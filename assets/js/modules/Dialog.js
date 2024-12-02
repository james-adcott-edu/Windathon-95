/**
 * Dialog class
 * @param {Window} windowOwner - The window that owns the dialog
 * @param {Object} dialogArgs - The arguments for the dialog
 */
export default class Dialog {

    /**
     * Constructor
     * @param {Window} windowOwner - The window that owns the dialog
     * @param {Object} dialogArgs - The arguments for the dialog
     */
    constructor(windowOwner, dialogArgs) {
        /** @type {Window} */
        this.windowOwner = windowOwner;
        /** @type {string} */
        this.title = "";
        /** @type {number} */
        this.width = 400;
        /** @type {number} */
        this.height = 300;
        /** @type {number} */
        this.x = this.windowOwner.x+30;
        /** @type {number} */
        this.y = this.windowOwner.y+30;
        /** @type {boolean} */
        this.hasFocus = true;
        /** @type {HTMLElement} */
        this.dialogElement = this.createDialogElement();
        if (dialogArgs) {
            for (let key in dialogArgs) {
                this[key] = dialogArgs[key];
            }
        }

        this.setSize(this.width, this.height);
        this.setPosition(this.x, this.y);
        this.setTitle(this.title);
        /** @type {HTMLElement} */
        this.content = this.dialogElement.querySelector('.window-content');

        // Window Dragging
        let titleBar = this.dialogElement.querySelector('.window-titlebar');
        titleBar.addEventListener('mousedown', this.dragHandler.bind(this));

        let closeButton = this.dialogElement.querySelector('.window-control-close');
        closeButton.addEventListener('click', e => {
            this.windowOwner.closeDialog(this);
        });
    }

    /**
     * Create the dialog element
     * @returns {HTMLElement} - The dialog element
     * @private
     */
    createDialogElement() {
        const win = document.createElement('div');
        win.className = 'window';
        win.classList.add('dialog');
        win.classList.add('window-focus');
        win.innerHTML = `
        <div class="window-titlebar">
            <div class="window-title">Title</div>
            <div class="window-controls">
                <div class="window-control window-control-close"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"/></svg></div>
            </div>
        </div>
        <div class="window-content"></div>
        `;
        return win;
    }

    /**
     * Render the dialog
     * @public
     * @returns {void}
     */
    render() {
        document.body.appendChild(this.dialogElement);
        const contentHeight = this.dialogElement.querySelector('.window-content > div').offsetHeight;
        this.setSize(this.width, contentHeight);
        this.windowOwner.windowElement.classList.add('dimmed');
    }

    /**
     * Drag handler for the dialog
     * @param {MouseEvent} e - The mouse event
     * @private
     * @returns {void}
     */
    dragHandler(e) {
        let oldx = e.clientX;
        let oldy = e.clientY;
        let mousemove = f => {
            let newx = this.dialogElement.offsetLeft - (oldx - f.clientX);
            let newy = this.dialogElement.offsetTop - (oldy - f.clientY);
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
    }

    /**
     * Close the dialog
     * @public
     * @returns {void}
     */
    close() {
        this.windowOwner.windowElement.classList.remove('dimmed');
        this.dialogElement.remove();
        this.dialogElement.querySelector('.window-titlebar')
            .removeEventListener('mousedown', this.dragHandler.bind(this));
        delete this;
    }

    /**
     * Set the content of the dialog
     * @param {string} content - The content to set
     * @returns {HTMLElement} - The dialog content
     */
    setContent(content) {
        let contentDiv = document.createElement('div');
        contentDiv.innerHTML = content;
        this.content.appendChild(contentDiv);
        return this.content;
    }

    /**
     * Get the content of the dialog
     * @returns {HTMLElement} - The dialog content
     */
    getContent() {
        return this.content;
    }

    /**
     * Set the title of the dialog
     * @param {string} title - The title to set
     * @returns {void}
     */
    setTitle(title) {
        this.title = title;
        this.dialogElement.querySelector('.window-title').textContent = this.title;
    }

    /**
     * Set the position of the dialog
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @returns {void}
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.dialogElement.style.left = this.x + 'px';
        this.dialogElement.style.top = this.y + 'px';
    }

    /**
     * Set the size of the dialog
     * @param {number} width - The width
     * @param {number} height - The height
     * @returns {void}
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.dialogElement.querySelector('.window-content').style.width = this.width + 'px';
        this.dialogElement.querySelector('.window-content').style.height = this.height + 'px';
    }
}
