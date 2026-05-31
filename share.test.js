const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildShareQuery, parseShareQuery } = require('./share.js');

describe('buildShareQuery', () => {
    it('omits customization left at defaults, keeping only url', () => {
        const q = buildShareQuery({ text: 'https://x.com', fg: '#000000', bg: '#ffffff', size: '256', ecl: 'H', style: 'classic', gradient: null });
        assert.equal(q, 'url=https%3A%2F%2Fx.com');
    });

    it('serializes a non-default style', () => {
        const q = new URLSearchParams(buildShareQuery({ text: 'x', style: 'dots' }));
        assert.equal(q.get('style'), 'dots');
    });

    it('serializes an enabled gradient as grad/gf/gt without the # prefix', () => {
        const q = new URLSearchParams(buildShareQuery({ text: 'x', gradient: { enabled: true, from: '#667eea', to: '#764ba2' } }));
        assert.equal(q.get('grad'), '1');
        assert.equal(q.get('gf'), '667eea');
        assert.equal(q.get('gt'), '764ba2');
    });

    it('emits no gradient params when the gradient is disabled', () => {
        const q = new URLSearchParams(buildShareQuery({ text: 'x', gradient: { enabled: false } }));
        assert.equal(q.get('grad'), null);
        assert.equal(q.get('gf'), null);
    });

    it('preserves the existing url/fg/bg/size/ecl serialization', () => {
        const q = new URLSearchParams(buildShareQuery({ text: 'hi', fg: '#112233', bg: '#abcdef', size: '512', ecl: 'Q' }));
        assert.equal(q.get('url'), 'hi');
        assert.equal(q.get('fg'), '112233');
        assert.equal(q.get('bg'), 'abcdef');
        assert.equal(q.get('size'), '512');
        assert.equal(q.get('ecl'), 'Q');
    });
});

describe('parseShareQuery', () => {
    it('accepts only styles from the allowed set', () => {
        assert.equal(parseShareQuery('style=dots').style, 'dots');
        assert.equal(parseShareQuery('style=diamond').style, 'diamond');
        assert.equal(parseShareQuery('style=hexagons').style, undefined);
    });

    it('parses an enabled gradient with #-prefixed colors', () => {
        assert.deepEqual(parseShareQuery('grad=1&gf=667eea&gt=764ba2').gradient, { enabled: true, from: '#667eea', to: '#764ba2' });
    });

    it('ignores gradient when grad flag is absent', () => {
        assert.equal(parseShareQuery('gf=667eea&gt=764ba2').gradient, undefined);
    });
});

describe('round-trip: Dots + gradient survive Share (the bug)', () => {
    it('preserves style and gradient through build -> parse', () => {
        const state = {
            text: 'https://qr.pivovarit.com', fg: '#112233', bg: '#ffffff', size: '512', ecl: 'Q',
            style: 'dots', gradient: { enabled: true, from: '#667eea', to: '#764ba2' }
        };
        const parsed = parseShareQuery(buildShareQuery(state));
        assert.equal(parsed.style, 'dots');
        assert.deepEqual(parsed.gradient, { enabled: true, from: '#667eea', to: '#764ba2' });
        assert.equal(parsed.fg, '#112233');
        assert.equal(parsed.size, 512);
        assert.equal(parsed.ecl, 'Q');
    });
});
