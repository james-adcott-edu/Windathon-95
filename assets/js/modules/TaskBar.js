import StartMenu from './StartMenu.js';
import Clock from './Clock.js';
import WindowManager from './WindowManager.js';

/**
 * Creates and manages the Windows 95-style taskbar
 * @class
 */
export default class TaskBar {
    /**
     * Creates a new TaskBar instance
     * @constructor
     * @param {import('./DesktopEnvironment.js').default} desktopEnvironment - The main desktop environment instance
     * @param {import('./WindowManager.js').default} windowManager - The window manager instance
     * @property {import('./WindowObject.js').default[]} tasks - Array of active tasks/windows
     * @property {HTMLElement} taskbarElement - The main taskbar DOM element
     * @property {HTMLElement} taskbarWindowList - Container for window buttons
     */
    constructor(desktopEnvironment, windowManager) {
        /** @type {import('./DesktopEnvironment.js').default} */
        this.desktopEnvironment = desktopEnvironment;
        /** @type {import('./WindowManager.js').default} */
        this.windowManager = windowManager;
        this.tasks = [];
        // create taskbar from template
        let taskbarTemplate = document.getElementById('taskbar_template');
        let newTaskbar = taskbarTemplate.content.cloneNode(true);
        this.taskbarElement = newTaskbar.querySelector('.taskbar');
        this.taskbarWindowList = this.taskbarElement.querySelector('.taskbar-windowlist');
        this.addStartMenu();
        this.clock = new Clock();
        this.taskbarElement.querySelector('.taskbar-clock').appendChild(this.clock.start());
        document.body.appendChild(this.taskbarElement);

        this.taskbarElement.querySelector('.taskbar-clock')
            .addEventListener('click', () => {
                const processExists = this.windowManager.processExists('clock');
                // Don't start the clock if it is already running.
                if (processExists === false) {
                    this.windowManager.startProcess('clock');
                }
            });
    }
    
    /**
     * Adds a new task to the taskbar
     * @param {Object} task - The task/window to add
     */
    addTask(task) {
        this.tasks.push(task);
        this.render();
    }
    
    /**
     * Removes a task from the taskbar
     * @param {Object} task - The task/window to remove
     */
    removeTask(task) {
        this.tasks = this.tasks.filter((t) => t !== task);
        this.render();
    }

    /**
     * Initializes and adds the Start Menu to the taskbar
     * @private
     */
    addStartMenu() {
        let startMenu = new StartMenu(this.desktopEnvironment);
        let startDiv = this.taskbarElement.querySelector('.taskbar-start');
        startDiv.appendChild(startMenu.render());
    }

    /**
     * Renders the taskbar and updates all window buttons
     * Each button shows window state (focused/minimized) and handles click events
     * for minimizing, restoring, and focusing windows
     * @private
     */
    render() {
        this.taskbarWindowList.innerHTML = '';
        this.tasks.forEach((task) => {
            let newButton = document.createElement('div');
            newButton.classList.add('taskbar-windowbutton');
            newButton.dataset.hasfocus = task.hasFocus;
            newButton.dataset.uuid = task.uuid;
            newButton.innerText = task.title;
            newButton.addEventListener('click', (e) => {
                if (task.hasFocus) {
                    this.windowManager.minimize(task);
                    return;
                }
                if (task.isMinimized) {
                    task.restore();
                }
                this.windowManager.setFocus(task);
            });
            this.taskbarWindowList.appendChild(newButton);
        });
    }    

    /**
     * Cleans up resources and stops the clock
     * @public
     */
    destroy() {
        if (this.clock) {
            this.clock.stop();
        }
        // Other cleanup...
    }
}
