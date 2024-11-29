export default class WebBrowser {
    constructor(windowObject, windowContent, args) {
        /** @type {import('../WindowObject.js').default} */
        this.window = windowObject;
        /** @type {HTMLElement} */
        this.windowContent = windowContent;

        // Initialize history management
        this.history = [];
        this.currentHistoryIndex = -1;

        // Initialize shortcuts map
        this.setupSearchShortcuts();

        this.window.setTitle('Web Browser');
        this.windowContent.className = 'web-browser';
        this.window.addStylesheet(css);

        this.setupBrowser();

        this.window.setCloseRequest(() => {
            this.window.closeWindow();
        });

        // Set initial page to home
        this.addressBar.value = 'win95://home';
        this.navigate();
    }

    addToHistory(url) {
        // Remove all entries after current index if we're not at the end
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        }
        
        this.history.push(url);
        this.currentHistoryIndex++;
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        this.backButton.disabled = this.currentHistoryIndex <= 0;
        this.forwardButton.disabled = this.currentHistoryIndex >= this.history.length - 1;
    }

    goBack() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            const url = this.history[this.currentHistoryIndex];
            this.addressBar.value = url;
            this.loadUrl(url);
            this.updateNavigationButtons();
        }
    }

    goForward() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            const url = this.history[this.currentHistoryIndex];
            this.addressBar.value = url;
            this.loadUrl(url);
            this.updateNavigationButtons();
        }
    }

    setupSearchShortcuts() {
        this.shortcuts = new Map([
            ['g', 'https://www.google.com/search?q='],
            ['y', 'https://www.youtube.com/results?search_query='],
            ['d', 'https://www.duckduckgo.com/?q='],
            ['w', 'https://en.wikipedia.org/wiki/'],
        ]);
    }

    setupBrowser() {
        // Create navigation bar
        const navbar = document.createElement('div');
        navbar.className = 'browser-navbar';

        // Back button
        this.backButton = document.createElement('button');
        this.backButton.textContent = '←';
        this.backButton.title = 'Back';
        this.backButton.disabled = true;
        this.backButton.addEventListener('click', () => this.goBack());

        // Forward button
        this.forwardButton = document.createElement('button');
        this.forwardButton.textContent = '→';
        this.forwardButton.title = 'Forward';
        this.forwardButton.disabled = true;
        this.forwardButton.addEventListener('click', () => this.goForward());

        // Home button
        const homeButton = document.createElement('button');
        homeButton.textContent = '🏠';
        homeButton.title = 'Home';
        homeButton.addEventListener('click', () => {
            this.addressBar.value = 'win95://home';
            this.navigate();
        });

        // Inception button
        const inceptionButton = document.createElement('button');
        inceptionButton.textContent = '🌀';
        inceptionButton.title = 'Inception Mode';
        inceptionButton.addEventListener('click', () => {
            this.addressBar.value = 'https://james-adcott-edu.github.io/Windathon-95/';
            this.navigate();
        });

        // Address bar
        this.addressBar = document.createElement('input');
        this.addressBar.type = 'text';
        this.addressBar.className = 'address-bar';
        this.addressBar.value = 'https://example.com';

        // Go button
        const goButton = document.createElement('button');
        goButton.textContent = 'Go';
        goButton.addEventListener('click', () => this.navigate());

        // Add navbar elements
        navbar.appendChild(this.backButton);
        navbar.appendChild(this.forwardButton);
        navbar.appendChild(homeButton);
        navbar.appendChild(inceptionButton);
        navbar.appendChild(this.addressBar);
        navbar.appendChild(goButton);

        // Create iframe for web content
        const iframeDiv = document.createElement('div');
        iframeDiv.classList.add('browser-content-container');
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'browser-content';
        this.iframe.src = 'https://example.com';
        iframeDiv.appendChild(this.iframe);

        // Handle address bar submission
        this.addressBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate();
            }
        });

        const appDiv = document.createElement('div');
        appDiv.className = 'app';
        appDiv.appendChild(navbar);
        appDiv.appendChild(iframeDiv);

        // Add elements to window
        this.windowContent.appendChild(appDiv);
    }

    loadUrl(url) {
        if (url === 'win95://home') {
            this.renderHomePage();
        } else {
            this.iframe.src = url;
        }
    }

    navigate() {
        let url = this.addressBar.value.trim();

        if (url === 'win95://home') {
            this.loadUrl(url);
            this.addToHistory(url);
            return;
        }

        let splitContents = url.split(' ');

        // Allow for shortcuts
        if (splitContents.length > 1) {
            let lastPart = splitContents.pop();
            if (lastPart.length === 2 && lastPart[0] == '!') {
                if (this.shortcuts.has(lastPart[1])) {
                    url = this.shortcuts.get(lastPart[1]) + encodeURIComponent(splitContents.join(' '));
                }
            }
        }
        
        // Check if it's a valid URL
        if (!url.match(/^(https?:\/\/)/i)) {
            if (url.includes(' ') || !url.includes('.')) {
                url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
            } else {
                url = 'https://' + url;
            }
        }
        
        this.loadUrl(url);
        this.addToHistory(url);
        this.addressBar.value = url;
    }

    renderHomePage() {
        const homeContent = `
            <html>
            <head>
                <title>Windows 95 Browser</title>
                <style>
                    body {
                        font-family: "MS Sans Serif", sans-serif;
                        background-color: #c0c0c0;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        text-align: center;
                    }
                    .search-container {
                        background: white;
                        padding: 20px;
                        border: 2px inset #808080;
                        margin: 20px 0;
                    }
                    .search-box {
                        width: 80%;
                        height: 25px;
                        font-family: "MS Sans Serif", sans-serif;
                        font-size: 14px;
                        padding: 0 5px;
                        border: 2px inset #808080;
                    }
                    .shortcuts {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        margin-top: 20px;
                    }
                    .shortcut {
                        background: white;
                        padding: 10px;
                        border: 2px outset #808080;
                        cursor: pointer;
                        text-decoration: none;
                        color: #000080;
                    }
                    .shortcut:active {
                        border-style: inset;
                    }
                    h1 {
                        color: #000080;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    .tips {
                        margin-top: 20px;
                        text-align: left;
                        background: white;
                        padding: 10px;
                        border: 2px inset #808080;
                    }
                    .tips h2 {
                        font-size: 16px;
                        margin-top: 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Windows 95 Browser</h1>
                    
                    <div class="search-container">
                        <form onsubmit="window.parent.postMessage({type: 'search', query: document.querySelector('.search-box').value}, '*'); return false;">
                            <input type="text" class="search-box" placeholder="Search the web...">
                        </form>
                    </div>

                    <div class="shortcuts">
                        <a href="https://codeinstitute.net" class="shortcut">Code Institute</a>
                        <a href="https://wikipedia.org" class="shortcut">Wikipedia</a>
                        <a href="https://james-adcott-edu.github.io/Windathon-95/" class="shortcut">This Website</a>
                        <a href="https://ladybird.org" class="shortcut">Ladybird</a>
                    </div>

                    <div class="tips">
                        <h2>Quick Search Tips:</h2>
                        <p>(They must be at the end of the search term)</p>
                        <ul>
                            <li>Use "!g" for Google search</li>
                            <li>Use "!y" for YouTube search</li>
                            <li>Use "!d" for DuckDuckGo search</li>
                            <li>Use "!w" for Wikipedia search</li>
                        </ul>
                    </div>
                </div>
                <script>
                    document.querySelectorAll('.shortcut').forEach(link => {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            window.parent.postMessage({type: 'navigate', url: e.target.href}, '*');
                        });
                    });
                </script>
            </body>
            </html>
        `;
        const blob = new Blob([homeContent], { type: 'text/html' });
        this.iframe.src = URL.createObjectURL(blob);

        // Listen for messages from the iframe
        window.addEventListener('message', (event) => {
            if (event.data.type === 'search') {
                this.addressBar.value = event.data.query;
                this.navigate();
            } else if (event.data.type === 'navigate') {
                this.addressBar.value = event.data.url;
                this.navigate();
            }
        });
    }
}

const css = `
:root {
    background: transparent;
    border: 0;
    padding: 0;
}

.app {
    display: flex;
    flex-direction: column;
    background: transparent;
    border: 0;
    padding: 0;
    height: 100%;
    box-sizing: border-box;
}

.browser-navbar {
    flex-shrink: 0;
    display: flex;
    gap: 4px;
    padding: 4px;
}

.browser-content-container {
    flex-grow: 1;
}

.browser-navbar button {
    min-width: 24px;
    height: 22px;
    font-family: "MS Sans Serif", sans-serif;
    font-size: 12px;
    background: inherit;
    border: 2px solid;
    border-color: var(--outset-border-color);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.browser-navbar button:active {
    border-color: var(--inset-border-color);
    padding: 1px 0 0 1px;
}

.browser-navbar button:nth-child(3) {
    font-size: 14px;
}

.browser-navbar button:nth-child(4) {
    font-size: 14px;
}

.address-bar {
    flex: 1;
    height: 22px;
    font-family: "MS Sans Serif", sans-serif;
    font-size: 12px;
    padding: 0 4px;
    background: #fff;
    border: 2px inset #bbb;
    color: #000;
    box-sizing: border-box;
}

.browser-content {
    flex: 1;
    border: 2px inset #bbb;
    background: #fff;
    margin: 0;
    box-sizing: border-box;
    width: 100%;
    height: calc(100% - 4px);
}

.browser-navbar button:disabled {
    opacity: 0.5;
    cursor: default;
}

.browser-navbar button:disabled:active {
    border-color: var(--outset-border-color);
    padding: 0;
}
`; 
