import Applications from '../../Applications.js';
import { web_root } from '../../Config.js';

/**
 * CSS styles for the File Explorer application
 * Defines layout and appearance for the explorer window, toolbar, file list, and folder tree
 */
const stylesheet = `
    .file-explorer {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #c0c0c0;
        font-family: 'MS Sans Serif', sans-serif;
    }

    .explorer-toolbar {
        display: flex;
        padding: 4px;
        border-bottom: 1px solid #808080;
        background: #c0c0c0;
    }

    .toolbar-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2px 4px;
        min-width: 50px;
        border: 1px solid transparent;
        background: transparent;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 11px;
    }

    .toolbar-button:hover {
        border: 1px solid #fff;
        border-right-color: #808080;
        border-bottom-color: #808080;
    }

    .toolbar-separator {
        width: 1px;
        margin: 0 4px;
        background: #808080;
    }

    .address-bar {
        display: flex;
        align-items: center;
        padding: 4px;
        background-color: #c0c0c0;
        border-bottom: 1px solid #808080;
    }

    .address-bar label {
        margin-right: 8px;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 11px;
    }

    .address-bar input {
        flex: 1;
        height: 21px;
        border: 1px inset #fff;
        background: #fff;
        padding: 2px 4px;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 11px;
    }

    .explorer-container {
        display: flex;
        flex: 1;
        background: #fff;
        border: 1px inset #fff;
        margin: 2px;
    }

    .folder-tree {
        width: 200px;
        overflow: auto;
        border-right: 1px solid #808080;
        background: #fff;
        padding: 2px;
    }

    .file-list {
        flex: 1;
        overflow: auto;
        background: #fff;
        padding: 2px;
    }

    .folder-item {
        display: flex;
        align-items: center;
        padding: 1px 2px;
        white-space: nowrap;
    }

    .folder-item:hover {
        background: #000080;
        color: #fff;
    }

    .file-item {
        display: flex;
        align-items: center;
        padding: 1px 2px;
    }

    .file-item:hover {
        background: #000080;
        color: #fff;
    }

    .file-item.selected, .folder-item.selected {
        background: #000080;
        color: #fff;
    }

    .status-bar {
        display: flex;
        padding: 2px 4px;
        border-top: 1px solid #808080;
        font-size: 11px;
        background: #c0c0c0;
    }

    .status-bar-section {
        border: 1px inset #fff;
        padding: 2px 4px;
        margin-right: 2px;
        flex: 1;
    }
`;

/**
 * Windows 95-style File Explorer application
 * Allows browsing and interacting with the virtual file system
 */
export default class FileExplorer {
    /**
     * Creates a new File Explorer instance
     * @param {import('../WindowObject.js').default} windowObject - The window instance
     * @param {HTMLElement} windowContent - The content container element
     * @param {Object} args - Additional arguments including desktopEnvironment reference
     */
    constructor(windowObject, windowContent, args) {
        this.window = windowObject;
        this.windowContent = windowContent;
        this.args = args;
        this.desktopEnvironment = args.desktopEnvironment;
        this.fs = args.desktopEnvironment.fileSystem;
        this.currentPath = 'C:';
        
        // Save mode specific setup
        this.mode = args.mode || 'normal';
        this.onSelect = args.onSelect;
        
        if (this.mode === 'saveDialog') {
            this.window.setTitle('Save As');
        } else {
            this.window.setTitle('File Explorer');
        }
        
        this.window.setCloseRequest(() => this.window.closeWindow());
        
        this.window.addStylesheet(stylesheet);
        this.window.addStylesheet(FileExplorer.styles);
        // First set up the main UI
        this.setupUI();
        
        // Then add save dialog elements if in save mode
        if (this.mode === 'saveDialog') {
            this.setupSaveDialog();
        }
        
        this.refreshView();
    }

    /**
     * Sets up the main UI components of the File Explorer
     * Creates toolbar, folder tree, file list, and status bar
     * @private
     */
    setupUI() {
        this.container = document.createElement('div');
        this.container.className = 'file-explorer';

        // Only show menu bar and toolbar in normal mode
        if (this.mode === 'normal') {
            this.setupMenuBar();
            this.setupToolbar();
        }
        
        // Always show address bar and file list
        this.setupAddressBar();

        // Create main container
        this.explorerContainer = document.createElement('div');
        this.explorerContainer.className = 'explorer-container';

        // Create folder tree
        this.folderTree = document.createElement('div');
        this.folderTree.className = 'folder-tree';

        // Create file list
        this.fileList = document.createElement('div');
        this.fileList.className = 'file-list';

        // Create status bar with sections
        this.setupStatusBar();

        // Assemble the UI
        this.explorerContainer.appendChild(this.folderTree);
        this.explorerContainer.appendChild(this.fileList);
        this.container.appendChild(this.explorerContainer);
        this.windowContent.appendChild(this.container);
    }

    /**
     * Sets up the menu bar with classic Windows 95 menus
     * @private
     */
    setupMenuBar() {
        this.window.setMenu({
            'File': {
                'New': () => this.newItem(),
                'Delete': () => this.deleteSelected(),
                'Properties': () => this.showProperties()
            },
            'View': {
                'Refresh': () => this.refreshView()
            },
            'Help': {
                'About File Explorer': () => this.showAbout()
            }
        });
    }

    /**
     * Sets up the address bar
     * @private
     */
    setupAddressBar() {
        const addressBar = document.createElement('div');
        addressBar.className = 'address-bar';
        
        const label = document.createElement('label');
        label.textContent = 'Address:';
        
        this.addressInput = document.createElement('input');
        this.addressInput.type = 'text';
        this.addressInput.value = this.currentPath;
        this.addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.navigateToAddress(this.addressInput.value);
            }
        });
        
        addressBar.appendChild(label);
        addressBar.appendChild(this.addressInput);
        this.container.appendChild(addressBar);
    }

    /**
     * Updates the address bar to show current path
     * @private
     */
    updateAddressBar() {
        if (this.addressInput) {
            this.addressInput.value = this.currentPath;
        }
    }

    /**
     * Navigates to the specified address
     * @param {string} address - The path to navigate to
     * @private
     */
    navigateToAddress(address) {
        try {
            // Validate and clean up the address
            if (!address.startsWith('C:')) {
                throw new Error('Path must start with C:');
            }

            // Verify the path exists
            const pathParts = address.split('\\');
            let current = this.fs.data[pathParts[0]];
            
            for (let i = 1; i < pathParts.length; i++) {
                if (!current || !current[pathParts[i]]) {
                    throw new Error(`Invalid path: ${address}`);
                }
                current = current[pathParts[i]];
                if (typeof current !== 'object') {
                    throw new Error('Cannot navigate to a file');
                }
            }
            
            this.currentPath = address;
            this.refreshView();
        } catch (error) {
            this.showErrorDialog(`Cannot navigate to ${address}: ${error.message}`);
            this.updateAddressBar(); // Reset address bar to current valid path
        }
    }

    /**
     * Sets up the toolbar with classic Windows 95 buttons
     * @private
     */
    setupToolbar() {
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'explorer-toolbar';

        const buttons = [
            { icon: 'up', text: 'Up', action: () => this.navigateUp() },
            { separator: true },
            { icon: 'delete', text: 'Delete', action: () => this.deleteSelected() },
            { icon: 'properties', text: 'Properties', action: () => this.showProperties() }
        ];

        buttons.forEach(button => {
            if (button.separator) {
                const separator = document.createElement('div');
                separator.className = 'toolbar-separator';
                this.toolbar.appendChild(separator);
            } else {
                const btn = document.createElement('button');
                btn.className = 'toolbar-button';
                const img = document.createElement('img');
                img.src = `${web_root}/assets/images/explorer/${button.icon}.png`;
                img.alt = button.text;
                img.width = 16;
                img.height = 16;
                const span = document.createElement('span');
                span.textContent = button.text;
                btn.appendChild(img);
                btn.appendChild(span);
                btn.addEventListener('click', button.action);
                this.toolbar.appendChild(btn);
            }
        });

        this.container.appendChild(this.toolbar);
    }

    /**
     * Sets up the status bar with multiple sections
     * @private
     */
    setupStatusBar() {
        this.statusBar = document.createElement('div');
        this.statusBar.className = 'status-bar';

        const itemCount = document.createElement('div');
        itemCount.className = 'status-bar-section';
        
        const diskSpace = document.createElement('div');
        diskSpace.className = 'status-bar-section';
        diskSpace.textContent = 'Free Space: 2.14GB';

        this.statusBar.appendChild(itemCount);
        this.statusBar.appendChild(diskSpace);
        this.container.appendChild(this.statusBar);
    }

    /**
     * Refreshes all views in the File Explorer
     * Updates folder tree, file list, and status bar
     * @public
     */
    refreshView() {
        this.updateFolderTree();
        this.updateFileList();
        this.updateStatusBar();
        this.updateAddressBar();
    }

    /**
     * Updates the file list view with contents of current directory
     * Creates clickable items for files and folders
     * @private
     */
    updateFileList() {
        this.fileList.innerHTML = '';
        
        try {
            const currentDir = this.getCurrentDirectory();
            
            if (!currentDir || typeof currentDir !== 'object') {
                throw new Error('Invalid directory');
            }

            const entries = Object.entries(currentDir).sort(([nameA], [nameB]) => {
                return nameA.localeCompare(nameB);
            });

            for (const [name, content] of entries) {
                const isDirectory = typeof content === 'object';
                const item = document.createElement('div');
                item.className = 'file-item';
                
                const img = document.createElement('img');
                img.src = `${web_root}/assets/images/${isDirectory ? 'folder.png' : 'file.png'}`;
                img.alt = isDirectory ? 'Folder' : 'File';
                img.width = 16;
                img.height = 16;
                
                const span = document.createElement('span');
                span.textContent = name;
                
                item.appendChild(img);
                item.appendChild(span);

                item.addEventListener('click', (e) => this.handleSelection(e, item));
                item.addEventListener('dblclick', () => {
                    if (isDirectory) {
                        this.navigate(name);
                    } else {
                        this.openFile(name);
                    }
                });

                this.fileList.appendChild(item);
            }
        } catch (error) {
            console.error('Error updating file list:', error);
            this.showErrorDialog(`Error loading directory: ${error.message}`);
            
            this.currentPath = 'C:';
            this.refreshView();
        }
    }

    /**
     * Gets the directory object for the current path
     * @private
     * @returns {Object} Directory contents
     */
    getCurrentDirectory() {
        const pathParts = this.currentPath.split('\\');
        let current = this.fs.data[pathParts[0]]; // Start at drive root
        
        // Return drive root if we're at the top level
        if (pathParts.length === 1) return current;
        
        // Navigate through path parts
        for (let i = 1; i < pathParts.length; i++) {
            if (!current || !current[pathParts[i]]) {
                throw new Error(`Invalid path: ${this.currentPath}`);
            }
            current = current[pathParts[i]];
        }
        
        return current || {};
    }

    /**
     * Navigates to a subfolder
     * @param {string} folder - Name of the folder to navigate to
     * @public
     */
    navigate(folder) {
        try {
            const newPath = this.currentPath === 'C:' ? 
                `${this.currentPath}\\${folder}` : 
                `${this.currentPath}\\${folder}`;
                
            // Verify the new path exists before changing
            const pathParts = newPath.split('\\');
            let current = this.fs.data[pathParts[0]];
            
            for (let i = 1; i < pathParts.length; i++) {
                if (!current || !current[pathParts[i]]) {
                    throw new Error(`Invalid path: ${newPath}`);
                }
                current = current[pathParts[i]];
            }
            
            this.currentPath = newPath;
            this.refreshView();
        } catch (error) {
            console.error('Navigation error:', error);
            this.showErrorDialog(`Cannot navigate to ${folder}: ${error.message}`);
        }
    }

    /**
     * Navigates up one directory level
     * @public
     */
    navigateUp() {
        const parts = this.currentPath.split('\\');
        if (parts.length > 1) {
            parts.pop();
            this.currentPath = parts.join('\\');
            this.refreshView();
        }
    }

    /**
     * Updates the status bar with current directory information
     * @private
     */
    updateStatusBar() {
        const currentDir = this.getCurrentDirectory();
        const items = Object.keys(currentDir).length;
        this.statusBar.textContent = `${items} item(s)`;
    }

    /**
     * Opens a file with the appropriate application (currently Notepad)
     * @param {string} filename - Name of the file to open
     * @private
     */
    openFile(filename) {
        const fullPath = `${this.currentPath}\\${filename}`;
        try {
            // Start Notepad with the file path
            this.desktopEnvironment.windowManager.startProcess('notepad', { 
                path: fullPath,
                desktopEnvironment: this.desktopEnvironment
            });
        } catch (error) {
            console.error('Error opening file:', error);
        }
    }

    /**
     * Updates the folder tree view
     * Creates a hierarchical view of all folders in the file system
     * @private
     */
    updateFolderTree() {
        this.folderTree.innerHTML = '';
        
        const rootItem = document.createElement('div');
        rootItem.className = 'folder-item';
        const rootImg = document.createElement('img');
        rootImg.src = `${web_root}/assets/images/folder.png`;
        rootImg.alt = 'Folder';
        rootImg.width = 16;
        rootImg.height = 16;
        rootItem.appendChild(rootImg);
        rootItem.appendChild(document.createTextNode('C:'));
        rootItem.addEventListener('click', () => {
            this.currentPath = 'C:';
            this.refreshView();
        });
        this.folderTree.appendChild(rootItem);
        
        const addFolders = (parentElement, path, content) => {
            if (!content || typeof content !== 'object') return;

            for (const [name, value] of Object.entries(content)) {
                if (typeof value === 'object') {
                    const folderItem = document.createElement('div');
                    folderItem.className = 'folder-item';
                    folderItem.style.paddingLeft = '20px';
                    const folderImg = document.createElement('img');
                    folderImg.src = `${web_root}/assets/images/folder.png`;
                    folderImg.alt = 'Folder';
                    folderImg.width = 16;
                    folderImg.height = 16;
                    folderItem.appendChild(folderImg);
                    folderItem.appendChild(document.createTextNode(name));
                    
                    const fullPath = path ? `${path}\\${name}` : `C:\\${name}`;
                    folderItem.addEventListener('click', () => {
                        this.currentPath = fullPath;
                        this.refreshView();
                    });
                    
                    parentElement.appendChild(folderItem);
                    addFolders(parentElement, fullPath, value);
                }
            }
        };
        
        if (this.fs.data && this.fs.data['C:']) {
            addFolders(this.folderTree, '', this.fs.data['C:']);
        }
    }

    /**
     * Additional styles for the folder tree component
     * @static
     * @returns {string} CSS styles
     */
    static get styles() {
        return `
            ${stylesheet}
            
            .folder-item {
                display: flex;
                align-items: center;
                padding: 2px 4px;
                cursor: default;
                white-space: nowrap;
            }
            
            .folder-item:hover {
                background-color: #000080;
                color: #ffffff;
            }
            
            .folder-item img {
                width: 16px;
                height: 16px;
                margin-right: 4px;
                object-fit: contain;
            }

            .folder-tree {
                padding: 2px;
                user-select: none;
            }

            .folder-item.selected {
                background-color: #000080;
                color: #ffffff;
            }
        `;
    }

    /**
     * Creates a new item (file or folder) in the current directory
     * @private
     */
    newItem() {
        // Create submenu for New
        const menu = {
            'Folder': () => this.createNewFolder(),
            'Text Document': () => this.createNewFile()
        };

        // Show context menu at mouse position
        this.window.showContextMenu(menu);
    }

    /**
     * Creates a new folder in the current directory
     * @private
     */
    createNewFolder() {
        const name = prompt('Enter folder name:', 'New Folder');
        if (!name) return;

        try {
            const path = `${this.currentPath}\\${name}`;
            this.fs.createDirectory(path);
            this.refreshView();
        } catch (error) {
            alert(`Could not create folder: ${error.message}`);
        }
    }

    /**
     * Creates a new text file in the current directory
     * @private
     */
    createNewFile() {
        const name = prompt('Enter file name:', 'New Text Document.txt');
        if (!name) return;

        try {
            const path = `${this.currentPath}\\${name}`;
            this.fs.writeFile(path, '');
            this.refreshView();
        } catch (error) {
            alert(`Could not create file: ${error.message}`);
        }
    }

    /**
     * Deletes the selected items
     * @private
     */
    deleteSelected() {
        const selected = this.getSelectedItems();
        if (selected.length === 0) return;

        const confirmMessage = selected.length === 1 
            ? `Are you sure you want to delete '${selected[0].name}'?`
            : `Are you sure you want to delete these ${selected.length} items?`;

        const content = `
            <div style="padding: 16px;">
                <p>${confirmMessage}</p>
                <div style="text-align: right; margin-top: 16px;">
                    <button class="dialog-yes">Yes</button>
                    <button class="dialog-no">No</button>
                </div>
            </div>
        `;

        this.deleteDialog = this.window.makeDialog(content, {
            title: 'Confirm Delete',
            width: 300,
            height: 150
        });

        // Add click handlers for Yes/No buttons
        this.deleteDialog.dialogElement.querySelector('.dialog-yes')
            .addEventListener('click', () => {
                this.window.closeDialog(this.deleteDialog);
                this.deleteDialog = null;
                this.performDelete(selected);
            });

        this.deleteDialog.dialogElement.querySelector('.dialog-no')
            .addEventListener('click', () => {
                this.window.closeDialog(this.deleteDialog);
                this.deleteDialog = null;
            });

        this.deleteDialog.render();
    }

    /**
     * Performs the actual deletion of selected items
     * @private
     * @param {Array<{name: string, isDirectory: boolean}>} items - Items to delete
     */
    performDelete(items) {
        for (const item of items) {
            const path = `${this.currentPath}\\${item.name}`;
            try {
                if (item.isDirectory) {
                    this.fs.deleteDirectory(path);
                } else {
                    this.fs.deleteFile(path);
                }
            } catch (error) {
                this.showErrorDialog(`Could not delete ${item.name}: ${error.message}`);
                return;
            }
        }
        this.refreshView();
    }

    /**
     * Shows an error dialog
     * @private
     * @param {string} message - Error message to display
     */
    showErrorDialog(message) {
        const content = `
            <div style="padding: 16px;">
                <p>${message}</p>
                <div style="text-align: right; margin-top: 16px;">
                    <button class="dialog-ok">OK</button>
                </div>
            </div>
        `;

        this.errorDialog = this.window.makeDialog(content, {
            title: 'Error',
            width: 300,
            height: 150
        });

        this.errorDialog.dialogElement.querySelector('.dialog-ok')
            .addEventListener('click', () => {
                this.window.closeDialog(this.errorDialog);
                this.errorDialog = null;
            });

        this.errorDialog.render();
    }

    /**
     * Gets array of currently selected items
     * @private
     * @returns {Array<{name: string, isDirectory: boolean}>}
     */
    getSelectedItems() {
        return Array.from(this.fileList.querySelectorAll('.file-item.selected'))
            .map(element => ({
                name: element.querySelector('span').textContent,
                isDirectory: element.querySelector('img').alt === 'Folder'
            }));
    }

    /**
     * Handles selection of items in the file list
     * @private
     */
    handleSelection(event, item) {
        if (event.ctrlKey) {
            // Toggle selection with Ctrl key
            item.classList.toggle('selected');
        } else if (event.shiftKey && this.lastSelected) {
            // Range selection with Shift key
            const items = Array.from(this.fileList.querySelectorAll('.file-item'));
            const start = items.indexOf(this.lastSelected);
            const end = items.indexOf(item);
            const range = items.slice(Math.min(start, end), Math.max(start, end) + 1);
            
            items.forEach(i => i.classList.remove('selected'));
            range.forEach(i => i.classList.add('selected'));
        } else {
            // Single selection
            this.fileList.querySelectorAll('.file-item').forEach(i => 
                i.classList.remove('selected'));
            item.classList.add('selected');
            this.lastSelected = item;
        }
    }

    /**
     * Shows properties dialog for selected items
     * @private
     */
    showProperties() {
        const selected = this.getSelectedItems();
        if (selected.length === 0) return;

        const item = selected[0]; // Show properties for first selected item
        const path = `${this.currentPath}\\${item.name}`;
        
        try {
            let content;
            if (item.isDirectory) {
                content = `
                    <div style="padding: 16px;">
                        <p><strong>Type:</strong> Folder</p>
                        <p><strong>Location:</strong> ${this.currentPath}</p>
                        <p><strong>Name:</strong> ${item.name}</p>
                        <div style="text-align: right; margin-top: 16px;">
                            <button onclick="this.closePropertiesDialog()">OK</button>
                        </div>
                    </div>
                `;
            } else {
                const fileContent = this.fs.readFile(path);
                const size = fileContent.length;
                content = `
                    <div style="padding: 16px;">
                        <p><strong>Type:</strong> Text Document</p>
                        <p><strong>Location:</strong> ${this.currentPath}</p>
                        <p><strong>Name:</strong> ${item.name}</p>
                        <p><strong>Size:</strong> ${size} bytes</p>
                        <div style="text-align: right; margin-top: 16px;">
                            <button class="dialog-ok">OK</button>
                        </div>
                    </div>
                `;
            }

            this.propertiesDialog = this.window.makeDialog(content, {
                title: `${item.name} Properties`,
                width: 300,
                height: 200
            });

            // Add click handler for the OK button
            this.propertiesDialog.dialogElement.querySelector('.dialog-ok')
                .addEventListener('click', () => {
                    this.window.closeDialog(this.propertiesDialog);
                    this.propertiesDialog = null;
                });

            this.propertiesDialog.render();

        } catch (error) {
            this.showErrorDialog(`Could not get properties: ${error.message}`);
        }
    }

    /**
     * Sets up additional UI elements for save dialog mode
     * @private
     */
    setupSaveDialog() {
        const saveBar = document.createElement('div');
        saveBar.className = 'save-bar';
        
        const filenameInput = document.createElement('input');
        filenameInput.type = 'text';
        filenameInput.value = 'Untitled.txt';
        filenameInput.className = 'filename-input';
        
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => {
            const path = `${this.currentPath}\\${filenameInput.value}`;
            if (this.onSelect) {
                this.onSelect(path);
            }
        });
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            this.window.closeWindow();
        });
        
        saveBar.appendChild(filenameInput);
        saveBar.appendChild(saveButton);
        saveBar.appendChild(cancelButton);
        
        // Add save bar at the bottom
        this.container.appendChild(saveBar);
    }

    static get styles() {
        return `
            ${stylesheet}
            
            .save-bar {
                display: flex;
                gap: 8px;
                padding: 8px;
                background: #c0c0c0;
                border-top: 1px solid #808080;
            }
            
            .filename-input {
                flex: 1;
                height: 21px;
                border: 1px inset #fff;
                padding: 2px 4px;
                font-family: 'MS Sans Serif', sans-serif;
                font-size: 11px;
            }
            
            .save-bar button {
                min-width: 75px;
                padding: 4px 8px;
                font-family: 'MS Sans Serif', sans-serif;
                font-size: 11px;
            }
        `;
    }
} 