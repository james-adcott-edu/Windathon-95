import Applications from '../Applications.js';
import WindowManager from './WindowManager.js';
import Desktop from './Desktop.js';
import Taskbar from './TaskBar.js';
import JsonFs from './JsonFs.js';
//import StartMenu from './StartMenu.js';

/**
 * Main class that orchestrates the Windows 95 desktop environment
 * @class
 */
export default class DesktopEnvironment {
    /**
     * Creates a new DesktopEnvironment instance and initializes all core components
     * @constructor
     * @throws {Error} If initialization of any component fails
     */
    constructor() {
        try {
            /** @type {import('../Applications.js').Application[]} List of available applications */
            this.applicationList = Applications;

            /** @type {WindowManager} Manages window creation and handling */
            this.windowManager = new WindowManager(this);

            /** @type {JsonFs} Manages the file system */
            this.fileSystem = new JsonFs();

            /** @type {Desktop} Manages desktop icons and interactions */
            this.desktop = new Desktop(this);

            /** @type {Taskbar} Manages the taskbar and start menu */
            this.taskbar = new Taskbar(this, this.windowManager);

            // Initialize event listeners
            this.initializeEventListeners();
        } catch (error) {
            console.error('Failed to initialize desktop environment:', error);
            this.destroy();
            throw error;
        }
    }

    /**
     * Initializes global event listeners
     * @private
     */
    initializeEventListeners() {
        // Handle global keyboard shortcuts
        this.handleKeyPress = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.handleKeyPress);
    }

    /**
     * Handles global keyboard shortcuts
     * @private
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyPress(event) {
        // Example: Alt+Tab window switching
        if (event.altKey && event.key === 'Tab') {
            event.preventDefault();
            console.log("Alt+Tab - Cycle Windows?");
        }
        // Example: Windows key for start menu
        if (event.key === 'Meta') {
            event.preventDefault();
            console.log("Meta - Toggle Start Menu?");
        }
    }

    /**
     * Cleans up all resources and destroys the desktop environment
     * @public
     */
    destroy() {
        // Remove global event listeners
        document.removeEventListener('keydown', this.handleKeyPress);

        // Destroy components in reverse order of creation
        if (this.taskbar) {
            this.taskbar.destroy();
            this.taskbar = null;
        }

        if (this.desktop) {
            this.desktop.destroy();
            this.desktop = null;
        }

        if (this.windowManager) {
            this.windowManager.destroy();
            this.windowManager = null;
        }

        // Add filesystem cleanup
        if (this.fileSystem) {
            this.fileSystem.destroy();
            this.fileSystem = null;
        }

        // Clear application list
        this.applicationList = null;
    }

    /**
     * Gets the current state of the desktop environment
     * @returns {Object} The current state
     */
    getState() {
        return {
            openWindows: this.windowManager.windows.length,
            activeWindow: this.windowManager.getFocusedWindow()?.windowElement.querySelector('.window-title').textContent,
            isStartMenuOpen: this.taskbar.isStartMenuOpen
        };
    }

    /**
     * Checks if the environment is in a valid state
     * @returns {boolean} True if all components are properly initialized
     */
    isValid() {
        return !!(
            this.applicationList &&
            this.windowManager &&
            this.desktop &&
            this.taskbar &&
            this.fileSystem
        );
    }
}
