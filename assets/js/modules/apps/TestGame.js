export default class TestGame {
    constructor(windowObject, windowContent, args) {
        this.windowObject = windowObject;
        this.documentObject = windowContent;
        this.args = args;

        this.windowObject.setTitle("Test Game");
        this.windowObject.setCloseRequest( () => {
            // do something before closing
            this.windowObject.closeWindow();
        });

        const dialog = this.windowObject.makeDialog(`
<fieldset>
    <legend>Open File</legend>
    <label for="file">Filename:</label>
    <input type="file" id="file" name="file">
</fieldset>
<fieldset>
    <legend>some radio buttons</legend>
    <label for="radio1">Radio 1</label>
    <input type="radio" id="radio1" name="radio" value="radio1">
    <br>
    <label for="radio2">Radio 2</label>
    <input type="radio" id="radio2" name="radio" value="radio2">
</fieldset>
<div><button id="submit">Submit</button></div>
        `);
        dialog.getContent().querySelector('#submit').addEventListener('click', () => {
            console.log('Submit clicked');
            console.log(dialog.getContent().querySelector('#file').value);
            this.windowObject.closeDialog(dialog);
        });

        const dialog2 = this.windowObject.makeDialog(`
<fieldset>
<legend>something else</legend>
<input type="text" id="text" name="text">
</fieldset>
<div><button id="submit2">Submit</button></div>
`, {title: 'Another Dialog'});
        dialog2.getContent().querySelector('#submit2').addEventListener('click', () => {
            console.log('Submit 2 clicked');
            console.log(dialog2.getContent().querySelector('#text').value);
            this.windowObject.closeDialog(dialog2);
        });

        this.windowObject.setMenu({
            'File': {
                'New': function() { console.log('New File'); },
                'Open': function() { dialog?.render(); }.bind(this),
                'Save': function() { dialog2?.render(); }.bind(this),
            },
            'Edit': {
                'Cut': function() { console.log('Cut'); },
                'Copy': function() { console.log('Copy'); },
                'Paste': function() { console.log('Paste'); },
            },
        });
        this.windowObject.addStylesheet(css);

        this.init();
    }
    init() {
        // Make the thing do the thing
        this.documentObject.innerHTML = "<h1>Test Game</h1>";
        if (this.args && Object.keys(this.args).length > 0) {
            this.documentObject.innerHTML += "Arguments passed to TestGame: ";
            this.documentObject.innerHTML += this.args.toString();
        } else {
            this.documentObject.innerHTML += "<div>No arguments passed to TestGame</div>";
        }
    }
}

const css = `
h1 {
color: green;
}

div {
color: red;
}
`;
