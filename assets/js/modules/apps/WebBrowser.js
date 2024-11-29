export default class WebBrowser {
    constructor(windowObject, windowContent, args) {
        /** @type {import('../WindowObject.js').default} */
        this.window = windowObject;
        /** @type {HTMLElement} */
        this.windowContent = windowContent;

        this.window.setTitle('Web Browser');
        this.windowContent.className = 'web-browser';
        this.window.addStylesheet(css);

        this.window.setCloseRequest(() => {
            this.window.closeWindow();
        });

        this.setupBrowser();
    }

    setupBrowser() {
        // Create navigation bar
        const navbar = document.createElement('div');
        navbar.className = 'browser-navbar';

        // Back button
        const backButton = document.createElement('button');
        backButton.textContent = '←';
        backButton.title = 'Back';
        backButton.addEventListener('click', () => this.iframe.contentWindow.history.back());

        // Forward button
        const forwardButton = document.createElement('button');
        forwardButton.textContent = '→';
        forwardButton.title = 'Forward';
        forwardButton.addEventListener('click', () => this.iframe.contentWindow.history.forward());

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
        navbar.appendChild(backButton);
        navbar.appendChild(forwardButton);
        navbar.appendChild(inceptionButton);
        navbar.appendChild(this.addressBar);
        navbar.appendChild(goButton);

        // Create iframe for web content
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'browser-content';
        this.iframe.src = 'https://example.com';

        // Handle address bar submission
        this.addressBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate();
            }
        });

        // Add elements to window
        this.windowContent.appendChild(navbar);
        this.windowContent.appendChild(this.iframe);
    }

    navigate() {
        let url = this.addressBar.value.trim();
        
        // Check if it's a valid URL
        if (!url.match(/^(https?:\/\/)/i)) {
            // Check if it contains spaces or doesn't contain a dot (likely a search term)
            if (url.includes(' ') || !url.includes('.')) {
                // Encode the search term for Google search
                url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
            } else {
                // Add https if it looks like a URL but missing protocol
                url = 'https://' + url;
            }
        }
        
        this.iframe.src = url;
        this.addressBar.value = url;
    }
}

const css = `
.web-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--window-background-color);
    box-sizing: border-box;
}

.browser-navbar {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--window-background-color);
    border-bottom: 1px solid var(--border-color);
}

.browser-navbar button {
    min-width: 24px;
    height: 22px;
    font-family: "MS Sans Serif", sans-serif;
    font-size: 12px;
    background: #c0c0c0;
    border: 2px solid;
    border-color: #ffffff #808080 #808080 #ffffff;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.browser-navbar button:active {
    border-color: #808080 #ffffff #ffffff #808080;
    padding: 1px 0 0 1px;
}

.browser-navbar button:nth-child(3) {
    font-size: 14px;
}

.address-bar {
    flex: 1;
    height: 22px;
    font-family: "MS Sans Serif", sans-serif;
    font-size: 12px;
    padding: 0 4px;
    background: #fff;
    border: 2px inset #808080;
    color: #000;
    box-sizing: border-box;
}

.browser-content {
    flex: 1;
    border: 2px inset #808080;
    background: #fff;
    margin: 4px;
    box-sizing: border-box;
    width: calc(100% - 8px);
    height: calc(100% - 38px); /* navbar height (30px) + margin (8px) */
}
`; 