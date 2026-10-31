// Modern Tetris Oyunu - Tam Fonksiyonel & SRS Uyumlu Oyun Motoru

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // 300x600 canvas boyutu

// Tetromino Tanımları ve Renkleri
const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

const COLORS = {
    I: { main: '#00f0ff', glow: 'rgba(0, 240, 255, 0.45)', light: '#a6f7ff', dark: '#009bb3' },
    J: { main: '#2979ff', glow: 'rgba(41, 121, 255, 0.45)', light: '#82b1ff', dark: '#1565c0' },
    L: { main: '#ff9100', glow: 'rgba(255, 145, 0, 0.45)', light: '#ffc480', dark: '#c76a00' },
    O: { main: '#ffd600', glow: 'rgba(255, 214, 0, 0.45)', light: '#ffea75', dark: '#b29500' },
    S: { main: '#00e676', glow: 'rgba(0, 230, 118, 0.45)', light: '#69f0ae', dark: '#00a352' },
    T: { main: '#d500f9', glow: 'rgba(213, 0, 249, 0.45)', light: '#ea80fc', dark: '#9500ae' },
    Z: { main: '#ff1744', glow: 'rgba(255, 23, 68, 0.45)', light: '#ff8a95', dark: '#b2102f' }
};

// Parçacık Sınıfı (Satır silme efektleri için)
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1.5;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.gravity = 0.18;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

// Yüzen Metin Sınıfı ("TETRIS!", "DOUBLE!" vb.)
class FloatingText {
    constructor(text, x, y, color = '#ffd600') {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.018;
    }

    update() {
        this.y -= 0.8;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = '900 24px "Segoe UI", sans-serif';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class TetrisGame {
    constructor() {
        // Canvas referansları
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');

        // Oyun Durumu
        this.board = [];
        this.bag = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.heldPiece = null;
        this.canHold = true;

        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = -1;
        this.highScore = parseInt(localStorage.getItem('tetris_high_score') || '0', 10);

        this.gameOver = false;
        this.isPaused = false;
        this.isPlaying = false;

        // Zamanlama & Döngü
        this.lastTime = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lockDelay = 450;
        this.lockTimer = null;
        this.lockResets = 0;
        this.maxLockResets = 15;
        this.animFrameId = null;

        // Efektler
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTime = 0;

        // DOM Elementleri
        this.scoreElem = document.getElementById('score');
        this.levelElem = document.getElementById('level');
        this.linesElem = document.getElementById('lines');
        this.highScoreElem = document.getElementById('high-score');
        this.highScoreGameOverElem = document.getElementById('gameover-highscore');
        this.finalScoreElem = document.getElementById('final-score');
        this.finalLinesElem = document.getElementById('final-lines');

        this.pauseModal = document.getElementById('pause-modal');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.startOverlay = document.getElementById('start-overlay');

        this.highScoreElem.innerText = this.highScore.toLocaleString();

        this.setupEventListeners();
        this.initBoard();
        this.drawEmptyBoard();
    }

    initBoard() {
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    // 7-Bag Randomizer
    generateBag() {
        const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        return pieces;
    }

    getNextPieceType() {
        if (this.bag.length === 0) {
            this.bag = this.generateBag();
        }
        return this.bag.pop();
    }

    createPiece(type) {
        return {
            type: type,
            matrix: SHAPES[type].map(row => [...row]),
            color: COLORS[type],
            x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
            y: type === 'I' ? -1 : 0
        };
    }

    start() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
        }

        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }

        this.initBoard();
        this.bag = this.generateBag();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = -1;
        this.gameOver = false;
        this.isPaused = false;
        this.isPlaying = true;
        this.heldPiece = null;
        this.canHold = true;
        this.particles = [];
        this.floatingTexts = [];

        this.dropInterval = this.getSpeedForLevel(this.level);
        this.updateStats();

        this.currentPiece = this.createPiece(this.getNextPieceType());
        this.nextPiece = this.createPiece(this.getNextPieceType());

        this.startOverlay.classList.add('hidden');
        this.gameOverModal.classList.add('hidden');
        this.pauseModal.classList.add('hidden');

        window.retroAudio.init();
        window.retroAudio.startMusic();

        this.lastTime = performance.now();
        this.dropCounter = 0;
        this.animFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    getSpeedForLevel(level) {
        return Math.max(90, Math.floor(1000 * Math.pow(0.85, level - 1)));
    }

    updateStats() {
        this.scoreElem.innerText = this.score.toLocaleString();
        this.levelElem.innerText = this.level;
        this.linesElem.innerText = this.lines;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetris_high_score', this.highScore);
            this.highScoreElem.innerText = this.highScore.toLocaleString();
        }
    }

    // Çarpışma Testi
    collide(matrix, offset) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    const boardX = x + offset.x;
                    const boardY = y + offset.y;

                    if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                        return true;
                    }

                    if (boardY >= 0 && this.board[boardY][boardX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Döndürme Matrisi
    rotateMatrix(matrix, clockwise = true) {
        const N = matrix.length;
        const result = Array.from({ length: N }, () => Array(N).fill(0));
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                if (clockwise) {
                    result[x][N - 1 - y] = matrix[y][x];
                } else {
                    result[N - 1 - x][y] = matrix[y][x];
                }
            }
        }
        return result;
    }

    // SRS Duvar Tekmesi (Wall Kicks)
    rotatePiece(clockwise = true) {
        if (!this.isPlaying || this.isPaused || this.gameOver) return;

        const originalMatrix = this.currentPiece.matrix;
        const rotated = this.rotateMatrix(originalMatrix, clockwise);

        if (this.currentPiece.type === 'O') return;

        const offsets = this.currentPiece.type === 'I'
            ? [
                { x: 0, y: 0 },
                { x: -2, y: 0 },
                { x: 1, y: 0 },
                { x: -2, y: -1 },
                { x: 1, y: 2 },
                { x: -1, y: 0 },
                { x: 2, y: 0 }
            ]
            : [
                { x: 0, y: 0 },
                { x: -1, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: -1 },
                { x: -1, y: -1 },
                { x: 1, y: -1 },
                { x: 0, y: 1 },
                { x: -2, y: 0 },
                { x: 2, y: 0 }
            ];

        for (const offset of offsets) {
            const testOffset = {
                x: this.currentPiece.x + offset.x,
                y: this.currentPiece.y + offset.y
            };

            if (!this.collide(rotated, testOffset)) {
                this.currentPiece.matrix = rotated;
                this.currentPiece.x = testOffset.x;
                this.currentPiece.y = testOffset.y;
                window.retroAudio.playRotate();
                this.resetLockDelay();
                return;
            }
        }
    }

    // Hareket Fonksiyonları
    moveLeft() {
        if (!this.isPlaying || this.isPaused || this.gameOver) return;
        if (!this.collide(this.currentPiece.matrix, { x: this.currentPiece.x - 1, y: this.currentPiece.y })) {
            this.currentPiece.x--;
            window.retroAudio.playMove();
            this.resetLockDelay();
        }
    }

    moveRight() {
        if (!this.isPlaying || this.isPaused || this.gameOver) return;
        if (!this.collide(this.currentPiece.matrix, { x: this.currentPiece.x + 1, y: this.currentPiece.y })) {
            this.currentPiece.x++;
            window.retroAudio.playMove();
            this.resetLockDelay();
        }
    }

    softDrop() {
        if (!this.isPlaying || this.isPaused || this.gameOver) return;
        if (!this.collide(this.currentPiece.matrix, { x: this.currentPiece.x, y: this.currentPiece.y + 1 })) {
            this.currentPiece.y++;
            this.score += 1;
            this.updateStats();
            this.dropCounter = 0;
            window.retroAudio.playDrop();
        } else {
            if (!this.lockTimer) {
                this.lockTimer = setTimeout(() => {
                    this.lockPiece();
                }, this.lockDelay);
            }
        }
    }

    hardDrop() {
        if (!this.isPlaying || this.isPaused || this.gameOver) return;
        let dropDistance = 0;
        while (!this.collide(this.currentPiece.matrix, { x: this.currentPiece.x, y: this.currentPiece.y + 1 })) {
            this.currentPiece.y++;
            dropDistance++;
        }

        this.score += dropDistance * 2;
        this.updateStats();
        this.shake(6);
        window.retroAudio.playHardDrop();
        this.lockPiece(true);
    }

    hold() {
        if (!this.isPlaying || this.isPaused || this.gameOver || !this.canHold) return;

        window.retroAudio.playHold();
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
        }
        this.lockResets = 0;

        if (this.heldPiece === null) {
            this.heldPiece = this.currentPiece.type;
            this.spawnPiece();
        } else {
            const temp = this.currentPiece.type;
            this.currentPiece = this.createPiece(this.heldPiece);
            this.heldPiece = temp;

            if (this.collide(this.currentPiece.matrix, { x: this.currentPiece.x, y: this.currentPiece.y })) {
                this.triggerGameOver();
                return;
            }
        }

        this.canHold = false;
        this.dropCounter = 0;
    }

    // Hayalet Parça Y Hesabı
    getGhostY() {
        let ghostY = this.currentPiece.y;
        while (!this.collide(this.currentPiece.matrix, { x: this.currentPiece.x, y: ghostY + 1 })) {
            ghostY++;
        }
        return ghostY;
    }

    resetLockDelay() {
        if (this.lockResets < this.maxLockResets) {
            this.lockResets++;
            if (this.lockTimer) {
                clearTimeout(this.lockTimer);
                this.lockTimer = null;
            }
        }
    }

    shake(intensity = 5) {
        this.shakeTime = intensity;
    }

    // Parçayı Zemine Sabitleme
    lockPiece(immediate = false) {
        if (!immediate && !this.collide(this.currentPiece.matrix, { x: this.currentPiece.x, y: this.currentPiece.y + 1 })) {
            return;
        }

        this.currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardY = y + this.currentPiece.y;
                    const boardX = x + this.currentPiece.x;
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            });
        });

        this.checkLines();
        this.canHold = true;
        this.lockResets = 0;
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
        }

        this.spawnPiece();
    }

    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece(this.getNextPieceType());

        if (this.collide(this.currentPiece.matrix, { x: this.currentPiece.x, y: this.currentPiece.y })) {
            this.triggerGameOver();
        }
    }

    checkLines() {
        const fullRows = [];
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                fullRows.push(y);
            }
        }

        if (fullRows.length > 0) {
            this.combo++;
            const lineCount = fullRows.length;

            fullRows.forEach(y => {
                for (let x = 0; x < COLS; x++) {
                    const color = this.board[y][x].main || '#ffffff';
                    for (let p = 0; p < 8; p++) {
                        this.particles.push(
                            new Particle(
                                x * BLOCK_SIZE + BLOCK_SIZE / 2,
                                y * BLOCK_SIZE + BLOCK_SIZE / 2,
                                color
                            )
                        );
                    }
                }
            });

            const pointsTable = [0, 100, 300, 500, 800];
            const baseScore = pointsTable[lineCount] || 800;
            const comboBonus = this.combo > 0 ? this.combo * 50 * this.level : 0;
            this.score += (baseScore * this.level) + comboBonus;
            this.lines += lineCount;

            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = this.getSpeedForLevel(this.level);
                window.retroAudio.playLevelUp();
                this.floatingTexts.push(new FloatingText(`SEVİYE ${this.level}!`, 150, 200, '#00f0ff'));
            }

            let label = '';
            if (lineCount === 1) label = 'SINGLE!';
            else if (lineCount === 2) label = 'DOUBLE!';
            else if (lineCount === 3) label = 'TRIPLE!';
            else if (lineCount === 4) {
                label = 'TETRIS!';
                this.shake(10);
            }

            if (this.combo > 0) {
                label += ` (x${this.combo + 1})`;
            }

            this.floatingTexts.push(
                new FloatingText(label, 150, fullRows[0] * BLOCK_SIZE, lineCount === 4 ? '#00f0ff' : '#ffd600')
            );

            window.retroAudio.playClear(lineCount);

            fullRows.forEach(rowIndex => {
                this.board.splice(rowIndex, 1);
                this.board.unshift(Array(COLS).fill(0));
            });

            this.updateStats();
        } else {
            this.combo = -1;
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        this.isPlaying = false;
        window.retroAudio.stopMusic();
        window.retroAudio.playGameOver();

        this.finalScoreElem.innerText = this.score.toLocaleString();
        this.finalLinesElem.innerText = this.lines;
        this.highScoreGameOverElem.innerText = this.highScore.toLocaleString();

        this.gameOverModal.classList.remove('hidden');
    }

    togglePause() {
        if (!this.isPlaying || this.gameOver) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            window.retroAudio.stopMusic();
            this.pauseModal.classList.remove('hidden');
        } else {
            window.retroAudio.startMusic();
            this.pauseModal.classList.add('hidden');
            this.lastTime = performance.now();
        }
    }

    gameLoop(currentTime) {
        if (!this.isPlaying) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.isPaused && !this.gameOver) {
            this.dropCounter += deltaTime;

            if (this.dropCounter > this.dropInterval) {
                if (!this.collide(this.currentPiece.matrix, { x: this.currentPiece.x, y: this.currentPiece.y + 1 })) {
                    this.currentPiece.y++;
                } else {
                    if (!this.lockTimer) {
                        this.lockTimer = setTimeout(() => {
                            this.lockPiece();
                        }, this.lockDelay);
                    }
                }
                this.dropCounter = 0;
            }

            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                this.floatingTexts[i].update();
                if (this.floatingTexts[i].life <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }

            if (this.shakeTime > 0) {
                this.shakeTime -= 0.5;
            }
        }

        this.draw();
        this.animFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    draw() {
        this.ctx.save();

        if (this.shakeTime > 0) {
            const offsetX = (Math.random() - 0.5) * this.shakeTime * 2;
            const offsetY = (Math.random() - 0.5) * this.shakeTime * 2;
            this.ctx.translate(offsetX, offsetY);
        }

        this.ctx.fillStyle = '#0b0e14';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.drawBoard();

        if (this.currentPiece && !this.gameOver) {
            this.drawGhostPiece();
            this.drawPiece(this.currentPiece, this.ctx);
        }

        this.particles.forEach(p => p.draw(this.ctx));
        this.floatingTexts.forEach(t => t.draw(this.ctx));

        this.ctx.restore();

        this.drawPreview(this.nextCtx, this.nextPiece);
        this.drawPreview(this.holdCtx, this.heldPiece ? this.createPiece(this.heldPiece) : null, !this.canHold);
    }

    drawEmptyBoard() {
        this.ctx.fillStyle = '#0b0e14';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawPreview(this.nextCtx, null);
        this.drawPreview(this.holdCtx, null);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }

        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }

    drawBlock(ctx, x, y, colorData, alpha = 1.0) {
        const px = x * BLOCK_SIZE;
        const py = y * BLOCK_SIZE;

        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.shadowColor = colorData.glow;
        ctx.shadowBlur = 8;

        ctx.fillStyle = colorData.main;
        ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

        // Üst / Sol Işık Efekti
        ctx.fillStyle = colorData.light;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + 1);
        ctx.lineTo(px + BLOCK_SIZE - 1, py + 1);
        ctx.lineTo(px + BLOCK_SIZE - 4, py + 4);
        ctx.lineTo(px + 4, py + 4);
        ctx.lineTo(px + 4, py + BLOCK_SIZE - 4);
        ctx.lineTo(px + 1, py + BLOCK_SIZE - 1);
        ctx.closePath();
        ctx.fill();

        // Alt / Sağ Gölge Efekti
        ctx.fillStyle = colorData.dark;
        ctx.beginPath();
        ctx.moveTo(px + BLOCK_SIZE - 1, py + 1);
        ctx.lineTo(px + BLOCK_SIZE - 1, py + BLOCK_SIZE - 1);
        ctx.lineTo(px + 1, py + BLOCK_SIZE - 1);
        ctx.lineTo(px + 4, py + BLOCK_SIZE - 4);
        ctx.lineTo(px + BLOCK_SIZE - 4, py + BLOCK_SIZE - 4);
        ctx.lineTo(px + BLOCK_SIZE - 4, py + 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.board[y][x];
                if (cell !== 0) {
                    this.drawBlock(this.ctx, x, y, cell);
                }
            }
        }
    }

    drawPiece(piece, ctx) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const blockY = y + piece.y;
                    if (blockY >= 0) {
                        this.drawBlock(ctx, x + piece.x, blockY, piece.color);
                    }
                }
            });
        });
    }

    drawGhostPiece() {
        const ghostY = this.getGhostY();
        if (ghostY === this.currentPiece.y) return;

        this.currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const px = (x + this.currentPiece.x) * BLOCK_SIZE;
                    const py = (y + ghostY) * BLOCK_SIZE;

                    if (y + ghostY >= 0) {
                        this.ctx.save();
                        this.ctx.strokeStyle = this.currentPiece.color.main;
                        this.ctx.lineWidth = 1.5;
                        this.ctx.fillStyle = this.currentPiece.color.glow;
                        this.ctx.fillRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
                        this.ctx.strokeRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
                        this.ctx.restore();
                    }
                }
            });
        });
    }

    drawPreview(ctx, piece, isLocked = false) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (!piece) return;

        const matrix = piece.matrix;
        const blockSize = 20;

        let minX = matrix[0].length, maxX = -1, minY = matrix.length, maxY = -1;
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (maxX === -1) return;

        const pieceWidth = (maxX - minX + 1) * blockSize;
        const pieceHeight = (maxY - minY + 1) * blockSize;
        const startX = Math.round((ctx.canvas.width - pieceWidth) / 2) - minX * blockSize;
        const startY = Math.round((ctx.canvas.height - pieceHeight) / 2) - minY * blockSize;

        ctx.save();
        if (isLocked) ctx.globalAlpha = 0.35;

        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    const px = startX + x * blockSize;
                    const py = startY + y * blockSize;

                    ctx.fillStyle = piece.color.main;
                    ctx.shadowColor = piece.color.glow;
                    ctx.shadowBlur = 6;
                    ctx.fillRect(px + 1, py + 1, blockSize - 2, blockSize - 2);

                    ctx.fillStyle = piece.color.light;
                    ctx.fillRect(px + 2, py + 2, blockSize - 4, 2);
                    ctx.fillRect(px + 2, py + 2, 2, blockSize - 4);
                }
            }
        }

        ctx.restore();
    }

    // Klavye & Kontroller
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
                return;
            }

            if (e.code === 'KeyM') {
                const active = window.retroAudio.toggleMusic();
                const btn = document.getElementById('btn-music');
                if (btn) btn.innerHTML = active ? '🎵 Müzik: Açık' : '🔇 Müzik: Kapalı';
                return;
            }

            if (!this.isPlaying || this.isPaused || this.gameOver) return;

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.softDrop();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'KeyX':
                    this.rotatePiece(true);
                    break;
                case 'KeyZ':
                    this.rotatePiece(false);
                    break;
                case 'Space':
                    this.hardDrop();
                    break;
                case 'KeyC':
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.hold();
                    break;
            }
        });

        // UI Butonları
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());

        const btnMusic = document.getElementById('btn-music');
        if (btnMusic) {
            btnMusic.addEventListener('click', () => {
                const active = window.retroAudio.toggleMusic();
                btnMusic.innerHTML = active ? '🎵 Müzik: Açık' : '🔇 Müzik: Kapalı';
            });
        }

        const btnSound = document.getElementById('btn-sound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                const active = window.retroAudio.toggleSound();
                btnSound.innerHTML = active ? '🔊 Ses: Açık' : '🔈 Ses: Kapalı';
            });
        }

        // Mobil / Ekran Kontrol Butonları
        const addTouchBtn = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const handler = (e) => {
                e.preventDefault();
                action();
            };
            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('mousedown', handler);
        };

        addTouchBtn('ctrl-left', () => this.moveLeft());
        addTouchBtn('ctrl-right', () => this.moveRight());
        addTouchBtn('ctrl-down', () => this.softDrop());
        addTouchBtn('ctrl-rotate', () => this.rotatePiece(true));
        addTouchBtn('ctrl-harddrop', () => this.hardDrop());
        addTouchBtn('ctrl-hold', () => this.hold());
    }
}

// Oyunu Başlat
window.addEventListener('DOMContentLoaded', () => {
    window.game = new TetrisGame();
});
