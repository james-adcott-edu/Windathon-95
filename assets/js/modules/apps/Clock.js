import GameTimer from '../GameTimer.js';

export default class Clock {
    constructor(windowObject, windowContent, args) {
        /** @type {import('../WindowObject.js').default} */
        this.window = windowObject;
        /** @type {HTMLElement} */
        this.windowContent = windowContent;
        /** @type {import('../DesktopEnvironment.js').default} */
        this.desktopEnvironment = args.desktopEnvironment;
        
        this.width = 300;
        
        this.window.setTitle('Clock');
        this.setupUI();
        this.initStopwatch();

        this.window.setCloseRequest(() => {
            this.stopwatch.stop();
            this.window.closeWindow();
        });

        this.window.setSize(this.width, this.windowContent.querySelector('.clock-app').clientHeight);
    }

    setupUI() {
        const content = `
        <div class="clock-app">
            <fieldset> 
                <legend> Current Time </legend>
                <div id="current-time" class="digital-display"></div>
            </fieldset>
            <fieldset>
                <legend> Stopwatch </legend>
                <div id="stopwatch-display" class="digital-display">0.0</div>
                <div class="controls">
                    <button id="start-stop">Start</button>
                    <button id="reset">Reset</button>
                </div>
            </fieldset>
        </div>`;

        const styles = `
            :root {
                background: transparent;
                border: none;
            }

            .clock-app {
                padding: 8px;
                box-sizing: border-box;
                width: 100%;
            }

            .digital-display {
                background: #000;
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 32px;
                padding: 8px 16px;
                text-align: center;
                margin-bottom: 16px;
                border: 2px solid var(--inset-border-color);
                width: calc(100% - 16px);
                box-sizing: border-box;
            }

            .controls {
                display: flex;
                justify-content: center;
                gap: 16px;
            }

            fieldset {
                margin-bottom: 16px;
                width: 100%;
                box-sizing: border-box;
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
