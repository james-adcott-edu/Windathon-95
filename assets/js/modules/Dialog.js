export default class Dialog {
    constructor(windowOwner, dialogArgs) {
        this.windowOwner = windowOwner;
        this.title = "";
        this.width = 400;
        this.height = 300;
        this.x = this.windowOwner.x+30;
        this.y = this.windowOwner.y+30;
        this.hasFocus = true;
        this.dialogElement = this.createDialogElement();
        if (dialogArgs) {
            for (let key in dialogArgs) {
                this[key] = dialogArgs[key];
            }
        }

        this.setSize(this.width, this.height);
        this.setPosition(this.x, this.y);
        this.setTitle(this.title);
        this.content = this.dialogElement.querySelector('.window-content');

        // Window Dragging
        let titleBar = this.dialogElement.querySelector('.window-titlebar');
        titleBar.addEventListener('mousedown', this.dragHandler.bind(this));

        let closeButton = this.dialogElement.querySelector('.window-control-close');
        closeButton.addEventListener('click', e => {
            this.windowOwner.closeDialog(this);
        });
    }

    createDialogElement() {
        const win = document.createElement('div');
        win.className = 'window';
        win.classList.add('dialog');
        win.classList.add('window-focus');
        win.innerHTML = `
        <div class="window-titlebar">
            <div class="window-title">Title</div>
            <div class="window-controls">
                <div class="window-control window-control-close">X</div>
            </div>
        </div>
        <div class="window-content"></div>
        `;
        return win;
    }

    render() {
        document.body.appendChild(this.dialogElement);
        const contentHeight = this.dialogElement.querySelector('.window-content > div').offsetHeight;
        this.setSize(this.width, contentHeight);
        this.windowOwner.windowElement.classList.add('dimmed');
    }

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

    close() {
        this.windowOwner.windowElement.classList.remove('dimmed');
        this.dialogElement.remove();
        this.dialogElement.querySelector('.window-titlebar')
            .removeEventListener('mousedown', this.dragHandler.bind(this));
        delete this;
    }

    setContent(content) {
        let contentDiv = document.createElement('div');
        contentDiv.innerHTML = content;
        this.content.appendChild(contentDiv);
        return this.content;
    }

    getContent() {
        return this.content;
    }

    setTitle(title) {
        this.title = title;
        this.dialogElement.querySelector('.window-title').textContent = this.title;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.dialogElement.style.left = this.x + 'px';
        this.dialogElement.style.top = this.y + 'px';
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.dialogElement.querySelector('.window-content').style.width = this.width + 'px';
        this.dialogElement.querySelector('.window-content').style.height = this.height + 'px';
    }
}
