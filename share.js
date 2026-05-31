(function (global) {
    'use strict';

    // Pure helpers for serializing the QR customization to a shareable URL query
    // and parsing it back, so a shared/embedded link reproduces the exact QR the
    // sender designed (style and gradient included, not just colors/size/ecl).

    const DEFAULTS = { fg: '#000000', bg: '#ffffff', size: '256', ecl: 'H', style: 'classic' };
    const STYLES = ['classic', 'dots', 'diamond'];
    const ECLS = ['L', 'M', 'Q', 'H'];
    const GRADIENT_FALLBACK = { from: '#667eea', to: '#764ba2' };

    const stripHash = (v) => String(v == null ? '' : v).replace(/^#/, '');

    function normalizeHex(v) {
        const h = stripHash(v);
        return /^[0-9a-fA-F]{6}$/.test(h) ? '#' + h.toLowerCase() : null;
    }

    function buildShareQuery(state) {
        const p = new URLSearchParams();
        p.set('url', state.text);
        if (state.fg && state.fg !== DEFAULTS.fg) p.set('fg', stripHash(state.fg));
        if (state.bg && state.bg !== DEFAULTS.bg) p.set('bg', stripHash(state.bg));
        if (state.size && String(state.size) !== DEFAULTS.size) p.set('size', String(state.size));
        if (state.ecl && state.ecl !== DEFAULTS.ecl) p.set('ecl', state.ecl);
        if (state.style && state.style !== DEFAULTS.style) p.set('style', state.style);
        if (state.gradient && state.gradient.enabled) {
            p.set('grad', '1');
            p.set('gf', stripHash(state.gradient.from));
            p.set('gt', stripHash(state.gradient.to));
        }
        return p.toString();
    }

    function parseShareQuery(query) {
        const p = query instanceof URLSearchParams ? query : new URLSearchParams(query);
        const out = {};

        const fg = normalizeHex(p.get('fg'));
        if (fg) out.fg = fg;
        const bg = normalizeHex(p.get('bg'));
        if (bg) out.bg = bg;

        if (p.get('size')) {
            const n = parseInt(p.get('size'), 10);
            if (n >= 128 && n <= 1024) out.size = n;
        }
        if (p.get('ecl')) {
            const e = p.get('ecl').toUpperCase();
            if (ECLS.includes(e)) out.ecl = e;
        }
        if (p.get('style') && STYLES.includes(p.get('style'))) {
            out.style = p.get('style');
        }
        if (p.get('grad') === '1' || p.get('grad') === 'true') {
            out.gradient = {
                enabled: true,
                from: normalizeHex(p.get('gf')) || GRADIENT_FALLBACK.from,
                to: normalizeHex(p.get('gt')) || GRADIENT_FALLBACK.to
            };
        }
        return out;
    }

    const QRShare = { buildShareQuery, parseShareQuery };
    global.QRShare = QRShare;

    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return QRShare;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = QRShare;
    }

})(typeof window !== 'undefined' ? window : this);
