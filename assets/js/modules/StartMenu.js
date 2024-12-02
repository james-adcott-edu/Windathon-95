import Applications from '../Applications.js';
import { web_root } from '../Config.js';

/**
 * Creates and manages the Windows 95-style Start Menu
 * @class
 */
export default class StartMenu {
    /**
     * Creates a new StartMenu instance
     * @constructor
     * @param {import('./DesktopEnvironment.js').default} desktopEnvironment - The main desktop environment instance
     * @property {import('../Applications.js').Application[]} applicationList - List of available applications from Applications.js
     */
    constructor(desktopEnvironment) {
        /** @type {import('./DesktopEnvironment.js').default} */
        this.desktopEnvironment = desktopEnvironment;
        /** @type {import('../Applications.js').Application[]} */
        this.applicationList = Applications;
        /** @type {HTMLDivElement | null} */
        this.startMenu = null;
        /** @type {HTMLDivElement | null} */
        this.startMenuDiv = null;
    }

    /**
     * Toggles the visibility of the Start Menu
     * @returns {void}
     */
    toggleVisibility() {
        this.startMenu.classList.toggle('hidden');
        // If the start menu is not hidden, add an event listener to close it when clicking outside
        if (!this.startMenu.classList.contains('hidden')) {
            document.addEventListener('click', this.handleOutsideClick = (event) => {
                if (!this.startMenuDiv.contains(event.target)) {
                    this.startMenu.classList.add('hidden');
                    document.removeEventListener('click', this.handleOutsideClick);
                }
            });
        }
    }

    /**
     * Renders the Start Menu with all application entries
     * @returns {HTMLDivElement} The complete start menu container element
     */
    render() {
        let startMenuDiv = this.startMenuDiv = document.createElement('div');
        let startMenuButton = document.createElement('div');
        let startMenu = this.startMenu = document.createElement('div');

        startMenuDiv.classList.add('taskbar-start');

        startMenuButton.classList.add('startbutton');
        startMenuButton.innerHTML = `<img src="${web_root}/assets/images/windows-4.png" alt="Windows Logo" height="16" width="16"> Start`;
        startMenuButton.addEventListener('click', (e) => {
            this.toggleVisibility();
        });
        startMenuDiv.appendChild(startMenuButton);

        startMenu.classList.add('startmenu', 'hidden');

        const sidebar = document.createElement('div');
        sidebar.classList.add('startmenu-sidebar');
        sidebar.innerHTML = '<span>Windathon</span><span>95</span>';
        startMenu.appendChild(sidebar);

        const menuArea = document.createElement('div');
        menuArea.classList.add('startmenu-items');

        this.applicationList.forEach((app) => {
            if (app.hideFromStartMenu) return;
            let applicationButton = document.createElement('div');
            applicationButton.classList.add('startmenu-item');
            applicationButton.innerHTML = `
                <img src="${web_root}/assets/images/${app.icon}" alt="${app.name} icon" height="32" width="32" style="vertical-align:middle; margin: 0 8px">
                <span>${app.name}</span>
            `;
            applicationButton.addEventListener('click', () => {
                this.desktopEnvironment.windowManager.start(app.module, app.moduleArgs, app.windowArgs);
                startMenu.classList.add('hidden');
            });
            menuArea.appendChild(applicationButton);
        });

        const shutdownButton = document.createElement('div');
        shutdownButton.classList.add('startmenu-item');
        shutdownButton.style.borderTop = '3px groove #fff';
        shutdownButton.innerHTML = `
            <img src="${web_root}/assets/images/shut_down_with_computer-0.png" alt="Shutdown icon" height="32" width="32" style="vertical-align:middle; margin: 0 8px">
            <span>Shutdown</span>
        `;
        shutdownButton.addEventListener('click', () => {
            document.body.innerHTML = '';
            document.body.style.height = '100vh';
            document.body.style.background = '#000 url(assets/images/safetoturnoff.webp) no-repeat center center';
            document.body.style.backgroundSize = '656px';
            document.body.style.cursor = 'none';
        });

        menuArea.appendChild(shutdownButton);

        startMenu.appendChild(menuArea);
        startMenuDiv.appendChild(startMenu);

        return startMenuDiv;
    }
}
