export default class Calculator {
    constructor(windowObject, windowContent, args) {
        /** @type {import('../WindowObject.js').default} */
        this.window = windowObject;
        /** @type {HTMLElement} */
        this.windowContent = windowContent;

        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;

        this.window.setTitle('Calculator');
        this.windowContent.className = 'calculator';
        this.window.addStylesheet(css);

        this.window.setCloseRequest(() => {
            this.window.closeWindow();
        });

        this.setupCalculator();
    }

    setupCalculator() {
        // Display
        this.display = document.createElement('input');
        this.display.type = 'text';
        this.display.className = 'calculator-display';
        this.display.value = '0';
        this.display.readOnly = true;

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'calculator-buttons';

        // Button layout (flattened array for grid)
        const buttons = [
            '7', '8', '9', '/',
            '4', '5', '6', '*',
            '1', '2', '3', '-',
            '0', '.', '=', '+',
            'C', 'CE'
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn;
            button.className = 'calculator-button';
            if (btn === '=') button.classList.add('equals');
            if ('+-*/'.includes(btn)) button.classList.add('operator');
            if ('C CE'.includes(btn)) button.classList.add('clear');
            
            button.addEventListener('click', () => this.handleButton(btn));
            buttonsContainer.appendChild(button);
        });

        this.windowContent.appendChild(this.display);
        this.windowContent.appendChild(buttonsContainer);
    }

    handleButton(value) {
        switch(value) {
            case 'C':
                this.clear();
                break;
            case 'CE':
                this.clearEntry();
                break;
            case '=':
                this.calculate();
                break;
            case '+':
            case '-':
            case '*':
            case '/':
                this.handleOperator(value);
                break;
            case '.':
                this.handleDecimal();
                break;
            default:
                this.handleNumber(value);
                break;
        }
        
        this.updateDisplay();
    }

    handleNumber(num) {
        if (this.newNumber) {
            this.currentValue = num;
            this.newNumber = false;
        } else {
            this.currentValue = this.currentValue === '0' ? 
                num : this.currentValue + num;
        }
    }

    handleOperator(op) {
        if (this.operation && !this.newNumber) {
            this.calculate();
        }
        this.previousValue = this.currentValue;
        this.operation = op;
        this.newNumber = true;
    }

    handleDecimal() {
        if (this.newNumber) {
            this.currentValue = '0.';
            this.newNumber = false;
        } else if (!this.currentValue.includes('.')) {
            this.currentValue += '.';
        }
    }

    calculate() {
        if (!this.operation || !this.previousValue) return;

        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        
        switch(this.operation) {
            case '+':
                this.currentValue = (prev + current).toString();
                break;
            case '-':
                this.currentValue = (prev - current).toString();
                break;
            case '*':
                this.currentValue = (prev * current).toString();
                break;
            case '/':
                if (current === 0) {
                    this.currentValue = 'Error';
                } else {
                    this.currentValue = (prev / current).toString();
                }
                break;
        }

        this.operation = null;
        this.previousValue = null;
        this.newNumber = true;
    }

    clear() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
    }

    clearEntry() {
        this.currentValue = '0';
        this.newNumber = true;
    }

    updateDisplay() {
        this.display.value = this.currentValue;
    }
}

const css = `
.calculator {
    background: var(--window-background-color);
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 200px;
    user-select: none;
}

.calculator-display {
    font-family: "MS Sans Serif", sans-serif;
    font-size: 16px;
    text-align: right;
    padding: 3px 4px;
    background: #fff;
    border: 2px inset #808080;
    width: calc(100% - 12px);
    color: #000;
    height: 25px;
    box-sizing: border-box;
    margin-bottom: 2px;
}

.calculator-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
}

.calculator-button {
    height: 25px;
    font-family: "MS Sans Serif", sans-serif;
    font-size: 12px;
    background: #c0c0c0;
    border: 2px solid;
    border-color: #ffffff #808080 #808080 #ffffff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: #000;
    font-weight: bold;
}

.calculator-button:active {
    border-color: #808080 #ffffff #ffffff #808080;
    padding: 1px 0 0 1px;
}

.calculator-button.operator {
    font-family: "MS Sans Serif", sans-serif;
}

.calculator-button.equals {
    font-family: "MS Sans Serif", sans-serif;
}

.calculator-button.clear {
    font-family: "MS Sans Serif", sans-serif;
}

/* Make C and CE buttons span 2 columns */
.calculator-button:nth-last-child(-n+2) {
    grid-column: span 2;
}
`; 