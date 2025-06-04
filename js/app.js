// Main Application
class PomodoroApp {
    constructor() {
        this.soundManager = new SoundManager();
        this.settings = new SettingsManager();
        this.stats = new StatsManager();
        this.timer = new Timer(this.settings, this.stats, this.soundManager);
        this.taskManager = new TaskManager();

        this.initializeApp();
        this.registerServiceWorker();
    }

    initializeApp() {
        this.initializeModals();
        this.initializeKeyboardShortcuts();
        this.initializeFocusMode();
        this.initializeButtonSounds(); // إضافة جديدة
        this.preventPageUnload();

        // Make instances globally available
        window.soundManager = this.soundManager;
        window.settings = this.settings;
        window.stats = this.stats;
        window.timer = this.timer;
        window.taskManager = this.taskManager;

        console.log('🍅 Pomodoro Timer initialized successfully!');
    }

    // دالة جديدة لتأثيرات الأزرار
    initializeButtonSounds() {
        // Add click sound effect for pixel buttons
        document.querySelectorAll('.pixel-btn, .control-btn, .btn, .nav-btn, .task-input button, .task-delete, .social-btn').forEach(button => {
            button.addEventListener('click', function () {
                // Create audio context for click sound
                if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                    try {
                        const audioContext = new (AudioContext || webkitAudioContext)();
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();

                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);

                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

                        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.1);
                    } catch (error) {
                        // Handle audio context creation errors silently
                        console.log('Audio context not available');
                    }
                }
            });
        });

        // Enhanced click effects for buttons
        document.querySelectorAll('.control-btn, .btn, .nav-btn, .social-btn').forEach(button => {
            button.addEventListener('click', function () {
                if (!this.disabled && !this.classList.contains('disabled')) {
                    this.style.transform = 'translateY(4px)';
                    this.style.transition = 'transform 0.05s ease';
                    setTimeout(() => {
                        this.style.transform = '';
                        this.style.transition = 'all 0.1s ease';
                    }, 100);
                }
            });
        });

        // Special effects for social buttons
        document.querySelectorAll('.social-btn').forEach(button => {
            button.addEventListener('mouseenter', function () {
                if (!this.classList.contains('disabled')) {
                    this.style.transform = 'translateY(-1px)';
                }
            });

            button.addEventListener('mouseleave', function () {
                if (!this.classList.contains('disabled')) {
                    this.style.transform = '';
                }
            });
        });

        // Add ripple effect to buttons
        document.querySelectorAll('.control-btn, .btn, .nav-btn').forEach(button => {
            button.addEventListener('click', function (e) {
                if (this.disabled || this.classList.contains('disabled')) return;

                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');

                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    initializeModals() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });

        // Close modal with close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal;
                document.getElementById(`${modalId}Modal`).classList.remove('show');
            });
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.show').forEach(modal => {
                    modal.classList.remove('show');
                });
            }
        });
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    e.preventDefault();
                    if (this.timer.isRunning) {
                        this.timer.pause();
                    } else {
                        this.timer.start();
                    }
                    break;
                case 'r':
                    e.preventDefault();
                    this.timer.reset();
                    break;
                case 's':
                    e.preventDefault();
                    this.timer.skip();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFocusMode();
                    break;
                case '1':
                    e.preventDefault();
                    document.getElementById('settingsModal').classList.add('show');
                    break;
                case '2':
                    e.preventDefault();
                    document.getElementById('statsModal').classList.add('show');
                    break;
                case '3':
                    e.preventDefault();
                    document.getElementById('themeModal').classList.add('show');
                    break;
            }
        });

        // Show keyboard shortcuts help
        this.createKeyboardShortcutsHelp();
    }

    createKeyboardShortcutsHelp() {
        const helpText = `
            <div class="keyboard-shortcuts" style="position: fixed; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 8px; font-size: 12px; opacity: 0; transition: opacity 0.3s; z-index: 1000;">
                <strong>🎮 Keyboard Shortcuts:</strong><br>
                Space/Enter: Start/Pause<br>
                R: Reset • S: Skip • F: Focus Mode<br>
                1: Settings • 2: Stats • 3: Themes<br>
                <em>Press ? to show this help</em>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', helpText);

        const helpEl = document.querySelector('.keyboard-shortcuts');

        // Show help on ? key
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' || e.key === '/') {
                e.preventDefault();
                helpEl.style.opacity = '1';
                setTimeout(() => {
                    helpEl.style.opacity = '0';
                }, 3000);
            }
        });
    }

    initializeFocusMode() {
        let focusModeEnabled = false;

        this.toggleFocusMode = () => {
            focusModeEnabled = !focusModeEnabled;
            document.body.classList.toggle('focus-mode', focusModeEnabled);

            if (focusModeEnabled) {
                this.soundManager.showNotification('🎯 Focus mode enabled. Press F to exit.', 'info');
            } else {
                this.soundManager.showNotification('👁️ Focus mode disabled.', 'info');
            }
        };
    }

    preventPageUnload() {
        window.addEventListener('beforeunload', (e) => {
            if (this.timer.isRunning) {
                e.preventDefault();
                e.returnValue = 'You have a timer running. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    await navigator.serviceWorker.register('./sw.js');
                    console.log('🔧 Service Worker registered successfully');
                } catch (error) {
                    console.log('❌ Service Worker registration failed:', error);
                }
            });
        }
    }
}

// Task Management
class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        this.initializeTaskUI();
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('pomodoroTasks');
        if (savedTasks) {
            try {
                this.tasks = JSON.parse(savedTasks);
            } catch (e) {
                console.warn('Failed to load tasks, using empty list');
                this.tasks = [];
            }
        }
    }

    saveTasks() {
        localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
    }

    initializeTaskUI() {
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');

        addTaskBtn.addEventListener('click', () => {
            this.addTask(taskInput.value.trim());
            taskInput.value = '';
        });

        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask(taskInput.value.trim());
                taskInput.value = '';
            }
        });

        this.renderTasks();
    }

    addTask(text) {
        if (!text) return;

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();

        if (window.soundManager) {
            window.soundManager.showNotification('✅ Task added successfully!', 'success');
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();

            if (window.soundManager && task.completed) {
                window.soundManager.showNotification('🎉 Task completed!', 'success');
            }
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();

        if (window.soundManager) {
            window.soundManager.showNotification('🗑️ Task deleted', 'info');
        }
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            taskList.innerHTML = '<li class="no-tasks">📝 No tasks yet. Add one above to get started!</li>';
            return;
        }

        this.tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;

            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <button class="task-delete">🗑️</button>
            `;

            // Event listeners
            const checkbox = taskItem.querySelector('.task-checkbox');
            const deleteBtn = taskItem.querySelector('.task-delete');
            const taskText = taskItem.querySelector('.task-text');

            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            taskText.addEventListener('click', () => this.toggleTask(task.id));

            taskList.appendChild(taskItem);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getActiveTasks() {
        return this.tasks.filter(t => !t.completed);
    }

    getCompletedTasks() {
        return this.tasks.filter(t => t.completed);
    }

    clearCompletedTasks() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.renderTasks();

        if (window.soundManager) {
            window.soundManager.showNotification('🧹 Completed tasks cleared!', 'success');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PomodoroApp();

    // Add some startup effects
    console.log('%c🍅 Focus Timer Loaded! 🎮', 'color: #ff6b6b; font-size: 20px; font-weight: bold;');
    console.log('%cPress ? for keyboard shortcuts', 'color: #4ecdc4; font-size: 14px;');
});