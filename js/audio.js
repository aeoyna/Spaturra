class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Master volume
        this.masterGain.connect(this.ctx.destination);
        this.initialized = false;
        this.bgmOscs = [];
        this.bgmGain = null;
    }

    init() {
        if (!this.initialized) {
            // Must be called from a user gesture (e.g. key press or click)
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this.initialized = true;
        }
    }

    // Play a basic beep
    playTone(frequency, type, duration, vol = 1) {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShoot(type = 'normal') {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;

        if (type === 'normal' || type === 'double') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'laser') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.2); // flat pitch
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'ripple') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'missile') {
            // "Hyuu" swoosh: sine gliding from low to high, then fading
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(2000, now + 0.25);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
            osc.start(now);
            osc.stop(now + 0.28);

            // Thin noise layer for a "tail" effect
            const bufSize = this.ctx.sampleRate * 0.25;
            const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buf;
            const bpf = this.ctx.createBiquadFilter();
            bpf.type = 'bandpass';
            bpf.frequency.setValueAtTime(600, now);
            bpf.frequency.exponentialRampToValueAtTime(3000, now + 0.25);
            bpf.Q.value = 2;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.08, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            noise.connect(bpf);
            bpf.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            noise.start(now);
        }
    }

    playExplosion() {
        if (!this.initialized) return;

        // Create noise buffer
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter the noise to sound more like an explosion (emphasize lows)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = this.ctx.createGain();

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        noise.start(now);
    }

    playPowerUp() {
        if (!this.initialized) return;

        const now = this.ctx.currentTime;

        // Fast arpeggio
        this._playNote(440, 'sine', now, 0.1); // A4
        this._playNote(554, 'sine', now + 0.05, 0.1); // C#5
        this._playNote(659, 'sine', now + 0.1, 0.1); // E5
        this._playNote(880, 'sine', now + 0.15, 0.2); // A5
    }

    playDamage() {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    _playNote(freq, type, startTime, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // --- BGM System (Procedural) ---
    startBGM() {
        if (!this.initialized || this.bgmOscs.length > 0) return;

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.15; // Lower volume for BGM
        this.bgmGain.connect(this.masterGain);

        const now = this.ctx.currentTime;
        const tempo = 140;
        const quarterNote = 60 / tempo;

        // Simple 4-bar bass/lead loop
        const scheduleNote = (freq, type, time, dur, vol = 0.5) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(vol, time + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, time + dur);
            osc.connect(g);
            g.connect(this.bgmGain);
            osc.start(time);
            osc.stop(time + dur);
            this.bgmOscs.push(osc);
        };

        const loop = () => {
            const startTime = this.ctx.currentTime + 0.1;
            for (let i = 0; i < 16; i++) {
                const time = startTime + i * (quarterNote / 2);
                // Bass (Pulse)
                const bassFreq = i % 8 < 4 ? 55 : 48.99; // A1 to G1
                if (i % 2 === 0) scheduleNote(bassFreq, 'square', time, 0.2, 0.4);

                // Beep melody (Techno vibe)
                if (i === 0 || i === 3 || i === 6 || i === 10 || i === 13) {
                    const melFreq = i % 8 < 4 ? 440 : 392; // A4 to G4
                    scheduleNote(melFreq, 'sine', time, 0.1, 0.3);
                }
            }
            // Schedule next loop
            this.bgmTimer = setTimeout(loop, (quarterNote * 8) * 1000);
        };

        loop();
    }

    stopBGM() {
        if (this.bgmTimer) clearTimeout(this.bgmTimer);
        this.bgmOscs.forEach(osc => { try { osc.stop(); } catch (e) { } });
        this.bgmOscs = [];
    }
}
