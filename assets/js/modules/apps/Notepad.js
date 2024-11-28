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
        this.currentFile = null;
        this.isModified = false;

        this.window.addStylesheet(stylesheet);

        // Set up window
        this.window.setTitle('Untitled - Notepad');
        
        // Add font settings
        this.fontSettings = {
            family: 'Consolas',
            size: 14,
            wordWrap: true
        };

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
                'Print...': () => this.print()
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
     * Creates a base dialog window within the notepad window
     * @private
     * @param {string} title - Dialog title
     * @param {string} content - Dialog HTML content
     * @returns {HTMLElement} The dialog element
     */
    createDialog(title, content) {
        const existingDialog = this.windowContent.querySelector('.notepad-dialog');
        if (existingDialog) existingDialog.remove();

        const dialog = document.createElement('div');
        dialog.className = 'notepad-dialog';
        dialog.innerHTML = `
            <div class="dialog-titlebar">
                <div class="dialog-title">${title}</div>
                <button class="dialog-close">×</button>
            </div>
            <div class="dialog-content">
                ${content}
            </div>
        `;

        // Close button functionality
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
        });

        this.windowContent.appendChild(dialog);
        return dialog;
    }

    /**
     * Shows the find dialog
     * @private
     */
    showFindDialog() {
        const dialog = this.createDialog('Find', `
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
        `);

        const findInput = dialog.querySelector('.find-input');
        const matchCase = dialog.querySelector('.match-case');
        const wrapAround = dialog.querySelector('.wrap-around');
        
        findInput.value = this.lastSearch || '';
        findInput.select();
        findInput.focus();

        dialog.querySelector('.find-next').addEventListener('click', () => {
            this.lastSearch = findInput.value;
            this.findNext(findInput.value, matchCase.checked, wrapAround.checked);
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    /**
     * Shows the replace dialog
     * @private
     */
    showReplaceDialog() {
        const dialog = this.createDialog('Replace', `
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
        `);

        const findInput = dialog.querySelector('.find-input');
        const replaceInput = dialog.querySelector('.replace-input');
        const matchCase = dialog.querySelector('.match-case');

        findInput.value = this.lastSearch || '';
        findInput.select();
        findInput.focus();

        dialog.querySelector('.find-next').addEventListener('click', () => {
            this.lastSearch = findInput.value;
            this.findNext(findInput.value, matchCase.checked);
        });

        dialog.querySelector('.replace').addEventListener('click', () => {
            this.replace(findInput.value, replaceInput.value, matchCase.checked);
        });

        dialog.querySelector('.replace-all').addEventListener('click', () => {
            this.replaceAll(findInput.value, replaceInput.value, matchCase.checked);
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    /**
     * Shows the go to line dialog
     * @private
     */
    showGoToDialog() {
        const totalLines = this.textarea.value.split('\n').length;
        
        const dialog = this.createDialog('Go To Line', `
            <div class="dialog-row">
                <label>Line number (1-${totalLines}):</label>
                <input type="number" class="line-input" min="1" max="${totalLines}" />
            </div>
            <div class="dialog-buttons">
                <button class="go-to">Go To</button>
                <button class="cancel">Cancel</button>
            </div>
        `);

        const lineInput = dialog.querySelector('.line-input');
        lineInput.focus();

        dialog.querySelector('.go-to').addEventListener('click', () => {
            const lineNumber = parseInt(lineInput.value);
            if (lineNumber >= 1 && lineNumber <= totalLines) {
                this.goToLine(lineNumber);
                dialog.remove();
            } else {
                alert(`Please enter a number between 1 and ${totalLines}`);
            }
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    /**
     * Shows the font dialog
     * @private
     */
    showFontDialog() {
        const dialog = this.createDialog('Font', `
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
        `);

        const familySelect = dialog.querySelector('.font-family');
        const sizeSelect = dialog.querySelector('.font-size');
        const preview = dialog.querySelector('.font-preview');

        // Set current values
        familySelect.value = this.fontSettings.family;
        sizeSelect.value = this.fontSettings.size;

        // Preview handlers
        const updatePreview = () => {
            preview.style.fontFamily = familySelect.value;
            preview.style.fontSize = `${sizeSelect.value}px`;
        };
        
        familySelect.addEventListener('change', updatePreview);
        sizeSelect.addEventListener('change', updatePreview);
        updatePreview();

        dialog.querySelector('.ok-button').addEventListener('click', () => {
            this.fontSettings.family = familySelect.value;
            this.fontSettings.size = parseInt(sizeSelect.value);
            this.applyFontSettings();
            dialog.remove();
        });

        dialog.querySelector('.cancel-button').addEventListener('click', () => {
            dialog.remove();
        });
    }

    /**
     * Shows the about dialog
     * @private
     */
    showAbout() {
        const dialog = this.createDialog('About Notepad', `
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
        `);

        dialog.querySelector('.ok-button').addEventListener('click', () => {
            dialog.remove();
        });
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
        const fileName = this.currentFile ? this.currentFile.name : 'Untitled';
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
        this.currentFile = null;
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
                this.currentFile = file;
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
    async saveFile() {
        if (this.currentFile) {
            await this.saveContent(this.currentFile);
        } else {
            await this.saveFileAs();
        }
    }

    /**
     * Opens save dialog and saves file with new name
     * @private
     */
    async saveFileAs() {
        const suggestedName = this.currentFile ? this.currentFile.name : 'untitled.txt';
        const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{
                description: 'Text Files',
                accept: {'text/plain': ['.txt']},
            }],
        });

        await this.saveContent(handle);
    }

    /**
     * Saves content to a file
     * @private
     * @param {FileSystemFileHandle} handle - File handle to save to
     */
    async saveContent(handle) {
        try {
            const writable = await handle.createWritable();
            await writable.write(this.textarea.value);
            await writable.close();
            
            this.currentFile = handle;
            this.isModified = false;
            this.updateTitle();
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file');
        }
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
     * @private
     * @returns {boolean} True if it's safe to proceed, false if operation should be cancelled
     */
    checkSave() {
        if (this.isModified) {
            const response = confirm('Do you want to save changes?');
            if (response === null) return false;
            if (response) {
                this.saveFile();
                return false;
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


`;
