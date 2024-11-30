import MenuBar from './MenuBar.js';
import StylesheetManager from './StylesheetManager.js';
import Dialog from './Dialog.js';

/**
 * Creates and manages individual window instances with dragging, sizing, and state management
 * @class
 */
export default class WindowObject {
    /**
     * Creates a new WindowObject instance
     * @constructor
     * @param {Object} windowManager - The window manager instance
     * @param {Object} [windowArgs] - Optional window configuration
     * @param {string} [windowArgs.title] - Window title
     * @param {number} [windowArgs.width=800] - Window width in pixels
     * @param {number} [windowArgs.height=600] - Window height in pixels
     * @param {number} [windowArgs.x=69] - Initial X position
     * @param {number} [windowArgs.y=69] - Initial Y position
     * @param {boolean} [windowArgs.resizable=false] - Whether window is resizable
     */
    constructor(windowManager, windowArgs) {
        this.title = "Starting Window...";
        this.width = 800;
        this.height = 600;
        this.x = 69;
        this.y = 69;
        this.resizable = false;
        this.hasFocus = true;
        this.isMinimized = false;
        this.isMaximized = false;
        this.windowElement = this.createWindowElement();
        this.uuid = 'window-'+self.crypto.randomUUID();
        this.windowManager = windowManager;
        this.windowContent = this.windowElement.querySelector('.window-content');
        if (windowArgs) {
            for (let key in windowArgs) {
                this[key] = windowArgs[key];
            }
        }
        this.dialogs = [];
        this.stylesheetManager = null;
        if (this.resizable) {
            this.windowContent.style.overflow = 'hidden';
            this.windowContent.style.resize = 'both';
        }
    }
    
    /**
     * Creates the window DOM element from template
     * @private
     * @returns {HTMLElement} The window element
     */
    createWindowElement() {
        const win = document.createElement('div');
        win.className = 'window';
        win.innerHTML = `
        <div class="window-titlebar">
            <div class="window-title">Title</div>
            <div class="window-controls">
                <div class="window-control window-control-minimize">_</div>
                <div class="window-control window-control-close">X</div>
            </div>
        </div>
        <div class="window-menubar"> </div>
        <div class="window-content"></div>
        `;
        return win;
    }

    /**
     * Renders the window and sets up event listeners
     * @public
     */
    render() {
        let windowContent = this.windowElement.querySelector('.window-content');  
        windowContent.setAttribute('id', this.uuid);
        this.setSize(this.width, this.height);
        this.setPosition(this.x, this.y);
        this.setTitle(this.title);

        // Window Dragging
        let titleBar = this.windowElement.querySelector('.window-title');
        titleBar.addEventListener('mousedown', e => {
            let oldx = e.clientX;
            let oldy = e.clientY;
            let mousemove = f => {
                let newx = this.windowElement.offsetLeft - (oldx - f.clientX);
                let newy = this.windowElement.offsetTop - (oldy - f.clientY);
                this.setPosition(newx, newy);
                oldx = f.clientX;
                oldy = f.clientY;
            }
            let mouseup = f => {
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
            }
            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);
        });
        
        let minimizeButton = this.windowElement.querySelector('.window-control-minimize');
        minimizeButton.addEventListener('click', e => {
            this.windowManager.minimize(this);
        });

        this.windowElement.addEventListener('mousedown', e => {
            this.windowManager.setFocus(this);
            this.setActive(true);
        });

        this.windowManager.setFocus(this);
        this.setActive(true);
        document.body.appendChild(this.windowElement);



        // test
        titleBar.addEventListener('dblclick', e => {
            if (this.resizable) {
                this.maximize();
            }
        });
    }

    maximize() {
        const offset = (() => {
            let windowContentRect = this.windowContent.getBoundingClientRect();
            let windowRect = this.windowElement.getBoundingClientRect();
            let menuBarRect = this.windowElement.querySelector('.window-menubar').getBoundingClientRect();
            console.log(windowRect, windowContentRect, menuBarRect);
            let rtnoffset = {
                x: windowRect.width - windowContentRect.width,
                y: windowRect.height - windowContentRect.height
            }
            console.log(rtnoffset);
            return rtnoffset;
        })();

        this.windowElement.style.left = '0';
        this.windowElement.style.top = '0';

        const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const taskbarHeight = document.querySelector('.taskbar').offsetHeight;
        this.windowContent.style.width = (viewportWidth - offset.x) + 'px';
        this.windowContent.style.height = (viewportHeight - taskbarHeight - offset.y) + 'px';
    }

    /**
     * Starts a program within the window
     * @param {Function} program - The program/application to run
     * @param {Object} [args={}] - Arguments to pass to the program
     */
    startProgram(program, args={}) {
        this.render();
        let windowContent = this.windowElement.querySelector('.window-content');  
        new program(this, windowContent, args);
    }

    /**
     * Creates a dialog within the window
     * @param {string} htmlContent - The HTML content of the dialog
     * @param {Object} dialogArgs - Optional arguments to pass to the dialog
     * @returns {Dialog} The dialog object
     * @public
     * @example
     * let dialog = windowObject.makeDialog('<p>Hello, World!</p>', {title: 'My Dialog'});
     * dialog.render();
     */
    makeDialog(htmlContent, dialogArgs) {
        const newDialog = new Dialog(this, dialogArgs);
        newDialog.setContent(htmlContent);
        this.dialogs.push(newDialog);
        return newDialog;
    }

    /**
     * Closes an open dialog
     * @public
     */
    closeDialog(dialog) {
        this.dialogs = this.dialogs.filter(d => d !== dialog);
        dialog.close();
    }

    /**
     * Minimizes the window
     */
    minimize() {
        this.isMinimized = true;
    }

    /**
     * Restores the window from minimized state
     */
    show() {
        this.isMinimized = false;
    }

    /**
     * Sets the window close handler
     * @param {Function} callback - Function to call when close button is clicked
     */
    setCloseRequest(callback) {
        const closeButton = this.windowElement.querySelector('.window-control-close');
        closeButton.removeEventListener('click', this.closeRequest);
        this.closeRequest = callback;
        closeButton.addEventListener('click', this.closeRequest);
    }

    /**
     * Closes and removes the window
     */
    closeWindow() {
        this.windowElement.remove();
        if (this.stylesheetManager) {
            this.stylesheetManager.removeSheet();
        }
        if (this.dialogs.length > 0) {
            this.dialogs.forEach(d => d.close());
        }
        //unset this object
        this.windowManager.remove(this);
        delete this;
    }

    /**
     * Sets the window's active state
     * @param {boolean} [focus=true] - Whether the window should have focus
     */
    setActive(focus=true) {
        this.hasFocus = focus;
    }

    /**
     * Sets the window title
     * @param {string} title - The new window title
     */
    setTitle(title) {
        this.title = title;
        this.windowElement.querySelector('.window-title').innerText = this.title;
        // very hacky way to update the taskbar button text if it exists
        let taskbarButton = document.querySelector(`.taskbar-windowbutton[data-uuid="${this.uuid}"]`);
        if (taskbarButton) taskbarButton.innerText = this.title;
    }

    /**
     * Sets up the window's menu bar
     * @param {Object} menuItems - Menu configuration object
     * @returns {boolean} Success status
     */
    setMenu(menuItems) {
        new MenuBar(this, menuItems);
        return true;
    }

    /**
     * Sets the window position
     * @param {number} x - X coordinate in pixels
     * @param {number} y - Y coordinate in pixels
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.windowElement.style.left = this.x + 'px';
        this.windowElement.style.top = this.y + 'px';
    }

    /**
     * Sets the window size
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.windowElement.querySelector('.window-content').style.width = this.width + 'px';
        this.windowElement.querySelector('.window-content').style.height = this.height + 'px';
    }

    /**
     * Adds a stylesheet to the window
     * @param {string} cssStr - CSS string to add
     */
    addStylesheet(cssStr) {
        this.stylesheetManager = new StylesheetManager(this, cssStr);
    }
}

