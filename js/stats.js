// Statistics Management
class StatsManager {
    constructor() {
        this.stats = {
            totalPomodoros: 0,
            totalFocusTime: 0, // in minutes
            todayPomodoros: 0,
            currentStreak: 0,
            longestStreak: 0,
            weeklyData: [0, 0, 0, 0, 0, 0, 0], // Last 7 days [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
            achievements: {},
            lastSessionDate: null,
            skippedSessions: 0 // تتبع الجلسات المتخطاة
        };

        this.achievements = [
            { id: 'firstPomodoro', name: 'Getting Started', description: 'Complete your first Pomodoro', icon: '🍅', condition: (stats) => stats.totalPomodoros >= 1 },
            { id: 'streak5', name: 'On Fire', description: 'Complete 5 Pomodoros in a row', icon: '🔥', condition: (stats) => stats.currentStreak >= 5 },
            { id: 'total25', name: 'Quarter Century', description: 'Complete 25 Pomodoros total', icon: '🏆', condition: (stats) => stats.totalPomodoros >= 25 },
            { id: 'total100', name: 'Centurion', description: 'Complete 100 Pomodoros total', icon: '💯', condition: (stats) => stats.totalPomodoros >= 100 },
            { id: 'daily10', name: 'Power User', description: 'Complete 10 Pomodoros in one day', icon: '⚡', condition: (stats) => stats.todayPomodoros >= 10 },
            { id: 'focusMarathon', name: 'Focus Marathon', description: 'Accumulate 25 hours of focus time', icon: '🏃', condition: (stats) => stats.totalFocusTime >= 1500 },
            { id: 'weekWarrior', name: 'Week Warrior', description: 'Complete at least 3 Pomodoros every day for a week', icon: '⚔️', condition: (stats) => stats.weeklyData.every(day => day >= 3) },
            { id: 'dedication', name: 'Dedication', description: 'Complete 500 Pomodoros total', icon: '🎯', condition: (stats) => stats.totalPomodoros >= 500 },
            { id: 'perfectionist', name: 'Perfectionist', description: 'Complete 20 Pomodoros without skipping any', icon: '💎', condition: (stats) => stats.currentStreak >= 20 }
        ];

        this.loadStats();
        this.initializeStatsUI();
        this.updateDisplay();
    }

    loadStats() {
        const savedStats = localStorage.getItem('pomodoroStats');
        if (savedStats) {
            try {
                const parsed = JSON.parse(savedStats);
                this.stats = { ...this.stats, ...parsed };

                // Reset daily stats if it's a new day
                this.checkNewDay();
            } catch (e) {
                console.warn('Failed to load stats, using defaults');
            }
        }
    }

    saveStats() {
        localStorage.setItem('pomodoroStats', JSON.stringify(this.stats));
    }

    checkNewDay() {
        const today = new Date().toDateString();

        if (this.stats.lastSessionDate !== today) {
            // New day - shift weekly data and reset daily count
            if (this.stats.lastSessionDate) {
                this.stats.weeklyData.shift();
                this.stats.weeklyData.push(this.stats.todayPomodoros);
            }

            this.stats.todayPomodoros = 0;
            this.stats.lastSessionDate = today;
            this.saveStats();
        }
    }

    addPomodoro(focusMinutes, wasSkipped = false) {
        this.checkNewDay();

        this.stats.totalPomodoros++;
        this.stats.totalFocusTime += focusMinutes;
        this.stats.todayPomodoros++;

        if (wasSkipped) {
            // إذا تم تخطي الجلسة - لا نضيف للـ streak ولا نكسره
            this.stats.skippedSessions++;

            // عرض رسالة للتخطي
            if (window.soundManager) {
                window.soundManager.showNotification(
                    '⚠️ Session skipped! No streak bonus this time.',
                    'warning'
                );
            }
        } else {
            // إذا اكتملت الجلسة بشكل طبيعي - نضيف +1 للـ streak
            this.stats.currentStreak++;

            if (this.stats.currentStreak > this.stats.longestStreak) {
                this.stats.longestStreak = this.stats.currentStreak;

                // إذا حقق رقم قياسي جديد
                if (window.soundManager && this.stats.longestStreak > 1) {
                    window.soundManager.showNotification(
                        `🏆 New record! ${this.stats.longestStreak} Pomodoros streak!`,
                        'success'
                    );
                }
            }

            // رسائل تحفيزية للـ streaks
            if (this.stats.currentStreak === 5) {
                if (window.soundManager) {
                    window.soundManager.showNotification('🔥 You\'re on fire! 5 in a row!', 'success');
                }
            } else if (this.stats.currentStreak === 10) {
                if (window.soundManager) {
                    window.soundManager.showNotification('⚡ Unstoppable! 10 Pomodoros streak!', 'success');
                }
            } else if (this.stats.currentStreak % 25 === 0 && this.stats.currentStreak > 0) {
                if (window.soundManager) {
                    window.soundManager.showNotification(`🎯 Amazing! ${this.stats.currentStreak} Pomodoros milestone!`, 'success');
                }
            }
        }

        // Update today's count in weekly data (last element)
        this.stats.weeklyData[6] = this.stats.todayPomodoros;

        this.saveStats();
        this.updateDisplay();
        this.checkAchievements();
    }

    breakStreak() {
        this.stats.currentStreak = 0;
        this.saveStats();
        this.updateDisplay();
    }

    initializeStatsUI() {
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.openStatsModal();
        });

        this.createWeeklyChart();
        this.createAchievementsList();
    }

    openStatsModal() {
        this.updateStatsDisplay();
        this.updateWeeklyChart();
        this.updateAchievements();
        document.getElementById('statsModal').classList.add('show');
    }

    updateDisplay() {
        // Update quick stats
        document.getElementById('todayPomodoros').textContent = this.stats.todayPomodoros;
        document.getElementById('totalTime').textContent = this.formatTime(this.stats.totalFocusTime);
        document.getElementById('currentStreak').textContent = this.stats.currentStreak;
    }

    updateStatsDisplay() {
        document.getElementById('totalPomodoros').textContent = this.stats.totalPomodoros;
        document.getElementById('totalFocusTime').textContent = this.formatTime(this.stats.totalFocusTime);
        document.getElementById('averageSession').textContent = this.getAverageSessionTime();
        document.getElementById('longestStreak').textContent = this.stats.longestStreak;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) {
            return `${mins}m`;
        }
        return `${hours}h ${mins}m`;
    }

    getAverageSessionTime() {
        if (this.stats.totalPomodoros === 0) return '25m';
        const average = Math.round(this.stats.totalFocusTime / this.stats.totalPomodoros);
        return `${average}m`;
    }

    createWeeklyChart() {
        const chartContainer = document.getElementById('weeklyChart');

        // أيام الأسبوع بالترتيب الصحيح (الاثنين = 0, الأحد = 6)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // احصل على اليوم الحالي (0 = الأحد, 1 = الاثنين, ... 6 = السبت)
        const today = new Date().getDay();

        // تحويل إلى نظام الاثنين = 0
        const todayIndex = today === 0 ? 6 : today - 1;

        chartContainer.innerHTML = '';

        this.stats.weeklyData.forEach((count, index) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';

            // إذا كان هذا اليوم الحالي، أضف class خاص
            if (index === todayIndex) {
                bar.classList.add('current-day');
            }

            const maxHeight = 100;
            const height = Math.max(count * 8, 8); // ارتفاع أدنى 8px
            bar.style.height = `${Math.min(height, maxHeight)}px`;
            bar.title = `${days[index]}: ${count} Pomodoros`;

            const dayLabel = document.createElement('div');
            dayLabel.className = 'chart-day';
            dayLabel.textContent = days[index];

            // إذا كان اليوم الحالي، أضف علامة
            if (index === todayIndex) {
                dayLabel.textContent += ' •';
                dayLabel.style.color = 'var(--primary-color)';
                dayLabel.style.fontWeight = 'bold';
            }

            bar.appendChild(dayLabel);
            chartContainer.appendChild(bar);
        });
    }

    updateWeeklyChart() {
        this.createWeeklyChart();
    }

    createAchievementsList() {
        const container = document.getElementById('achievementsList');
        container.innerHTML = '';

        this.achievements.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = 'achievement';

            const isUnlocked = this.stats.achievements[achievement.id] || achievement.condition(this.stats);

            if (isUnlocked && !this.stats.achievements[achievement.id]) {
                this.stats.achievements[achievement.id] = true;
                this.saveStats();
            }

            if (isUnlocked) {
                achievementEl.classList.add('unlocked');
            }

            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            `;

            container.appendChild(achievementEl);
        });
    }

    updateAchievements() {
        this.createAchievementsList();
    }

    checkAchievements() {
        let newAchievements = [];

        this.achievements.forEach(achievement => {
            if (!this.stats.achievements[achievement.id] && achievement.condition(this.stats)) {
                this.stats.achievements[achievement.id] = true;
                newAchievements.push(achievement);
            }
        });

        if (newAchievements.length > 0) {
            this.saveStats();
            this.showAchievementNotifications(newAchievements);
        }
    }

    showAchievementNotifications(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                if (window.soundManager) {
                    window.soundManager.showNotification(
                        `🏆 Achievement Unlocked: ${achievement.name}!`,
                        'success'
                    );
                    window.soundManager.playComplete();
                }
            }, index * 2000);
        });
    }

    exportStats() {
        const dataStr = JSON.stringify(this.stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'pomodoro-stats.json';
        link.click();

        URL.revokeObjectURL(url);
    }

    importStats(jsonData) {
        try {
            const importedStats = JSON.parse(jsonData);
            this.stats = { ...this.stats, ...importedStats };
            this.saveStats();
            this.updateDisplay();
            this.updateStatsDisplay();

            if (window.soundManager) {
                window.soundManager.showNotification('Stats imported successfully!', 'success');
            }
        } catch (e) {
            if (window.soundManager) {
                window.soundManager.showNotification('Failed to import stats. Invalid file format.', 'error');
            }
        }
    }
}