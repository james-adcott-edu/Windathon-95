export default class GameTimer {
    constructor(callback) {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isPaused = true;
        this.callback = callback;
    }

    start() {
        if (this.isPaused) {
            this.startTime = Date.now() - this.elapsedTime;
            this.timerInterval = setInterval(() => {
                this.elapsedTime = Date.now() - this.startTime;
                this.callback(this.formatTime(this.elapsedTime));
            }, 10);
            this.isPaused = false;
        }
    }

    stop() {
        clearInterval(this.timerInterval);
        this.elapsedTime = 0;
        this.isPaused = true;
        this.callback(this.formatTime(this.elapsedTime));
    }

    pause() {
        if (!this.isPaused) {
            clearInterval(this.timerInterval);
            this.isPaused = true;
        }
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const fractionSeconds = Math.floor(ms / 100) % 10;
        return `${totalSeconds}.${this.pad(fractionSeconds, 1)}`;
    }

    pad(number, length) {
        return number.toString().padStart(length, '0');
    }
}

// Example usage:
//const timerDisplay = document.getElementById('timerDisplay');
//const gameTimer = new GameTimer((time) => {
//    timerDisplay.textContent = time;
//});
//
//document.getElementById('startButton').addEventListener('click', () => gameTimer.start());
//document.getElementById('pauseButton').addEventListener('click', () => gameTimer.pause());
//document.getElementById('stopButton').addEventListener('click', () => gameTimer.stop());
