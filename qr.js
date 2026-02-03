(function (global) {
    'use strict';

    const ECL = {L: 0, M: 1, Q: 2, H: 3};

    const EC_CODEWORDS_PER_BLOCK = [
        [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
        [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
    ];

    const NUM_EC_BLOCKS = [
        [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
        [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
        [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
        [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
    ];

    const TOTAL_CODEWORDS = [
        -1, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085,
        1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706
    ];

    const ALIGNMENT_PATTERNS = [
        [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
        [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62],
        [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
        [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]
    ];

    const FORMAT_INFO = [
        [0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976],
        [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0],
        [0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed],
        [0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b]
    ];

    const VERSION_INFO = [
        0x07c94, 0x085bc, 0x09a99, 0x0a4d3, 0x0bbf6, 0x0c762, 0x0d847, 0x0e60d,
        0x0f928, 0x10b78, 0x1145d, 0x12a17, 0x13532, 0x149a6, 0x15683, 0x168c9,
        0x177ec, 0x18ec4, 0x191e1, 0x1afab, 0x1b08e, 0x1cc1a, 0x1d33f, 0x1ed75,
        0x1f250, 0x209d5, 0x216f0, 0x228ba, 0x2379f, 0x24b0b, 0x2542e, 0x26a64,
        0x27541, 0x28c69
    ];

    const GF = {
        exp: new Uint8Array(512),
        log: new Uint8Array(256),

        init() {
            let x = 1;
            for (let i = 0; i < 255; i++) {
                this.exp[i] = x;
                this.log[x] = i;
                x <<= 1;
                if (x & 0x100) x ^= 0x11d;
            }
            for (let i = 255; i < 512; i++) {
                this.exp[i] = this.exp[i - 255];
            }
        },

        mul(a, b) {
            if (a === 0 || b === 0) return 0;
            return this.exp[this.log[a] + this.log[b]];
        },

        polyMul(p1, p2) {
            const result = new Uint8Array(p1.length + p2.length - 1);
            for (let i = 0; i < p1.length; i++) {
                for (let j = 0; j < p2.length; j++) {
                    result[i + j] ^= this.mul(p1[i], p2[j]);
                }
            }
            return result;
        },

        polyDiv(dividend, divisor) {
            const result = new Uint8Array(dividend);
            for (let i = 0; i < dividend.length - divisor.length + 1; i++) {
                if (result[i] !== 0) {
                    const factor = result[i];
                    for (let j = 0; j < divisor.length; j++) {
                        result[i + j] ^= this.mul(divisor[j], factor);
                    }
                }
            }
            return result.slice(dividend.length - divisor.length + 1);
        },

        generatePoly(degree) {
            let poly = new Uint8Array([1]);
            for (let i = 0; i < degree; i++) {
                poly = this.polyMul(poly, new Uint8Array([1, this.exp[i]]));
            }
            return poly;
        }
    };

    GF.init();

    function encodeTextToBytes(text) {
        const encoder = new TextEncoder();
        return encoder.encode(text);
    }

    function findMinimumVersion(dataLen, ecl) {
        const capacities = [
            [-1, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953],
            [-1, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666, 711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331],
            [-1, 11, 20, 32, 46, 60, 74, 86, 108, 130, 151, 177, 203, 241, 258, 292, 322, 364, 394, 442, 482, 509, 565, 611, 661, 715, 751, 805, 868, 908, 982, 1030, 1112, 1168, 1228, 1283, 1351, 1423, 1499, 1579, 1663],
            [-1, 7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280, 310, 338, 382, 403, 439, 461, 511, 535, 593, 625, 658, 698, 742, 790, 842, 898, 958, 983, 1051, 1093, 1139, 1219, 1273]
        ];

        for (let v = 1; v <= 40; v++) {
            if (capacities[ecl][v] >= dataLen) return v;
        }
        return -1;
    }

    function calculateDataCapacity(version, ecl) {
        const totalCodewords = TOTAL_CODEWORDS[version];
        const ecCodewordsPerBlock = EC_CODEWORDS_PER_BLOCK[ecl][version];
        const numBlocks = NUM_EC_BLOCKS[ecl][version];
        return totalCodewords - (ecCodewordsPerBlock * numBlocks);
    }

    function encodeDataToCodewords(data, version, ecl) {
        const capacity = calculateDataCapacity(version, ecl);
        const bits = [];

        bits.push(0, 1, 0, 0);

        const countBits = version < 10 ? 8 : 16;
        for (let i = countBits - 1; i >= 0; i--) {
            bits.push((data.length >> i) & 1);
        }

        for (const byte of data) {
            for (let i = 7; i >= 0; i--) {
                bits.push((byte >> i) & 1);
            }
        }

        const maxBits = capacity * 8;
        for (let i = 0; i < 4 && bits.length < maxBits; i++) {
            bits.push(0);
        }

        while (bits.length % 8 !== 0 && bits.length < maxBits) {
            bits.push(0);
        }

        const padBytes = [0xec, 0x11];
        let padIdx = 0;
        while (bits.length < maxBits) {
            for (let i = 7; i >= 0; i--) {
                bits.push((padBytes[padIdx] >> i) & 1);
            }
            padIdx = (padIdx + 1) % 2;
        }

        const codewords = new Uint8Array(capacity);
        for (let i = 0; i < capacity; i++) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                byte = (byte << 1) | bits[i * 8 + j];
            }
            codewords[i] = byte;
        }

        return codewords;
    }

    function generateErrorCorrectionCodewords(data, version, ecl) {
        const ecCodewordsPerBlock = EC_CODEWORDS_PER_BLOCK[ecl][version];
        const numBlocks = NUM_EC_BLOCKS[ecl][version];
        const totalCodewords = TOTAL_CODEWORDS[version];
        const dataCapacity = calculateDataCapacity(version, ecl);

        const shortBlockLen = Math.floor(dataCapacity / numBlocks);
        const numLongBlocks = dataCapacity % numBlocks;
        const numShortBlocks = numBlocks - numLongBlocks;

        const generator = GF.generatePoly(ecCodewordsPerBlock);
        const dataBlocks = [];
        const ecBlocks = [];

        let dataIdx = 0;
        for (let i = 0; i < numBlocks; i++) {
            const blockLen = i < numShortBlocks ? shortBlockLen : shortBlockLen + 1;
            const block = data.slice(dataIdx, dataIdx + blockLen);
            dataBlocks.push(block);

            const padded = new Uint8Array(blockLen + ecCodewordsPerBlock);
            padded.set(block);
            const ec = GF.polyDiv(padded, generator);
            ecBlocks.push(ec);

            dataIdx += blockLen;
        }

        const result = new Uint8Array(totalCodewords);
        let idx = 0;

        for (let i = 0; i < shortBlockLen + 1; i++) {
            for (let j = 0; j < numBlocks; j++) {
                if (i < dataBlocks[j].length) {
                    result[idx++] = dataBlocks[j][i];
                }
            }
        }

        for (let i = 0; i < ecCodewordsPerBlock; i++) {
            for (let j = 0; j < numBlocks; j++) {
                result[idx++] = ecBlocks[j][i];
            }
        }

        return result;
    }

    function initializeMatrix(version) {
        const size = version * 4 + 17;
        const matrix = [];
        const reserved = [];
        for (let i = 0; i < size; i++) {
            matrix.push(new Array(size).fill(null));
            reserved.push(new Array(size).fill(false));
        }
        return {matrix, reserved, size};
    }

    function drawFinderPatterns(qr) {
        const {matrix, reserved, size} = qr;
        const pattern = [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1],
            [1, 0, 1, 1, 1, 0, 1],
            [1, 0, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ];

        const positions = [[0, 0], [0, size - 7], [size - 7, 0]];

        for (const [row, col] of positions) {
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    matrix[row + r][col + c] = pattern[r][c];
                    reserved[row + r][col + c] = true;
                }
            }
        }

        for (let i = 0; i < 8; i++) {
            if (i < size) {
                matrix[7][i] = 0;
                reserved[7][i] = true;
                matrix[i][7] = 0;
                reserved[i][7] = true;
            }
            matrix[7][size - 8 + i] = 0;
            reserved[7][size - 8 + i] = true;
            if (i < 8) {
                matrix[i][size - 8] = 0;
                reserved[i][size - 8] = true;
            }
            matrix[size - 8 + i][7] = 0;
            reserved[size - 8 + i][7] = true;
            if (i < 8) {
                matrix[size - 8][i] = 0;
                reserved[size - 8][i] = true;
            }
        }
    }

    function drawAlignmentPatterns(qr, version) {
        if (version < 2) return;

        const {matrix, reserved} = qr;
        const positions = ALIGNMENT_PATTERNS[version];
        const pattern = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ];

        for (const row of positions) {
            for (const col of positions) {
                if (reserved[row][col]) continue;

                for (let r = -2; r <= 2; r++) {
                    for (let c = -2; c <= 2; c++) {
                        matrix[row + r][col + c] = pattern[r + 2][c + 2];
                        reserved[row + r][col + c] = true;
                    }
                }
            }
        }
    }

    function drawTimingPatterns(qr) {
        const {matrix, reserved, size} = qr;

        for (let i = 8; i < size - 8; i++) {
            const bit = (i + 1) % 2;
            if (!reserved[6][i]) {
                matrix[6][i] = bit;
                reserved[6][i] = true;
            }
            if (!reserved[i][6]) {
                matrix[i][6] = bit;
                reserved[i][6] = true;
            }
        }
    }

    function reserveFormatAndVersionAreas(qr, version) {
        const {matrix, reserved, size} = qr;

        matrix[size - 8][8] = 1;
        reserved[size - 8][8] = true;

        for (let i = 0; i < 9; i++) {
            if (!reserved[8][i]) reserved[8][i] = true;
            if (!reserved[i][8]) reserved[i][8] = true;
        }
        for (let i = 0; i < 8; i++) {
            reserved[8][size - 1 - i] = true;
            reserved[size - 1 - i][8] = true;
        }

        if (version >= 7) {
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 3; j++) {
                    reserved[i][size - 11 + j] = true;
                    reserved[size - 11 + j][i] = true;
                }
            }
        }
    }

    function writeDataBits(qr, codewords) {
        const {matrix, reserved, size} = qr;
        let bitIdx = 0;
        const totalBits = codewords.length * 8;

        let x = size - 1;
        let upward = true;

        while (x >= 0) {
            if (x === 6) x--;

            for (let i = 0; i < size; i++) {
                const y = upward ? size - 1 - i : i;

                for (let dx = 0; dx >= -1; dx--) {
                    const xx = x + dx;
                    if (xx < 0 || reserved[y][xx]) continue;

                    if (bitIdx < totalBits) {
                        const byteIdx = Math.floor(bitIdx / 8);
                        const bitPos = 7 - (bitIdx % 8);
                        matrix[y][xx] = (codewords[byteIdx] >> bitPos) & 1;
                        bitIdx++;
                    } else {
                        matrix[y][xx] = 0;
                    }
                }
            }

            x -= 2;
            upward = !upward;
        }
    }

    function applyMask(qr, mask) {
        const {matrix, reserved, size} = qr;
        const maskFuncs = [
            (r, c) => (r + c) % 2 === 0,
            (r, c) => r % 2 === 0,
            (r, c) => c % 3 === 0,
            (r, c) => (r + c) % 3 === 0,
            (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
            (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
            (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
            (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0
        ];

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!reserved[r][c] && maskFuncs[mask](r, c)) {
                    matrix[r][c] ^= 1;
                }
            }
        }
    }

    function writeFormatInfo(qr, ecl, mask) {
        const {matrix, size} = qr;
        const formatBits = FORMAT_INFO[ecl][mask];

        for (let i = 0; i < 6; i++) {
            matrix[8][i] = (formatBits >> (14 - i)) & 1;
        }
        matrix[8][7] = (formatBits >> 8) & 1;
        matrix[8][8] = (formatBits >> 7) & 1;
        matrix[7][8] = (formatBits >> 6) & 1;
        for (let i = 0; i < 6; i++) {
            matrix[5 - i][8] = (formatBits >> (5 - i)) & 1;
        }

        for (let i = 0; i < 8; i++) {
            matrix[8][size - 1 - i] = (formatBits >> i) & 1;
        }
        for (let i = 0; i < 7; i++) {
            matrix[size - 1 - i][8] = (formatBits >> (14 - i)) & 1;
        }
    }

    function writeVersionInfo(qr, version) {
        if (version < 7) return;

        const {matrix, size} = qr;
        const versionBits = VERSION_INFO[version - 7];

        for (let i = 0; i < 18; i++) {
            const bit = (versionBits >> i) & 1;
            const r = Math.floor(i / 3);
            const c = i % 3;
            matrix[r][size - 11 + c] = bit;
            matrix[size - 11 + c][r] = bit;
        }
    }

    function calculatePenalty(matrix, size) {
        let penalty = 0;

        for (let r = 0; r < size; r++) {
            let runColor = -1;
            let runLen = 0;
            for (let c = 0; c < size; c++) {
                if (matrix[r][c] === runColor) {
                    runLen++;
                } else {
                    if (runLen >= 5) penalty += runLen - 2;
                    runColor = matrix[r][c];
                    runLen = 1;
                }
            }
            if (runLen >= 5) penalty += runLen - 2;
        }

        for (let c = 0; c < size; c++) {
            let runColor = -1;
            let runLen = 0;
            for (let r = 0; r < size; r++) {
                if (matrix[r][c] === runColor) {
                    runLen++;
                } else {
                    if (runLen >= 5) penalty += runLen - 2;
                    runColor = matrix[r][c];
                    runLen = 1;
                }
            }
            if (runLen >= 5) penalty += runLen - 2;
        }

        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size - 1; c++) {
                const color = matrix[r][c];
                if (color === matrix[r][c + 1] && color === matrix[r + 1][c] && color === matrix[r + 1][c + 1]) {
                    penalty += 3;
                }
            }
        }

        const pattern1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
        const pattern2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= size - 11; c++) {
                let match1 = true, match2 = true;
                for (let i = 0; i < 11; i++) {
                    if (matrix[r][c + i] !== pattern1[i]) match1 = false;
                    if (matrix[r][c + i] !== pattern2[i]) match2 = false;
                }
                if (match1 || match2) penalty += 40;
            }
        }

        for (let c = 0; c < size; c++) {
            for (let r = 0; r <= size - 11; r++) {
                let match1 = true, match2 = true;
                for (let i = 0; i < 11; i++) {
                    if (matrix[r + i][c] !== pattern1[i]) match1 = false;
                    if (matrix[r + i][c] !== pattern2[i]) match2 = false;
                }
                if (match1 || match2) penalty += 40;
            }
        }

        let dark = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (matrix[r][c] === 1) dark++;
            }
        }
        const percent = (dark * 100) / (size * size);
        const prev5 = Math.floor(percent / 5) * 5;
        const next5 = prev5 + 5;
        penalty += Math.min(Math.abs(prev5 - 50), Math.abs(next5 - 50)) * 2;

        return penalty;
    }

    function cloneMatrix(matrix) {
        return matrix.map(row => [...row]);
    }

    function generate(text, options = {}) {
        const ecl = options.correctLevel !== undefined ? options.correctLevel : ECL.H;
        const data = encodeTextToBytes(text);
        const version = findMinimumVersion(data.length, ecl);

        if (version < 0) {
            throw new Error('Data too long for QR code');
        }

        const dataCodewords = encodeDataToCodewords(data, version, ecl);
        const allCodewords = generateErrorCorrectionCodewords(dataCodewords, version, ecl);

        const qr = initializeMatrix(version);
        drawFinderPatterns(qr);
        drawAlignmentPatterns(qr, version);
        drawTimingPatterns(qr);
        reserveFormatAndVersionAreas(qr, version);
        writeDataBits(qr, allCodewords);

        let bestMask = 0;
        let bestPenalty = Infinity;
        let bestMatrix = null;

        for (let mask = 0; mask < 8; mask++) {
            const testQr = {
                matrix: cloneMatrix(qr.matrix),
                reserved: qr.reserved,
                size: qr.size
            };

            applyMask(testQr, mask);
            writeFormatInfo(testQr, ecl, mask);
            writeVersionInfo(testQr, version);

            const penalty = calculatePenalty(testQr.matrix, testQr.size);
            if (penalty < bestPenalty) {
                bestPenalty = penalty;
                bestMask = mask;
                bestMatrix = testQr.matrix;
            }
        }

        return {
            matrix: bestMatrix,
            size: qr.size,
            version: version
        };
    }

    function renderToCanvas(container, text, options = {}) {
        const width = options.width || 256;
        const height = options.height || 256;
        const colorDark = options.colorDark || '#000000';
        const colorLight = options.colorLight || '#ffffff';

        const qr = generate(text, options);
        const canvasSize = Math.min(width, height);
        const moduleSize = canvasSize / qr.size;
        const offset = (canvasSize - moduleSize * qr.size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = colorLight;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = colorDark;
        for (let r = 0; r < qr.size; r++) {
            for (let c = 0; c < qr.size; c++) {
                if (qr.matrix[r][c] === 1) {
                    ctx.fillRect(offset + c * moduleSize, offset + r * moduleSize, moduleSize, moduleSize);
                }
            }
        }

        container.innerHTML = '';
        container.appendChild(canvas);

        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.style.display = 'none';
        container.appendChild(img);

        return canvas;
    }

    function QRCode(container, options) {
        if (typeof options === 'string') {
            options = {text: options};
        }

        return renderToCanvas(container, options.text, options);
    }

    QRCode.CorrectLevel = ECL;
    QRCode.generate = generate;
    QRCode.renderToCanvas = renderToCanvas;

    global.QRCode = QRCode;

    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return QRCode;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = QRCode;
    }

})(typeof window !== 'undefined' ? window : this);
