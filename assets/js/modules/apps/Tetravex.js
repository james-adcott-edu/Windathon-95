import GameTimer from '../GameTimer.js';

// used to randomize the arrangement of the tiles
Array.prototype.shuffle = function() {
    let m = this.length, i;
    while (m) {
        i = (Math.random() * m--) >>> 0;
        [this[m], this[i]] = [this[i], this[m]]
    }
    return this;
}


/**
 * Tetravex class
 * @property {number} gameSize - the size of the game
 * @property {Tile[][]} solution - a 2d array of a solution to the game
 * @property {Tile[]} tiles - a flat array of the tiles in the game
 * @method init - initialize the game
 * @method generateSolution - generate a random solution for the game
 * @method makeTable - create a table element with the given id
 * @method createGameArea - create the game area with the solution table and the tiles table
 * @method checkWinCondition - check if the win condition is met
 * @method getTileById - get a tile by its id
 * @returns {Tetravex} - a new Tetravex object
 */
export default class Tetravex {
    constructor(windowObject, windowContent, args) {
        this.windowObject = windowObject;
        this.windowContent = windowContent;
        this.args = args;
        
        this.disableChecking = false; // don't check the win condition if providing the solution

        // default game size is 3x3
        this.gameSize = 3;

        this.windowObject.setTitle("Tetravex");
        this.windowObject.setCloseRequest( () => {
            // do something before closing
            if (this.timer) {
                this.timer.stop();
            }
            this.windowObject.closeWindow();
        });

        this.windowObject.setMenu({
            'Game': {
                'New': () => this.init(),
                'Show Solution': () => this.showSolution(),
                'Exit': () => this.windowObject.closeWindow(),
            },
            'Size': {
                '2x2': () => this.setGameSize(2),
                '3x3': () => this.setGameSize(3),
                '4x4': () => this.setGameSize(4),
                '5x5': () => this.setGameSize(5),
            },
        });

        this.windowObject.addStylesheet(stylesheet);

        this.init();
    }

    /**
     * Set the game size
     * @param {number} size - the size of the game
     * @returns {void}
     */
    setGameSize(size) {
        this.gameSize = size;
        this.init();
    }

    /**
     * Initialize the game
     * @returns {void}
     */
    init() {
        this.solution = [...Array(this.gameSize)].map(_=>Array(this.gameSize))
        this.tiles = [];
        this.generateSolution();
        if (this.timer) {
            this.timer.stop();
        }

        this.disableChecking = false;
        this.windowContent.classList.remove('game-off');
        
        // remove the game area if it exists and create a new one
        this.windowContent.querySelector('#game-area')?.remove();
        this.windowContent.appendChild(this.createGameArea());
        
        // draw the tiles in the table
        let inputCells = this.windowContent.querySelectorAll('#tiles td');
        this.tiles.shuffle().forEach((tile, i) => {
            inputCells[i].appendChild(tile.draw());
        });

        let gameArea = this.windowContent.querySelector('#game-area');
        this.windowObject.setSize(gameArea.offsetWidth, gameArea.offsetHeight);

        // make the tiles draggable
        const draggableTiles = this.windowContent.querySelectorAll('.tile');
        draggableTiles.forEach(draggable => {
            let offsetX, offsetY;
            draggable.addEventListener('mousedown', (e) => {
                if (this.disableChecking) return;
                if (e.button !== 0) return;
                draggable.style.position = 'absolute';
                draggable.classList.add('dragging');
                offsetX = e.clientX - draggable.offsetLeft;
                offsetY = e.clientY - draggable.offsetTop;
                this.windowContent.addEventListener('mousemove', onMouseMove);
                this.windowContent.addEventListener('mouseup', onMouseUp);
            });

            let onMouseMove = (e) => {
                let newLeft = e.clientX - offsetX;
                let newTop = e.clientY - offsetY;

                // prevent the tile from going outside the game area
                if (newLeft < 0) newLeft = 0;
                if (newTop < 0) newTop = 0;
                if (newLeft + draggable.offsetWidth > this.windowContent.offsetWidth) {
                    newLeft = this.windowContent.offsetWidth - draggable.offsetWidth;
                }
                if (newTop + draggable.offsetHeight > this.windowContent.offsetHeight) {
                    newTop = this.windowContent.offsetHeight - draggable.offsetHeight;
                }

                draggable.style.left = `${newLeft}px`;
                draggable.style.top = `${newTop}px`;
            }

            let onMouseUp = (e) => {
                this.windowContent.removeEventListener('mousemove', onMouseMove);
                this.windowContent.removeEventListener('mouseup', onMouseUp);
                draggable.classList.remove('dragging');
                snapToCell(e.clientX, e.clientY);
            }

            let snapToCell = (clientX, clientY) => {
                const cells = this.windowContent.getElementsByTagName('td');
                for (let cell of cells) {
                    const rect = cell.getBoundingClientRect();
                    if (clientX > rect.left && clientX < rect.right &&
                        clientY > rect.top && clientY < rect.bottom && cell.childNodes.length === 0) {

                        cell.appendChild(draggable);
                        draggable.style.position = 'relative';
                        draggable.style.left = 'auto';
                        draggable.style.top = 'auto';

                        this.checkWinCondition();
                        return;
                    }
                }
            }
        });

        this.timer = new GameTimer((time) => {
            this.windowObject.setTitle(`Tetravex - ${time}`);
        });
        this.timer.start();
    }

    
    gameOff() {
        this.timer.pause();
        this.disableChecking = true;
        this.windowContent.classList.add('game-off');
    }

    showSolution() {
        this.gameOff();

        const solutionRows = this.windowContent.querySelectorAll('#solutiontable tr');
        this.solution.forEach((row, i) => {
            row.forEach((cell, j) => {
                cell.element.style.position = 'absolute';
                cell.element.style.transition = 'all 1s';
                cell.element.style.left = cell.element.offsetLeft + 'px';
                cell.element.style.top = cell.element.offsetTop + 'px';
                cell.element.style.left = solutionRows[i].childNodes[j].offsetLeft + 2 + 'px';
                cell.element.style.top = solutionRows[i].childNodes[j].offsetTop + 2 + 'px';
                cell.element.classList.add('off');
                return;
            });
        });
    }

    /**
     * Generate a random solution for the game
     * The solution is a 2D array of Tile objects
     * Each tile has 4 values, one for each side
     * @returns {void}
     */
    generateSolution() {
        for (let i = 0; i < this.gameSize; i++) {
            for (let j = 0; j < this.gameSize; j++) {
                let newTile = new Tile();
                for (let k = 0; k < 4; k++) {
                    if (k === 0 && i > 0) {
                        // copy the bottom value of the tile above
                        newTile.values[k] = this.solution[i - 1][j].values[2];
                        continue;
                    }
                    if (k === 3 && j > 0) {
                        // copy the right value of the tile to the left
                        newTile.values[k] = this.solution[i][j - 1].values[1];
                        continue;
                    }
                    // generate a random value for the other sides
                    newTile.values[k] = Math.floor(Math.random() * 10);
                }
                this.solution[i][j] = newTile;
                this.tiles.push(newTile);
            }
        }
    }

    /**
     * Create a table element with the given id
     * @param {string} id - the id of the table
     * @returns {HTMLTableElement} - the table element
     */
    makeTable(id) {
        const table = document.createElement('table');
        table.id = id;
        this.solution.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                tr.appendChild(document.createElement('td'));
            });
            table.appendChild(tr);
        });
        return table;
    }

    /**
     * Create the game area with the solution table and the tiles table
     * @returns {HTMLDivElement} - the game area element
     */
    createGameArea() {
        const gameArea = document.createElement('div');
        gameArea.id = 'game-area';
        gameArea.appendChild(this.makeTable('solutiontable'));
        gameArea.appendChild(this.makeTable('tiles'));
        return gameArea;
    }

    /**
     * Check if the win condition is met
     * If all the tiles are in the correct position, the player wins
     * @returns {void}
     */
    checkWinCondition() {
        if (this.disableChecking) return;

        const rows = this.windowContent.querySelectorAll('#solutiontable tr');

        for (let i = 0; i < rows.length; i++) {
            let cells = rows[i].childNodes;
            for (let j = 0; j < cells.length; j++) {
                if (cells[j].childNodes.length === 0) {
                    return;
                }
                const tileId = cells[j].childNodes[0].id;
                const tile = this.getTileById(tileId);
                if (i > 0 && tile.values[0] !== this.getTileById(rows[i - 1].childNodes[j].childNodes[0].id).values[2]) {
                    return;
                }
                if (j > 0 && tile.values[3] !== this.getTileById(rows[i].childNodes[j - 1].childNodes[0].id).values[1]) {
                    return;
                }
            }
        }
        this.gameOff();
        const winDialog = this.windowObject.makeDialog(`
        <div style="text-align: center">
        <h1>You Win!</h1>
        <p>I'm not sure if that was a high score because I didn't time it, but well done!</p>
        <button id="new-game">New Game</button>
        </div>
        `);
        winDialog.getContent().querySelector('#new-game').addEventListener('click', () => {
            winDialog.close();
            this.init();
        });
        winDialog.render();
    }

    /**
     * Get a tile by its id
     * @param {string} id - the id of the tile
     * @returns {Tile} - the tile with the given id
     */
    getTileById(id) {
        return this.tiles.find(tile => tile.uuid === id);
    }
}

/**
 * Tile class
 * @property {number[]} values - an array of 4 values, one for each side of the tile
 * @property {string} uuid - a unique identifier for the tile
 * @property {HTMLDivElement} element - the div element representing the tile
 * @method draw - draw the tile
 * @returns {Tile} - a new Tile object
 */
class Tile {
    constructor() {
        this.values = [];
        this.uuid = 'tile-'+self.crypto.randomUUID();
        this.element = document.createElement('div');
        this.element.classList.add('tile');
        this.element.id = this.uuid;
    }
    draw() {
        this.element.innerHTML = ''
        this.values.forEach(v => {
            this.element.innerHTML += `<span>${v}</span>`;
        });
        return this.element;
    }
}


// Stylesheet for the Tetravex game

let stylesheet = `
:root {
    --tile-size: 80px;
    background-color: transparent;
    border: none;
}

.tile {
    width: var(--tile-size);
    height: var(--tile-size);
    outline: 1px solid black;
    background-color: #999;
    background-image: url(data:image/svg+xml;utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZlcnNpb249JzEuMScgcHJlc2VydmVBc3BlY3RSYXRpbz0nbm9uZScgdmlld0JveD0nMCAwIDEwIDEwJz48c3R5bGU+bGluZXtzdHJva2U6Z3JheTtzdHJva2Utd2lkdGg6NCV9PC9zdHlsZT48bGluZSB4MT0nMCcgeTE9JzAnIHgyPScxMDAlJyB5Mj0nMTAwJScvPjxsaW5lIHgxPScwJyB5MT0nMTAwJScgeDI9JzEwMCUnIHkyPScwJy8+PC9zdmc+);
    background-repeat:no-repeat;
    background-position:center center;
    background-size: 100% 100%, auto;
    position: relative;
    user-select: none;
    cursor: move;
}

.tile.off, .game-off .tile {
    cursor: default;
}

.dragging {
    z-index: 999;
}

.tile span {
    position: absolute;
    padding: 5px;
    font-weight: bold;
}

.tile span:nth-child(1) {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

.tile span:nth-child(2) {
    top: 50%;
    right: 0;
    transform: translateY(-50%);
}

.tile span:nth-child(3) {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
}

.tile span:nth-child(4) {
    top: 50%;
    left: 0;
    transform: translateY(-50%);
}

#game-area {
    display: inline-flex;
    flex-direction: row;
    gap: 20px;
}

table {
    border-spacing: 2px;
}

td {
    box-sizing: content-box;
    min-width: var(--tile-size);
    height: var(--tile-size);
    vertical-align: top;
}

#solutiontable td {
    background-color: #ddd;
}
`;
