import WindowObject from './WindowObject.js';
import Applications from '../Applications.js';

/**
 * Manages all window operations including creation, focus, minimization, and removal
 * @class
 */
export default class WindowManager {
    /**
     * Creates a new WindowManager instance
     * @constructor
     * @param {import('./DesktopEnvironment.js').default} desktopEnvironment - The main desktop environment instance
     * @property {WindowObject[]} windows - Array of active window objects
     */
    constructor(desktopEnvironment) {
        /** @type {import('./DesktopEnvironment.js').default} */
        this.desktopEnvironment = desktopEnvironment;

        /** @type {WindowObject[]} */
        this.windows = [];
    }

    /**
     * Creates and starts a new window with the specified module
     * @param {Function} module - The module/application to start in the window
     * @param {Object} moduleArgs - Arguments to pass to the module
     * @param {Object} windowArgs - Configuration options for the window
     * @returns {WindowObject} The created window object
     */
    start(module, moduleArgs = {}, windowArgs = {}) {
        const window = new WindowObject(this, windowArgs);
        const args = {
            ...moduleArgs,
            desktopEnvironment: this.desktopEnvironment
        };
        window.startProgram(module, args);
        this.windows.push(window);
        this.desktopEnvironment.taskbar.addTask(window);
        return window;
    }

    /**
     * Starts a process with the specified module name, so that other applications
     * can easily start other applications.
     * @param {string} moduleName - The name of the module to start
     * @param {Object} moduleArgs - Arguments to pass to the module
     * @param {Object} windowArgs - Configuration options for the window
     * @returns {WindowObject} The created window object
     */
    startProcess(moduleName, moduleArgs = {}, windowArgs = {}) {
        const module = Applications.find(app => app.id === moduleName).module;
        return this.start(module, moduleArgs, windowArgs);
    }

    processExists(windowTitle) {
        return this.windows.some(win => win.title.toLowerCase() === windowTitle.toLowerCase());
    }

    /**
     * Removes a window from management and updates taskbar
     * @param {WindowObject} windowObj - The window to remove
     */
    remove(windowObj) {
        this.windows = this.windows.filter((win) => win !== windowObj);
        this.desktopEnvironment.taskbar.removeTask(windowObj);
        let visibleWindows = this.listVisible();
        if (visibleWindows.length > 0) {
            this.setFocus(visibleWindows[visibleWindows.length - 1]);
        }
    }

    /**
     * Sets focus to a specific window and updates window states
     * @param {WindowObject} windowObj - The window to focus
     */
    setFocus(windowObj) {
        if (windowObj.isMinimized) windowObj.show();
        windowObj.windowElement.classList.remove('minimized');
        this.windows.forEach((win) => {
            win.windowElement.classList.remove('window-focus');
            win.setActive(win === windowObj);
        });
        windowObj.windowElement.classList.add('window-focus');
        this.desktopEnvironment.taskbar.render();
    }

    /**
     * Returns an array of all non-minimized windows
     * @returns {WindowObject[]} Array of visible windows
     */
    listVisible() {
        return this.windows.filter((win) => !win.isMinimized);
    }

    /**
     * Minimizes a window and updates focus to the next visible window
     * @param {WindowObject} windowObj - The window to minimize
     */
    minimize(windowObj) {
        windowObj.windowElement.classList.add('minimized');
        windowObj.minimize();
        let visibleWindows = this.listVisible();
        if (visibleWindows.length > 0) {
            this.setFocus(visibleWindows[visibleWindows.length - 1]);
        } else {
            windowObj.windowElement.classList.remove('window-focus');
            windowObj.setActive(false);
        }
        this.desktopEnvironment.taskbar.render();
    }

    /**
     * Cleans up resources and destroys all windows
     * @public
     */
    destroy() {
        // Close all windows
        [...this.windows].forEach(window => {
            window.closeWindow();
        });
    }
}
