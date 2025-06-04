// Settings Management
class SettingsManager {
    constructor() {
        this.settings = {
            focusTime: 25,
            shortBreak: 5,
            longBreak: 15,
            sessionsUntilLongBreak: 4,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            tickingSound: false,
            volume: 50,
            theme: 'classic',
            notifications: true
        };

        this.loadSettings();
        this.initializeSettingsUI();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            } catch (e) {
                console.warn('Failed to load settings, using defaults');
            }
        }
    }

    saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
        this.applySettings();
    }

    applySettings() {
        // Update timer display if not running
        if (window.timer && !window.timer.isRunning) {
            window.timer.resetTimer();
        }

        // Apply theme
        this.applyTheme(this.settings.theme);

        // Update sound settings
        if (window.soundManager) {
            window.soundManager.setVolume(this.settings.volume);
            window.soundManager.setTickingEnabled(this.settings.tickingSound);
        }

        // Update UI
        this.updateSettingsUI();

        // Show confirmation
        if (window.soundManager) {
            window.soundManager.showNotification('Settings saved successfully!', 'success');
        }
    }

    initializeSettingsUI() {
        // Settings modal event listeners
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettingsFromUI();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Volume slider real-time update
        const volumeSlider = document.getElementById('volume');
        const volumeValue = document.getElementById('volumeValue');

        volumeSlider.addEventListener('input', (e) => {
            volumeValue.textContent = e.target.value + '%';
        });

        // Theme selector
        document.getElementById('themeBtn').addEventListener('click', () => {
            this.openThemeModal();
        });

        // Initialize theme options
        this.initializeThemeOptions();

        // Apply current settings
        this.applySettings();
    }

    openSettingsModal() {
        this.updateSettingsUI();
        document.getElementById('settingsModal').classList.add('show');
    }

    updateSettingsUI() {
        document.getElementById('focusTime').value = this.settings.focusTime;
        document.getElementById('shortBreak').value = this.settings.shortBreak;
        document.getElementById('longBreak').value = this.settings.longBreak;
        document.getElementById('sessionsUntilLongBreak').value = this.settings.sessionsUntilLongBreak;
        document.getElementById('autoStartBreaks').checked = this.settings.autoStartBreaks;
        document.getElementById('autoStartPomodoros').checked = this.settings.autoStartPomodoros;
        document.getElementById('tickingSound').checked = this.settings.tickingSound;
        document.getElementById('volume').value = this.settings.volume;
        document.getElementById('volumeValue').textContent = this.settings.volume + '%';
    }

    saveSettingsFromUI() {
        this.settings.focusTime = parseInt(document.getElementById('focusTime').value);
        this.settings.shortBreak = parseInt(document.getElementById('shortBreak').value);
        this.settings.longBreak = parseInt(document.getElementById('longBreak').value);
        this.settings.sessionsUntilLongBreak = parseInt(document.getElementById('sessionsUntilLongBreak').value);
        this.settings.autoStartBreaks = document.getElementById('autoStartBreaks').checked;
        this.settings.autoStartPomodoros = document.getElementById('autoStartPomodoros').checked;
        this.settings.tickingSound = document.getElementById('tickingSound').checked;
        this.settings.volume = parseInt(document.getElementById('volume').value);

        this.saveSettings();
        document.getElementById('settingsModal').classList.remove('show');
    }

    resetToDefaults() {
        this.settings = {
            focusTime: 25,
            shortBreak: 5,
            longBreak: 15,
            sessionsUntilLongBreak: 4,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            tickingSound: false,
            volume: 50,
            theme: 'classic',
            notifications: true
        };

        this.saveSettings();
        this.updateSettingsUI();
    }

    initializeThemeOptions() {
        const themeOptions = document.querySelectorAll('.theme-option');

        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.setTheme(theme);

                // Update active state
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // Close modal after a short delay
                setTimeout(() => {
                    document.getElementById('themeModal').classList.remove('show');
                }, 300);
            });
        });

        // Set active theme
        this.updateActiveTheme();
    }

    updateActiveTheme() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            if (option.dataset.theme === this.settings.theme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    openThemeModal() {
        this.updateActiveTheme();
        document.getElementById('themeModal').classList.add('show');
    }

    setTheme(theme) {
        this.settings.theme = theme;
        this.applyTheme(theme);
        this.saveSettings();
    }

    applyTheme(theme) {
        // Remove all theme classes
        const themes = ['classic', 'dark', 'forest', 'ocean', 'sunset', 'minimal'];
        themes.forEach(t => {
            document.body.classList.remove(`theme-${t}`);
        });

        // Add selected theme class
        document.body.classList.add(`theme-${theme}`);

        // Update meta theme color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const themeColors = {
            classic: '#ff6b6b',
            dark: '#2d2d2d',
            forest: '#27ae60',
            ocean: '#3498db',
            sunset: '#e74c3c',
            minimal: '#2c3e50'
        };

        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColors[theme] || themeColors.classic);
        }
    }

    getSetting(key) {
        return this.settings[key];
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
}