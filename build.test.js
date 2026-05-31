const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { render, pages } = require('./scripts/build.js');

const home = pages.find(p => p.slug === '');
const sub = pages.find(p => p.slug === 'wifi');

describe('social card meta (Open Graph / Twitter)', () => {
    it('og:image is an absolute raster (PNG) URL, not a relative SVG', () => {
        const html = render(home);
        const m = html.match(/<meta property="og:image" content="([^"]+)"/);
        assert.ok(m, 'og:image meta present');
        assert.ok(m[1].startsWith('https://'), `og:image must be absolute: ${m[1]}`);
        assert.match(m[1], /\.png$/);
        assert.doesNotMatch(m[1], /\.svg$/);
    });

    it('uses the same absolute og:image on subpages (no ../ relative path)', () => {
        const html = render(sub);
        const m = html.match(/<meta property="og:image" content="([^"]+)"/);
        assert.ok(m[1].startsWith('https://'));
        assert.doesNotMatch(m[1], /\.\.\//);
    });

    it('declares og:image type and 1200x630 dimensions', () => {
        const html = render(home);
        assert.match(html, /<meta property="og:image:type" content="image\/png"/);
        assert.match(html, /<meta property="og:image:width" content="1200"/);
        assert.match(html, /<meta property="og:image:height" content="630"/);
    });

    it('sets twitter:image to the same absolute PNG', () => {
        const html = render(home);
        const og = html.match(/<meta property="og:image" content="([^"]+)"/)[1];
        const tw = html.match(/<meta name="twitter:image" content="([^"]+)"/);
        assert.ok(tw, 'twitter:image present');
        assert.equal(tw[1], og);
    });

    it('sets og:url to the page canonical URL', () => {
        const html = render(home);
        const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
        const ogurl = html.match(/<meta property="og:url" content="([^"]+)"/);
        assert.ok(ogurl, 'og:url present');
        assert.equal(ogurl[1], canonical);
    });

    it('still uses the SVG favicon for the icon link', () => {
        const html = render(home);
        assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="favicon\.svg"/);
    });
});

describe('og image asset', () => {
    it('exists at repo root as a valid 1200x630-class PNG', () => {
        const p = path.join(__dirname, 'og.png');
        assert.ok(fs.existsSync(p), 'og.png must exist at repo root');
        const buf = fs.readFileSync(p);
        assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'PNG magic bytes');
        // PNG IHDR width/height are big-endian uint32 at offsets 16 and 20
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        assert.equal(width, 1200);
        assert.equal(height, 630);
    });
});
