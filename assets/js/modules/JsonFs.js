const FIVE_MB = 5242880;

/**
 * A file system that stores data in local storage as a JSON object
 * @module JsonFs
 * @property {Object} data - The raw data stored in the file system
 */
export default class JsonFs {
    /**
     * Creates a new JsonFs instance
     * @throws {Error} If localStorage is not available
     */
    constructor() {
        console.log('[jsonfs] initializing file system');
        
        if (!this.isStorageAvailable()) {
            throw new Error('[jsonfs] localStorage is not available');
        }

        /** @type {Object} The raw data stored in the file system */
        this.data = {};
        this.sync();

        // Optional: Add auto-save functionality
        // this.startAutoSave();
    }

    /**
     * Checks if localStorage is available
     * @private
     * @returns {boolean}
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Starts auto-save functionality
     * @private
     */
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.save();
        }, 15000);
    }

    /**
     * Saves the data to local storage
     * @throws {Error} If save fails
     */
    save() {
        try {
            const jsonString = JSON.stringify(this.data);
            if (jsonString.length > FIVE_MB) { // 5MB limit
                throw new Error('Data exceeds localStorage size limit');
            }
            localStorage.setItem('jsonfs', jsonString);
        } catch (error) {
            console.error('[jsonfs] failed to save:', error);
            throw error;
        }
    }

    /**
     * Validates a path string
     * @private
     * @param {string} path - Path to validate
     * @throws {Error} If path is invalid
     */
    validatePath(path) {
        if (!path || typeof path !== 'string') {
            throw new Error('Invalid path: Path must be a non-empty string');
        }
        if (path.includes('..')) {
            throw new Error('Invalid path: Path cannot contain ".."');
        }
    }

    /**
     * Creates a directory
     * @param {string} path - The path to the directory
     * @throws {Error} If directory creation fails
     */
    createDirectory(path) {
        console.log('[jsonfs] Creating directory at:', path);
        this.validatePath(path);

        const pathParts = path.split('\\');
        
        // Handle drive letter
        if (!pathParts[0].includes(':')) {
            throw new Error('Path must include drive letter');
        }

        const drive = pathParts.shift(); // Remove and store drive letter (e.g., "C:")
        const newDirName = pathParts.pop(); // Get the new directory name
        
        // Start at the drive's root
        let currentObj = this.data[drive];
        if (!currentObj) {
            throw new Error(`Drive not found: ${drive}`);
        }

        // Traverse to the parent directory
        for (const part of pathParts) {
            const upperPart = part.toUpperCase();
            if (!currentObj[upperPart]) {
                currentObj[upperPart] = {};
            } else if (typeof currentObj[upperPart] !== 'object') {
                throw new Error(`Cannot create directory: ${part} is a file`);
            }
            currentObj = currentObj[upperPart];
        }

        // Create the new directory in the current location
        const upperDirName = newDirName.toUpperCase();
        if (currentObj[upperDirName]) {
            throw new Error(`Directory already exists: ${newDirName}`);
        }
        
        currentObj[upperDirName] = {};
        
        this.save();
        return currentObj[upperDirName];
    }

    /**
     * Creates a file
     * @param {string} path - The path to the file
     * @param {string} content - The content to write to the file
     * @throws {Error} If file creation fails
     */
    createFile(path, content) {
        console.log('[jsonfs] Creating file at:', path);
        this.validatePath(path);

        const pathParts = path.split('\\');
        const fileName = pathParts.pop();
        const drive = pathParts[0];
        
        // Navigate to the directory
        let currentDir = this.data[drive];
        for (let i = 1; i < pathParts.length; i++) {
            const part = pathParts[i].toUpperCase();
            if (!currentDir[part]) {
                throw new Error(`Directory not found: ${pathParts.slice(0, i + 1).join('\\')}`);
            }
            if (typeof currentDir[part] !== 'object') {
                throw new Error(`${part} is not a directory`);
            }
            currentDir = currentDir[part];
        }

        // Create the file
        currentDir[fileName.toUpperCase()] = content;
        this.save();
    }

    /**
     * Cleans up resources
     */
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }

    /**
     * Creates the default filesystem structure
     * @private
     */
    createDefaultFileSystem() {
        const defaultStructure = {
            'C:': {
                'WINDOWS': {
                    'SYSTEM32': {
                        'DRIVERS': {
                            'WIN95BROWSER.SYS': 'You are not permitted to view this file'
                        },
                        'CONFIG': {},
                        'SHELL': {},
                        'USER32': {},
                        'USER': {},
                        'WIN.INI': 'mode=browser\nsyscall=redirect-to-browser\ndxgi-calls=redirect-to-browser\n'
                    }
                },
                'SYSTEM': {},
                'PROGRAM FILES': {},
                'USERS': {
                    'DEFAULT': {
                        'DESKTOP': {},
                        'DOCUMENTS': {},
                    }
                },
                // This is obviously not real, just a fun easter egg
                'AUTOEXEC.BAT': `
                export PATH=C:\\WINDOWS\\SYSTEM32;C:\\SYSTEM\\
                export PROMPT=$P$G

                for %%F in (PROGRAMS -f *.COM) do @echo %%F >> AUTOEXEC.BAT

                start -S %SYSTEMROOT%\\DRIVERS\\WIN95BROWSER.SYS
                verify -Q win95browser --message Failed to load windows 95!

                # Run autoexec.bat
                start -U %SYSTEMROOT%\\AUTOEXEC.BAT

                # The system has now loaded, we need to initialize the desktop environment
                start -S %SYSTEMROOT%\\SHELL\\SHELL.EXE
                verify -Q shell --message Failed to load shell!

                shell -c "start desktopenv"
                `,
                'CONFIG.SYS': 'Binary contents cannot be displayed',
                'COMMAND.COM': '[SYSTEM]'
            }
        };

        this.data = defaultStructure;
        this.save();
    }

    /**
     * Synchronizes the file system with localStorage
     * @private
     * @throws {Error} If sync fails due to invalid data
     */
    sync() {
        try {
            const storedData = localStorage.getItem('jsonfs');
            
            if (!storedData) {
                // No existing data, initialize default filesystem
                this.createDefaultFileSystem();
                return;
            }

            // Parse and validate stored data
            const parsedData = JSON.parse(storedData);
            
            // Validate that parsed data is an object
            if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
                throw new Error('Invalid filesystem data structure');
            }

            // Validate directory structure
            for (const [path, content] of Object.entries(parsedData)) {
                // Validate path
                this.validatePath(path);
                
                // Validate directory/file content
                if (typeof content !== 'object' || Array.isArray(content)) {
                    throw new Error(`Invalid content at path: ${path}`);
                }
            }

            // All validation passed, update data
            this.data = parsedData;
            
        } catch (error) {
            console.error('[jsonfs] Failed to sync filesystem:', error);
            this.createDefaultFileSystem();
            this.save();
        }
    }

    /**
     * Reads a file from the filesystem
     * @param {string} absolutePath - The absolute path to the file
     * @returns {string} The contents of the file
     * @throws {Error} If the file doesn't exist or is a directory
     */
    readFile(absolutePath) {
        // Handle root directory case
        if (absolutePath.includes('\\')) {
            const pathParts = absolutePath.split('\\');
            const fileName = pathParts.pop().toUpperCase(); // Get and convert filename to uppercase
            const drive = pathParts.shift().toUpperCase(); // Get and store drive letter
            
            // Access the drive
            let currentDir = this.data[drive];
            if (!currentDir) {
                throw new Error(`Drive not found: ${drive}`);
            }

            // Traverse through directories
            for (const part of pathParts) {
                const upperPart = part.toUpperCase();
                currentDir = currentDir[upperPart];
                if (!currentDir) {
                    throw new Error(`Directory not found: ${part}`);
                }
                if (typeof currentDir !== 'object') {
                    throw new Error(`${part} is not a directory`);
                }
            }

            // Find the file in the final directory
            if (!(fileName in currentDir)) {
                throw new Error(`File not found: ${fileName}`);
            }

            const fileContent = currentDir[fileName];
            if (typeof fileContent === 'object') {
                throw new Error(`${fileName} is a directory`);
            }

            return fileContent;
        } else {
            throw new Error('Invalid path format');
        }
    }

    /**
     * Deletes a file from the file system
     * @param {string} path - Full path to the file
     * @throws {Error} If file doesn't exist or is a directory
     */
    deleteFile(path) {
        console.log('[jsonfs] Deleting file:', path);
        this.validatePath(path);

        const { parent, name } = this.getParentAndName(path);
        
        if (!parent[name]) {
            throw new Error('File not found');
        }
        
        if (typeof parent[name] === 'object') {
            throw new Error('Cannot delete directory as file');
        }
        
        delete parent[name];
        this.save();
    }

    /**
     * Deletes a directory and all its contents
     * @param {string} path - Full path to the directory
     * @throws {Error} If directory doesn't exist or is a file
     */
    deleteDirectory(path) {
        console.log('[jsonfs] Deleting directory:', path);
        this.validatePath(path);

        const { parent, name } = this.getParentAndName(path);
        
        if (!parent[name]) {
            throw new Error('Directory not found');
        }
        
        if (typeof parent[name] !== 'object') {
            throw new Error('Cannot delete file as directory');
        }
        
        delete parent[name];
        this.save();
    }

    /**
     * Gets the parent directory object and name for a path
     * @private
     * @param {string} path - Full path
     * @returns {{parent: Object, name: string}} Parent directory and item name
     */
    getParentAndName(path) {
        const parts = path.split('\\');
        const name = parts.pop();
        let parent = this.data[parts[0]]; // Start at drive root
        
        // Navigate to parent directory
        for (let i = 1; i < parts.length; i++) {
            parent = parent[parts[i]];
            if (!parent || typeof parent !== 'object') {
                throw new Error('Invalid path');
            }
        }
        
        return { parent, name };
    }

    /**
     * Checks if a file or directory exists
     * @param {string} path - Full path to the file or directory
     * @returns {boolean} True if the file or directory exists, false otherwise
     */
    exists(path) {
        this.validatePath(path);
        const { parent, name } = this.getParentAndName(path);
        return !!parent[name];
    }
}