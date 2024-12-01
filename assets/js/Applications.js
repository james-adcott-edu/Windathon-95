import { environment } from './Config.js';

import TestGame from './modules/apps/TestGame.js';
import Tetravex from './modules/apps/Tetravex.js';
import Paint from './modules/apps/Paint.js';
import Notepad from './modules/apps/Notepad.js';
import Terminal from './modules/apps/Terminal.js';
import Minesweeper from './modules/apps/Minesweeper.js';
import DesktopSettings from './modules/apps/DesktopSettings.js';
import Explorer from './modules/apps/FileExplorer.js';
import About from './modules/apps/About.js';
import Clock from './modules/apps/Clock.js';
import Calculator from './modules/apps/Calculator.js';
import WebBrowser from './modules/apps/WebBrowser.js';
/**
 * @typedef {Object} WindowArgs
 * @property {number} width - The initial width of the window
 * @property {number} height - The initial height of the window
 * @property {number} x - The initial x position of the window
 * @property {number} y - The initial y position of the window
 */

/**
 * @typedef {Object} Application
 * @property {string} id - Unique identifier for the application
 * @property {string} name - Display name of the application
 * @property {string} icon - Path to the application's icon image
 * @property {WindowArgs} windowArgs - Window configuration settings
 * @property {Object} [moduleArgs] - Optional arguments passed to the application module
 * @property {Function} module - The application's main module class
 */

/**
 * Array of available applications in the desktop environment
 * @type {Application[]}
 */
const Applications = [
    {
        id: 'about',
        name: 'About',
        icon: 'question.png',
        hideFromStartMenu: true,
        windowArgs: {
            x: 250,
            width: 630,
            height: 550,
        },
        module: About
    },
    {
        id: 'explorer',
        name: "File Explorer",
        icon: "explorer.webp",
        windowArgs: {
            width: 800,
            height: 600,
            x: 100,
            y: 100
        },
        module: Explorer
    },
    {
        id: 'terminal',
        name: "MS-DOS Prompt",
        icon: "msdos.png",
        windowArgs: {
            resizable: true,
            width: 640,
            height: 400,
            x: 100,
            y: 100
        },
        module: Terminal
    },
    {
        id: 'webbrowser',
        name: 'Web Browser',
        icon: 'webbrowser.png',
        windowArgs: {
            resizable: true,
        },
        module: WebBrowser
    },
    {
        id: 'desktopsettings',
        name: "Desktop Settings",
        icon: "displaysettings.png",
        windowArgs: {
            width: 400,
            height: 300,
            x: 300,
            y: 300
        },
        module: DesktopSettings
    },
    {
        id: 'notepad',
        name: "Notepad",
        icon: "notepad.png",
        windowArgs: {
            resizable: true,
            width: 600,
            height: 400,
            x: 120,
            y: 120
        },
        module: Notepad
    },
    {
        id: 'minesweeper',
        name: "Minesweeper",
        icon: "minesweeper.png",
        module: Minesweeper
    },
    {
        id: 'tetravex',
        name: "Tetravex",
        icon: "tetravex.png",
        module: Tetravex
    },
    {
        id: 'paint',
        name: "Paint",
        icon: "paint.webp",
        windowArgs: {
            resizable: true,
            width: 800,
            height: 600,
            x: 100,
            y: 100
        },
        module: Paint
    },
    {
        id: 'calculator',
        name: 'Calculator',
        icon: 'calculator.png',
        windowArgs: {
            width: 220,
            height: 160,
            resizable: false,
            x: 100,
            y: 100
        },
        module: Calculator
    },
    {
        id: 'clock',
        name: 'Clock',
        icon: 'clock.png',
        hideFromStartMenu: true,
        windowArgs: { 
            width: 300, 
            height: 250,
            resizable: false
        },
        module: Clock
    },
];

if (environment === 'development') {
    Applications.push({
        id: 'testgame',
        name: "Test Game",
        icon: "testgame.png",
        hideFromStartMenu: true,
        windowArgs: {
            width: 800,
            height: 600,
            x: 100,
            y: 100
        },
        module: TestGame
    });
}

export default Applications;
