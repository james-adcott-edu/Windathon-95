import GameTimer from '../GameTimer.js';

/**
 * Minesweeper
 * @param {Window} windowObject - The window object
 * @param {HTMLElement} windowContent - The window content element
 * @param {Object} args - Optional arguments
 */
export default class Minesweeper {
    constructor(windowObject, windowContent, args) {
        this.windowObject = windowObject;
        this.windowContent = windowContent;
        this.args = args;

        this.windowObject.setTitle('Minesweeper');
        this.windowObject.setCloseRequest(() => this.windowObject.closeWindow());

        this.windowObject.setMenu({
            'Game': {
                'New': () => this.reset(),
                'Exit': () => this.windowObject.closeWindow(),
            },
            //'Size': {
            //    '2x2': () => this.setGameSize(2),
            //    '3x3': () => this.setGameSize(3),
            //    '4x4': () => this.setGameSize(4),
            //    '5x5': () => this.setGameSize(5),
            //},
        });

        this.windowContent.innerHTML = `
        <div id="game-area">
            <table oncontextmenu="return false;" id="board"> </table>
            <div class="statusbar">
                <div id="minesleft"></div>
                <div id="timer"></div>
            </div>
        </div>
        `;

        // FIXME
        this.windowObject.setSize(22 * 32, 22 * 20 + 28);
        //this.windowObject.setSize(
        //    this.windowContent.querySelector('#game-area').offsetWidth,
        //    this.windowContent.querySelector('#game-area').offsetHeight
        //);


        this.windowObject.addStylesheet(css);

        this.gameSize = {
            rows: 20,
            cols: 32,
            mines: 99
        };

        this.timer = new GameTimer((time) => {
            this.printTime(time);
        });

        this.init();
    }

    setGameSize(rows, cols, mines) {
        this.gameSize = {rows, cols, mines};
        this.reset();
    }

    endGame(hasWon) {
        this.gameEnded = 1;
        this.timer.stop();
        let mineClass = 'flag';
        if (hasWon) {
            this.printRemaining(0);
            // TODO - Hi Scores
            //if (hiScore == undefined || timer.getTime() < hiScore.t) {
            //    let hiScores = JSON.parse(localStorage.getItem('hiscores')) || [];
            //    hiScores.push({x: cols, y: rows, m: mines, t: timer.getTime()});
            //    localStorage.setItem('hiscores', JSON.stringify(hiScores));
            //    $('#debug').innerHTML += JSON.stringify(hiScores);
            //} else {
            //    $('#debug').innerHTML += '\n Not Hi Score';
            //}
        } else {
            mineClass = 'mine';
            this.listFlags().forEach(f => { // check for incorrect flags
                if (this.mineLocations.findIndex(c => (c[1]==f[1] && c[0]==f[0])) == -1)
                    this.getCellByCoords(...f).classList.add('flag_error');
            });
        }

        this.mineLocations.forEach(m => this.getCellByCoords(...m).classList.add(mineClass));
    }

    generateBoard() {
        while (this.mineLocations.length < this.gameSize.mines) {
            let x = Math.floor(Math.random() * this.gameSize.cols);
            let y = Math.floor(Math.random() * this.gameSize.rows);
            if (this.hints[x][y] != -1) {
                this.hints[x][y] = -1;
                this.mineLocations.push([x, y]);
            }
        }
        this.generateHints();
    }

    generateHints() {
        this.mineLocations.forEach(m => {
            this.getAdjacentCells(...m).forEach(c => {
                if (this.hints[c[0]][c[1]] != -1) this.hints[c[0]][c[1]]++;
            });
        });
    }

    getAdjacentCells(x, y, wrap, relative, adjacent) {
        adjacent = adjacent || [[-1,-1], [-1,0], [-1, 1], [ 0,-1], [ 0, 1], [ 1,-1], [ 1,0], [ 1, 1]];
        if (wrap) return adjacent.map(c => this.wrapCoords([x,y], c));
        adjacent = adjacent.filter(i => (!(x==this.gameSize.cols-1 && i[0]==1) && !(x==0 && i[0]==-1) &&
            !(y==this.gameSize.rows-1 && i[1]==1) && !(y==0 && i[1]==-1)));
        if (relative) return adjacent;
        return adjacent.map(c => this.wrapCoords([x,y], c));
    }

    getCellByCoords(x, y) {
        return this.windowContent.querySelectorAll('#board tr')[y].childNodes[x];
    }

    goodStart(x, y, any) {
        let isSafe = (x, y) => this.hints[x][y]!=-1;
        if (this.hints[x][y]==0 || (any && isSafe(x,y))) {
            return;
        }
        let relAdj= this.getAdjacentCells(x,y,0,1);
        let rel = (() => {
            for (let c=0; c<this.gameSize.cols; c++) {
                for (let r=0; r<this.gameSize.rows; r++) {
                    if (isSafe(c, r)) {
                        if (any || this.getAdjacentCells(c,r,1,0,relAdj).every(a=>isSafe(...a)))
                            return [x-c, y-r];
                    }
                }
            }
        })();
        if (!rel) {
            if (!any) this.goodStart(x, y, 1);
            return;
        }
        this.hints = this.hints.map(h => h.fill(0));
        let newMineLocations = [];
        this.mineLocations.forEach(m => {
            let newCoords = this.wrapCoords(m, rel);
            newMineLocations.push(newCoords);
            this.hints[newCoords[0]][newCoords[1]] = -1;
        });
        this.mineLocations = newMineLocations;
        this.generateHints();
    }

    init() {
        this.hints = [...Array(this.gameSize.cols)].map(x => Array(this.gameSize.rows));
        this.flags = [...this.hints].map(x => Array(this.gameSize.rows));
        this.revealed = [...this.hints].map(x => Array(this.gameSize.rows));

        this.reset();
    }

    listFlags() {
        let f = [];
        for (let x=0; x<this.gameSize.cols; x++) {
            for (let y=0; y<this.gameSize.rows; y++) {
                if (this.flags[x][y]==1) f.push([x,y]);
            }
        }
        return f;
    }

    plantFlag(x, y) {
        if (this.gameEnded || this.revealed[x][y]) return;
        this.flags[x][y] ^= 1;
        this.getCellByCoords(x,y).classList.toggle('flag');
        this.minesRemaining = this.gameSize.mines - this.listFlags().length;
        this.printRemaining();
    }

    printRemaining(s) {
        if (s===undefined) s = this.minesRemaining;
        this.windowContent.querySelector('#minesleft').innerHTML = `Mines remaining: ${s}`;
    }

    printTime(t) {
        this.windowContent.querySelector('#timer').innerHTML = `Time: ${t}`;
    }

    quickClick(x, y) {
        if (!this.revealed[x][y]) return;
        let neighbours = this.getAdjacentCells(x, y);
        let flaggedNeighbours = neighbours.reduce((a,c)=>a+this.flags[c[0]][c[1]], 0);
        if (flaggedNeighbours >= this.hints[x][y]) neighbours.forEach(c => this.revealCell(...c) );
    }

    reset() {
        this.firstClick = 1;
        this.gameEnded = 0;
        this.cellsRemaining = this.gameSize.rows*this.gameSize.cols;
        this.minesRemaining = this.gameSize.mines;
        this.timer.stop();
        this.printTime(0);
        this.printRemaining(this.minesRemaining);
        this.mineLocations = [];
        [this.hints, this.flags, this.revealed].forEach(a => a.map(m => m.fill(0)));
        this.generateBoard();
        this.windowContent.querySelector('#board').innerHTML = ('<tr>'+'<td></td>'.repeat(this.gameSize.cols)+'</tr>').repeat(this.gameSize.rows);
        this.windowContent.querySelectorAll('#board td').forEach(cell => {
            cell.addEventListener('mousedown', e => {
                let x = e.currentTarget.cellIndex;
                let y = e.currentTarget.parentNode.rowIndex;
                if (e.which == 1) {
                    if (this.firstClick) {
                        this.goodStart(x, y);
                        this.timer.start();
                        this.firstClick = 0;
                    }
                    this.revealCell(x, y);
                }
                else if (e.which == 2) this.quickClick(x, y);
                else if (e.which == 3) this.plantFlag(x, y);
            });
            cell.addEventListener('dblclick', e => {
                let x = e.currentTarget.cellIndex;
                let y = e.currentTarget.parentNode.rowIndex;
                this.quickClick(x, y);
            });
        });
    }

    revealCell(x, y) {
        if (this.revealed[x][y] || this.flags[x][y] || this.gameEnded) return;
        let cell = this.getCellByCoords(x, y);
        let val = this.hints[x][y];
        if (val == -1) {
            this.endGame(0);
            cell.classList.add('hl');
            return;
        }
        this.revealed[x][y] = 1;
        cell.classList.add('revealed');
        this.cellsRemaining--;
        if (val > 0) {
            cell.innerText = val;
            cell.classList.add('r_'+val);
            if (this.cellsRemaining == this.gameSize.mines) this.endGame(1);
            return;
        }
        this.getAdjacentCells(x, y).forEach(c => this.revealCell(...c) );
    }

    wrapCoords(coords, offset) {
        let newCol = (this.gameSize.cols + coords[0] + offset[0]) % this.gameSize.cols;
        let newRow = (this.gameSize.rows + coords[1] + offset[1]) % this.gameSize.rows;
        return [newCol, newRow]
    }
}

const css = `
:root {
background: transparent;
border: none;
padding: 0;
--cellsize: 22px;
--mineImg: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzdHlsZT5saW5le3N0cm9rZTojMDAwO3N0cm9rZS13aWR0aDo2JX08L3N0eWxlPjxkZWZzPjxyYWRpYWxHcmFkaWVudCBpZD0ibSIgY3g9IjMwJSIgY3k9IjM1JSI+PHN0b3Agb2Zmc2V0PSIxMCUiIHN0b3AtY29sb3I9IiNDQ0MiLz48c3RvcCBvZmZzZXQ9IjcwJSIgc3RvcC1jb2xvcj0iIzAwMCIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPjxsaW5lIHgxPSI1MCUiIHkxPSIwJSIgeDI9IjUwJSIgeTI9IjEwMCUiLz48bGluZSB4MT0iMCIgeTE9IjUwJSIgeDI9IjEwMCUiIHkyPSI1MCUiLz48bGluZSB4MT0iMTQuNjUlIiB5MT0iMTQuNjUlIiB4Mj0iODUuMzUlIiB5Mj0iODUuMzUlIi8+PGxpbmUgeDE9IjE0LjY1JSIgeTE9Ijg1LjM1JSIgeDI9Ijg1LjM1JSIgeTI9IjE0LjY1JSIvPjxjaXJjbGUgY3g9IjUwJSIgY3k9IjUwJSIgcj0iMzglIiBzdHlsZT0iZmlsbDp1cmwoI20pIi8+PC9zdmc+);
--flagImg: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0iMTAwIiB3aWR0aD0iMTAwIj48bGluZSB4MT0iNTAiIHkxPSIxMCIgeDI9IjUwIiB5Mj0iMTAwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMTAiLz48cGF0aCBkPSJNIDAgMTAwIEEgNjAgNzAgMCAwIDEgMTAwIDEwMCIgZmlsbD0iIzAwMCIgLz48cGF0aCBkPSJNIDU1IDAgTCAwIDI1IEwgNTUgNTAiIGZpbGw9InJlZCIgLz48L3N2Zz4%3D);
--errorImg: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxzdHlsZT5saW5le3N0cm9rZTpyZWQ7c3Ryb2tlLXdpZHRoOjEwJX08L3N0eWxlPjxsaW5lIHgxPScwJyB5MT0nMCcgeDI9JzEwMCUnIHkyPScxMDAlJy8+PGxpbmUgeDE9JzAnIHkxPScxMDAlJyB4Mj0nMTAwJScgeTI9JzAnLz48L3N2Zz4%3D);
}

#game-area {
display: flex;
flex-direction: column;
}

.statusbar {
flex-shrink: 0;
margin-top: 3px;
display: grid;
grid-template-columns: 1fr 1fr;
}

.statusbar > div {
padding: 2px 5px;
border: 1px solid;
border-color: var(--inset-border-color);
}

#board {
border-spacing: 0;
border-collapse: separate;
user-select: none;
}

#board td {
background-color: #bbb;
color: #000;
border: 3px outset #ccc;
box-sizing: border-box;
height: var(--cellsize);
max-height: var(--cellsize);
width: var(--cellsize);
max-width: var(--cellsize);
font-size: calc(var(--cellsize)*.8);
line-height: .5;
padding; 0;
margin: 0;
text-align: center;
font-weight: bold;
font-family: 'verdana';
cursor: default;
overflow: hidden;
}

#board td.revealed {
background-color: #ccc;
border: 1px solid #999;
} 

#board td.r_1 { color: #00C; }
#board td.r_2 { color: #090; }
#board td.r_3 { color: #C00; }
#board td.r_4 { color: #006; }
#board td.r_5 { color: #600; }
#board td.r_6 { color: #099; }
#board td.r_7 { color: #606; }
#board td.r_8 { color: #666; }

#board td.mine {
background: #bbb var(--mineImg) no-repeat center/90%;
}

#board td.flag {
background: #bbb var(--flagImg) no-repeat center/80%;
}

#board td.flag_error {
background: var(--errorImg) no-repeat center, #bbb var(--mineImg) no-repeat center/90%;
}

#board td.hl {
background-color: #d00;
border-color: #e00;
}
`;
