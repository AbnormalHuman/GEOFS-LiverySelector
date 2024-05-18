const githubRepo = 'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main';

let liveryobj;
let multiplayertexture;
let origHTMLs = {};
let uploadHistory = [];

(function init() {

    // styles
    // @TODO: replace this with the github repo style.css below once deployed
    document.head.appendChild(generateStylesHTML());
    //appendNewChild(document.head, 'link', {rel: 'stylesheet', href: `${githubRepo}/styles.css`});
    appendNewChild(document.head, 'link', {rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'});

    // Panel for list
    const listDiv = appendNewChild(document.querySelector('.geofs-ui-left'), 'div', {
        id: 'listDiv',
        class: 'geofs-list geofs-toggle-panel livery-list geofs-visible',
        'data-noblur': 'true',
        'data-onshow': '{geofs.initializePreferencesPanel()}',
        'data-onhide': '{geofs.savePreferencesPanel()}'
    });
    listDiv.innerHTML = generateListHTML();

    // Button for panel
    const geofsUiButton = document.querySelector('.geofs-ui-bottom');
    const insertPos = geofs.version >= 3.6 ? 4 : 3;
    geofsUiButton.insertBefore(generatePanelButtonHTML(), geofsUiButton.children[insertPos]);

    //remove original buttons
    const origButtons = document.getElementsByClassName('geofs-liveries geofs-list-collapsible-item');
    Object.values(origButtons).forEach(btn => btn.parentElement.removeChild(btn));

    //Load liveries (@todo: consider moving to listLiveries)
    fetch(`${githubRepo}/livery.json`).then(handleLiveryJson);

    // Start multiplayer (WIP)
    //setInterval(updateMultiplayer, 5000);
})();

/**
 * @param {Response} data
 */
async function handleLiveryJson(data) {
    liveryobj = await data.json();
    liveryobj.aircrafts[23] = Object.assign(liveryobj.aircrafts[23], {
            'index': [0, 2, 3], 'parts': [0, 0, 0], 'liveries': [
                {
                    'name': 'Aerobility',
                    'texture': [
                        '/models/aircraft/premium/pa28/normals.jpg',
                        '/models/aircraft/premium/pa28/specular.jpg',
                        '/models/aircraft/premium/pa28/texture.jpg'
                    ]
                },
                {
                    'name': 'Aeroclub Milano',
                    'texture': [
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/maps/normals.jpg',
                        '/models/aircraft/premium/pa28/specular.jpg',
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/Aeroclub_Milano.png'
                    ]
                },
                {
                    'name': 'N4891F',
                    'texture': [
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/maps/normals.jpg',
                        '/models/aircraft/premium/pa28/specular.jpg',
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/N4891F.png'
                    ]
                },
                {
                    'name': 'Swiss AviationTraining',
                    'texture': [
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/maps/normals.jpg',
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/maps/swiss_specular.jpg',
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/swiss.jpg'
                    ]
                },
                {
                    'name': 'Cheatline',
                    'texture': [
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/maps/normals.jpg',
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/maps/cheatline_specular.jpg',
                        'https://raw.githubusercontent.com/kolos26/GEOFS-LiverySelector/main/liveries/piper_pa28/cheatline.jpg'
                    ]
                }
            ], 'labels': ['Normal map', 'Specular shader', 'Texture']
    });

    // mark aircraft with livery icons
    Object.keys(liveryobj.aircrafts).forEach(aircraftId => {
        const element = document.querySelector(`[data-aircraft='${aircraftId}']`);
        if (!origHTMLs[aircraftId]) {
            origHTMLs[aircraftId] = element.innerHTML;
        }

        element.innerHTML = origHTMLs[aircraftId] +
            createTag('img', {src: `${githubRepo}/liveryselector-logo-small.svg`, height: '30px'}).outerHTML;
    });
}

/**
 * @returns {object} current aircraft from liveryobj
 */
function getCurrentAircraft() {
    return liveryobj.aircrafts[geofs.aircraft.instance.id];
}

/**
 * Triggers GeoFS API to load texture
 *
 * @param {string[]} texture
 * @param {number[]} index
 * @param {number[]} parts
 */
function loadLivery(texture, index, parts) {
    //change livery
    for (let i = 0; i < texture.length; i++) {
        const model3d = geofs.aircraft.instance.definition.parts[parts[i]]['3dmodel'];
        if (geofs.version == 2.9) {
            geofs.api.Model.prototype.changeTexture(texture[i], index[i], model3d);
        } else {
            geofs.api.changeModelTexture(model3d._model, texture[i], index[i]);
        }
        //change multiplayer texture
        multiplayertexture = texture;
    }
}

/**
 * Load liveries from text input fields
 */
function inputLivery() {
    const airplane = getCurrentAircraft();
    const textures = airplane.liveries[0].texture;
    const inputFields = document.getElementsByName('textureInput');
    if (textures.filter(x => x === textures[0]).length === textures.length) { // the same texture is used for all indexes and parts
        const texture = inputFields[0].value;
        loadLivery(Array(textures.length).fill(texture), airplane.index, airplane.parts);
    } else {
        const texture = [];
        inputFields.forEach(e => texture.push(e.value));
        loadLivery(texture, airplane.index, airplane.parts);
    }
}

function sortList(id) {
    const list = domById(id);
    let i, switching, b, shouldSwitch;
    switching = true;
    while (switching) {
        switching = false;
        b = list.getElementsByTagName('LI');
        for (i = 0; i < (b.length - 1); i++) {
            shouldSwitch = false;
            if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            b[i].parentNode.insertBefore(b[i + 1], b[i]);
            switching = true;
        }
    }
}

/**
 * Generate main livery list
 */
function listLiveries() {
    domById('liverylist').innerHTML = '';

    const airplane = getCurrentAircraft();
    airplane.liveries.forEach(function (e) {
        let listItem = appendNewChild(domById('liverylist'), 'li', {
            id: [geofs.aircraft.instance.id, e.name, 'button'].join('_'),
            class: 'livery-list-item'
        });
        listItem.onclick = () => loadLivery(e.texture, airplane.index, airplane.parts);
        listItem.innerHTML = e.name;

        appendNewChild(listItem, 'span', {
            id: [geofs.aircraft.instance.id, e.name].join('_'),
            class: 'fa fa-star nocheck',
            onclick: 'LiverySelector.star(this)'
        });
    });
    sortList('liverylist');
    loadFavorites();
    sortList('favorites');
    addCustomForm();
}

function loadFavorites() {
    if (localStorage.getItem('favorites') === null) {
        localStorage.favorites = '';
    }
    domById('favorites').innerHTML = '';
    const list = localStorage.favorites.split(',');
    const airplane = geofs.aircraft.instance.id;
    list.forEach(function (e) {
        if ((airplane == e.slice(0, airplane.length)) && (e.charAt(airplane.length) == '_')) {
            star(domById(e));
        }
    });
}

function addCustomForm() {
    document.querySelector('#livery-custom-tab-upload .upload-fields').innerHTML = '';
    document.querySelector('#livery-custom-tab-direct .upload-fields').innerHTML = '';
    const airplane = getCurrentAircraft();
    const textures = airplane.liveries[0].texture;
    const placeholders = airplane.labels;
    if (textures.filter(x => x === textures[0]).length === textures.length) { // the same texture is used for all indexes and parts
        createUploadButton(placeholders[0]);
        createDirectButton(placeholders[0]);
    } else {
        placeholders.forEach((placeholder,i)=>{
            createUploadButton(placeholder);
            createDirectButton(placeholder,i);
        });
    }
    document.querySelector('.livery-custom-tabs li').click();
}

function search(text) {
    if (text === '') {
        listLiveries();
    } else {
        const liveries = domById('liverylist').childNodes;
        liveries.forEach(function (e) {
            const found = e.innerText.toLowerCase().includes(text.toLowerCase());
            e.style.display = found ? 'block' : 'none';
        });
    }
}

/**
 * Mark as favorite
 *
 * @param {HTMLElement} element
 */
function star(element) {
    const e = element.classList;
    const elementId = [element.id, 'favorite'].join('_');
    if (e == 'fa fa-star nocheck') {
        const btn = domById([element.id, 'button'].join('_'));
        const fbtn = appendNewChild(domById('favorites'), 'li', { id: elementId, class: 'livery-list-item' });
        fbtn.onclick = btn.onclick;
        fbtn.innerText = btn.innerText;

        let list = localStorage.favorites.split(',');
        list.push(element.id);
        list = [...new Set(list)];
        localStorage.favorites = list;

    } else if (e == 'fa fa-star checked') {
        domById('favorites').removeChild(domById(elementId));
        const list = localStorage.favorites.split(',');
        const index = list.indexOf(element.id);
        if (index !== -1) {
            list.splice(index, 1);
        }
        localStorage.favorites = list;
    }
    //style animation
    e.toggle('checked');
    e.toggle('nocheck');
}

/**
 * @param {string} id
 */
function createUploadButton(id) {
    const customDiv = document.querySelector('#livery-custom-tab-upload .upload-fields');
    appendNewChild(customDiv, 'input', {
        type: 'file',
        onchange: 'LiverySelector.uploadLivery(this)'
    });
    appendNewChild(customDiv, 'input', {
        type: 'text',
        name: 'textureInput',
        class: 'mdl-textfield__input address-input',
        placeholder: id,
        id: id
    });
    appendNewChild(customDiv, 'br');
}

/**
 * @param {string} id
 * @param {number} i
 */
function createDirectButton(id,i) {
    const customDiv = document.querySelector('#livery-custom-tab-direct .upload-fields');
    appendNewChild(customDiv, 'input', {
        type: 'file',
        onchange: 'LiverySelector.loadLiveryDirect(this,'+i+')'
    });
    appendNewChild(customDiv, 'span').innerHTML = id;
    appendNewChild(customDiv, 'br');
}

/**
 * @param {HTMLInputElement} fileInput
 * @param {number} i
 */
function loadLiveryDirect(fileInput, i) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        const airplane = getCurrentAircraft();
        const textures = airplane.liveries[0].texture;
        const newTexture = event.target.result;
        if (i === undefined) {
            loadLivery(Array(textures.length).fill(newTexture), airplane.index, airplane.parts);
        } else {
            geofs.api.changeModelTexture(
                geofs.aircraft.instance.definition.parts[airplane.parts[i]]["3dmodel"]._model,
                newTexture,
                airplane.index[i]
            );
        }
        fileInput.value = null;
    });
    fileInput.files.length && reader.readAsDataURL(fileInput.files[0]);
}

/**
 * @param {HTMLInputElement} fileInput
 */
function uploadLivery(fileInput) {
    if (!fileInput.files.length)
        return;
    if (!localStorage.imgbbAPIKEY) {
        alert('No imgbb API key saved! Check API tab');
        fileInput.value = null;
        return;
    }
    const form = new FormData();
    form.append('image', fileInput.files[0]);
    if (localStorage.liveryAutoremove)
        form.append('expiration', (new Date()/1000) * 60 * 60);

    const settings = {
        'url': `https://api.imgbb.com/1/upload?key=${localStorage.imgbbAPIKEY}`,
        'method': 'POST',
        'timeout': 0,
        'processData': false,
        'mimeType': 'multipart/form-data',
        'contentType': false,
        'data': form
    };

    $.ajax(settings).done(function (response) {
        const jx = JSON.parse(response);
        console.log(jx.data.url);
        fileInput.nextSibling.value = jx.data.url;
        fileInput.value = null;
        uploadHistory.push(jx.data);
    });
}

function handleCustomTabs(e){
    e = e || window.event;
    const src = e.target || e.srcElement;
    const tabId = src.innerHTML.toLocaleLowerCase();
    domById('customDiv').querySelectorAll(':scope > div').forEach(tabDiv => {
        if (tabDiv.id != ['livery-custom-tab', tabId].join('-')) {
            tabDiv.style.display =  'none';
            return;
        }
        tabDiv.style.display = '';
        switch (tabId) {
            case 'upload': {
                const fields = tabDiv.querySelectorAll('input[type="file"]');
                fields.forEach(f=>localStorage.imgbbAPIKEY ? f.classList.remove('err') : f.classList.add('err'));
            } break;

            case 'download': {
                reloadDownloadsForm(tabDiv);
            } break;

            case 'api': {
                reloadSettingsForm();
            } break;
        }
    });

}

function reloadDownloadsForm(tabDiv) {
    const airplane = getCurrentAircraft();
    const liveries = airplane.liveries;
    const defaults = liveries[0];
    const fields = tabDiv.querySelector('.download-fields')
    fields.innerHTML = '';
    liveries.forEach((livery,liveryNo) => {
        appendNewChild(fields, 'h7').innerHTML = livery.name;
        const wrap = appendNewChild(fields, 'div');
        livery.texture.forEach((href,i) => {
            if (liveryNo>0 && href == defaults.texture[i]) return;
            const link = appendNewChild(wrap,'a',{href,target:'_blank',
                class:"mdl-button mdl-button--raised mdl-button--colored"
            });
            link.innerHTML = airplane.labels[i];
        });
    });
}

function reloadSettingsForm() {
    const apiInput = domById('livery-setting-apikey');
    apiInput.placeholder = localStorage.imgbbAPIKEY ?
        'API KEY SAVED ✓ (type CLEAR to remove)' :
        'API KEY HERE';

    const removeCheckbox = domById('livery-setting-remove');
    removeCheckbox.checked = (localStorage.liveryAutoremove==1);
}

function saveSetting(element) {
    const id = element.id.replace('livery-setting-','');
    switch (id) {
        case 'apikey': {
            if (element.value.length) {
                if (element.value.trim().toLowerCase() == 'clear') {
                    delete localStorage.imgbbAPIKEY;
                } else {
                    localStorage.imgbbAPIKEY = element.value.trim();
                }
                element.value = '';
            }
        } break;

        case 'remove': {
            localStorage.liveryAutoremove = element.checked ? '1' : '0';
        } break;
    }
    reloadSettingsForm();
}

function parseLiveryUrls(e){
  console.log(e||window.event);
}

/**
 * disabled for now @todo: ask whats this about
 */
function updateMultiplayer() {
    Object.values(multiplayer.visibleUsers).forEach(function (e) {
        geofs.api.changeModelTexture(multiplayer.visibleUsers[e.id].model, multiplayertexture, 0);
    });
}

/******************* Utilities *********************/


function toggleDiv(id) {
    const div = domById(id);
    const target = window.event.target;
    if (target.classList.contains('closed')) {
        target.classList.remove('closed');
        div.style.display='';
    } else {
        target.classList.add('closed');
        div.style.display='none';
    }
}

/**
 * Create tag with <name attributes=...
 *
 * @param {string} name
 * @param {object} attributes
 * @returns {HTMLElement}
 */
function createTag(name, attributes = {}) {
    const el = document.createElement(name);
    Object.keys(attributes).forEach(k => el.setAttribute(k, attributes[k]));

    return el;
}

/**
 * Creates a new element <tagName attributes=...
 * appends to parent and returns the child for later access
 *
 * @param {HTMLElement} parent
 * @param {string} tagName
 * @param {object} attributes
 * @param {number} pos insert in Nth position (default append)
 * @returns {HTMLElement}
 */
function appendNewChild(parent, tagName, attributes = {}, pos = -1) {
    const child = createTag(tagName, attributes);
    if (pos < 0) {
        parent.appendChild(child);
    } else {
        parent.insertBefore(child, parent.children[pos]);
    }

    return child;
}

/**
 * @param {string} elementId
 * @returns {HTMLElement}
 */
function domById(elementId) {
    return document.getElementById(elementId);
}

/******************* HTML & CSS Templates *********************/

/**
 * @returns {string} HTML template for main panel
 */
function generateListHTML() {
    return `
        <h3><img src="${githubRepo}/liveryselector-logo.svg" class="livery-title" title="LiverySelector" /></h3>

        <div class="livery-searchbar mdl-textfield mdl-js-textfield geofs-stopMousePropagation geofs-stopKeyupPropagation">
            <input class="mdl-textfield__input address-input" type="text" placeholder="Search liveries" onkeyup="LiverySelector.search(this.value)" id="searchlivery">
            <label class="mdl-textfield__label" for="searchlivery">Search liveries</label>
        </div>

        <h6 onclick="LiverySelector.toggleDiv('favorites')">Favorite liveries</h6>
        <ul id="favorites" class="geofs-list geofs-visible"></ul>

        <h6 onclick="LiverySelector.toggleDiv('liverylist')">Available liveries</h6>
        <ul id="liverylist" class=" geofs-list geofs-visible"></ul>

        <h6 onclick="LiverySelector.toggleDiv('customDiv')" class="closed">Load external livery</h6>
        <div id="customDiv" class="mdl-textfield mdl-js-textfield geofs-stopMousePropagation geofs-stopKeyupPropagation" style="display:none;">
            <ul class="livery-custom-tabs" onclick="LiverySelector.handleCustomTabs()">
                <li>Upload</li>
                <li>Direct</li>
                <li>Download</li>
                <li>API</li>
            </ul>
            <div id="livery-custom-tab-upload" style="display:none;">
                <div>Paste URL or upload image to generate imgbb URL</div>
                <div class="upload-fields"></div>
                <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="LiverySelector.inputLivery()">Load livery</button>
            </div>
            <div id="livery-custom-tab-direct" style="display:none;">
                <div>Load texture directly in client, no upload.</div>
                <div class="upload-fields"></div>
            </div>
            <div id="livery-custom-tab-download" style="display:none;">
                <div>Download textures for current Airplane:</div>
                <div class="download-fields"></div>
            </div>
            <div id="livery-custom-tab-api" style="display:none;">
              <div>
                <label for="livery-setting-apikey">Paste your imgbb API key here (<a href="https://api.imgbb.com" target="_blank">get key</a>)</label>
                <input type="text" id="livery-setting-apikey" class="mdl-textfield__input address-input" onchange="LiverySelector.saveSetting(this)">
                <br>
                <input type="checkbox" id="livery-setting-remove" onchange="LiverySelector.saveSetting(this)">
                <label for="livery-setting-remove">Remove uploaded files after an hour</label>
              </div>
            </div>
        </div>
`;
}

/**
 * @returns {HTMLElement} HTML template for main menu livery button
 */
function generatePanelButtonHTML() {
    const liveryButton = createTag('button', {
        title: 'Change livery',
        id: 'liverybutton',
        class: 'mdl-button mdl-js-button geofs-f-standard-ui geofs-mediumScreenOnly',
        onclick: 'LiverySelector.listLiveries()',
        'data-toggle-panel': '.livery-list',
        'data-tooltip-classname': 'mdl-tooltip--top',
        'data-upgraded': ',MaterialButton'
    });
    liveryButton.innerHTML = 'LIVERY' + createTag('img', {src: `${githubRepo}/liveryselector-logo-small.svg`, height: '30px'}).outerHTML;

    return liveryButton;
}

/**
 * @returns {HTMLElement} HTML template
 */
function generateStylesHTML() {
    const tag = createTag('style', {type: 'text/css'});
    tag.innerHTML = `
.livery-list {
    width: 400px;
}

#listDiv h6 {
    padding-left: 4px;
}
#listDiv h6:before  {
    content: "\\25bc\\FE0E";
    margin-right: 2px;
}
#listDiv h6.closed:before {
    content: "\\25b6\\FE0E";
    margin-right: 2px;
}
.checked, .nocheck {
    text-shadow: 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black;
    color: rgb(255, 193, 7);
    display: inline;
    text-align: right;
    cursor: pointer;
}
.nocheck {
    color: white;
}

input[type="file"] {
    width: 30%;
    display: inline-block;
    background-color: rgb(83, 109, 254);
    color: white;
    padding: 12px 0;
    margin: 2px 0;
    height: 20px;
    cursor: pointer;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

input[type="file"].err {
    background-color: rgb(254, 109, 83);
}

input[type="file"]::-webkit-file-upload-button,
input[type="file"]::file-selector-button {
    visibility: hidden;
    width: 0;
}

#livery-custom-tab-direct input[type="file"]::before,
#livery-custom-tab-upload input[type="file"]::before {
    content: "UPLOAD IMAGE";
    text-align: center;
    display: inline-block;
    width: 100%;
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    font-size: 14px;
}

#livery-custom-tab-direct input[type="file"]::before {
    content: 'LOAD IMAGE';
}

#livery-custom-tab-upload input[type="file"].err::before {
    content: 'NO API KEY';
}


input[name="textureInput"] {
    color: white;
    font-size: 14px;
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    height: 36px;
    display: inline-block;
    background-color: #729e8f;
    border: none;
    outline: none;
    width: 68%;
    padding: 4px 3px;
    keyboard-events: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

#livery-setting-apikey::placeholder,
input[name="textureInput"]::placeholder {
    color: #dedede;
    font-size: 14px;
}

img.livery-title {
    width: 95%;
    display: block;
    margin: 0 auto;
}

ul.livery-custom-tabs {
    display: flex;
    justify-content: space-evenly;
    background-color: white;
    padding-inline-start: 0;
    margin: 0;
}

.livery-custom-tabs li {
    display: inline-block;
    padding: 0.75rem;
    cursor: pointer;
    flex-grow: 1;
    text-align: center;
}
#livery-setting-apikey {
    background-color: #729e8f;
    color: #dedede;
    padding: 4px 2px;
    width: 98%;
    height: 36px;
}

#livery-custom-tab-upload button {
    position: initial;
    margin: 10px auto;
    display: block;
    width: 80%;
    text-align: center;
}

#livery-custom-tab-upload > div,
#livery-custom-tab-direct > div,
#livery-custom-tab-download > div,
#livery-custom-tab-api div {
    padding: 10px;
    background: white;
}

#favorites li.livery-list-item span,
#liverylist li.livery-list-item span {
    float: right;
    padding-top: 15px;
}

#favorites li.livery-list-item,
#liverylist li.livery-list-item {
    background-color: white;
    display: block;
}

.geofs-list .livery-custom-tabs li:hover,
#favorites li.livery-list-item:hover,
#liverylist li.livery-list-item:hover {
    background-color: #dedede;
}

.livery-searchbar {
    width: 100%;
}

.download-fields h7 {
    background-color: #729e8f;
    display:block;
    padding: 4px;
}
.download-fields .mdl-button {
    position: initial;
    margin: 4px;
    display: inline-block;
    width: 38%;
}

#customDiv {
    width: 100%;
    padding: 0;
}
    `;
    return tag;
}

window.LiverySelector = {
    liveryobj,
    saveSetting,
    toggleDiv,
    loadLiveryDirect,
    parseLiveryUrls,
    handleCustomTabs,
    listLiveries,
    star,
    search,
    inputLivery,
    uploadLivery,
};