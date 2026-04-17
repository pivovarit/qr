const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const QRCode = require('./qr.js');

const { generate, CorrectLevel } = QRCode;

describe('QRCode.generate', () => {
    it('generates a valid QR matrix for simple text', () => {
        const qr = generate('Hello');
        assert.ok(qr.matrix);
        assert.ok(qr.size > 0);
        assert.ok(qr.version >= 1 && qr.version <= 40);
        assert.equal(qr.matrix.length, qr.size);
        assert.equal(qr.matrix[0].length, qr.size);
    });

    it('matrix size matches version formula (version * 4 + 17)', () => {
        const qr = generate('Test');
        assert.equal(qr.size, qr.version * 4 + 17);
    });

    it('matrix contains only 0s and 1s', () => {
        const qr = generate('Binary check');
        for (let r = 0; r < qr.size; r++) {
            for (let c = 0; c < qr.size; c++) {
                assert.ok(qr.matrix[r][c] === 0 || qr.matrix[r][c] === 1,
                    `Invalid value ${qr.matrix[r][c]} at [${r}][${c}]`);
            }
        }
    });

    it('matrix is square', () => {
        const qr = generate('Square test');
        for (const row of qr.matrix) {
            assert.equal(row.length, qr.size);
        }
    });
});

describe('error correction levels', () => {
    it('supports all four error correction levels', () => {
        for (const level of [CorrectLevel.L, CorrectLevel.M, CorrectLevel.Q, CorrectLevel.H]) {
            const qr = generate('ECL test', { correctLevel: level });
            assert.ok(qr.matrix);
            assert.ok(qr.version >= 1);
        }
    });

    it('higher ECL may produce larger version for same data', () => {
        const qrL = generate('Error correction level comparison test string', { correctLevel: CorrectLevel.L });
        const qrH = generate('Error correction level comparison test string', { correctLevel: CorrectLevel.H });
        assert.ok(qrH.version >= qrL.version);
    });

    it('defaults to ECL H when not specified', () => {
        const qrDefault = generate('Default ECL');
        const qrH = generate('Default ECL', { correctLevel: CorrectLevel.H });
        assert.deepEqual(qrDefault.matrix, qrH.matrix);
    });
});

describe('version selection', () => {
    it('uses version 1 for short text with low ECL', () => {
        const qr = generate('1', { correctLevel: CorrectLevel.L });
        assert.equal(qr.version, 1);
    });

    it('increases version for longer text', () => {
        const short = generate('Hi', { correctLevel: CorrectLevel.L });
        const long = generate('A'.repeat(100), { correctLevel: CorrectLevel.L });
        assert.ok(long.version > short.version);
    });

    it('throws for data exceeding max capacity', () => {
        assert.throws(() => generate('X'.repeat(3000)), /Data too long/);
    });
});

describe('finder patterns', () => {
    it('has finder pattern in top-left corner', () => {
        const qr = generate('Finder', { correctLevel: CorrectLevel.L });
        // Top-left finder pattern: 7x7 block with specific pattern
        // First row should be 1,1,1,1,1,1,1
        for (let c = 0; c < 7; c++) {
            assert.equal(qr.matrix[0][c], 1, `Top-left finder row 0, col ${c}`);
        }
        // Second row should be 1,0,0,0,0,0,1
        assert.equal(qr.matrix[1][0], 1);
        assert.equal(qr.matrix[1][1], 0);
        assert.equal(qr.matrix[1][5], 0);
        assert.equal(qr.matrix[1][6], 1);
    });

    it('has finder pattern in top-right corner', () => {
        const qr = generate('Finder', { correctLevel: CorrectLevel.L });
        const s = qr.size;
        for (let c = s - 7; c < s; c++) {
            assert.equal(qr.matrix[0][c], 1, `Top-right finder row 0, col ${c}`);
        }
    });

    it('has finder pattern in bottom-left corner', () => {
        const qr = generate('Finder', { correctLevel: CorrectLevel.L });
        const s = qr.size;
        for (let c = 0; c < 7; c++) {
            assert.equal(qr.matrix[s - 1][c], 1, `Bottom-left finder last row, col ${c}`);
        }
    });
});

describe('deterministic output', () => {
    it('produces identical output for identical input', () => {
        const qr1 = generate('Deterministic');
        const qr2 = generate('Deterministic');
        assert.deepEqual(qr1.matrix, qr2.matrix);
        assert.equal(qr1.version, qr2.version);
        assert.equal(qr1.size, qr2.size);
    });

    it('produces different output for different input', () => {
        const qr1 = generate('Hello');
        const qr2 = generate('World');
        assert.notDeepEqual(qr1.matrix, qr2.matrix);
    });

    it('produces different output for different ECL', () => {
        const qr1 = generate('Same text', { correctLevel: CorrectLevel.L });
        const qr2 = generate('Same text', { correctLevel: CorrectLevel.H });
        assert.notDeepEqual(qr1.matrix, qr2.matrix);
    });
});

describe('special characters and encodings', () => {
    it('handles URLs', () => {
        const qr = generate('https://example.com/path?q=1&r=2#hash');
        assert.ok(qr.matrix);
    });

    it('handles Unicode text', () => {
        const qr = generate('こんにちは世界');
        assert.ok(qr.matrix);
    });

    it('handles emoji', () => {
        const qr = generate('Hello 🌍🎉');
        assert.ok(qr.matrix);
    });

    it('handles WiFi format strings', () => {
        const qr = generate('WIFI:T:WPA;S:MyNetwork;P:MyPassword;;');
        assert.ok(qr.matrix);
    });

    it('handles vCard format', () => {
        const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD';
        const qr = generate(vcard);
        assert.ok(qr.matrix);
    });

    it('handles single character', () => {
        const qr = generate('A');
        assert.ok(qr.matrix);
        assert.equal(qr.version, 1);
    });

    it('handles newlines and special whitespace', () => {
        const qr = generate('line1\nline2\ttab\rreturn');
        assert.ok(qr.matrix);
    });
});

describe('QRCode constructor', () => {
    it('exposes CorrectLevel constants', () => {
        assert.equal(CorrectLevel.L, 0);
        assert.equal(CorrectLevel.M, 1);
        assert.equal(CorrectLevel.Q, 2);
        assert.equal(CorrectLevel.H, 3);
    });

    it('exposes generate as a static method', () => {
        assert.equal(typeof QRCode.generate, 'function');
    });
});

describe('golden output tests', () => {
    it('produces known matrix for "1" with ECL L', () => {
        const qr = generate('1', { correctLevel: CorrectLevel.L });
        assert.equal(qr.version, 1);
        assert.equal(qr.size, 21);

        // Serialize matrix to a stable string for snapshot comparison
        const snapshot = qr.matrix.map(row => row.join('')).join('\n');
        assert.equal(snapshot, [
            '111111100101101111111',
            '100000101101001000001',
            '101110101100101011101',
            '101110100101001011101',
            '101110101000101011101',
            '100000101001101000001',
            '111111101010101111111',
            '000000001111100000000',
            '110100110110001110110',
            '101011011110001000110',
            '101111100100110000011',
            '111011010101000001101',
            '001100110100101010101',
            '000000001011000111011',
            '111111101110010100100',
            '100000100101110111000',
            '101110100101001111111',
            '101110101001000001111',
            '101110100110100010001',
            '100000101000011010100',
            '111111101011100011110',
        ].join('\n'));
    });

    it('produces known matrix for "Hello, World!" with ECL M', () => {
        const qr = generate('Hello, World!', { correctLevel: CorrectLevel.M });
        assert.equal(qr.version, 1);
        assert.equal(qr.size, 21);

        const snapshot = qr.matrix.map(row => row.join('')).join('\n');
        assert.equal(snapshot, [
            '111111101010001111111',
            '100000101101101000001',
            '101110101001101011101',
            '101110100011001011101',
            '101110101011101011101',
            '100000100100001000001',
            '111111101010101111111',
            '000000000100000000000',
            '100111111001010010111',
            '000101010010111111100',
            '010110100011110000111',
            '011001011110110010100',
            '110110111001110111010',
            '000000001010000011011',
            '111111101010101110100',
            '100000101000111011111',
            '101110101010110011010',
            '101110101001000000000',
            '101110100010110111111',
            '100000100010101111111',
            '111111101111011000000',
        ].join('\n'));
    });

    it('produces known matrix for a short URL at V2 ECL L (one alignment pattern)', () => {
        const qr = generate('https://example.com/a', { correctLevel: CorrectLevel.L });
        assert.equal(qr.version, 2);
        assert.equal(qr.size, 25);

        const snapshot = qr.matrix.map(row => row.join('')).join('\n');
        assert.equal(snapshot, [
            '1111111011101011101111111',
            '1000001011100000101000001',
            '1011101010110010101011101',
            '1011101011010111101011101',
            '1011101000000011101011101',
            '1000001010011100001000001',
            '1111111010101010101111111',
            '0000000001001010000000000',
            '1100111000010011000101111',
            '1011010001101011010011010',
            '0010001010011111011101100',
            '1101100100110011010100110',
            '0000011110101000011101111',
            '1111000101000111100010010',
            '0011111000000001110111100',
            '0000010101101011000110110',
            '1100011011110111111111100',
            '0000000010101010100010000',
            '1111111000011110101010000',
            '1000001011010100100011100',
            '1011101011101100111111111',
            '1011101001000110011100111',
            '1011101000100001111001010',
            '1000001011001010001111110',
            '1111111011110111011000111',
        ].join('\n'));
    });

    it('produces known matrix at V10 ECL H (multiple alignment patterns)', () => {
        const qr = generate('X'.repeat(100), { correctLevel: CorrectLevel.H });
        assert.equal(qr.version, 10);
        assert.equal(qr.size, 57);

        const first = qr.matrix[0].join('');
        assert.equal(first, '111111100110100110000010111110101111001001111011001111111');
        const last = qr.matrix[qr.size - 1].join('');
        assert.equal(last, '111111100010010010011100001011010111011110001000001011101');
    });

    it('produces known matrix at V15 ECL L (large, many alignment patterns)', () => {
        const qr = generate('Y'.repeat(500), { correctLevel: CorrectLevel.L });
        assert.equal(qr.version, 15);
        assert.equal(qr.size, 77);

        const first = qr.matrix[0].join('');
        assert.equal(first, '11111110101101001101010100101010101010101010100101011101110111011100001111111');
        const last = qr.matrix[qr.size - 1].join('');
        assert.equal(last, '11111110101101011011010100101010101010101010101101010111011101110110101100101');
    });
});

describe('alignment patterns', () => {
    function hasAlignmentCenter(matrix, cr, cc) {
        if (matrix[cr][cc] !== 1) return false;
        for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
                if (r === 0 && c === 0) continue;
                const onBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
                const expected = onBorder ? 1 : 0;
                if (matrix[cr + r][cc + c] !== expected) return false;
            }
        }
        return true;
    }

    it('places alignment pattern at (18,18) for V2', () => {
        const qr = generate('https://example.com/a', { correctLevel: CorrectLevel.L });
        assert.equal(qr.version, 2);
        assert.ok(hasAlignmentCenter(qr.matrix, 18, 18),
            'alignment pattern expected at (18,18) for version 2');
    });

    it('places alignment patterns at all V7 spec positions', () => {
        const qr = generate('Z'.repeat(60), { correctLevel: CorrectLevel.H });
        assert.equal(qr.version, 7);
        // ALIGNMENT_PATTERNS[7] = [6, 22, 38]; corners that collide with finder patterns
        // (6,6), (6,38), (38,6) are skipped by the encoder — test only the placed ones.
        const positions = [[6, 22], [22, 6], [22, 22], [22, 38], [38, 22], [38, 38]];
        for (const [r, c] of positions) {
            assert.ok(hasAlignmentCenter(qr.matrix, r, c),
                `alignment pattern missing or malformed at (${r},${c})`);
        }
    });
});

describe('version selection monotonicity', () => {
    it('version does not decrease as data length increases (ECL L)', () => {
        let prev = 0;
        for (let len = 1; len <= 2000; len += 50) {
            const qr = generate('A'.repeat(len), { correctLevel: CorrectLevel.L });
            assert.ok(qr.version >= prev, `version regressed at len=${len}: ${prev} -> ${qr.version}`);
            prev = qr.version;
        }
    });

    it('finder patterns remain intact at V15', () => {
        const qr = generate('Y'.repeat(500), { correctLevel: CorrectLevel.L });
        assert.equal(qr.version, 15);
        const s = qr.size;
        // top-left, top-right, bottom-left outer ring all 1s
        for (let c = 0; c < 7; c++) {
            assert.equal(qr.matrix[0][c], 1);
            assert.equal(qr.matrix[0][s - 7 + c], 1);
            assert.equal(qr.matrix[s - 1][c], 1);
        }
    });
});
