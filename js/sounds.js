// Sound Management
class SoundManager {
    constructor() {
        this.sounds = {
            tick: null,
            bell: null,
            complete: null
        };
        this.volume = 0.5;
        this.enabled = true;
        this.tickingEnabled = false;
        this.tickInterval = null;

        this.initializeSounds();
    }

    initializeSounds() {
        // Create audio context for better browser compatibility
        if (typeof Audio !== 'undefined') {
            // Use data URLs for basic sounds to avoid file dependencies
            this.sounds.tick = this.createTickSound();
            this.sounds.bell = this.createBellSound();
            this.sounds.complete = this.createCompleteSound();
        }
    }

    createTickSound() {
        // Generate a simple tick sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        return {
            play: () => {
                if (!this.enabled || !this.tickingEnabled) return;

                try {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();

                    osc.connect(gain);
                    gain.connect(audioContext.destination);

                    osc.frequency.setValueAtTime(800, audioContext.currentTime);
                    gain.gain.setValueAtTime(0, audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(this.volume * 0.1, audioContext.currentTime + 0.01);
                    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);

                    osc.start(audioContext.currentTime);
                    osc.stop(audioContext.currentTime + 0.1);
                } catch (e) {
                    console.log('Tick sound not available');
                }
            }
        };
    }

    createBellSound() {
        return {
            play: () => {
                if (!this.enabled) return;

                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();

                    osc.connect(gain);
                    gain.connect(audioContext.destination);

                    osc.frequency.setValueAtTime(800, audioContext.currentTime);
                    osc.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                    osc.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

                    gain.gain.setValueAtTime(0, audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                    osc.start(audioContext.currentTime);
                    osc.stop(audioContext.currentTime + 0.5);
                } catch (e) {
                    // Fallback notification
                    this.showNotification('🔔 Timer finished!');
                }
            }
        };
    }

    createCompleteSound() {
        return {
            play: () => {
                if (!this.enabled) return;

                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                    // Play a success melody
                    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
                    const noteDuration = 0.2;

                    notes.forEach((freq, index) => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();

                        osc.connect(gain);
                        gain.connect(audioContext.destination);

                        osc.frequency.setValueAtTime(freq, audioContext.currentTime + index * noteDuration);
                        gain.gain.setValueAtTime(0, audioContext.currentTime + index * noteDuration);
                        gain.gain.linearRampToValueAtTime(this.volume * 0.2, audioContext.currentTime + index * noteDuration + 0.01);
                        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (index + 1) * noteDuration);

                        osc.start(audioContext.currentTime + index * noteDuration);
                        osc.stop(audioContext.currentTime + (index + 1) * noteDuration);
                    });
                } catch (e) {
                    // Fallback notification
                    this.showNotification('🎉 Pomodoro completed!');
                }
            }
        };
    }

    playTick() {
        if (this.sounds.tick) {
            this.sounds.tick.play();
        }
    }

    playBell() {
        if (this.sounds.bell) {
            this.sounds.bell.play();
        }

        // Also trigger browser notification if permitted
        this.requestNotificationPermission();
    }

    playComplete() {
        if (this.sounds.complete) {
            this.sounds.complete.play();
        }

        // Also trigger browser notification if permitted
        this.requestNotificationPermission();
    }

    startTicking() {
        if (this.tickingEnabled && !this.tickInterval) {
            this.tickInterval = setInterval(() => {
                this.playTick();
            }, 1000);
        }
    }

    stopTicking() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    setVolume(volume) {
        this.volume = volume / 100;
    }

    setTickingEnabled(enabled) {
        this.tickingEnabled = enabled;
        if (!enabled) {
            this.stopTicking();
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopTicking();
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    showBrowserNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                icon: 'assets/icons/favicon.ico',
                badge: 'assets/icons/favicon.ico',
                ...options
            });
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}