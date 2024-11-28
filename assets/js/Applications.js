import { environment } from './Config.js';

import TestGame from './modules/apps/TestGame.js';
import Tetravex from './modules/apps/Tetravex.js';
import Paint from './modules/apps/Paint.js';
import Notepad from './modules/apps/Notepad.js';
import Terminal from './modules/apps/Terminal.js';
import Minesweeper from './modules/apps/Minesweeper.js';
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
            width: 800,
            height: 600,
            x: 100,
            y: 100
        },
        module: Paint
    },
    {
        id: 'notepad',
        name: "Notepad",
        icon: "notepad.png",
        windowArgs: {
            width: 600,
            height: 400,
            x: 120,
            y: 120
        },
        module: Notepad
    },
    {
        id: 'terminal',
        name: "MS-DOS Prompt",
        icon: "terminal.svg",
        windowArgs: {
            width: 640,
            height: 400,
            x: 100,
            y: 100
        },
        module: Terminal
    },
    {
        id: 'minesweeper',
        name: "Minesweeper",
        icon: "minesweeper.png",
        module: Minesweeper
    }
];

if (environment === 'development') {
    Applications.push({
        id: 'testgame',
        name: "Test Game",
        icon: "testgame.png",
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
