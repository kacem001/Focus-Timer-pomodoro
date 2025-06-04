// Timer Management
class Timer {
    constructor(settings, stats, soundManager) {
        this.settings = settings;
        this.stats = stats;
        this.soundManager = soundManager;

        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = 0; // in seconds
        this.totalTime = 0; // in seconds
        this.sessionType = 'focus'; // 'focus', 'shortBreak', 'longBreak'
        this.sessionCount = 0;
        this.completedPomodoros = 0;
        this.wasSkipped = false; // تتبع إذا تم تخطي الجلسة

        this.interval = null;
        this.startTime = null;

        this.initializeTimer();
        this.initializeControls();
        this.updateProgressRing();
    }

    initializeTimer() {
        this.resetTimer();
        this.updateDisplay();
        this.updateSessionInfo();
    }

    initializeControls() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('skipBtn').addEventListener('click', () => this.skip());
    }

    start() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.startNewSession();
        }
    }

    startNewSession() {
        this.isRunning = true;
        this.isPaused = false;
        this.wasSkipped = false; // إعادة تعيين حالة التخطي
        this.startTime = Date.now() - (this.totalTime - this.timeLeft) * 1000;

        this.updateControls();
        this.startInterval();

        if (this.soundManager && this.settings.getSetting('tickingSound')) {
            this.soundManager.startTicking();
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        this.updateSessionInfo();

        // Show start notification
        if (this.soundManager) {
            const sessionName = this.getSessionTypeDisplay();
            this.soundManager.showNotification(`🚀 ${sessionName} started! Stay focused!`, 'info');
        }
    }

    resume() {
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now() - (this.totalTime - this.timeLeft) * 1000;

        this.updateControls();
        this.startInterval();

        if (this.soundManager && this.settings.getSetting('tickingSound')) {
            this.soundManager.startTicking();
        }

        // Show resume notification
        if (this.soundManager) {
            this.soundManager.showNotification('▶️ Timer resumed!', 'info');
        }
    }

    pause() {
        this.isRunning = false;
        this.isPaused = true;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this.soundManager) {
            this.soundManager.stopTicking();
        }

        this.updateControls();

        // Show pause notification
        if (this.soundManager) {
            this.soundManager.showNotification('⏸️ Timer paused.', 'info');
        }
    }

    reset() {
        this.stop();
        this.wasSkipped = false; // إعادة تعيين حالة التخطي
        this.resetTimer();
        this.updateDisplay();
        this.updateProgressRing();
        this.updateControls();
        this.updateSessionInfo();

        // Reset document title
        document.title = 'Focus Timer - Pomodoro Technique';

        // Show reset notification
        if (this.soundManager) {
            this.soundManager.showNotification('🔄 Timer reset!', 'info');
        }
    }

    skip() {
        this.wasSkipped = true; // تعيين أن الجلسة تم تخطيها
        this.completeSession();
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this.soundManager) {
            this.soundManager.stopTicking();
        }
    }

    startInterval() {
        this.interval = setInterval(() => {
            this.tick();
        }, 1000);
    }

    tick() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgressRing();

            // Update document title with remaining time
            const sessionName = this.getSessionTypeDisplay();
            document.title = `${this.formatTime(this.timeLeft)} - ${sessionName} | Focus Timer`;

            // Show warnings for last minutes
            if (this.timeLeft === 60 && this.sessionType === 'focus') {
                if (this.soundManager) {
                    this.soundManager.showNotification('⏰ 1 minute remaining! Stay focused!', 'warning');
                }
            } else if (this.timeLeft === 300 && this.sessionType === 'focus') {
                if (this.soundManager) {
                    this.soundManager.showNotification('⏰ 5 minutes remaining!', 'info');
                }
            }
        } else {
            this.wasSkipped = false; // الجلسة اكتملت بشكل طبيعي
            this.completeSession();
        }
    }

    completeSession() {
        this.stop();

        // Play completion sound
        if (this.soundManager) {
            if (this.sessionType === 'focus') {
                this.soundManager.playComplete();
            } else {
                this.soundManager.playBell();
            }
        }

        // Show notification
        this.showSessionCompleteNotification();

        // Add celebration animation only if not skipped
        if (!this.wasSkipped) {
            this.addCelebrationAnimation();
        }

        // Update stats for focus sessions
        if (this.sessionType === 'focus') {
            this.completedPomodoros++;

            // إضافة البومودورو للإحصائيات مع تحديد إذا تم تخطيها
            this.stats.addPomodoro(this.settings.getSetting('focusTime'), this.wasSkipped);
        }

        // Move to next session
        this.moveToNextSession();
    }

    moveToNextSession() {
        if (this.sessionType === 'focus') {
            this.sessionCount++;

            // Determine break type
            if (this.sessionCount % this.settings.getSetting('sessionsUntilLongBreak') === 0) {
                this.sessionType = 'longBreak';
            } else {
                this.sessionType = 'shortBreak';
            }
        } else {
            this.sessionType = 'focus';
        }

        this.resetTimer();
        this.updateDisplay();
        this.updateProgressRing();
        this.updateSessionInfo();

        // Auto-start next session if enabled
        const shouldAutoStart = this.sessionType === 'focus'
            ? this.settings.getSetting('autoStartPomodoros')
            : this.settings.getSetting('autoStartBreaks');

        if (shouldAutoStart) {
            // Show countdown before auto-start
            let countdown = 3;
            const countdownInterval = setInterval(() => {
                if (this.soundManager) {
                    this.soundManager.showNotification(
                        `🔄 Auto-starting in ${countdown}... Press any button to cancel.`,
                        'info'
                    );
                }
                countdown--;

                if (countdown < 0) {
                    clearInterval(countdownInterval);
                    this.start();
                }
            }, 1000);

            // Store interval to allow cancellation
            this.autoStartInterval = countdownInterval;
        }

        this.updateControls();

        // Reset document title
        document.title = 'Focus Timer - Pomodoro Technique';
    }

    resetTimer() {
        const timeMap = {
            focus: this.settings.getSetting('focusTime'),
            shortBreak: this.settings.getSetting('shortBreak'),
            longBreak: this.settings.getSetting('longBreak')
        };

        // Convert minutes to seconds
        this.totalTime = timeMap[this.sessionType] * 60;
        this.timeLeft = this.totalTime;
        this.wasSkipped = false; // إعادة تعيين حالة التخطي

        // Cancel auto-start if active
        if (this.autoStartInterval) {
            clearInterval(this.autoStartInterval);
            this.autoStartInterval = null;
        }
    }

    updateDisplay() {
        const timeDisplay = document.getElementById('timeDisplay');
        timeDisplay.textContent = this.formatTime(this.timeLeft);

        // Add pulsing effect when time is running low
        if (this.timeLeft <= 60 && this.isRunning && this.sessionType === 'focus') {
            timeDisplay.style.animation = 'pulse 1s infinite';
            timeDisplay.style.color = '#e74c3c';
        } else {
            timeDisplay.style.animation = '';
            timeDisplay.style.color = 'var(--primary-color)';
        }
    }

    updateSessionInfo() {
        const sessionTypeElement = document.getElementById('sessionType');
        const sessionNumberElement = document.getElementById('sessionNumber');

        sessionTypeElement.textContent = this.getSessionTypeDisplay();

        if (this.sessionType === 'focus') {
            sessionNumberElement.textContent = `Session ${this.sessionCount + 1}`;
        } else {
            sessionNumberElement.textContent = 'Break Time';
        }

        // Add visual indicators for session type
        const timerContainer = document.querySelector('.timer-container');
        timerContainer.className = 'timer-container';
        timerContainer.classList.add(`session-${this.sessionType}`);
    }

    getSessionTypeDisplay() {
        const displayMap = {
            focus: 'Focus Time',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };

        return displayMap[this.sessionType];
    }

    updateControls() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const skipBtn = document.getElementById('skipBtn');

        // Cancel auto-start when any button is clicked
        if (this.autoStartInterval) {
            clearInterval(this.autoStartInterval);
            this.autoStartInterval = null;
        }

        if (this.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            resetBtn.disabled = false;
            skipBtn.disabled = false;

            startBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        } else if (this.isPaused) {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = false;
            skipBtn.disabled = false;

            startBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = false;
            skipBtn.disabled = false;

            startBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        }

        // Update button styles based on session type
        this.updateButtonStyles();
    }

    updateButtonStyles() {
        const startBtn = document.getElementById('startBtn');
        const skipBtn = document.getElementById('skipBtn');

        // Remove all session classes
        startBtn.classList.remove('focus-session', 'break-session');
        skipBtn.classList.remove('focus-session', 'break-session');

        // Add appropriate class based on session type
        if (this.sessionType === 'focus') {
            startBtn.classList.add('focus-session');
            skipBtn.classList.add('focus-session');
        } else {
            startBtn.classList.add('break-session');
            skipBtn.classList.add('break-session');
        }
    }

    updateProgressRing() {
        const progressRing = document.querySelector('.progress-ring-progress');
        const radius = 135;
        const circumference = 2 * Math.PI * radius;

        const progress = (this.totalTime - this.timeLeft) / this.totalTime;
        const offset = circumference - (progress * circumference);

        progressRing.style.strokeDashoffset = offset;

        // Change progress ring color based on session type
        const colors = {
            focus: 'var(--primary-color)',
            shortBreak: 'var(--secondary-color)',
            longBreak: 'var(--accent-color)'
        };

        progressRing.style.stroke = colors[this.sessionType];
    }

    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showSessionCompleteNotification() {
        let message;
        let notificationType;

        if (this.wasSkipped) {
            message = this.sessionType === 'focus'
                ? '⚠️ Focus session skipped!'
                : '⚠️ Break skipped!';
            notificationType = 'warning';
        } else {
            if (this.sessionType === 'focus') {
                message = '🎉 Pomodoro completed! Time for a break.';
                notificationType = 'success';
            } else {
                message = '✨ Break time is over! Ready to focus?';
                notificationType = 'info';
            }
        }

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Timer', {
                body: message,
                icon: 'assets/images/logo.png',
                badge: 'assets/images/logo.png',
                tag: 'pomodoro-notification', // Prevent multiple notifications
                requireInteraction: true
            });
        }

        // Show completion message
        if (this.soundManager) {
            this.soundManager.showNotification(message, notificationType);
        }
    }

    addCelebrationAnimation() {
        const timerContainer = document.querySelector('.timer-container');
        timerContainer.classList.add('celebrate');

        // Add confetti effect for milestones
        if (this.completedPomodoros % 5 === 0 && this.completedPomodoros > 0) {
            this.createConfettiEffect();
        }

        setTimeout(() => {
            timerContainer.classList.remove('celebrate');
        }, 2000);
    }

    createConfettiEffect() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3'];
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
        `;

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;
            confettiContainer.appendChild(confetti);
        }

        document.body.appendChild(confettiContainer);

        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }

    getCurrentSessionInfo() {
        return {
            type: this.sessionType,
            timeLeft: this.timeLeft,
            totalTime: this.totalTime,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            sessionCount: this.sessionCount,
            completedPomodoros: this.completedPomodoros,
            wasSkipped: this.wasSkipped,
            progress: ((this.totalTime - this.timeLeft) / this.totalTime) * 100
        };
    }

    // Method to get time in human readable format
    getTimeRemaining() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return { minutes, seconds };
    }

    // Method to get session progress percentage
    getProgress() {
        return ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
    }

    // Method to manually set time (for testing purposes)
    setTime(minutes) {
        if (!this.isRunning) {
            this.timeLeft = minutes * 60;
            this.totalTime = minutes * 60;
            this.updateDisplay();
            this.updateProgressRing();
        }
    }

    // Cleanup method
    destroy() {
        this.stop();
        if (this.autoStartInterval) {
            clearInterval(this.autoStartInterval);
        }

        // Remove event listeners
        document.getElementById('startBtn').removeEventListener('click', () => this.start());
        document.getElementById('pauseBtn').removeEventListener('click', () => this.pause());
        document.getElementById('resetBtn').removeEventListener('click', () => this.reset());
        document.getElementById('skipBtn').removeEventListener('click', () => this.skip());
    }
}

// Add CSS for confetti animation
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confetti-fall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .timer-container.session-focus {
        border-left: 4px solid var(--primary-color);
    }

    .timer-container.session-shortBreak {
        border-left: 4px solid var(--secondary-color);
    }

    .timer-container.session-longBreak {
        border-left: 4px solid var(--accent-color);
    }

    .control-btn.focus-session {
        box-shadow: 0 4px 14px 0 rgba(255, 107, 107, 0.3);
    }

    .control-btn.break-session {
        box-shadow: 0 4px 14px 0 rgba(78, 205, 196, 0.3);
    }
`;

document.head.appendChild(confettiStyle);