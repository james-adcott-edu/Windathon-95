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
        this.desktopEnvironment = desktopEnvironment;
        this.applicationList = Applications;
    }

    /**
     * Renders the Start Menu with all application entries
     * @returns {HTMLDivElement} The complete start menu container element
     */
    render() {
        let startMenuDiv = document.createElement('div');
        let startMenuButton = document.createElement('div');
        let startMenu = document.createElement('div');

        startMenuDiv.classList.add('taskbar-start');

        startMenuButton.classList.add('startbutton');
        startMenuButton.innerHTML = '<img src="assets/images/windows-logo.png" alt="Windows Logo" height="16" width="16"> Start';
        startMenuButton.addEventListener('click', (e) => {
            startMenu.classList.toggle('hidden');
            // If the start menu is not hidden, add an event listener to close it when clicking outside
            if (!startMenu.classList.contains('hidden')) {
                document.addEventListener('click', this.handleOutsideClick = (event) => {
                    if (!startMenuDiv.contains(event.target)) {
                        startMenu.classList.add('hidden');
                        document.removeEventListener('click', this.handleOutsideClick);
                    }
                });
            }
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
            let applicationButton = document.createElement('div');
            applicationButton.classList.add('startmenu-item');
            applicationButton.innerHTML = `
                <img src="${web_root}/assets/images/${app.icon}" alt="${app.name} icon" height="16" width="16">
                <span>${app.name}</span>
            `;
            applicationButton.addEventListener('click', () => {
                this.desktopEnvironment.windowManager.start(app.module, app.moduleArgs, app.windowArgs);
                startMenu.classList.add('hidden');
            });
            menuArea.appendChild(applicationButton);
        });

        startMenu.appendChild(menuArea);
        startMenuDiv.appendChild(startMenu);

        return startMenuDiv;
    }
}
