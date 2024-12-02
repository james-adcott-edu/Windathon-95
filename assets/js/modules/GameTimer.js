/**
 * GameTimer class
 * @class
 * @classdesc A class for a game timer.
 * @param {function} callback - The callback function to call when the timer updates.
 */
export default class GameTimer {

    /**
     * Create a GameTimer.
     * @param {function} callback - The callback function to call when the timer updates.
     * @constructor
     */
    constructor(callback) {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isPaused = true;
        this.callback = callback;
    }

    /**
     * Start the timer.
     * @method
     * @returns {void}
     */
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

    /**
     * Stop the timer.
     * @method
     * @returns {void}
     */
    stop() {
        clearInterval(this.timerInterval);
        this.elapsedTime = 0;
        this.isPaused = true;
        this.callback(this.formatTime(this.elapsedTime));
    }

    /**
     * Pause the timer.
     * @method
     * @returns {void}
     */
    pause() {
        if (!this.isPaused) {
            clearInterval(this.timerInterval);
            this.isPaused = true;
        }
    }

    /**
     * Get the current time.
     * @method
     * @returns {string} The current time in the format "ss.s".
     */
    getTime() {
        return this.formatTime(this.elapsedTime);
    }

    /**
     * Format the time.
     * @private
     * @param {number} ms - The time in milliseconds.
     * @returns {string} The formatted time in the format "ss.s".
     */
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const fractionSeconds = Math.floor(ms / 100) % 10;
        return `${totalSeconds}.${this.pad(fractionSeconds, 1)}`;
    }

    /**
     * Pad a number with zeros.
     * @private
     * @param {number} number - The number to pad.
     * @param {number} length - The length of the padded number.
     * @returns {string} The padded number.
     */
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
