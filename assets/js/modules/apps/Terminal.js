    import Applications from '../../Applications.js';

    /** @type {string} CSS styles for the Terminal */
    const stylesheet = `
    :root {
        background-color: #000;
        padding: 0;
    }

    .terminal {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        background-color: #000;
        color: #c0c0c0;
        font-family: 'DOS', 'Consolas', monospace;
        font-size: 16px;
        padding: 4px;
        overflow-y: auto;
        cursor: text;
        white-space: pre;
    }

    .terminal-output {
        margin: 0;
        padding: 0;
    }

    .terminal-input-line {
        position: relative;
        display: flex;
        align-items: flex-start;
        margin: 0;
        padding: 0;
    }

    .terminal-prompt {
        white-space: pre;
        margin: 0;
        padding: 0;
    }

    .terminal-input {
        white-space: pre;
        margin: 0;
        padding: 0;
    }

    .terminal-cursor {
        position: absolute;
        margin: 0;
        padding: 0;
    }
    `;

    /**
     * Creates and manages a Windows 95-style command prompt terminal
     * @class
     */
    export default class Terminal {
        /**
         * Creates a new Terminal instance
         * @constructor
         * @param {import('../../WindowManager.js').WindowObject} windowObject - The window instance containing this terminal
         * @param {HTMLElement} windowContent - The content container element for the terminal
         * @param {Object} args - Configuration arguments
         * @param {import('../DesktopEnvironment.js').default} args.desktopEnvironment - Reference to the desktop environment
         */
        constructor(windowObject, windowContent, args) {
            /** @type {import('../../WindowManager.js').WindowObject} */
            this.window = windowObject;
            /** @type {HTMLElement} */
            this.windowContent = windowContent;
            this.args = args;

            // Terminal state
            /** @type {string} Current directory display */
            this.currentDirectory = 'C:\\>';
            /** @type {string[]} Command history */
            this.commandHistory = [];
            /** @type {number} Current position in command history */
            this.historyIndex = -1;
            /** @type {string} Current input buffer */
            this.inputBuffer = '';
            /** @type {number} Current cursor position */
            this.cursorPosition = 0;

            // Set up window
            this.window.setTitle('MS-DOS Prompt');
            this.setupTerminal();

            // Set up close handler
            this.window.setCloseRequest(() => {
                if (confirm('Terminate batch job (Y/N)?')) {
                    this.window.closeWindow();
                }
            });

            // Add reference to desktop environment
            /** @type {import('../DesktopEnvironment.js').default} */
            this.desktopEnvironment = args.desktopEnvironment;
            
            // Add available applications map
            /** @type {Map<string, import('../../Applications.js').Application>} */
            this.availableApps = new Map(
                Applications.map(app => [app.name.toLowerCase().replace(/\s+/g, ''), app])
            );

            // Add terminal styles
            this.window.addStylesheet(stylesheet);

            /** @type {string} Current directory path */
            this.currentPath = 'C:';
            this.currentDirectory = `${this.currentPath}\\>`;
            
            /** @type {import('../JsonFs.js').default} */
            this.fs = args.desktopEnvironment.fileSystem;
        }

        /**
         * Sets up the terminal UI elements
         * @private
         */
        setupTerminal() {
            // Create terminal container
            this.terminal = document.createElement('div');
            this.terminal.className = 'terminal';
            
            // Create output display
            this.output = document.createElement('div');
            this.output.className = 'terminal-output';
            
            // Create input line
            this.inputLine = document.createElement('div');
            this.inputLine.className = 'terminal-input-line';
            
            // Create prompt span
            this.promptSpan = document.createElement('span');
            this.promptSpan.className = 'terminal-prompt';
            this.promptSpan.textContent = this.currentDirectory;
            
            // Create input span
            this.inputSpan = document.createElement('span');
            this.inputSpan.className = 'terminal-input';
            
            // Create cursor
            this.cursor = document.createElement('span');
            this.cursor.className = 'terminal-cursor';
            this.cursor.textContent = '█';
            
            // Assemble the terminal
            this.inputLine.appendChild(this.promptSpan);
            this.inputLine.appendChild(this.inputSpan);
            this.inputLine.appendChild(this.cursor);
            this.terminal.appendChild(this.output);
            this.terminal.appendChild(this.inputLine);
            this.windowContent.appendChild(this.terminal);

            // Show welcome message
            this.writeOutput(`Microsoft(R) Windows 95
    (C)Copyright Microsoft Corp 1981-1995.

    `);

            // Set up event listeners
            this.setupEventListeners();
            this.startCursorBlink();
        }

        /**
         * Sets up event listeners for keyboard input
         * @private
         */
        setupEventListeners() {
            document.addEventListener('keydown', this.handleKeyDown = (e) => {
                if (!this.window.hasFocus) return;
                
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.executeCommand();
                        break;
                    case 'Backspace':
                        e.preventDefault();
                        this.handleBackspace();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        this.navigateHistory(-1);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.navigateHistory(1);
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.moveCursor(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.moveCursor(1);
                        break;
                    default:
                        if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
                            e.preventDefault();
                            this.handleInput(e.key);
                        }
                }
            });

            // Handle focus
            this.terminal.addEventListener('click', () => {
                if (this.window.setFocus) {
                    this.window.setFocus();
                }
            });
        }

        /**
         * Starts the cursor blinking animation
         * @private
         */
        startCursorBlink() {
            this.cursorInterval = setInterval(() => {
                this.cursor.style.visibility = 
                    this.cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
            }, 530); // Classic DOS cursor blink rate
        }

        /**
         * Handles input of a single character
         * @private
         * @param {string} char - The character to handle
         */
        handleInput(char) {
            this.inputBuffer = 
                this.inputBuffer.slice(0, this.cursorPosition) +
                char +
                this.inputBuffer.slice(this.cursorPosition);
            this.cursorPosition++;
            this.updateInputDisplay();
        }

        handleBackspace() {
            if (this.cursorPosition > 0) {
                this.inputBuffer = 
                    this.inputBuffer.slice(0, this.cursorPosition - 1) +
                    this.inputBuffer.slice(this.cursorPosition);
                this.cursorPosition--;
                this.updateInputDisplay();
            }
        }

        moveCursor(direction) {
            const newPos = this.cursorPosition + direction;
            if (newPos >= 0 && newPos <= this.inputBuffer.length) {
                this.cursorPosition = newPos;
                this.updateInputDisplay();
            }
        }

        updateInputDisplay() {
            this.inputSpan.textContent = this.inputBuffer;
            // Position cursor
            const beforeCursor = this.inputBuffer.slice(0, this.cursorPosition);
            const tempSpan = document.createElement('span');
            tempSpan.textContent = beforeCursor;
            tempSpan.style.visibility = 'hidden';
            this.inputLine.appendChild(tempSpan);
            const offset = tempSpan.offsetWidth;
            this.inputLine.removeChild(tempSpan);
            this.cursor.style.left = `${this.promptSpan.offsetWidth + offset}px`;
        }

        navigateHistory(direction) {
            if (this.commandHistory.length === 0) return;
            
            this.historyIndex += direction;
            
            if (this.historyIndex >= this.commandHistory.length) {
                this.historyIndex = this.commandHistory.length - 1;
            } else if (this.historyIndex < 0) {
                this.historyIndex = 0;
            }
            
            this.inputBuffer = this.commandHistory[this.historyIndex];
            this.cursorPosition = this.inputBuffer.length;
            this.updateInputDisplay();
        }

        /**
         * Writes output to the terminal
         * @private
         * @param {string} text - Text to output
         */
        writeOutput(text) {
            const line = document.createElement('div');
            line.textContent = text;
            this.output.appendChild(line);
            this.terminal.scrollTop = this.terminal.scrollHeight;
        }

        /**
         * Executes the current command in the input buffer
         * @private
         */
        executeCommand() {
            const fullLine = this.currentDirectory + this.inputBuffer;
            this.writeOutput(fullLine);
            
            if (this.inputBuffer.trim()) {
                this.commandHistory.push(this.inputBuffer);
                this.historyIndex = this.commandHistory.length;
                this.processCommand(this.inputBuffer.trim());
            } else {
                this.writeOutput('');  // Empty line for empty command
            }
            
            this.inputBuffer = '';
            this.cursorPosition = 0;
            this.updateInputDisplay();
        }

        /**
         * Processes a command entered by the user
         * @private
         * @param {string} commandLine - The command to process
         */
        processCommand(commandLine) {
            // Parse command line with quotes support
            const args = this.parseCommandLine(commandLine);
            if (args.length === 0) return;

            const cmd = args[0].toLowerCase();
            const cmdArgs = args.slice(1);
            
            switch (cmd) {
                case 'cd':
                    this.changeDirectory(cmdArgs[0]);
                    break;

                case 'cls':
                    this.output.innerHTML = '';
                    break;

                case 'dir':
                    this.listDirectory();
                    break;

                case 'help':
                    this.writeOutput(
    `Available commands:
            CLS      - Clear screen
            DIR      - List directory contents
            CD       - Display/change current directory
            MD       - Create a directory
            MKDIR    - Create a directory
            TYPE     - Display contents of a text file
            HELP     - Show this help
            VER      - Show version
            EXIT     - Exit to Windows
            START    - Start a program
            TASKLIST - List running programs
            TASKKILL - Close a running program
            PROGRAMS - List available programs

    Examples:
            CD ..           - Go up one directory
            CD WINDOWS      - Change to WINDOWS directory
            DIR            - List files in current directory
            TYPE CONFIG.SYS - Display contents of CONFIG.SYS
            MD TEST        - Create directory named TEST
            START notepad
            START paint
            TASKKILL notepad`
                    );
                    break;

                case 'ver':
                    this.writeOutput(`Microsoft(R) Windows 95
    (C)Copyright Microsoft Corp 1981-1995.`);
                    break;

                case 'start':
                    if (cmdArgs.length === 0) {
                        this.writeOutput('ERROR: Please specify a program name');
                        break;
                    }
                    this.startProgram(cmdArgs[0], cmdArgs.slice(1));
                    break;

                case 'tasklist':
                    this.showRunningTasks();
                    break;

                case 'taskkill':
                    if (cmdArgs.length === 0) {
                        this.writeOutput('ERROR: Please specify a program name');
                        break;
                    }
                    this.killTask(cmdArgs[0]);
                    break;

                case 'programs':
                    this.listAvailablePrograms();
                    break;

                case 'exit':
                    this.window.closeWindow();
                    break;

                case 'type':
                    this.typeFile(cmdArgs[0]);
                    break;

                case 'md':
                case 'mkdir':
                    this.makeDirectory(cmdArgs[0]);
                    break;

                // TODO: This doesn't work correctly.
                case 'copy':
                    if (cmdArgs[0]?.toLowerCase() === 'con') {
                        this.startFileCreation(cmdArgs[1]);
                    } else {
                        this.writeOutput('Syntax error');
                    }
                    break;

                case 'echo':
                    if (cmdArgs[0] === '.' && cmdArgs[1]?.startsWith('>')) {
                        const filename = cmdArgs[1].substring(1);
                        this.createEmptyFile(filename);
                    } else {
                        this.writeOutput(cmdArgs.join(' '));
                    }
                    break;

                default:
                    // Check if it's an executable in Program Files
                    const programPath = `C:\\PROGRAM FILES\\${cmd.toUpperCase()}`;
                    if (this.fs.data['C:']?.['PROGRAM FILES']?.[cmd.toUpperCase()]) {
                        this.writeOutput(`Executing ${cmd}...`);
                        // Start the program if it exists in our Applications list
                        const appName = cmd.toLowerCase().replace(/\s+/g, '');
                        const app = this.availableApps.get(appName);
                        if (app) {
                            this.startProgram(appName, cmdArgs);
                        } else {
                            this.writeOutput(`Error: ${cmd} is not a valid application`);
                        }
                    } else {
                        this.writeOutput('Bad command or file name');
                    }
                    break;
            }

            // Add new prompt after command execution
            this.writeOutput('');  // Empty line after command output
        }

        /**
         * Parses a command line string into an array of arguments, respecting quotes
         * @private
         * @param {string} commandLine - The command line to parse
         * @returns {string[]} Array of parsed arguments
         */
        parseCommandLine(commandLine) {
            const args = [];
            let currentArg = '';
            let inQuotes = false;
            
            for (let i = 0; i < commandLine.length; i++) {
                const char = commandLine[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                    continue;
                }
                
                if (char === ' ' && !inQuotes) {
                    if (currentArg) {
                        args.push(currentArg);
                        currentArg = '';
                    }
                } else {
                    currentArg += char;
                }
            }
            
            if (currentArg) {
                args.push(currentArg);
            }
            
            return args;
        }

        /**
         * Starts a program through the terminal with quoted arguments support
         * @private
         * @param {string} programName - Name of the program to start
         * @param {string[]} args - Arguments to pass to the program
         */
        startProgram(programName, args = []) {
            const appName = programName.toLowerCase().replace(/\s+/g, '');
            const app = this.availableApps.get(appName);
            
            if (app) {
                try {
                    this.writeOutput(`Starting ${app.name}...`);
                    if (this.desktopEnvironment && this.desktopEnvironment.windowManager) {
                        // Pass the parsed arguments to the program
                        this.desktopEnvironment.windowManager.start(
                            app.module,
                            { ...app.moduleArgs, terminalArgs: args },
                            app.windowArgs
                        );
                    } else {
                        throw new Error('Desktop environment not available');
                    }
                } catch (error) {
                    this.writeOutput(`ERROR: Failed to start ${app.name}`);
                    console.error(error);
                }
            } else {
                this.writeOutput(`Program not found: ${programName}`);
                this.writeOutput('Use PROGRAMS command to see available programs');
            }
        }

        /**
         * Shows list of running tasks
         * @private
         */
        showRunningTasks() {
            const windows = this.desktopEnvironment.windowManager.windows;
            
            this.writeOutput(
    `Image Name                     PID    Status
    ========================= ======== ============`
            );
            
            windows.forEach((window, index) => {
                const name = window.title.padEnd(25, ' ');
                const pid = String(index + 1).padStart(8, ' ');
                this.writeOutput(`${name} ${pid}    Running`);
            });
        }

        /**
         * Attempts to close a running program
         * @private
         * @param {string} programName - Name or ID of program to kill
         */
        killTask(programName) {
            const windows = this.desktopEnvironment.windowManager.windows;
            const id = parseInt(programName);
            
            let targetWindow;
            if (!isNaN(id) && id > 0 && id <= windows.length) {
                targetWindow = windows[id - 1];
            } else {
                targetWindow = windows.find(w => 
                    w.title.toLowerCase().includes(programName.toLowerCase())
                );
            }
            
            if (targetWindow) {
                targetWindow.closeWindow();
                this.writeOutput(`Terminated: ${targetWindow.title}`);
            } else {
                this.writeOutput(`No running program found: ${programName}`);
            }
        }

        /**
         * Lists all available programs
         * @private
         */
        listAvailablePrograms() {
            this.writeOutput(
    `Available Programs:
    ==================`
            );
            
            Applications.forEach(app => {
                this.writeOutput(app.name);
            });
        }

        /**
         * Changes the current directory
         * @private
         * @param {string} path - The path to change to
         */
        changeDirectory(path) {
            if (!path) {
                this.writeOutput(this.currentPath);
                return;
            }

            try {
                // Handle special cases
                if (path === '..') {
                    // Go up one directory
                    const parts = this.currentPath.split('\\');
                    if (parts.length > 1) {
                        parts.pop();
                        this.currentPath = parts.join('\\');
                        this.updatePrompt();
                    }
                    return;
                }

                // If path starts with drive letter, treat as absolute path
                if (path.includes(':')) {
                    if (this.fs.data[path]) {
                        this.currentPath = path;
                        this.updatePrompt();
                        return;
                    }
                } else {
                    // Relative path - combine with current path
                    const newPath = `${this.currentPath}\\${path}`;
                    const driveContents = this.fs.data[this.currentPath.split('\\')[0]];
                    
                    // Navigate through the path parts to check if directory exists
                    let current = driveContents;
                    const parts = newPath.split('\\').slice(1); // Skip drive letter
                    
                    for (const part of parts) {
                        // Handle case-insensitive comparison for "PROGRAM FILES"
                        const foundKey = Object.keys(current).find(
                            key => key.toLowerCase() === part.toLowerCase()
                        );
                        
                        if (!foundKey || typeof current[foundKey] !== 'object') {
                            throw new Error('Invalid directory');
                        }
                        current = current[foundKey];
                    }
                    
                    this.currentPath = newPath;
                    this.updatePrompt();
                    return;
                }

                throw new Error('Invalid directory');
            } catch (error) {
                this.writeOutput('Invalid directory');
            }
        }

        /**
         * Updates the command prompt to show current directory
         * @private
         */
        updatePrompt() {
            this.currentDirectory = `${this.currentPath}\\>`;
            this.promptSpan.textContent = this.currentDirectory;
        }

        /**
         * Lists contents of current directory
         * @private
         */
        listDirectory() {
            // Split the path to get drive and subdirectories
            const pathParts = this.currentPath.split('\\');
            const drive = pathParts[0];  // e.g., "C:"
            
            // Start at drive root
            let currentDir = this.fs.data[drive];
            
            // Navigate through subdirectories if they exist
            for (let i = 1; i < pathParts.length; i++) {
                currentDir = currentDir[pathParts[i]];
                if (!currentDir || typeof currentDir !== 'object') {
                    this.writeOutput(`Invalid path - ${this.currentPath}`);
                    return;
                }
            }
            
            this.writeOutput(
                ` Volume in drive C is WINDOWS95\n` +
                ` Volume Serial Number is 1337-1337\n` +
                ` Directory of ${this.currentPath}\n\n`
            );

            for (const [name, content] of Object.entries(currentDir)) {
                const isDirectory = typeof content === 'object';
                const type = isDirectory ? '<DIR>' : '     ';
                const size = isDirectory ? '         ' : String(content.length).padStart(9);
                const paddedName = name.padEnd(12, ' ');
                this.writeOutput(`${type}    ${paddedName}    ${size}`);
            }

            // Add summary line
            const files = Object.entries(currentDir);
            const fileCount = files.filter(([_, content]) => typeof content !== 'object').length;
            const dirCount = files.filter(([_, content]) => typeof content === 'object').length;
            const byteCount = files.reduce((acc, [_, content]) => 
                acc + (typeof content === 'object' ? 0 : content.length), 0);

            this.writeOutput(
                `\n     ${fileCount} File(s)    ${byteCount.toLocaleString()} bytes\n` +
                `     ${dirCount} Dir(s)     ${(512 * 1024 * 1024).toLocaleString()} bytes free`
            );
        }

        /**
         * Resolves a path (handles .. and .)
         * @private
         * @param {string} path - Path to resolve
         * @returns {string} Resolved path
         */
        resolvePath(path) {
            if (path.startsWith('\\')) {
                return 'C:' + path;
            }

            const parts = this.currentPath.split('\\');
            const newParts = path.split('\\');

            for (const part of newParts) {
                if (part === '..') {
                    if (parts.length > 1) parts.pop();
                } else if (part !== '.') {
                    parts.push(part);
                }
            }

            return parts.join('\\');
        }

        /**
         * Creates a new directory
         * @private
         * @param {string} path - Path of directory to create
         */
        makeDirectory(path) {
            if (!path) {
                this.writeOutput('Syntax error');
                return;
            }

            try {
                // If path doesn't start with a drive letter (C:), prepend current path
                const fullPath = path.includes(':') ? 
                    path : 
                    `${this.currentPath}\\${path}`;

                console.log('[terminal] Creating directory:', fullPath);
                this.fs.createDirectory(fullPath);
            } catch (error) {
                this.writeOutput(error.message);
            }
        }

        /**
         * Displays contents of a file
         * @private
         * @param {string} path - Path to file
         */
        typeFile(path) {
            if (!path) {
                this.writeOutput('Syntax error');
                return;
            }

            try {
                const fullPath = this.resolvePath(path);
                const content = this.fs.readFile(fullPath);
                this.writeOutput(content);
            } catch (error) {
                console.error('[terminal] Error reading file:', error);
                this.writeOutput(error.message);
            }
        }

        /**
         * Starts interactive file creation mode
         * @private
         * @param {string} filename - Name of file to create
         */
        startFileCreation(filename) {
            if (!filename) {
                this.writeOutput('File name must be specified');
                return;
            }

            this.writeOutput('Enter file contents. Press Ctrl+Z and Enter to save.');
            this.fileCreationMode = true;
            this.fileCreationName = filename;
            this.fileCreationContent = [];
        }

        /**
         * Creates an empty file
         * @private
         * @param {string} filename - Name of file to create
         */
        createEmptyFile(filename) {
            if (!filename) {
                this.writeOutput('File name must be specified');
                return;
            }

            try {
                const fullPath = `${this.currentPath}\\${filename}`;
                this.fs.createFile(fullPath, '');
                this.writeOutput(`        1 file(s) created`);
            } catch (error) {
                this.writeOutput(error.message);
            }
        }

        /**
         * Handles keydown events
         * @private
         * @param {KeyboardEvent} e - The keyboard event
         */
        handleKeyDown(e) {
            if (!this.window.hasFocus) return;
            
            // Handle file creation mode
            if (this.fileCreationMode) {
                if (e.ctrlKey && e.key === 'z') {
                    e.preventDefault();
                    const content = this.fileCreationContent.join('\n');
                    const fullPath = `${this.currentPath}\\${this.fileCreationName}`;
                    try {
                        this.fs.createFile(fullPath, content);
                        this.writeOutput('^Z');
                        this.writeOutput(`        1 file(s) copied`);
                    } catch (error) {
                        this.writeOutput(error.message);
                    }
                    this.fileCreationMode = false;
                    this.fileCreationContent = [];
                    return;
                }
                
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.fileCreationContent.push(this.inputBuffer);
                    this.writeOutput(this.currentDirectory + this.inputBuffer);
                    this.inputBuffer = '';
                    this.cursorPosition = 0;
                    this.updateInputDisplay();
                    return;
                }
            }

            // ... existing keyboard handling code ...
        }
    } 
