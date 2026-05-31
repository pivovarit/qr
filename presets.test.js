const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const presets = require('./presets.js');

describe('wifi format', () => {
    it('escapes backslash, semicolon, colon, comma and quote in SSID and password', () => {
        const out = presets.wifi.format({ ssid: 'My,Net;2', password: 'a:b"c\\d', encryption: 'WPA' });
        assert.equal(out, 'WIFI:T:WPA;S:My\\,Net\\;2;P:a\\:b\\"c\\\\d;;');
    });

    it('leaves ordinary SSID/password unchanged (backward compatible)', () => {
        const out = presets.wifi.format({ ssid: 'MyNetwork', password: 'MyPassword', encryption: 'WPA' });
        assert.equal(out, 'WIFI:T:WPA;S:MyNetwork;P:MyPassword;;');
    });

    it('omits the password field for an open (nopass) network', () => {
        const out = presets.wifi.format({ ssid: 'Cafe', password: 'leftover', encryption: 'nopass' });
        assert.equal(out, 'WIFI:T:nopass;S:Cafe;;');
    });
});

describe('vcard format', () => {
    it('escapes comma, semicolon and backslash in free-text fields', () => {
        const out = presets.vcard.format({ name: 'Doe, John;Jr', org: 'Acme;Evil', address: '5th Ave; Suite 200, NYC' });
        assert.match(out, /^FN:Doe\\, John\\;Jr$/m);
        assert.match(out, /^ORG:Acme\\;Evil$/m);
        assert.match(out, /^ADR:;;5th Ave\\; Suite 200\\, NYC;;;;$/m);
    });

    it('encodes embedded newlines as \\n', () => {
        const out = presets.vcard.format({ name: 'Line1\nLine2' });
        assert.match(out, /^FN:Line1\\nLine2$/m);
    });

    it('produces a clean card with no special characters (backward compatible)', () => {
        const out = presets.vcard.format({ name: 'John Doe', phone: '+1234567890', email: 'john@example.com' });
        assert.equal(out, 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD');
    });

    it('does not escape TEL/EMAIL/URL values', () => {
        const out = presets.vcard.format({ name: 'X', phone: '+1 (555) 123', email: 'a@b.co', url: 'https://x.com/a,b' });
        assert.match(out, /^TEL:\+1 \(555\) 123$/m);
        assert.match(out, /^URL:https:\/\/x\.com\/a,b$/m);
    });
});

describe('email (mailto) format', () => {
    it('leaves a normal recipient address literal (does not encode @)', () => {
        const out = presets.email.format({ emailTo: 'user@example.com', subject: '', body: '' });
        assert.equal(out, 'mailto:user@example.com');
    });

    it('percent-encodes unsafe characters in the recipient while keeping @', () => {
        assert.equal(presets.email.format({ emailTo: 'a b@x.com' }), 'mailto:a%20b@x.com');
        assert.equal(presets.email.format({ emailTo: 'weird?addr@x.com' }), 'mailto:weird%3Faddr@x.com');
    });

    it('still encodes subject and body params', () => {
        const out = presets.email.format({ emailTo: 'a@b.co', subject: 'Hi there', body: 'x&y' });
        assert.equal(out, 'mailto:a@b.co?subject=Hi%20there&body=x%26y');
    });
});

describe('phone and sms formats (unchanged)', () => {
    it('formats tel', () => {
        assert.equal(presets.phone.format({ phoneNumber: '+1234567890' }), 'tel:+1234567890');
    });
    it('formats smsto with body', () => {
        assert.equal(presets.sms.format({ smsTo: '+1234567890', smsBody: 'hello' }), 'smsto:+1234567890:hello');
    });
});
