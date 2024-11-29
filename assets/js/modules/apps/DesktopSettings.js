import { web_root } from "../../Config.js";

export default class DesktopSettings {

    constructor(windowObject, windowContent, args) {
        this.windowObject = windowObject;
        this.windowContent = windowContent;
        this.args = args;

        this.windowObject.setTitle("Desktop Settings");
        this.windowObject.setCloseRequest( () => {
            // do something before closing
            this.windowObject.closeWindow();
        });

        this.windowObject.addStylesheet(css);

        this.windowContent.innerHTML = html;
        let app = this.windowContent.querySelector("#app");
        this.windowObject.setSize(app.offsetWidth, app.offsetHeight);

        this.windowContent.querySelector("#cancel").addEventListener("click", () => {
            this.windowObject.closeWindow();
        });

        this.windowContent.querySelector("#apply").addEventListener("click", () => {
            this.applyBackground(
                document.body,
                this.windowContent.querySelector("#color").value,
                this.windowContent.querySelector("#wallpaper").value,
                this.windowContent.querySelector("#wallpaper-behaviour").value
            );
            this.windowObject.closeWindow();
        });

        this.demoWindow = this.windowContent.querySelector("#demo");

        this.windowContent.querySelector("#color").addEventListener("input", (event) => {
            this.applyBackground(
                this.demoWindow,
                event.target.value,
                this.windowContent.querySelector("#wallpaper").value,
                this.windowContent.querySelector("#wallpaper-behaviour").value
            );
        });

        this.windowContent.querySelector("#wallpaper").addEventListener("input", (event) => {
            this.applyBackground(
                this.demoWindow,
                this.windowContent.querySelector("#color").value,
                event.target.value,
                this.windowContent.querySelector("#wallpaper-behaviour").value
            );
        });

        this.windowContent.querySelector("#wallpaper-behaviour").addEventListener("input", (event) => {
            this.applyBackground(
                this.demoWindow,
                this.windowContent.querySelector("#color").value,
                this.windowContent.querySelector("#wallpaper").value,
                event.target.value
            );
        });
    }

    applyBackground(target, color, img, behaviour) {
        target.style.backgroundColor = color;
        if (img === "none") {
            target.style.backgroundImage = "none";
            return;
        }
        target.style.backgroundImage = `url(${web_root}/assets/images/wallpapers/${img})`;

        switch (behaviour) {
            case "tile":
                target.style.backgroundSize = "auto";
                target.style.backgroundRepeat = "repeat";
                break;
            case "center":
                target.style.backgroundSize = "auto";
                target.style.backgroundRepeat = "no-repeat";
                target.style.backgroundPosition = "center";
                break;
            case "stretch":
                target.style.backgroundSize = "100% 100%";
                break;
            default:
                console.error("Unknown behaviour", behaviour);
                break;
        }
    }

}

const html = `
<div id="app">
<div id="demo"></div>
<fieldset>
<legend>Desktop Wallpaper</legend>
<table>
    <tr>
        <td>Colour</td>
        <td><input type="color" value="#008888" id="color"></td>
    </tr>
    <tr>
        <td>Image</td>
        <td>
            <select id="wallpaper">
                <option value="none">None</option>
                <option value="clouds.png">Clouds</option>
                <option value="black_thatch.png">Black Thatch</option>
                <option value="bubbles.webp">Bubbles</option>
                <option value="sandstone.png">Sandstone</option>
            </select>
        </td>
    </tr>
    <tr>
        <td>Behaviour</td>
        <td>
            <select id="wallpaper-behaviour">
                <option value="tile" selected>Tile</option>
                <option value="center">Center</option>
                <option value="stretch">Stretch</option>
            </select>
        </td>
    </tr>
</table>
</fieldset>
<div id="action-buttons">
<button id="cancel">Cancel</button>
<button id="apply">Apply</button>
</div>
</div>
`;

const css = `
:root {
background: transparent;
border: none;
padding: 1em;
}

#demo {
border: 1px solid;
width: 250px;
height: 200px;
background: #008888;
margin: 0 auto 1em;
}

#action-buttons {
margin-top: 1em;
text-align: right;
}
`;
