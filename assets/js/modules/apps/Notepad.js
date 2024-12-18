import Dialog from '../Dialog.js';

export default class Notepad {
    /**
     * Creates a new Notepad application instance
     * @param {import('../WindowObject').default} windowObject - The window instance
     * @param {HTMLElement} windowContent - The content container element
     * @param {Array} args - Additional arguments passed to the application
     */
    constructor(windowObject, windowContent, args) {
        this.window = windowObject;
        this.windowContent = windowContent;
        
        /** @type {string|null} Path to the current file */
        this.currentPath = args.path || null;

        /** @type {import('../DesktopEnvironment.js').default} */
        this.desktopEnvironment = args.desktopEnvironment;
        
        /** @type {import('../JsonFs.js').default} */
        this.fs = args.desktopEnvironment.fileSystem;
        
        this.window.setTitle('Untitled - Notepad');
        
        this.setupUi();
        
        // If a path was provided, load the file
        if (this.currentPath) {
            this.loadFile(this.currentPath);
        }
    }

    setupUi() {
        // Add font settings
        this.fontSettings = {
            family: 'Consolas',
            size: 14,
            wordWrap: true
        };

        this.window.addStylesheet(stylesheet);
        
        // Initialize UI
        this.setupTextArea();
        this.setupStatusBar();
        this.setupMenuBar();
        
        // Set up close handler
        this.window.setCloseRequest(() => {
            if (!this.checkSave()) return;
            this.window.closeWindow();
        });
    }

    /**
     * Sets up the text area for editing
     * @private
     */
    setupTextArea() {
        this.textarea = document.createElement('textarea');
        
        this.textarea.addEventListener('input', () => {
            if (!this.isModified) {
                this.isModified = true;
                this.updateTitle();
            }
        });

        this.windowContent.appendChild(this.textarea);
    }

    /**
     * Sets up the status bar
     * @private
     */
    setupStatusBar() {
        this.statusBar = document.createElement('div');
        this.statusBar.className = 'notepad-statusbar';
        this.statusBar.innerHTML = `
            <div class="status-position">Ln 1, Col 1</div>
            <div class="status-info">100% | Windows (CRLF) | UTF-8</div>
        `;
        this.windowContent.appendChild(this.statusBar);

        // Update cursor position on selection or cursor movement
        this.textarea.addEventListener('mouseup', () => this.updateStatusBar());
        this.textarea.addEventListener('keyup', () => this.updateStatusBar());
    }

    /**
     * Updates the status bar information
     * @private
     */
    updateStatusBar() {
        const text = this.textarea.value;
        const position = this.textarea.selectionStart;
        const textToPosition = text.substr(0, position);
        const lines = textToPosition.split('\n');
        const currentLine = lines.length;
        const currentColumn = lines[lines.length - 1].length + 1;

        const positionElement = this.statusBar.querySelector('.status-position');
        positionElement.textContent = `Ln ${currentLine}, Col ${currentColumn}`;
    }

    /**
     * Sets up the menu bar with Notepad-specific options
     * @private
     */
    setupMenuBar() {
        this.window.setMenu({
            'File': {
                'New': () => this.newFile(),
                'Open...': () => this.openFile(),
                'Save': () => this.saveFile(),
                'Save As...': () => this.saveFileAs(),
                'Page Setup...': () => this.pageSetup(),
                'Print...': () => this.print(),
                'Close': () => {
                    if (!this.checkSave()) return;
                    this.window.closeWindow()
                }
            },
            'Edit': {
                'Undo': () => this.textarea.undo?.(),
                'Cut': () => this.execCommand('cut'),
                'Copy': () => this.execCommand('copy'),
                'Paste': () => this.execCommand('paste'),
                'Delete': () => this.execCommand('delete'),
                'Find...': () => this.showFindDialog(),
                'Find Next': () => this.findNext(),
                'Replace...': () => this.showReplaceDialog(),
                'Go To...': () => this.showGoToDialog(),
                'Select All': () => this.execCommand('selectAll'),
                'Time/Date': () => this.insertTimeDate()
            },
            'Format': {
                'Word Wrap': () => this.toggleWordWrap(),
                'Font...': () => this.showFontDialog()
            },
            'View': {
                'Status Bar': () => this.toggleStatusBar(),
                'Zoom': {
                    'Zoom In': () => this.zoom(1),
                    'Zoom Out': () => this.zoom(-1),
                    'Restore Default Zoom': () => this.zoom(0)
                }
            },
            'Help': {
                'View Help': () => this.showHelp(),
                'About Notepad': () => this.showAbout()
            }
        });
    }

    /**
     * Shows the find dialog
     * @private
     */
    async showFindDialog() {
        const dialog = new Dialog(this.window, {
            title: 'Find',
            width: 350,
            height: 150
        });
        
        const content = `
            <div class="dialog-row">
                <label>Find what:</label>
                <input type="text" class="find-input" />
            </div>
            <div class="dialog-row">
                <label><input type="checkbox" class="match-case" /> Match case</label>
                <label><input type="checkbox" class="wrap-around" /> Wrap around</label>
            </div>
            <div class="dialog-buttons">
                <button class="find-next">Find Next</button>
                <button class="cancel">Cancel</button>
            </div>
        `;
        
        const dialogContent = dialog.setContent(content);
        
        const findInput = dialogContent.querySelector('.find-input');
        const matchCase = dialogContent.querySelector('.match-case');
        const wrapAround = dialogContent.querySelector('.wrap-around');
        
        findInput.value = this.lastSearch || '';
        findInput.select();
        findInput.focus();

        dialogContent.querySelector('.find-next').addEventListener('click', () => {
            this.lastSearch = findInput.value;
            this.findNext(findInput.value, matchCase.checked, wrapAround.checked);
        });

        dialogContent.querySelector('.cancel').addEventListener('click', () => {
            dialog.close();
        });

        dialog.render();
    }

    /**
     * Shows the replace dialog
     * @private
     */
    showReplaceDialog() {
        const dialog = new Dialog(this.window, {
            title: 'Replace',
            width: 350,
            height: 200
        });
        
        const content = `
            <div class="dialog-row">
                <label>Find what:</label>
                <input type="text" class="find-input" />
            </div>
            <div class="dialog-row">
                <label>Replace with:</label>
                <input type="text" class="replace-input" />
            </div>
            <div class="dialog-row">
                <label><input type="checkbox" class="match-case" /> Match case</label>
            </div>
            <div class="dialog-buttons">
                <button class="find-next">Find Next</button>
                <button class="replace">Replace</button>
                <button class="replace-all">Replace All</button>
                <button class="cancel">Cancel</button>
            </div>
        `;

        const dialogContent = dialog.setContent(content);
        
        const findInput = dialogContent.querySelector('.find-input');
        const replaceInput = dialogContent.querySelector('.replace-input');
        const matchCase = dialogContent.querySelector('.match-case');

        findInput.value = this.lastSearch || '';
        findInput.select();
        findInput.focus();

        dialogContent.querySelector('.find-next').addEventListener('click', () => {
            this.lastSearch = findInput.value;
            this.findNext(findInput.value, matchCase.checked);
        });

        dialogContent.querySelector('.replace').addEventListener('click', () => {
            this.replace(findInput.value, replaceInput.value, matchCase.checked);
        });

        dialogContent.querySelector('.replace-all').addEventListener('click', () => {
            this.replaceAll(findInput.value, replaceInput.value, matchCase.checked);
        });

        dialogContent.querySelector('.cancel').addEventListener('click', () => {
            dialog.close();
        });

        dialog.render();
    }

    /**
     * Shows the go to line dialog
     * @private
     */
    showGoToDialog() {
        const totalLines = this.textarea.value.split('\n').length;
        
        const dialog = new Dialog(this.window, {
            title: 'Go To Line',
            width: 300,
            height: 150
        });
        
        const content = `
            <div class="dialog-row">
                <label>Line number (1-${totalLines}):</label>
                <input type="number" class="line-input" min="1" max="${totalLines}" />
            </div>
            <div class="dialog-buttons">
                <button class="go-to">Go To</button>
                <button class="cancel">Cancel</button>
            </div>
        `;

        const dialogContent = dialog.setContent(content);
        const lineInput = dialogContent.querySelector('.line-input');
        lineInput.focus();

        dialogContent.querySelector('.go-to').addEventListener('click', () => {
            const lineNumber = parseInt(lineInput.value);
            if (lineNumber >= 1 && lineNumber <= totalLines) {
                this.goToLine(lineNumber);
                dialog.close();
            } else {
                alert(`Please enter a number between 1 and ${totalLines}`);
            }
        });

        dialogContent.querySelector('.cancel').addEventListener('click', () => {
            dialog.close();
        });

        dialog.render();
    }

    /**
     * Shows the font dialog
     * @private
     */
    showFontDialog() {
        const dialog = new Dialog(this.window, {
            title: 'Font',
            width: 400,
            height: 300
        });
        
        const content = `
            <div class="font-section">
                <label>Font:</label>
                <select class="font-family">
                    <option value="Consolas">Consolas</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Lucida Console">Lucida Console</option>
                    <option value="monospace">Monospace</option>
                </select>
            </div>
            <div class="font-section">
                <label>Size:</label>
                <select class="font-size">
                    ${[8,9,10,11,12,14,16,18,20,22,24,26,28,36,48,72]
                        .map(size => `<option value="${size}">${size}</option>`)
                        .join('')}
                </select>
            </div>
            <div class="font-preview">
                AaBbYyZz 123
            </div>
            <div class="dialog-buttons">
                <button class="ok-button">OK</button>
                <button class="cancel-button">Cancel</button>
            </div>
        `;

        const dialogContent = dialog.setContent(content);
        
        const familySelect = dialogContent.querySelector('.font-family');
        const sizeSelect = dialogContent.querySelector('.font-size');
        const preview = dialogContent.querySelector('.font-preview');

        // Set current values
        familySelect.value = this.fontSettings.family;
        sizeSelect.value = this.fontSettings.size;

        // Preview handlers
        const updatePreview = () => {
            preview.style.fontFamily = familySelect.value;
            preview.style.fontSize = `${sizeSelect.value}px`;
            dialog.render();
        };
        
        familySelect.addEventListener('change', updatePreview);
        sizeSelect.addEventListener('change', updatePreview);
        updatePreview();

        dialogContent.querySelector('.ok-button').addEventListener('click', () => {
            this.fontSettings.family = familySelect.value;
            this.fontSettings.size = parseInt(sizeSelect.value);
            this.applyFontSettings();
            dialog.close();
        });

        dialogContent.querySelector('.cancel-button').addEventListener('click', () => {
            dialog.close();
        });

        dialog.render();
    }

    /**
     * Shows the about dialog
     * @private
     */
    showAbout() {
        const dialog = new Dialog(this.window, {
            title: 'About Notepad',
            width: 400,
            height: 300
        });
        
        const content = `
            <div class="about-content">
                <div class="about-header">Windows 95 Notepad</div>
                <div class="about-version">Version 1.0</div>
                <div class="about-copyright">© 2024 Your Name</div>
                <div class="about-description">
                    A faithful recreation of the classic Windows 95 Notepad
                    for the modern web browser.
                </div>
            </div>
            <div class="dialog-buttons">
                <button class="ok-button">OK</button>
            </div>
        `;

        const dialogContent = dialog.setContent(content);

        dialogContent.querySelector('.ok-button').addEventListener('click', () => {
            dialog.close();
        });

        dialog.render();
    }

    /**
     * Toggles word wrap
     * @private
     */
    toggleWordWrap() {
        this.fontSettings.wordWrap = !this.fontSettings.wordWrap;
        this.textarea.style.whiteSpace = this.fontSettings.wordWrap ? 'pre-wrap' : 'pre';
    }

    /**
     * Inserts current time and date at cursor position
     * @private
     */
    insertTimeDate() {
        const now = new Date();
        const timeDate = now.toLocaleString();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        this.textarea.value = 
            this.textarea.value.substring(0, start) + 
            timeDate + 
            this.textarea.value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + timeDate.length;
        this.textarea.focus();
    }

    /**
     * Updates the window title based on current file and modification status
     * @private
     */
    updateTitle() {
        const fileName = this.currentPath ? 
            this.currentPath.split('\\').pop() : 
            'Untitled';
        const modified = this.isModified ? '*' : '';
        this.window.setTitle(`${fileName}${modified} - Notepad`);
    }

    /**
     * Creates a new empty file
     * @private
     */
    newFile() {
        if (!this.checkSave()) return;
        
        this.textarea.value = '';
        this.currentPath = null;
        this.isModified = false;
        this.updateTitle();
    }

    /**
     * Opens a file for editing
     * @private
     */
    async openFile() {
        if (!this.checkSave()) return;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt';

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                this.textarea.value = text;
                this.currentPath = file.name;
                this.isModified = false;
                this.updateTitle();
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Error reading file');
            }
        });

        fileInput.click();
    }

    /**
     * Saves the current file
     * @private
     */
    saveFile() {
        if (!this.currentPath) {
            // Implement save dialog here
            return;
        }

        try {
            this.fs.createFile(this.currentPath, this.textarea.value);
            this.isModified = false;
            this.updateTitle();
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file');
        }
    }

    /**
     * Opens save dialog using File Explorer
     * @private
     */
    async saveFileAs() {
        // Start File Explorer in save mode
        const fileExplorer = this.desktopEnvironment.windowManager.startProcess('explorer', {
            mode: 'saveDialog',
            onSelect: (path) => {
                try {
                    this.fs.createFile(path, this.textarea.value);
                    this.currentPath = path;
                    this.isModified = false;
                    this.updateTitle();
                    fileExplorer.closeWindow();
                } catch (error) {
                    console.error('Error saving file:', error);
                }
            }
        });
    }

    /**
     * Executes a clipboard or edit command
     * @private
     * @param {string} command - The command to execute
     */
    async execCommand(command) {
        try {
            switch (command) {
                case 'cut':
                    await this.cutText();
                    break;
                case 'copy':
                    await this.copyText();
                    break;
                case 'paste':
                    await this.pasteText();
                    break;
                case 'delete':
                    this.deleteText();
                    break;
                case 'selectAll':
                    this.textarea.select();
                    break;
            }
        } catch (err) {
            console.error('Clipboard operation failed:', err);
            alert('The requested operation could not be completed.');
        }
    }

    /**
     * Copies the selected text to clipboard
     * @private
     */
    async copyText() {
        const selectedText = this.getSelectedText();
        if (selectedText) {
            await navigator.clipboard.writeText(selectedText);
        }
    }

    /**
     * Cuts the selected text to clipboard
     * @private
     */
    async cutText() {
        const selectedText = this.getSelectedText();
        if (selectedText) {
            await navigator.clipboard.writeText(selectedText);
            this.replaceSelection('');
        }
    }

    /**
     * Pastes text from clipboard
     * @private
     */
    async pasteText() {
        const text = await navigator.clipboard.readText();
        this.replaceSelection(text);
    }

    /**
     * Deletes the selected text
     * @private
     */
    deleteText() {
        this.replaceSelection('');
    }

    /**
     * Gets the currently selected text
     * @private
     * @returns {string} The selected text
     */
    getSelectedText() {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        return this.textarea.value.substring(start, end);
    }

    /**
     * Replaces the current selection with new text
     * @private
     * @param {string} newText - Text to insert
     */
    replaceSelection(newText) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const text = this.textarea.value;
        
        this.textarea.value = text.substring(0, start) + newText + text.substring(end);
        
        // Place cursor after inserted text
        const newCursorPos = start + newText.length;
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);
        
        // Mark as modified
        if (!this.isModified) {
            this.isModified = true;
            this.updateTitle();
        }
    }

    /**
     * Checks if there are unsaved changes and prompts user to save
     * @returns {boolean} True if it's safe to proceed, false if operation should be cancelled
     * @private
     */
    checkSave() {
        if (this.isModified) {
            const response = confirm('Do you want to save changes?');
            if (response === null) return false;
            if (response) {
                this.saveFile();
            }
        }
        return true;
    }

    /**
     * Applies current font settings to the textarea
     * @private
     */
    applyFontSettings() {
        this.textarea.style.fontFamily = this.fontSettings.family;
        this.textarea.style.fontSize = `${this.fontSettings.size}px`;
    }

    /**
     * Finds the next occurrence of the search text
     * @private
     * @param {string} searchText - Text to find
     * @param {boolean} matchCase - Whether to match case
     * @param {boolean} wrapAround - Whether to wrap around to the beginning
     */
    findNext(searchText, matchCase, wrapAround = true) {
        if (!searchText) return;

        const text = this.textarea.value;
        const currentPos = this.textarea.selectionEnd;
        
        let searchFrom = currentPos;
        let content = text;
        let search = searchText;
        
        if (!matchCase) {
            content = content.toLowerCase();
            search = search.toLowerCase();
        }

        let foundPos = content.indexOf(search, searchFrom);
        
        if (foundPos === -1 && wrapAround) {
            foundPos = content.indexOf(search, 0);
        }

        if (foundPos !== -1) {
            this.textarea.setSelectionRange(foundPos, foundPos + searchText.length);
            this.textarea.focus();
        } else {
            alert('Cannot find "' + searchText + '"');
        }
    }

    /**
     * Replaces the current selection with new text
     * @private
     * @param {string} findText - Text to find
     * @param {string} replaceText - Text to replace with
     * @param {boolean} matchCase - Whether to match case
     */
    replace(findText, replaceText, matchCase) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const selection = this.textarea.value.substring(start, end);
        
        let matches = false;
        if (matchCase) {
            matches = selection === findText;
        } else {
            matches = selection.toLowerCase() === findText.toLowerCase();
        }

        if (matches) {
            this.textarea.setRangeText(replaceText);
            this.textarea.setSelectionRange(start + replaceText.length, start + replaceText.length);
        }
        
        this.findNext(findText, matchCase);
    }

    /**
     * Replaces all occurrences of the search text
     * @private
     * @param {string} findText - Text to find
     * @param {string} replaceText - Text to replace with
     * @param {boolean} matchCase - Whether to match case
     */
    replaceAll(findText, replaceText, matchCase) {
        let content = this.textarea.value;
        let search = findText;
        let count = 0;

        if (!matchCase) {
            content = content.replace(new RegExp(search, 'gi'), () => {
                count++;
                return replaceText;
            });
        } else {
            content = content.replace(new RegExp(search, 'g'), () => {
                count++;
                return replaceText;
            });
        }

        this.textarea.value = content;
        alert(`Replaced ${count} occurrences`);
    }

    /**
     * Goes to the specified line number
     * @private
     * @param {number} lineNumber - Line number to go to
     */
    goToLine(lineNumber) {
        const lines = this.textarea.value.split('\n');
        let position = 0;
        
        for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
            position += lines[i].length + 1;
        }

        this.textarea.setSelectionRange(position, position);
        this.textarea.focus();
    }

    /**
     * Loads a file from the virtual filesystem
     * @param {string} path - Full path to the file
     * @private
     */
    loadFile(path) {
        try {
            const content = this.fs.readFile(path);
            this.textarea.value = content;
            this.currentPath = path;
            this.isModified = false;
            this.updateTitle();
        } catch (error) {
            console.error('Error loading file:', error);
            alert('Error loading file');
        }
    }
}

const stylesheet = `

:root {
display: flex;
flex-direction: column;
background: transparent;
border: 0;
padding: 0;
}

textarea {
--padding: 5px;
box-sizing: border-box;
border: 2px inset #bbb;
width: 100%;
resize: none;
padding: var(--padding);
outline: none;
overflow: scroll;
font-family: monospace;
font-size: 14px;
flex-grow: 1;
}


.notepad-statusbar {
flex-shrink: 0;
display: grid;
grid-template-columns: 1fr auto;
}

.notepad-statusbar > div {
padding: 2px 5px;
border: 1px solid;
border-color: var(--inset-border-color);
}

.notepad-dialog {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--window-background-color);
    border: 2px outset var(--border-color);
    min-width: 300px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
    z-index: 100;
}

.notepad-dialog-titlebar {
    background: var(--active-titlebar-background-color);
    color: var(--active-titlebar-color);
    padding: 3px 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
}

.notepad-dialog-close {
    width: 16px;
    height: 16px;
    background: var(--window-background-color);
    border: 1px outset var(--border-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.notepad-dialog-content {
    padding: 16px;
}

/* Common Dialog Elements */
.notepad-dialog-row {
    margin-bottom: 12px;
    display: flex;
    gap: 8px;
    align-items: center;
}

.notepad-dialog-row input[type="text"],
.notepad-dialog-row input[type="number"] {
    flex: 1;
    min-width: 200px;
    padding: 2px 4px;
    border: 1px inset var(--border-color);
}

.notepad-dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid var(--border-color);
    background: var(--window-background-color);
}

.notepad-dialog-buttons button {
    min-width: 75px;
    padding: 4px 8px;
    border: 2px outset var(--border-color);
    background: var(--window-background-color);
    color: var(--window-color);
    cursor: pointer;
}

.notepad-dialog-buttons button:active {
    border-style: inset;
}

/* Font Dialog Specific Styles */
.notepad-font-section {
    margin-bottom: 12px;
}

.notepad-font-section select {
    width: 200px;
    margin-top: 4px;
    border: 1px inset var(--border-color);
}

.notepad-font-preview {
    margin: 16px 0;
    padding: 8px;
    border: 1px inset var(--border-color);
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
}

/* About Dialog Specific Styles */
.notepad-about {
    width: 400px;
}

.notepad-about-content {
    text-align: center;
    padding: 20px;
    background: var(--window-background-color);
}

.notepad-about-logo {
    width: 32px;
    height: 32px;
    margin: 0 auto 16px;
}

.notepad-about-header {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
}

.notepad-about-version {
    margin-bottom: 4px;
    color: var(--window-color);
}

.notepad-about-copyright {
    margin-bottom: 16px;
    color: var(--window-color);
}

.notepad-about-description {
    text-align: left;
    margin-top: 16px;
    padding: 8px;
    border: 1px inset var(--border-color);
    background: white;
    color: var(--window-color);
    font-size: 12px;
    line-height: 1.4;
}

/* Find/Replace Dialog Specific Styles */
.notepad-find-replace {
    width: 350px;
}

.notepad-find-replace-options {
    display: flex;
    gap: 16px;
    margin: 12px 0;
}

.notepad-find-replace-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
}

.notepad-find-replace-checkbox input[type="checkbox"] {
    margin: 0;
}

/* Go To Dialog Specific Styles */
.notepad-goto {
    width: 300px;
}

.notepad-goto-input {
    width: 100%;
    padding: 2px 4px;
    border: 1px inset var(--border-color);
}

.save-dialog {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
}

.save-dialog-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}

.save-dialog-header input {
    flex: 1;
    height: 21px;
    border: 1px inset #fff;
    padding: 2px 4px;
    font-family: 'MS Sans Serif', sans-serif;
    font-size: 11px;
}

.save-dialog-explorer {
    flex: 1;
    border: 1px inset #fff;
    background: #fff;
    margin-bottom: 16px;
}

.save-dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

`;
