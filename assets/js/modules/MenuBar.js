/**
 * Creates and manages a window's menu bar with dropdown functionality
 * @class
 */
export default class MenuBar {
    /**
     * Creates a new MenuBar instance
     * @constructor
     * @param {import('./WindowObject.js').default} windowObj - The window object that will contain this menu bar
     * @param {Object} menuObj - Menu configuration object containing menu items and their actions
     * @throws {Error} Throws if windowObj is not provided or menuObj is invalid
     */
    constructor(windowObj, menuObj) {
        if (!windowObj) {
            throw new Error('MenuBar requires a window object');
        }
        if (!menuObj || typeof menuObj !== 'object') {
            throw new Error('MenuBar requires a valid menu configuration object');
        }

        /** @type {import('./WindowObject.js').default} */
        this.windowObject = windowObj;
        /** @type {Object} */
        this.menu = menuObj;
        /** @type {Map<HTMLElement, function>} */
        this.menuItems = new Map(); // Track menu items and their handlers
        /** @type {HTMLElement|null} */
        this.activeSubmenu = null;
        
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        document.addEventListener('click', this.handleDocumentClick);
        
        this.render();
    }

    /**
     * Creates a submenu element
     * @private
     * @param {Object} submenuItems - The submenu configuration
     * @returns {HTMLElement} The submenu element
     */
    createSubmenu(submenuItems) {
        const submenu = document.createElement('div');
        submenu.classList.add('submenu');
        
        // Create container outside the menubar for the dropdown
        document.body.appendChild(submenu);
        
        Object.entries(submenuItems).forEach(([label, action]) => {
            const item = document.createElement('div');
            item.classList.add('submenu-item');
            item.innerText = label;
            
            if (typeof action === 'function') {
                const handler = (e) => {
                    e.stopPropagation();
                    this.closeAllSubmenus();
                    action();
                };
                item.addEventListener('click', handler);
                this.menuItems.set(item, handler);
            }
            
            submenu.appendChild(item);
        });

        return submenu;
    }

    /**
     * Closes all open submenus
     * @private
     */
    closeAllSubmenus() {
        this.activeSubmenu = null;
        document.querySelectorAll('.submenu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    /**
     * Handles clicks outside of menus
     * @private
     * @param {Event} event - The click event
     */
    handleDocumentClick(event) {
        if (!event.target.closest('.menu-item')) {
            this.closeAllSubmenus();
        }
    }

    /**
     * Creates a dropdown menu item
     * @private
     * @param {string} label - Menu item label
     * @param {Object|Function} value - Submenu object or click handler
     * @returns {HTMLElement} The menu item element
     */
    createMenuItem(label, value) {
        const menuItem = document.createElement('div');
        menuItem.classList.add('menu-item');
        
        const menuLabel = document.createElement('span');
        menuLabel.textContent = label;
        menuItem.appendChild(menuLabel);

        if (typeof value === 'object') {
            // Create dropdown container
            const dropdown = this.createDropdown(value);
            menuItem.appendChild(dropdown);

            // Toggle dropdown on click
            const toggleHandler = (e) => {
                e.stopPropagation();
                const isActive = menuItem.classList.contains('active');
                this.closeAllDropdowns();
                if (!isActive) {
                    menuItem.classList.add('active');
                }
            };
            menuItem.addEventListener('click', toggleHandler);
            this.menuItems.set(menuItem, toggleHandler);
        }

        return menuItem;
    }

    /**
     * Creates a dropdown menu
     * @private
     * @param {Object} items - Menu items configuration
     * @returns {HTMLElement} The dropdown element
     */
    createDropdown(items) {
        const dropdown = document.createElement('div');
        dropdown.classList.add('menu-dropdown');
        
        Object.entries(items).forEach(([subKey, subValue]) => {
            const subItem = document.createElement('div');
            subItem.classList.add('menu-dropdown-item');
            
            const label = document.createElement('span');
            label.textContent = subKey;
            subItem.appendChild(label);

            if (typeof subValue === 'object') {
                // Create nested dropdown
                subItem.classList.add('has-submenu');
                const submenu = this.createDropdown(subValue);
                subItem.appendChild(submenu);
                
                // Show submenu on hover
                subItem.addEventListener('mouseenter', () => {
                    const rect = subItem.getBoundingClientRect();
                    submenu.style.left = `${rect.width}px`;
                    submenu.style.top = '0';
                    submenu.classList.add('active');
                });
                
                subItem.addEventListener('mouseleave', (e) => {
                    if (!e.relatedTarget?.closest('.menu-dropdown')) {
                        submenu.classList.remove('active');
                    }
                });
            } else if (typeof subValue === 'function') {
                const handler = (e) => {
                    e.stopPropagation();
                    this.closeAllDropdowns();
                    subValue();
                };
                subItem.addEventListener('click', handler);
                this.menuItems.set(subItem, handler);
            }
            
            dropdown.appendChild(subItem);
        });

        return dropdown;
    }

    /**
     * Renders the menu bar and its items
     * @private
     */
    render() {
        this.menubarHTML = this.windowObject.windowElement.querySelector('.window-menubar');
        if (!this.menubarHTML) {
            throw new Error('Menu bar container not found');
        }

        // Clear existing menu items
        this.menubarHTML.innerHTML = '';
        this.menuItems.clear();

        // Create menu items
        Object.entries(this.menu).forEach(([key, value]) => {
            const menuItem = this.createMenuItem(key, value);
            this.menubarHTML.appendChild(menuItem);
        });
    }

    /**
     * Updates the menu configuration
     * @param {Object} newMenuObj - New menu configuration
     */
    updateMenu(newMenuObj) {
        if (!newMenuObj || typeof newMenuObj !== 'object') {
            throw new Error('Invalid menu configuration');
        }
        this.menu = newMenuObj;
        this.render();
    }

    /**
     * Cleans up resources and removes event listeners
     * @public
     */
    destroy() {
        // Remove document click handler
        document.removeEventListener('click', this.handleDocumentClick);

        // Remove all menu item event listeners
        this.menuItems.forEach((handler, element) => {
            element.removeEventListener('click', handler);
        });
        this.menuItems.clear();

        // Clear references
        this.menu = null;
        this.windowObject = null;
        this.menubarHTML = null;
        this.activeSubmenu = null;
    }

    /**
     * Positions the submenu below the menu item
     * @private
     * @param {HTMLElement} menuItem - The menu item
     * @param {HTMLElement} submenu - The submenu
     */
    positionSubmenu(menuItem, submenu) {
        const rect = menuItem.getBoundingClientRect();
        submenu.style.left = `${rect.left}px`;
        submenu.style.top = `${rect.bottom}px`;
    }

    /**
     * Closes all dropdowns
     * @private
     */
    closeAllDropdowns() {
        this.menubarHTML.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
    }
}
