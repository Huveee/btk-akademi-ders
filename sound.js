// Web Audio API Tabanlı Retro Ses Motoru (Harici dosya gerektirmez)
class RetroAudio {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.isPlayingMusic = false;
        this.musicTimer = null;
        this.tempo = 140; // BPM
        this.currentNoteIndex = 0;
        this.bassNoteIndex = 0;
        this.masterVolume = 0.2;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Basit osilatör sesi üretici
    playTone(freq, type = 'square', duration = 0.1, gainVal = 0.1, pitchDecay = false) {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (pitchDecay) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.2), this.ctx.currentTime + duration);
            }

            gain.gain.setValueAtTime(gainVal * this.masterVolume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio context hatası olursa sessizce yut
        }
    }

    // Ses Efektleri
    playMove() {
        this.init();
        this.playTone(320, 'square', 0.04, 0.08);
    }

    playRotate() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.12 * this.masterVolume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch(e) {}
    }

    playDrop() {
        this.init();
        this.playTone(180, 'triangle', 0.08, 0.15, true);
    }

    playHardDrop() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        try {
            // Tok bir gümleme efekti
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.25 * this.masterVolume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch(e) {}
    }

    playHold() {
        this.init();
        this.playTone(520, 'sine', 0.1, 0.15);
    }

    playClear(lines) {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        if (lines >= 4) {
            // TETRIS fanfare
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                const noteTime = now + (idx * 0.09);
                gain.gain.setValueAtTime(0.2 * this.masterVolume, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.25);
            });
        } else {
            // Normal satır silme
            const notes = [440, 554, 659].slice(0, lines);
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const noteTime = now + (idx * 0.07);
                gain.gain.setValueAtTime(0.18 * this.masterVolume, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.18);
            });
        }
    }

    playLevelUp() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const notes = [440, 554.37, 659.25, 880];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const noteTime = now + (idx * 0.08);
            gain.gain.setValueAtTime(0.2 * this.masterVolume, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(noteTime);
            osc.stop(noteTime + 0.2);
        });
    }

    playGameOver() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [440, 415.3, 392, 349.2, 329.6];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            const noteTime = now + (idx * 0.12);
            gain.gain.setValueAtTime(0.2 * this.masterVolume, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(noteTime);
            osc.stop(noteTime + 0.3);
        });
    }

    // --- Korobeiniki (Tetris Teması) Chiptune Müzik Motoru ---
    startMusic() {
        if (!this.musicEnabled || this.isPlayingMusic) return;
        this.init();
        this.isPlayingMusic = true;
        this.currentNoteIndex = 0;
        this.playMusicStep();
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    playMusicStep() {
        if (!this.isPlayingMusic || !this.musicEnabled || !this.ctx) return;

        // Klasik Tetris Korobeiniki notaları (Nota, vuruş süresi cinsinden)
        // [Frekans, vuruş/4]
        const N = {
            E5: 659.25, B4: 493.88, C5: 523.25, D5: 587.33, A4: 440.00,
            G4: 392.00, F4: 349.23, E4: 329.63, Gsharp4: 415.30,
            A3: 220.00, E3: 164.81, D3: 146.83, C3: 130.81, B2: 123.47,
            F3: 174.61, Gsharp3: 207.65, G3: 196.00
        };

        const melody = [
            [N.E5, 2], [N.B4, 1], [N.C5, 1], [N.D5, 2], [N.C5, 1], [N.B4, 1],
            [N.A4, 2], [N.A4, 1], [N.C5, 1], [N.E5, 2], [N.D5, 1], [N.C5, 1],
            [N.B4, 3], [N.C5, 1], [N.D5, 2], [N.E5, 2],
            [N.C5, 2], [N.A4, 2], [N.A4, 3], [0, 1],
            
            [N.D5, 3], [N.F4 * 2, 1], [N.A4 * 2, 2], [N.G4 * 2, 1], [N.F4 * 2, 1],
            [N.E5, 3], [N.C5, 1], [N.E5, 2], [N.D5, 1], [N.C5, 1],
            [N.B4, 2], [N.B4, 1], [N.C5, 1], [N.D5, 2], [N.E5, 2],
            [N.C5, 2], [N.A4, 2], [N.A4, 3], [0, 1]
        ];

        const bassline = [
            [N.E3, 2], [N.Gsharp3, 2], [N.A3, 2], [N.C3 * 2, 2],
            [N.D3, 2], [N.F3, 2], [N.E3, 2], [N.Gsharp3, 2],
            [N.A3, 2], [N.C3 * 2, 2], [N.E3, 2], [N.Gsharp3, 2],
            [N.A3, 2], [N.A3, 2], [N.A3, 2], [0, 2],

            [N.D3, 2], [N.F3, 2], [N.D3, 2], [N.F3, 2],
            [N.C3 * 2, 2], [N.E3, 2], [N.C3 * 2, 2], [N.E3, 2],
            [N.E3, 2], [N.Gsharp3, 2], [N.E3, 2], [N.Gsharp3, 2],
            [N.A3, 2], [N.C3 * 2, 2], [N.A3, 2], [0, 2]
        ];

        const beatDuration = (60 / this.tempo) * 0.5; // Sekizlik nota süresi

        const item = melody[this.currentNoteIndex];
        const freq = item[0];
        const duration = item[1] * beatDuration;

        if (freq > 0) {
            try {
                // Melodi kanalı (Chiptune Square wave)
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                gain.gain.setValueAtTime(0.04 * this.masterVolume, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration * 0.85);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration * 0.88);
            } catch (e) {}
        }

        // Bas kanalı (Triangle wave)
        const bassItem = bassline[this.bassNoteIndex % bassline.length];
        const bassFreq = bassItem[0];
        const bassDur = bassItem[1] * beatDuration;
        if (bassFreq > 0) {
            try {
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = 'triangle';
                bassOsc.frequency.setValueAtTime(bassFreq, this.ctx.currentTime);

                bassGain.gain.setValueAtTime(0.06 * this.masterVolume, this.ctx.currentTime);
                bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + bassDur * 0.8);

                bassOsc.connect(bassGain);
                bassGain.connect(this.ctx.destination);
                bassOsc.start();
                bassOsc.stop(this.ctx.currentTime + bassDur * 0.85);
            } catch (e) {}
        }

        this.currentNoteIndex = (this.currentNoteIndex + 1) % melody.length;
        this.bassNoteIndex = (this.bassNoteIndex + 1) % bassline.length;

        this.musicTimer = setTimeout(() => {
            this.playMusicStep();
        }, duration * 1000);
    }
}

window.retroAudio = new RetroAudio();

