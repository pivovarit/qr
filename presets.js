(function (global) {
    'use strict';

    // Escape the characters that are structural in the WIFI: (MECARD-style) payload.
    // Backslash is in the class, so each character is matched once left-to-right and
    // prefixed exactly once — no double-escaping.
    const wifiEsc = (s) => (s || '').replace(/([\\,;:"])/g, '\\$1');

    // Escape a vCard 3.0 (RFC 2426) TEXT value: backslash first, then newline, comma
    // and semicolon. ADR is a compound, semicolon-delimited value, so escaping ';'
    // inside the street keeps the components aligned.
    const vcardEsc = (s) => String(s == null ? '' : s)
        .replace(/\\/g, '\\\\')
        .replace(/\r\n|\r|\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');

    // Encode an addr-spec for a mailto: URI (RFC 6068) without encoding the '@'
    // separator, so ordinary addresses round-trip unchanged.
    const encodeAddr = (a) => (a || '').split('@').map(encodeURIComponent).join('@');

    const presets = {
        text: {
            fields: [
                { id: 'text', type: 'text', placeholder: 'Enter text or URL...' }
            ],
            format: (values) => values.text
        },
        wifi: {
            fields: [
                { id: 'ssid', type: 'text', placeholder: 'Network name (SSID)' },
                { id: 'password', type: 'text', placeholder: 'Password' },
                { id: 'encryption', type: 'select', options: [
                    { value: 'WPA', label: 'WPA/WPA2' },
                    { value: 'WEP', label: 'WEP' },
                    { value: 'nopass', label: 'None' }
                ]}
            ],
            format: (values) => {
                const ssid = wifiEsc(values.ssid);
                if (values.encryption === 'nopass') {
                    return `WIFI:T:nopass;S:${ssid};;`;
                }
                return `WIFI:T:${values.encryption};S:${ssid};P:${wifiEsc(values.password)};;`;
            }
        },
        vcard: {
            fields: [
                { id: 'name', type: 'text', placeholder: 'Full Name' },
                { id: 'title', type: 'text', placeholder: 'Job Title (optional)' },
                { id: 'org', type: 'text', placeholder: 'Organization (optional)' },
                { id: 'phone', type: 'tel', placeholder: 'Phone Number' },
                { id: 'email', type: 'email', placeholder: 'Email Address' },
                { id: 'url', type: 'text', placeholder: 'Website URL (optional)' },
                { id: 'address', type: 'text', placeholder: 'Address (optional)' }
            ],
            format: (values) => {
                let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
                if (values.name) vcard += `FN:${vcardEsc(values.name)}\n`;
                if (values.title) vcard += `TITLE:${vcardEsc(values.title)}\n`;
                if (values.org) vcard += `ORG:${vcardEsc(values.org)}\n`;
                if (values.phone) vcard += `TEL:${values.phone}\n`;
                if (values.email) vcard += `EMAIL:${values.email}\n`;
                if (values.url) vcard += `URL:${values.url}\n`;
                if (values.address) vcard += `ADR:;;${vcardEsc(values.address)};;;;\n`;
                vcard += 'END:VCARD';
                return vcard;
            }
        },
        email: {
            fields: [
                { id: 'emailTo', type: 'email', placeholder: 'Email Address' },
                { id: 'subject', type: 'text', placeholder: 'Subject (optional)' },
                { id: 'body', type: 'textarea', placeholder: 'Message body (optional)' }
            ],
            format: (values) => {
                let mailto = `mailto:${encodeAddr(values.emailTo)}`;
                const params = [];
                if (values.subject) params.push(`subject=${encodeURIComponent(values.subject)}`);
                if (values.body) params.push(`body=${encodeURIComponent(values.body)}`);
                if (params.length) mailto += '?' + params.join('&');
                return mailto;
            }
        },
        sms: {
            fields: [
                { id: 'smsTo', type: 'tel', placeholder: 'Phone Number' },
                { id: 'smsBody', type: 'text', placeholder: 'Message (optional)' }
            ],
            format: (values) => `smsto:${values.smsTo}:${values.smsBody || ''}`
        },
        phone: {
            fields: [
                { id: 'phoneNumber', type: 'tel', placeholder: 'Phone Number (e.g., +1234567890)' }
            ],
            format: (values) => `tel:${values.phoneNumber}`
        }
    };

    global.QRPresets = presets;

    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return presets;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = presets;
    }

})(typeof window !== 'undefined' ? window : this);
