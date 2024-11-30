import { web_root } from "../../Config.js";

export default class DesktopSettings {

    constructor(windowObject, windowContent, args) {
        this.windowObject = windowObject;
        this.windowContent = windowContent;
        this.args = args;

        // Add reference to desktop environment
        /** @type {import('../DesktopEnvironment.js').default} */
        this.desktopEnvironment = args.desktopEnvironment;
        
        /** @type {import('../JsonFs.js').default} */
        this.fs = args.desktopEnvironment.fileSystem;

        this.filename = "C:\\settings\\desktop.ini";
        this.currentSettings = {
            color: "#008888",
            wallpaper: "none",
            behaviour: "tile"
        };
        try {
            this.currentSettings = JSON.parse(this.fs.readFile(this.filename));
        } catch (e) {
            console.log("Error reading settings", e);
        }

        this.windowObject.setTitle("Desktop Settings");
        this.windowObject.setCloseRequest( () => {
            // do something before closing
            this.windowObject.closeWindow();
        });

        this.windowObject.addStylesheet(css);

        this.windowContent.innerHTML = html;

        this.windowContent.querySelector("#color").value = this.currentSettings.color;
        this.windowContent.querySelector(`#wallpaper option[value="${this.currentSettings.wallpaper}"]`).selected = true;
        this.windowContent.querySelector(`#wallpaper-behaviour option[value="${this.currentSettings.behaviour}"]`).selected = true;

        this.demoWindow = this.windowContent.querySelector("#demo");


        this.applyBackground(
            this.demoWindow,
            this.currentSettings.color,
            this.currentSettings.wallpaper,
            this.currentSettings.behaviour
        );

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
            this.saveSettings();
            this.windowObject.closeWindow();
        });

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

        let app = this.windowContent.querySelector("#app");
        this.windowObject.setSize(app.offsetWidth, app.offsetHeight);
    }

    saveSettings() {
        try {
            this.fs.createDirectory('C:\\settings');
        } catch (e) {
            console.log("Settings directory already exists");
        }
        const fileContents = JSON.stringify({
            color: this.windowContent.querySelector("#color").value,
            wallpaper: this.windowContent.querySelector("#wallpaper").value,
            behaviour: this.windowContent.querySelector("#wallpaper-behaviour").value
        });
        this.fs.createFile(this.filename, fileContents);
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

const wallpapers = [
    { img: "none", name: "none" },
    { img: "black_thatch.png", name: "Black Thatch" },
    { img: "Bliss.jpg", name: "Bliss (Win XP)" },
    { img: "blue_rivets.webp", name: "Blue Rivets" },
    { img: "boilding_point.jpg", name: "Boiling Point" },
    { img: "bubbles.webp", name: "Bubbles" },
    { img: "carved_stone.webp", name: "Carved Stone" },
    { img: "circles.webp", name: "Circles" },
    { img: "clouds.png", name: "Clouds" },
    { img: "forest.png", name: "Forest" },
    { img: "purple_sponge.jpg", name: "Purple Sponge" },
    { img: "sandstone.png", name: "Sandstone" },
    { img: "water_color.jpg", name: "Water Color" }
];



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
            ${wallpapers.map(w => `<option value="${w.img}">${w.name}</option>`).join("")}
            </select>
        </td>
    </tr>
    <tr>
        <td>Behaviour</td>
        <td>
            <select id="wallpaper-behaviour">
            ${["tile", "center", "stretch"].map(b => `<option value="${b}">${b}</option>`).join("")}
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
box-sizing: content-box;
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
