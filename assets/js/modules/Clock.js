/**
 * A class that creates and manages a real-time clock display in Windows 95 style
 * @class
 */
export default class Clock {
    /**
     * Creates a new Clock instance
     * @constructor
     */
    constructor() {
        this.output = document.createElement('div');
        this.intervalId = null;
    }
    
    /**
     * Starts the clock
     * @public
     */
    start() {
        this.render(); // Initial render
        this.intervalId = setInterval(this.render.bind(this), 1000);
        return this.output;
    }

    /**
     * Stops the clock and cleans up resources
     * @public
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Updates the clock display with the current time
     * @private
     */
    render() {
        try {
            this.output.textContent = new Date().toLocaleTimeString('en-GB');
        } catch (error) {
            console.error('Clock update failed:', error);
            this.stop(); // Stop updates if there's an error
        }
    }
}
