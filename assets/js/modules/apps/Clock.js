import GameTimer from '../GameTimer.js';

export default class Clock {
    constructor(windowObject, windowContent, args) {
        /** @type {import('../WindowObject.js').default} */
        this.window = windowObject;
        /** @type {HTMLElement} */
        this.windowContent = windowContent;
        
        this.window.setTitle('Clock');
        this.setupUI();
        this.initStopwatch();

        this.window.setCloseRequest(() => {
            this.stopwatch.stop();
            this.window.closeWindow();
        });
    }

    setupUI() {
        const content = `
            <div class="clock-app">
                <div class="clock-section">
                    <h2>Current Time</h2>
                    <div id="current-time" class="digital-display"></div>
                </div>
                
                <div class="stopwatch-section">
                    <h2>Stopwatch</h2>
                    <div id="stopwatch-display" class="digital-display">0.0</div>
                    <div class="controls">
                        <button id="start-stop">Start</button>
                        <button id="reset">Reset</button>
                    </div>
                </div>
            </div>
        `;

        const styles = `
            .clock-app {
                padding: 16px;
                font-family: 'MS Sans Serif', sans-serif;
            }

            .clock-section,
            .stopwatch-section {
                margin-bottom: 20px;
                padding: 16px;
                border: 2px solid;
                border-color: #808080 #ffffff #ffffff #808080;
            }

            h2 {
                margin: 0 0 16px 0;
                font-size: 14px;
                font-weight: bold;
            }

            .digital-display {
                background: #000;
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 32px;
                padding: 8px 16px;
                text-align: center;
                margin-bottom: 16px;
                border: 2px solid #808080;
            }

            .controls {
                display: flex;
                gap: 8px;
                justify-content: center;
            }

            button {
                min-width: 75px;
                padding: 4px 8px;
                background: #c0c0c0;
                border: 2px solid;
                border-color: #ffffff #808080 #808080 #ffffff;
                outline: 1px solid #000000;
                font-family: 'MS Sans Serif', sans-serif;
            }

            button:active {
                border-color: #808080 #ffffff #ffffff #808080;
            }
        `;

        this.window.addStylesheet(styles);
        this.windowContent.innerHTML = content;

        // Start updating current time
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
    }

    initStopwatch() {
        const display = this.windowContent.querySelector('#stopwatch-display');
        const startStopBtn = this.windowContent.querySelector('#start-stop');
        const resetBtn = this.windowContent.querySelector('#reset');

        this.stopwatch = new GameTimer((time) => {
            display.textContent = time;
        });

        startStopBtn.addEventListener('click', () => {
            if (this.stopwatch.isPaused) {
                this.stopwatch.start();
                startStopBtn.textContent = 'Stop';
            } else {
                this.stopwatch.pause();
                startStopBtn.textContent = 'Start';
            }
        });

        resetBtn.addEventListener('click', () => {
            this.stopwatch.stop();
            startStopBtn.textContent = 'Start';
        });
    }

    updateCurrentTime() {
        const timeDisplay = this.windowContent.querySelector('#current-time');
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }
} 