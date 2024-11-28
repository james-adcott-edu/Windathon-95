# Windows 95 Web Clone

A faithful recreation of the Windows 95 operating system in vanilla JavaScript, running entirely in the browser.

![Screenshot of the Windows 95 Web Clone](./assets/images/screenshot.png)

## 🚀 Features

- Classic Windows 95 UI with working windows, taskbar, and start menu
- Multiple built-in applications:
  - Notepad (with full text editing capabilities)
  - MS-DOS Prompt (command-line interface)
  - Minesweeper
  - Paint
  - Tetravex
- Draggable and resizable windows
- File system simulation using localStorage
- Authentic Windows 95 styling and interactions

### Site Goals
- Provide a faithful recreation of the Windows 95 experience
- Offer a nostalgic and educational tool for users interested in retro operating systems
- Ensure accessibility and ease of use for all users

### Design Choices
- Classic Windows 95 styling for authenticity
- Intuitive and familiar interface for easy navigation
- Responsive design to accommodate various screen sizes

### User Stories
- As a user, I want to explore the Windows 95 interface to relive nostalgia.
- As a new user, I want to easily navigate the system and access applications.
- As a developer, I want to understand the architecture of a web-based OS simulation.
- As a user, I want to save and load files using the simulated file system.

### Wireframes
- Initial wireframes were created to map out the desktop layout, taskbar, and application windows.
- Iterative design process to refine the user interface based on feedback.

### Additional Information
- The design process focused on balancing authenticity with modern web standards.
- User feedback was incorporated to improve usability and functionality.

## 🛠️ Technical Details

### Core Components

- **Desktop Environment**: Main orchestrator managing the OS simulation
- **File System**: Virtual file system using localStorage
- **Window Manager**: Handles window creation, movement, and resizing
- **Application Framework**: Base class for all applications, providing common functionality
- **Config**: Simple configuration file to account for different environments.

#### Desktop Environment

This is the main component that orchestrates the desktop environment. It manages the taskbar, start menu, and the overall layout of the desktop. It's essentially a monolithic class that handles all the interactions and updates the DOM accordingly.

#### File System (jsonfs)

This is a simple file system that uses localStorage to store the file data. It's a basic implementation of a file system and is not a full-fledged file system like the one in Windows 95. It's just a simple way to simulate a file system in the browser.

This allows us to integrate the file system into the applications that we build. Creating true saving functionality, and the ability to load previous states of applications.

#### Window Manager

This is the component that handles the windows that are created. It allows us to create, move, and resize windows. It also handles the z-index of the windows, so that windows can be brought to the front by the user.

#### Application Framework

This is the base class for all applications. It provides ways to accept arguments, interact with the desktop environment, and provides a base class for all applications to build upon.

## 💻 Applications

### Notepad
- Full text editing capabilities
- File operations (New, Open, Save, Save As)
- Find/Replace functionality
- Word wrap and font settings

### MS-DOS Prompt
- Command-line interface
- Basic DOS commands
- File system navigation
- File operations

### Minesweeper
- Classic Windows 95 Minesweeper game
- Multiple difficulty levels
- Timer and mine counter

## 📦 Deployment

### GitHub Pages Deployment

1. Fork this repository
2. Go to your fork's Settings > Pages
3. Set the source branch to `main`
4. Set the folder to `/ (root)`
5. Save your changes
6. Your site will be available at `https://[your-username].github.io/windows95-clone/`

### Traditional Web Server Deployment

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/windows95-clone.git
```

2. Deploy using a local development server:
```bash
# Using Python
python -m http.server 8000
```

3. For production deployment:
   - Minify the files, remove comments, and other non-essential content
   - Upload the files to your web hosting service
   - Ensure all files maintain their directory structure
   - Configure your web server to serve `index.html` as the default page

### Requirements

- The application requires no build process or dependencies
- All assets must maintain their relative paths
- Web server must support:
  - Serving static files
  - JavaScript modules (ES6)
  - Local Storage API

### Cross-Origin Considerations

If deploying to a custom domain:
1. Ensure all resource paths are relative
2. Update `web_root` in `assets/js/Config.js` if necessary
3. Configure CORS headers if serving assets from a different domain

### Troubleshooting

- If images don't load, check the `web_root` configuration
- If storage doesn't work, ensure localStorage is enabled
- For CORS issues, verify your server's security headers

## 🔧 Development

### Adding New Applications

1. Create a new application class in `assets/js/modules/apps/`
2. Register the application in `Applications.js`
3. Add corresponding icon in `assets/images/`

Example application structure:

```
export default class NewApp {
    constructor(windowObject, windowContent, args) {
        this.window = windowObject;
        this.windowContent = windowContent;
        this.args = args;

        this.window.setTitle('My New App');
        this.setupUI();
    }

    setupUI() {
        // Application-specific UI setup
    }
}
```

## 🧪 Testing

### Manual Testing
- Each application has been thoroughly tested for functionality and user interaction
- Window management system tested for proper focus handling, dragging, and resizing
- Start menu and taskbar interactions verified across different scenarios
- File system operations tested for data persistence and proper error handling

### Responsive Testing
- Interface tested across multiple screen sizes and resolutions
- Window positioning and sizing adjusts appropriately to viewport
- Touch input support verified on mobile devices

### User Story Testing
| User Story | Test | Result |
|------------|------|---------|
| As a user, I want to explore the Windows 95 interface | Tested navigation through start menu, desktop icons, and windows | ✅ Pass |
| As a user, I want to save and load files | Tested file operations in Notepad and other applications | ✅ Pass |
| As a developer, I want to understand the architecture | Reviewed code organization and documentation | ✅ Pass |

### Validation Testing
- JavaScript code linted using ESLint
- CSS validated using W3C CSS Validator
- HTML validated using W3C Markup Validator

### Known Bugs
- Window maximize behavior may be inconsistent on some screen sizes
- Some keyboard shortcuts may conflict with browser defaults
- File system has limited storage capacity due to localStorage limitations

### Fixed Bugs
- Resolved window focus issues when multiple windows are open
- Fixed taskbar button alignment on smaller screens
- Corrected file system path handling for case-sensitive operations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is intended for educational purposes only. Windows 95 is a trademark of Microsoft Corporation.

## 🙏 Acknowledgments

- Microsoft for the original Windows 95
- Contributors to the project
- The web development community for resources and inspiration
