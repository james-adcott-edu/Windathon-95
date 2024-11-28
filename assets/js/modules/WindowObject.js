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
        this.windowElement = this.createWindowElement();
        this.uuid = 'window-'+self.crypto.randomUUID();
        this.windowManager = windowManager;
        if (windowArgs) {
            for (let key in windowArgs) {
                this[key] = windowArgs[key];
            }
        }
        this.dialogs = [];
        this.stylesheetManager = null;
        if (this.resizable) {
            this.windowElement.querySelector('.window-content').style.overflow = 'auto';
            this.windowElement.querySelector('.window-content').style.resize = 'both';
        }
    }
    
    /**
     * Creates the window DOM element from template
     * @private
     * @returns {HTMLElement} The window element
     */
    createWindowElement() {
        let windowTemplate = document.getElementById('window_template');
        let newWindow = windowTemplate.content.cloneNode(true);
        return newWindow.querySelector('.window');
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
        let titleBar = this.windowElement.querySelector('.window-titlebar');
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
    restore() {
        this.isMinimized = false;
    }
    /**
     * Sets the window close handler
     * @param {Function} callback - Function to call when close button is clicked
     */
    setCloseRequest(callback) {
        this.windowElement.querySelector('.window-control-close').removeEventListener('click', this.closeRequest);
        this.closeRequest = callback;
        this.windowElement.querySelector('.window-control-close').addEventListener('click', this.closeRequest);
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
        this.windowManager.desktopEnvironment.taskbar.render(); // this feels hacky
        this.windowElement.querySelector('.window-title').innerText = this.title;
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

    addStylesheet(cssStr) {
        this.stylesheetManager = new StylesheetManager(this, cssStr);
    }
}

