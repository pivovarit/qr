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
            const esc = (s) => s.replace(/([\\;:"])/g, '\\$1');
            return `WIFI:T:${values.encryption};S:${esc(values.ssid)};P:${esc(values.password)};;`;
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
            if (values.name) vcard += `FN:${values.name}\n`;
            if (values.title) vcard += `TITLE:${values.title}\n`;
            if (values.org) vcard += `ORG:${values.org}\n`;
            if (values.phone) vcard += `TEL:${values.phone}\n`;
            if (values.email) vcard += `EMAIL:${values.email}\n`;
            if (values.url) vcard += `URL:${values.url}\n`;
            if (values.address) vcard += `ADR:;;${values.address};;;;\n`;
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
            let mailto = `mailto:${values.emailTo}`;
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

const presetSelect = document.getElementById('presetSelect');
const inputGroup = document.getElementById('inputGroup');
const qrContainer = document.getElementById('qrcode');
const qrFrame = document.getElementById('qrFrame');
const actionButtons = document.getElementById('actionButtons');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const copyFeedback = document.getElementById('copyFeedback');

const panelHeader = document.getElementById('panelHeader');
const panelContent = document.getElementById('panelContent');
const fgColor = document.getElementById('fgColor');
const bgColor = document.getElementById('bgColor');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const errorLevel = document.getElementById('errorLevel');
const includeBorder = document.getElementById('includeBorder');

const ERROR_LEVELS = {
    'L': QRCode.CorrectLevel.L,
    'M': QRCode.CorrectLevel.M,
    'Q': QRCode.CorrectLevel.Q,
    'H': QRCode.CorrectLevel.H
};

panelHeader.addEventListener('click', () => {
    panelHeader.classList.toggle('expanded');
    panelContent.classList.toggle('expanded');
});

panelHeader.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
});

sizeSlider.addEventListener('input', () => {
    sizeValue.textContent = sizeSlider.value + 'px';
    refreshQRCode();
});

function refreshQRCode() {
    if (document.querySelector('#qrcode canvas')) {
        generateQRCode();
    }
}

fgColor.addEventListener('input', refreshQRCode);
bgColor.addEventListener('input', refreshQRCode);
errorLevel.addEventListener('change', refreshQRCode);

function createInputFields(presetKey) {
    const preset = presets[presetKey];
    inputGroup.innerHTML = '';

    preset.fields.forEach(field => {
        if (field.type === 'select') {
            const select = document.createElement('select');
            select.id = field.id;
            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                select.appendChild(option);
            });
            select.addEventListener('change', regenerateIfValid);
            inputGroup.appendChild(select);
        } else if (field.type === 'textarea') {
            const textarea = document.createElement('textarea');
            textarea.id = field.id;
            textarea.placeholder = field.placeholder;
            textarea.setAttribute('aria-label', field.placeholder);
            textarea.addEventListener('input', regenerateIfValid);
            inputGroup.appendChild(textarea);
        } else {
            const input = document.createElement('input');
            input.type = field.type;
            input.id = field.id;
            input.placeholder = field.placeholder;
            input.setAttribute('aria-label', field.placeholder);
            input.addEventListener('input', regenerateIfValid);
            inputGroup.appendChild(input);
        }
    });

    const firstInput = inputGroup.querySelector('input, textarea');
    if (firstInput) firstInput.focus();

    clearQRCode();
}

function collectFormValues() {
    const preset = presets[presetSelect.value];
    const values = {};
    preset.fields.forEach(field => {
        const el = document.getElementById(field.id);
        values[field.id] = el ? el.value.trim() : '';
    });
    return values;
}

function isFormValid() {
    const preset = presets[presetSelect.value];
    const values = collectFormValues();

    const firstField = preset.fields[0];
    return values[firstField.id].length > 0;
}

function regenerateIfValid() {
    if (isFormValid()) {
        generateQRCode();
    } else {
        clearQRCode();
    }
}

function clearQRCode() {
    qrContainer.innerHTML = '';
    qrFrame.classList.remove('visible');
    actionButtons.classList.remove('visible');
}

presetSelect.addEventListener('change', () => {
    createInputFields(presetSelect.value);
});

function generateQRCode() {
    const preset = presets[presetSelect.value];
    const values = collectFormValues();
    const text = preset.format(values);

    if (!text) return;

    const size = parseInt(sizeSlider.value);

    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: text,
        width: size,
        height: size,
        colorDark: fgColor.value,
        colorLight: bgColor.value,
        correctLevel: ERROR_LEVELS[errorLevel.value]
    });

    if (document.querySelector('#qrcode canvas')) {
        qrFrame.classList.add('visible');
        actionButtons.classList.add('visible');
    }
}

function getExportCanvas() {
    const canvas = document.querySelector('#qrcode canvas');
    if (!canvas) return null;
    if (!includeBorder.checked) return canvas;

    const padding = 16;
    const padded = document.createElement('canvas');
    padded.width = canvas.width + padding * 2;
    padded.height = canvas.height + padding * 2;
    const ctx = padded.getContext('2d');
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, padded.width, padded.height);
    ctx.drawImage(canvas, padding, padding);
    return padded;
}

downloadBtn.addEventListener('click', () => {
    const canvas = getExportCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

copyBtn.addEventListener('click', async () => {
    const canvas = getExportCanvas();
    if (!canvas) return;

    if (!navigator.clipboard?.write || !window.ClipboardItem) {
        copyFeedback.textContent = 'Copy not supported in this browser';
        copyFeedback.classList.add('visible');
        setTimeout(() => {
            copyFeedback.textContent = 'Copied to clipboard!';
            copyFeedback.classList.remove('visible');
        }, 3000);
        return;
    }

    try {
        const clipboardItem = new ClipboardItem({
            'image/png': new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to create blob'));
                }, 'image/png');
            })
        });
        await navigator.clipboard.write([clipboardItem]);

        copyFeedback.classList.add('visible');
        setTimeout(() => {
            copyFeedback.classList.remove('visible');
        }, 2000);
    } catch (err) {
        console.error('Clipboard error:', err);
        copyFeedback.textContent = 'Copy failed - try Download instead';
        copyFeedback.classList.add('visible');
        setTimeout(() => {
            copyFeedback.textContent = 'Copied to clipboard!';
            copyFeedback.classList.remove('visible');
        }, 3000);
    }
});

shareBtn.addEventListener('click', async () => {
    const preset = presets[presetSelect.value];
    const values = collectFormValues();
    const text = preset.format(values);
    if (!text) return;

    const params = new URLSearchParams();
    params.set('url', text);
    if (fgColor.value !== '#000000') params.set('fg', fgColor.value.slice(1));
    if (bgColor.value !== '#ffffff') params.set('bg', bgColor.value.slice(1));
    if (sizeSlider.value !== '256') params.set('size', sizeSlider.value);
    if (errorLevel.value !== 'H') params.set('ecl', errorLevel.value);

    const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();

    try {
        await navigator.clipboard.writeText(shareUrl);
        copyFeedback.textContent = 'Link copied to clipboard!';
        copyFeedback.classList.add('visible');
        setTimeout(() => {
            copyFeedback.textContent = 'Copied to clipboard!';
            copyFeedback.classList.remove('visible');
        }, 2000);
    } catch {
        copyFeedback.textContent = 'Could not copy link';
        copyFeedback.classList.add('visible');
        setTimeout(() => {
            copyFeedback.textContent = 'Copied to clipboard!';
            copyFeedback.classList.remove('visible');
        }, 3000);
    }
});

createInputFields('text');

function initFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');

    if (!urlParam) return;

    const isEmbed = params.get('embed') === 'true' || params.get('embed') === '1';
    const hasBorder = params.get('border') !== 'false' && params.get('border') !== '0';

    if (isEmbed) {
        document.body.classList.add('embed-mode');
        if (hasBorder) {
            document.body.classList.add('embed-border');
        }
    }

    if (params.get('fg')) {
        const fg = params.get('fg');
        fgColor.value = fg.startsWith('#') ? fg : '#' + fg;
    }
    if (params.get('bg')) {
        const bg = params.get('bg');
        bgColor.value = bg.startsWith('#') ? bg : '#' + bg;
    }
    if (params.get('size')) {
        const size = parseInt(params.get('size'));
        if (size >= 128 && size <= 1024) {
            sizeSlider.value = size;
            sizeValue.textContent = size + 'px';
        }
    }
    if (params.get('ecl')) {
        const ecl = params.get('ecl').toUpperCase();
        if (['L', 'M', 'Q', 'H'].includes(ecl)) {
            errorLevel.value = ecl;
        }
    }

    const textInput = document.getElementById('text');
    if (textInput) {
        textInput.value = urlParam;
        generateQRCode();

        if (isEmbed && hasBorder) {
            qrContainer.style.backgroundColor = bgColor.value;
        }
    }
}

initFromUrlParams();
