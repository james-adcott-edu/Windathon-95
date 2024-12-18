import Applications from '../Applications.js';
import { web_root } from '../Config.js';

/**
 * @typedef {Object} DesktopSettings
 * @property {string} color - The color of the desktop background
 * @property {string} wallpaper - The wallpaper of the desktop background
 * @property {string} behaviour - The behaviour of the desktop background
 */

/**
 * A class that manages the desktop environment and its icons
 * @class
 */
export default class Desktop {
    /**
     * Creates a new Desktop instance
     * @constructor
     * @param {import('./DesktopEnvironment.js').default} desktopEnvironment - The main desktop environment instance
     */
    constructor(desktopEnvironment) {
        /** @type {import('./DesktopEnvironment.js').default} */
        this.desktopEnvironment = desktopEnvironment;
        /** @type {import('../Applications.js').Application[]} */
        this.applicationList = Applications;
        /** @type {Map<string, HTMLElement>} */
        this.icons = new Map(); // Track icon elements
        /** @type {HTMLElement|null} */
        this.desktopElement = null;
        /** @type {import('./JsonFs.js').default} */
        this.fs = desktopEnvironment.fileSystem;
        try {
            /** @type {DesktopSettings} */
            this.currentSettings = JSON.parse(this.fs.readFile("C:\\settings\\desktop.ini"));
            document.body.style.backgroundColor = this.currentSettings.color;
            if (this.currentSettings.wallpaper === "none") {
                document.body.style.backgroundImage = "none";
            } else {
                document.body.style.backgroundImage = `url(${web_root}/assets/images/wallpapers/${this.currentSettings.wallpaper})`;
            }
            switch (this.currentSettings.behaviour) {
                case "tile":
                    document.body.style.backgroundSize = "auto";
                    document.body.style.backgroundRepeat = "repeat";
                    break;
                case "center":
                    document.body.style.backgroundSize = "auto";
                    document.body.style.backgroundRepeat = "no-repeat";
                    document.body.style.backgroundPosition = "center";
                    break;
                case "stretch":
                    document.body.style.backgroundSize = "100% 100%";
                    break;
                default:
                    console.error("Unknown behaviour", this.currentSettings.behaviour);
                    break;
            }
        } catch (e) {
            console.log("[desktop] failed to load desktop settings, this is likely because no settings have been saved yet.");
        }

        this.render();
    }

    /**
     * Creates a desktop icon element with click and double-click functionality
     * @param {string} name - The display name of the icon
     * @param {string} icon - The URL of the icon image
     * @param {Object} module - The module to be launched when icon is double-clicked
     * @param {Object} moduleArgs - Arguments to be passed to the module
     * @param {Object} windowArgs - Arguments for configuring the window
     * @returns {HTMLDivElement} The created icon element
     */
    icon(name, icon, module, moduleArgs, windowArgs) {
        let icondiv = document.createElement('div');
        icondiv.classList.add('icon');
        icondiv.innerHTML = `
            <img src="${web_root}/assets/images/${icon}" alt="${name}">
            <div>${name}</div>
        `;

        const clickHandler = () => {
            document.querySelectorAll('.desktop .icon').forEach(icon => {
                icon.classList.remove('active');
            });
            icondiv.classList.add('active');
        };

        const dblclickHandler = () => {
            this.desktopEnvironment.windowManager.start(module, moduleArgs, windowArgs);
        };

        icondiv.addEventListener('click', clickHandler);
        icondiv.addEventListener('dblclick', dblclickHandler);

        // Store handlers for cleanup
        icondiv.handlers = { click: clickHandler, dblclick: dblclickHandler };
        
        return icondiv;
    }

    /**
     * Renders the desktop and all application icons
     * @public
     */
    render() {
        if (this.desktopElement) {
            this.desktopElement.remove();
        }

        this.desktopElement = document.createElement('div');
        this.desktopElement.classList.add('desktop');
        
        this.applicationList.forEach(app => {
            const iconElement = this.icon(app.name, app.icon, app.module, app.moduleArgs, app.windowArgs);
            this.icons.set(app.id, iconElement);
            this.desktopElement.appendChild(iconElement);
        });
        
        document.body.appendChild(this.desktopElement);
    }

    /**
     * Cleans up resources and removes desktop icons
     * @public
     */
    destroy() {
        // Remove all icon event listeners
        this.icons.forEach(iconElement => {
            const { click, dblclick } = iconElement.handlers;
            iconElement.removeEventListener('click', click);
            iconElement.removeEventListener('dblclick', dblclick);
        });

        // Clear icons map
        this.icons.clear();

        // Remove desktop element
        if (this.desktopElement) {
            this.desktopElement.remove();
            this.desktopElement = null;
        }
    }
}
