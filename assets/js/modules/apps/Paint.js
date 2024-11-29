export default class Paint {
    /**
     * Creates a new Paint application instance
     * @param {import('../WindowObject').default} windowObject - The window instance
     * @param {HTMLElement} windowContent - The content container element
     * @param {Array} args - Additional arguments passed to the application
     */
    constructor(windowObject, windowContent, args) {
        this.window = windowObject;
        this.windowContent = windowContent;
        
        // Set up canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.ctx = this.canvas.getContext('2d');
        
        // Drawing state
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Initialize brush settings first
        this.brushSettings = {
            size: 15,
            color: '#000000',
            opacity: 1,
            style: 'round' // round, square, etc.
        };

        this.setTool('pencil');
        
        // Drawing history for undo
        this.history = [];
        this.maxHistory = 10;
        
        // Set up window
        this.window.setTitle('Paint');
        this.window.setSize(820, 640); // Slightly larger than canvas for borders
        
        // Initialize UI
        this.setupMenuBar();
        this.setupToolbar();
        this.setupCanvas();
        
        // Set up event listeners
        this.setupEventListeners();

        this.window.setCloseRequest(() => {
            if (!this.cleanup()) return;
            this.window.closeWindow();
        });

        // Zoom settings
        this.zoomLevel = 1;
        this.minZoom = 0.1;  // Will be dynamically calculated
        this.maxZoom = 3;

        // Add CSS
        this.window.addStylesheet(css);
    }

    /**
     * Sets up the menu bar with Paint-specific options
     * @private
     */
    setupMenuBar() {
        this.window.setMenu({
            'File': {
                'New': () => this.clearCanvas(),
                'Open': () => this.openImage(),
                'Save': () => this.saveCanvas()
            },
            'Edit': {
                'Undo': () => this.undo(),
                'Clear': () => this.clearCanvas()
            },
            'Tools': {
                'Pencil': () => this.setTool('pencil'),
                'Brush': () => this.setTool('brush'),
                'Line': () => this.setTool('line'),
                'Rectangle': () => this.setTool('rectangle')
            }
        });
    }

    /**
     * Cleans up the Paint application instance
     * @private
     */
    cleanup() {
        /* Ask to save? Etc.. */
        return true;
    }

    /**
     * Sets up the toolbar with painting tools
     * @private
     */
    setupToolbar() {
        const toolbar = document.createElement('div');
        toolbar.classList.add('paint-toolbar');

        // Tools Section
        const toolsSection = document.createElement('div');
        toolsSection.classList.add('toolbar-section');
        
        const tools = [
            { name: 'pencil', icon: '✏️', tooltip: 'Pencil' },
            { name: 'brush', icon: '🖌️', tooltip: 'Brush' },
            { name: 'line', icon: '📏', tooltip: 'Line' },
            { name: 'rectangle', icon: '⬜', tooltip: 'Rectangle' }
        ];

        tools.forEach(tool => {
            const button = document.createElement('button');
            button.classList.add('tool-button');
            if (tool.name === this.currentTool) {
                button.classList.add('active');
            }
            button.title = tool.tooltip;
            button.innerHTML = tool.icon;
            button.addEventListener('click', () => {
                toolsSection.querySelectorAll('.tool-button').forEach(b => 
                    b.classList.remove('active'));
                button.classList.add('active');
                this.setTool(tool.name);
            });
            toolsSection.appendChild(button);
        });

        // Brush Settings Section
        const brushSection = document.createElement('div');
        brushSection.classList.add('toolbar-section', 'brush-settings');
        
        // Color Picker
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = this.brushSettings.color;
        colorPicker.title = 'Brush Color';
        colorPicker.addEventListener('input', (e) => {
            this.brushSettings.color = e.target.value;
            this.ctx.strokeStyle = e.target.value;
        });

        // Size Slider
        const sizeContainer = document.createElement('div');
        sizeContainer.classList.add('size-container');
        
        const sizeLabel = document.createElement('span');
        sizeLabel.textContent = 'Size:';
        
        const sizeSlider = document.createElement('input');
        sizeSlider.type = 'range';
        sizeSlider.min = '1';
        sizeSlider.max = '50';
        sizeSlider.value = this.brushSettings.size;
        sizeSlider.title = 'Brush Size';
        sizeSlider.addEventListener('input', (e) => {
            this.brushSettings.size = parseInt(e.target.value);
            this.ctx.lineWidth = this.brushSettings.size;
            sizeValue.textContent = e.target.value;
        });

        const sizeValue = document.createElement('span');
        sizeValue.classList.add('size-value');
        sizeValue.textContent = this.brushSettings.size;

        // Opacity Slider
        const opacityContainer = document.createElement('div');
        opacityContainer.classList.add('opacity-container');
        
        const opacityLabel = document.createElement('span');
        opacityLabel.textContent = 'Opacity:';
        
        const opacitySlider = document.createElement('input');
        opacitySlider.type = 'range';
        opacitySlider.min = '0';
        opacitySlider.max = '100';
        opacitySlider.value = this.brushSettings.opacity * 100;
        opacitySlider.title = 'Brush Opacity';
        opacitySlider.addEventListener('input', (e) => {
            this.brushSettings.opacity = parseInt(e.target.value) / 100;
            this.ctx.globalAlpha = this.brushSettings.opacity;
            opacityValue.textContent = `${e.target.value}%`;
        });

        const opacityValue = document.createElement('span');
        opacityValue.classList.add('opacity-value');
        opacityValue.textContent = `${this.brushSettings.opacity * 100}%`;

        // Style Select
        const styleSelect = document.createElement('select');
        styleSelect.classList.add('brush-style');
        styleSelect.title = 'Brush Style';
        
        const styles = ['round', 'square', 'butt'];
        styles.forEach(style => {
            const option = document.createElement('option');
            option.value = style;
            option.textContent = style.charAt(0).toUpperCase() + style.slice(1);
            styleSelect.appendChild(option);
        });
        
        styleSelect.value = this.brushSettings.style;
        styleSelect.addEventListener('change', (e) => {
            this.brushSettings.style = e.target.value;
            this.ctx.lineCap = this.brushSettings.style;
        });

        // Append all brush settings
        sizeContainer.append(sizeLabel, sizeSlider, sizeValue);
        opacityContainer.append(opacityLabel, opacitySlider, opacityValue);
        brushSection.append(colorPicker, sizeContainer, opacityContainer, styleSelect);

        // Zoom Controls Section
        const zoomSection = document.createElement('div');
        zoomSection.classList.add('toolbar-section', 'zoom-controls');

        const zoomOutButton = document.createElement('button');
        zoomOutButton.innerHTML = '🔍-';
        zoomOutButton.title = 'Zoom Out';
        zoomOutButton.addEventListener('click', () => this.adjustZoom(-0.1));

        const zoomInButton = document.createElement('button');
        zoomInButton.innerHTML = '🔍+';
        zoomInButton.title = 'Zoom In';
        zoomInButton.addEventListener('click', () => this.adjustZoom(0.1));

        const zoomLabel = document.createElement('span');
        zoomLabel.classList.add('zoom-level');
        zoomLabel.textContent = '100%';

        zoomSection.append(zoomOutButton, zoomLabel, zoomInButton);
        toolbar.appendChild(zoomSection);

        // Append all sections to toolbar
        toolbar.append(toolsSection, brushSection);
        this.windowContent.insertBefore(toolbar, this.windowContent.firstChild);
    }

    /**
     * Sets up the canvas and adds it to the window
     * @private
     */
    setupCanvas() {
        const canvasContainer = document.createElement('div');
        canvasContainer.classList.add('paint-canvas-container');
        
        // Set initial canvas position
        this.canvas.style.transformOrigin = 'top left';
        
        canvasContainer.appendChild(this.canvas);
        this.windowContent.appendChild(canvasContainer);
        
        // Wait for next frame to ensure container is rendered,
        // this prevents the initial state of the zoom level from being `NaN%`
        requestAnimationFrame(() => {
            // Set initial zoom level to 1 before calculating fit
            this.zoomLevel = 1;
            this.adjustZoom(0);
        });
    }

    /**
     * Sets up mouse event listeners for drawing
     * @private
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    /**
     * Gets the mouse coordinates relative to the canvas, accounting for zoom
     * @private
     * @param {MouseEvent} event - The mouse event
     * @returns {{x: number, y: number}} The coordinates
     */
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) / this.zoomLevel,
            y: (event.clientY - rect.top) / this.zoomLevel
        };
    }

    /**
     * Saves the current canvas state to history
     * @private
     */
    saveState() {
        if (this.history.length >= this.maxHistory) {
            this.history.shift();
        }
        this.history.push(this.canvas.toDataURL());
    }

    /**
     * Handles mouse down events on the canvas
     * @private
     * @param {MouseEvent} event
     */
    handleMouseDown(event) {
        const pos = this.getMousePos(event);
        this.isDrawing = true;
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Save state before starting new drawing
        this.saveState();

        // Start path for freehand drawing
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        
        // Set up drawing style using brush settings
        this.ctx.strokeStyle = this.brushSettings.color;
        this.ctx.lineWidth = this.brushSettings.size;
        this.ctx.lineCap = this.brushSettings.style;
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = this.brushSettings.opacity;
    }

    /**
     * Handles mouse move events on the canvas
     * @private
     * @param {MouseEvent} event
     */
    handleMouseMove(event) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(event);
        
        switch (this.currentTool) {
            case 'pencil':
                this.drawPencil(pos);
                break;
            case 'brush':
                this.drawBrush(pos);
                break;
            case 'line':
                this.drawLine(pos);
                break;
            case 'rectangle':
                this.drawRectangle(pos);
                break;
        }
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    /**
     * Handles mouse up events on the canvas
     * @private
     * @param {MouseEvent} event
     */
    handleMouseUp() {
        this.isDrawing = false;
        this.ctx.closePath();
    }

    /**
     * Draws with pencil tool
     * @private
     * @param {{x: number, y: number}} pos - Current mouse position
     */
    drawPencil(pos) {
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }

    /**
     * Draws with brush tool
     * @private
     * @param {{x: number, y: number}} pos - Current mouse position
     */
    drawBrush(pos) {
        const distance = Math.sqrt(
            Math.pow(pos.x - this.lastX, 2) + 
            Math.pow(pos.y - this.lastY, 2)
        );
        const angle = Math.atan2(pos.y - this.lastY, pos.x - this.lastX);
        
        for (let i = 0; i < distance; i++) {
            const x = this.lastX + (Math.cos(angle) * i);
            const y = this.lastY + (Math.sin(angle) * i);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.brushSettings.size / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = this.brushSettings.color;
            this.ctx.fill();
        }
    }

    /**
     * Draws a line
     * @private
     * @param {{x: number, y: number}} pos - Current mouse position
     */
    drawLine(pos) {
        // Clear the canvas to the last saved state
        const lastState = this.history[this.history.length - 1];
        if (lastState) {
            const img = new Image();
            img.src = lastState;
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
                
                // Draw the new line
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
            };
        }
    }

    /**
     * Draws a rectangle
     * @private
     * @param {{x: number, y: number}} pos - Current mouse position
     */
    drawRectangle(pos) {
        const lastState = this.history[this.history.length - 1];
        if (lastState) {
            const img = new Image();
            img.src = lastState;
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
                
                const width = pos.x - this.lastX;
                const height = pos.y - this.lastY;
                this.ctx.strokeRect(this.lastX, this.lastY, width, height);
            };
        }
    }

    /**
     * Sets the current drawing tool
     * @param {string} tool - The tool to use ('pencil', 'brush', 'line', 'rectangle')
     */
    setTool(tool) {
        this.currentTool = tool;
        // Reset context settings when changing tools
        this.ctx.strokeStyle = this.brushSettings.color;
        this.ctx.lineWidth = this.brushSettings.size;
        this.ctx.lineCap = this.brushSettings.style;
        this.ctx.globalAlpha = this.brushSettings.opacity;
    }

    /**
     * Undoes the last drawing action
     */
    undo() {
        if (this.history.length > 0) {
            const previousState = this.history.pop();
            const img = new Image();
            img.src = previousState;
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
        }
    }

    /**
     * Clears the entire canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    }

    /**
     * Adjusts the zoom level of the canvas
     * @private
     * @param {number} delta - The amount to adjust zoom by
     */
    adjustZoom(delta) {
        const container = this.windowContent.querySelector('.paint-canvas-container');
        const containerRect = container.getBoundingClientRect();
        
        // Ensure we have valid dimensions
        if (containerRect.width === 0 || containerRect.height === 0) {
            return; // Skip zoom adjustment if container isn't properly sized yet
        }
        
        // Calculate minimum zoom to fit canvas in container
        this.minZoom = Math.min(
            containerRect.width / this.canvas.width,
            containerRect.height / this.canvas.height
        );

        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
        
        if (newZoom !== this.zoomLevel) {
            this.zoomLevel = newZoom;
            this.applyZoom();
            
            // Update zoom label
            const zoomLabel = this.windowContent.querySelector('.zoom-level');
            if (zoomLabel) {
                zoomLabel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
            }
        }
    }

    /**
     * Applies the current zoom level to the canvas
     * @private
     */
    applyZoom() {
        const container = this.windowContent.querySelector('.paint-canvas-container');
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
        this.canvas.style.transformOrigin = 'top left';
        
        // Adjust container size to accommodate zoomed canvas
        container.style.width = `${this.canvas.width * this.zoomLevel}px`;
        container.style.height = `${this.canvas.height * this.zoomLevel}px`;
    }
}


const css = `

:root {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: transparent;
    border: none;
}

.paint-toolbar {
    display: flex;
    padding: 4px;
    gap: 8px;
    background: var(--window-background-color);
    border-bottom: 1px solid var(--border-color);
}

.paint-toolbar .toolbar-section {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    border-right: 1px solid var(--border-color);
}

.paint-toolbar :is(button, input[type="color"], select) {
border: 2px solid;
border-color: var(--outset-border-color);
}

.paint-toolbar .tool-button {
    width: 28px;
    height: 28px;
    padding: 2px;
    background: var(--window-background-color);
    cursor: pointer;
}

.paint-toolbar .tool-button.active {
    background: var(--highlight-bg);
    color: var(--highlight-text);
}

.paint-toolbar .tool-button:hover {
    background: var(--highlight-bg);
    color: var(--highlight-text);
}

.paint-toolbar input[type="color"] {
    width: 30px;
    height: 20px;
    padding: 0;
}

.paint-toolbar input[type="range"] {
    width: 100px;
}

.paint-canvas-container {
    overflow: auto;
    position: relative;
    flex: 1;
    height: calc(100% - 40px);
    border: 2px inset #bbb;
    background: #fff;
}

.paint-canvas-container canvas {
    background: white;
}

.paint-toolbar .brush-settings {
    display: flex;
    gap: 8px;
    align-items: center;
}

.paint-toolbar .size-container,
.paint-toolbar .opacity-container {
    display: flex;
    align-items: center;
    gap: 4px;
}

.paint-toolbar .size-value,
.paint-toolbar .opacity-value {
    min-width: 30px;
    text-align: right;
}

.paint-toolbar .brush-style {
    height: 22px;
    border: 1px solid var(--border-color);
    background: var(--window-background-color);
    cursor: pointer;
}

.paint-toolbar input[type="range"] {
    width: 80px;
}

.paint-toolbar label {
    font-size: 12px;
    user-select: none;
}

.paint-toolbar .zoom-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.paint-toolbar .zoom-controls button {
    width: 28px;
    height: 28px;
    padding: 2px;
    background: var(--window-background-color);
    cursor: pointer;
}

.paint-toolbar .zoom-controls .zoom-level {
    min-width: 50px;
    text-align: center;
}

.paint-canvas-container {
    overflow: auto;
    position: relative;
}

.paint-canvas-container canvas {
    position: absolute;
    top: 0;
    left: 0;
}

.paint-toolbar {
    flex-shrink: 0;
    height: 40px;
    padding: 4px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--window-background-color);
}
`;
