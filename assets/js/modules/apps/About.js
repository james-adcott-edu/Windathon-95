export default class About {
    constructor(windowObject, windowContent, args) {
        /** @type {import('../WindowObject.js').default} */
        this.window = windowObject;
        /** @type {HTMLElement} */
        this.windowContent = windowContent;

        this.window.setTitle('About Windathon 95');
        this.window.setCloseRequest(() => {
            this.window.closeWindow();
        });
        this.setupUI();

        const button = this.windowContent.querySelector('.about-footer button');
        button.addEventListener('click', () => {
            this.window.closeWindow();
        });
    }

    setupUI() {
        const content = `
            <div class="about-dialog">
                <div class="about-header">
                    <img src="assets/images/windows-logo.png" alt="Windows 95 Logo" class="about-logo">
                    <div class="about-title">
                        <h1>Windathon 95</h1>
                        <p>A Windows 95 Desktop Experience</p>
                    </div>
                </div>
                <div class="about-content">
                    <p>This is a vanilla JavaScript recreation of the Windows 95 desktop environment.</p>
                    
                    <h2>Features:</h2>
                    <ul>
                        <li>Classic Windows 95 look and feel</li>
                        <li>Functioning window management system</li>
                        <li>Start menu and taskbar</li>
                        <li>Multiple applications including:
                            <ul>
                                <li>Notepad</li>
                                <li>Paint</li>
                                <li>File Explorer</li>
                                <li>Minesweeper</li>
                                <li>Terminal</li>
                            </ul>
                        </li>
                        <li>Virtual file system</li>
                    </ul>

                    <p class="about-links">
                        <a href="https://github.com/james-adcott-edu/Windathon-95" target="_blank">View on GitHub</a>
                    </p>
                </div>
                <div class="about-footer">
                    <button onclick="this.closest('.window').querySelector('.window-control-close').click()">OK</button>
                </div>
            </div>
        `;

        const styles = `
            :root {
                background: transparent;
                border: none;
                padding: 0;
            }

            .about-dialog {
                padding: 16px;
                font-family: 'MS Sans Serif', sans-serif;
                display: flex;
                height: 100%;
                flex-direction: column;
                box-sizing: border-box;
            }

            .about-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #808080;
                padding-bottom: 16px;
            }

            .about-logo {
                width: 64px;
                height: 64px;
                margin-right: 16px;
            }

            .about-title h1 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
            }

            .about-title p {
                margin: 4px 0 0 0;
                font-size: 14px;
            }

            .about-content {
                flex-grow: 1;
                overflow-y: auto;
                padding: 0 8px;
                box-sizing: border-box;
            }

            .about-content h2 {
                font-size: 16px;
                margin: 16px 0 8px 0;
            }

            .about-content ul {
                margin: 8px 0;
                padding-left: 24px;
            }

            .about-content ul ul {
                margin: 4px 0;
            }

            .about-links {
                margin-top: 16px;
                text-align: center;
            }

            .about-links a {
                color: #000080;
                text-decoration: none;
            }

            .about-links a:hover {
                text-decoration: underline;
            }

            .about-footer {
                margin-top: 16px;
                text-align: center;
                border-top: 2px solid #808080;
                padding-top: 16px;
            }

            .about-footer button {
                min-width: 75px;
                padding: 4px 8px;
                border: 2px solid;
                border-color: #ffffff #808080 #808080 #ffffff;
                outline: 1px solid #000000;
                font-family: 'MS Sans Serif', sans-serif;
            }

            .about-footer button:active {
                border-color: #808080 #ffffff #ffffff #808080;
            }
        `;

        this.window.addStylesheet(styles);
        this.windowContent.innerHTML = content;
    }
} 
