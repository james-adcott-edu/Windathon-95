/**
 * StylesheetManager
 *
 * Manages a stylesheet for a window
 * @param {Window} windowObj - The window object
 * @param {string} stylesheet - The stylesheet to manage
 * @returns {StylesheetManager} - The StylesheetManager object
 */
export default class StylesheetManager {
    constructor(windowObj, stylesheet) {
        this.windowObj = windowObj;
        this.stylesheet = stylesheet;
        this.processedStylesheet = this.processStylesheet();
        this.sheet = document.createElement('style');
        this.sheet.innerHTML = this.processedStylesheet;
        this.addSheet();
    }
    
    processStylesheet() {
        let str = this.stylesheet;
        str = str.replace(/\/\*.*?\*\//g, ''); // remove comments
        str = str.replace(/(\r\n|\n)/g, ' '); // remove newlines
        str = str.replace(/\s+/g, ' '); // remove extra whitespace
        str = str.replace(/}/g, '} \n'); // add newline after }
        str = str.trim();
        str = str.replace(/^:root/gm, ''); // remove :root 
        str = str.replace(/^/gm, `#${this.windowObj.uuid} `); // add uuid to all selectors
        return str;
    }

    addRule() {
        // TODO
    }   
    
    addSheet() {
        document.head.appendChild(this.sheet);
    }

    removeSheet() {
        if (document.head.contains(this.sheet)) {
            document.head.removeChild(this.sheet);
        }
    }
}
