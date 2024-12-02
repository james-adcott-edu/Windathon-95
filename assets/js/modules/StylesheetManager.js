/**
 * StylesheetManager
 *
 * Manages stylesheets for a window
 * @param {Window} windowObj - The window object
 * @returns {StylesheetManager} - The StylesheetManager object
 */
export default class StylesheetManager {
    constructor(windowObj) {
        /** @type {import('./WindowObject.js').default} */
        this.windowObj = windowObj;
        /** @type {Map<string, HTMLElement>} */
        this.sheets = new Map(); // Store multiple stylesheets
    }
    
    /**
     * Process the stylesheet by removing comments, newlines, extra whitespace, and adding a uuid to all selectors
     * @param {string} stylesheet - The stylesheet to process
     * @returns {string} - The processed stylesheet
     */
    processStylesheet(stylesheet) {
        let str = stylesheet;
        str = str.replace(/\/\*.*?\*\//g, ''); // remove comments
        str = str.replace(/(\r\n|\n)/g, ' '); // remove newlines
        str = str.replace(/\s+/g, ' '); // remove extra whitespace
        str = str.replace(/}/g, '} \n'); // add newline after }
        str = str.trim();
        str = str.replace(/^:root/gm, ''); // remove :root 
        str = str.replace(/^/gm, `#${this.windowObj.uuid} `); // add uuid to all selectors
        return str;
    }

    /**
     * Add a new stylesheet
     * @param {string} id - Unique identifier for this stylesheet
     * @param {string} stylesheet - The CSS to add
     */
    addSheet(id, stylesheet) {
        // Remove existing sheet with same ID if it exists
        this.removeSheet(id);
        
        const sheet = document.createElement('style');
        sheet.innerHTML = this.processStylesheet(stylesheet);
        this.sheets.set(id, sheet);
        document.head.appendChild(sheet);
    }

    /**
     * Remove a specific stylesheet by ID
     * @param {string} id - The stylesheet identifier to remove
     */
    removeSheet(id) {
        const sheet = this.sheets.get(id);
        if (sheet && document.head.contains(sheet)) {
            document.head.removeChild(sheet);
            this.sheets.delete(id);
        }
    }

    /**
     * Remove all stylesheets managed by this instance
     */
    removeAllSheets() {
        for (const [id, sheet] of this.sheets) {
            this.removeSheet(id);
        }
    }

    /**
     * Update an existing stylesheet
     * @param {string} id - The stylesheet identifier to update
     * @param {string} stylesheet - The new CSS content
     */
    updateSheet(id, stylesheet) {
        if (this.sheets.has(id)) {
            this.addSheet(id, stylesheet);
        }
    }
}
