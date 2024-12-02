import StartMenu from './StartMenu.js';
import Clock from './Clock.js';
import { web_root } from '../Config.js';

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

        this.taskbarElement = document.createElement('div');
        this.taskbarElement.className = 'taskbar';
        this.taskbarElement.innerHTML = `
        <div class="taskbar-start"></div>
        <div class="taskbar-windowlist"></div>
        <div class="taskbar-clock"></div>
        `;

        /** @type {import('./StartMenu.js').default | null} */
        this.startMenu = null;
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

        this.setupSystemTray();
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
        this.startMenu = new StartMenu(this.desktopEnvironment);
        let startDiv = this.taskbarElement.querySelector('.taskbar-start');
        startDiv.appendChild(this.startMenu.render());
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
                    task.show();
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

    /**
     * Sets up the system tray with icons
     * @private
     */
    setupSystemTray() {
        // Create a container for system tray and clock
        const rightSection = document.createElement('div');
        rightSection.className = 'taskbar-right-section';

        // Create system tray
        const systemTray = document.createElement('div');
        systemTray.className = 'system-tray';

        // Network Icon
        const networkIcon = document.createElement('div');
        networkIcon.className = 'tray-icon network-icon';
        //networkIcon.innerHTML = '🖧';
        networkIcon.innerHTML = `<img src="${web_root}/assets/images/conn_pcs_off_off.png" alt="Network Status: on" style="width: 16px; height: 16px;">`;
        networkIcon.title = 'Network Status';
        this.updateNetworkStatus(networkIcon);

        // Add network status listener
        window.addEventListener('online', () => this.updateNetworkStatus(networkIcon));
        window.addEventListener('offline', () => this.updateNetworkStatus(networkIcon));

        // Audio Icon (existing)
        const audioIcon = document.createElement('div');
        audioIcon.className = 'tray-icon audio-icon';
        audioIcon.innerHTML = `<img src="${web_root}/assets/images/loudspeaker_rays-1.png" alt="Audio Icon" style="width: 16px; height: 16px;">`;
        audioIcon.style.fontSize = '14px';
        audioIcon.addEventListener('click', (e) => this.toggleAudioSlider(e));

        // Add icons to system tray
        systemTray.appendChild(networkIcon);
        systemTray.appendChild(audioIcon);

        // Add system tray and clock to right section
        rightSection.appendChild(systemTray);
        rightSection.appendChild(this.taskbarElement.querySelector('.taskbar-clock'));

        // Add right section to taskbar
        this.taskbarElement.appendChild(rightSection);
    }

    /**
     * Updates the network status icon based on online/offline status
     * @private
     * @param {HTMLElement} networkIcon - The network icon element
     * @returns {void}
     */
    updateNetworkStatus(networkIcon) {
        if (navigator.onLine) {
            networkIcon.style.color = '#0000FF';
            networkIcon.title = 'Connected to Network';
            networkIcon.innerHTML = `<img src="${web_root}/assets/images/conn_pcs_off_off.png" alt="Network Status: on" style="width: 16px; height: 16px;">`;
        } else {
            networkIcon.style.color = '#FF0000';
            networkIcon.title = 'No Network Connection';
            networkIcon.innerHTML = `<img src="${web_root}/assets/images/conn_pcs_no_network.png" alt="Network Status: on" style="width: 16px; height: 16px;">`;
        }
    }

    /**
     * Toggles the audio slider visibility
     * @private
     * @param {Event} event - The click event
     */
    toggleAudioSlider(event) {
        let slider = document.querySelector('.audio-slider');
        if (!slider) {
            slider = document.createElement('div');
            slider.className = 'audio-slider';
            slider.innerHTML = `
                <input type="range" min="0" max="100" value="50">
            `;
            document.body.appendChild(slider);

            // Position the slider above the audio icon
            const rect = event.target.getBoundingClientRect();
            slider.style.position = 'absolute';
            slider.style.left = `${rect.left}px`;
            slider.style.bottom = '30px'; // Position above taskbar
        } else {
            slider.remove();
        }

        // Close slider when clicking outside
        const closeSlider = (e) => {
            if (!slider.contains(e.target) && !event.target.contains(e.target)) {
                slider.remove();
                document.removeEventListener('click', closeSlider);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeSlider);
        }, 0);
    }
}
