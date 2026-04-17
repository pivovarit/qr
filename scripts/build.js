#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const layout = fs.readFileSync(path.join(root, 'templates/layout.html'), 'utf8');
const pages = require(path.join(root, 'templates/pages.js'));

const SITE_ORIGIN = 'https://qr.pivovarit.com';

function schemaBlock(page) {
    if (!page.hasSchema) return '';
    const name = page.shortTitle;
    const description = page.schemaDescription || page.ogDescription;
    return `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "${name}",
        "description": "${description}",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "browserRequirements": "Requires a modern web browser"
    }
    </script>`;
}

function seoContentBlock(page) {
    return page.seoContent ? page.seoContent + '\n\n' : '';
}

function crossLinks(currentSlug) {
    const links = pages
        .filter(p => p.slug !== currentSlug)
        .map(p => {
            const href = p.slug === '' ? '/' : `/${p.slug}/`;
            return `    <a href="${href}">${p.crossLinkLabel}</a>`;
        })
        .join('\n');
    return `<nav class="cross-links container">
    <span class="cross-links-label">Also available:</span>
${links}
</nav>`;
}

function pathPrefix(slug) {
    return slug === '' ? '' : '../';
}

function render(page) {
    const prefix = pathPrefix(page.slug);
    const canonical = page.slug === '' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${page.slug}/`;

    const substitutions = {
        title: page.title,
        description: page.description,
        shortTitle: page.shortTitle,
        ogDescription: page.ogDescription,
        h1: page.h1,
        subtitle: page.subtitle,
        canonical,
        faviconPath: prefix + 'favicon.svg',
        stylePath: prefix + 'style.css',
        qrScriptPath: prefix + 'qr.js',
        appScriptPath: prefix + 'app.js',
        schemaBlock: schemaBlock(page),
        seoContentBlock: seoContentBlock(page),
        crossLinks: crossLinks(page.slug),
    };

    return layout.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (!(key in substitutions)) {
            throw new Error(`Unknown template placeholder: {{${key}}}`);
        }
        return substitutions[key];
    });
}

function outputPath(slug) {
    return slug === ''
        ? path.join(root, 'index.html')
        : path.join(root, slug, 'index.html');
}

function build() {
    for (const page of pages) {
        const html = render(page);
        const out = outputPath(page.slug);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, html);
        console.log(`wrote ${path.relative(root, out)}`);
    }
}

build();
