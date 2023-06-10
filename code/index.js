function downloadFile(filename, text) {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', 'data: text/plain; charset=utf-8,' + encodeURIComponent(text));
  anchor.setAttribute('download', filename);

  anchor.style.display = 'none';
  document.body.appendChild(anchor);

  anchor.click();

  document.body.removeChild(anchor);
}

const get = name => document.getElementById(name);

const fields = [
    "name",
    "cost",
    "oracle",
    "oracle_size",
    "art",
    "typeline",
    "p_t",
    "artist",
    "set_symbol",
];

function getFields() {
    const out = {};
    fields.forEach(field => out[field] = get(field).value);
    if (!out.artist || out.artist == "undefined")
        out.artist = "Missy";
    // if (!out.set_symbol || out.set_symbol == "undefined")
    //     out.set_symbol = "α";
    return out;
}

function createImage(url) {
    const img = new Image();
    img.src = url;
    return img;
}

function create() {
    const { name, cost, oracle_size, oracle, art, typeline, p_t, artist, set_symbol } = getFields();
    const canvas = get("result");
    const ctx = canvas.getContext("2d");
    ctx.textAlign = "left";
    
    // Card background color
    const backgroundColor = typeline.split(' ').map(e => e.trim().toLowerCase()).includes("token") ? "#c5c5c5" : "#ffffff";
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Card outline
    const canvasOutlineSize = 24;
    ctx.fillStyle = "#000000";
    // Left
    ctx.fillRect(0, 0, canvasOutlineSize, canvas.height);
    // Right
    ctx.fillRect(canvas.width - canvasOutlineSize, 0, canvasOutlineSize, canvas.height);
    // Top
    ctx.fillRect(0, 0, canvas.width, canvasOutlineSize);
    // Bottom
    ctx.fillRect(0, canvas.height - canvasOutlineSize, canvas.width, canvasOutlineSize);

    
    // Cardname
    ctx.font = "140px monospace";
    ctx.fillText(name, 100, 200);
    
    // Separation line for Cardname
    ctx.fillRect(0, 300, canvas.width, canvasOutlineSize);
    
    // Cost
    if (cost && String(cost) !== "undefined") {
        ctx.textAlign = "right";
        ctx.fillText(cost, canvas.width - 100, 200);
        ctx.textAlign = "left";
        ctx.fillRect(canvas.width - canvasOutlineSize - 180 - ctx.measureText(cost).width, canvasOutlineSize, canvasOutlineSize, 300);
    }
    
    // Art
    const img = createImage(art);
    const artWidth = 2500 - 2 * canvasOutlineSize;
    const artHeight = 3 * artWidth / 4;
    img.addEventListener("load", function () { ctx.drawImage(img, canvasOutlineSize, 300 + canvasOutlineSize, artWidth, artHeight) }, false);
    
    // Separation line for Art
    ctx.fillRect(0, 300 + canvasOutlineSize + artHeight, canvas.width, canvasOutlineSize);
    
    // Typeline
    
    // Shrink the text until it fits on the box
    let fontSize = 140;
    while (ctx.measureText(typeline).width > canvas.width - canvasOutlineSize * 2 - 340) {
        fontSize--;
        ctx.font = fontSize + "px monospace";
    }
    
    ctx.fillText(typeline, 100, 450 - (140 - fontSize) / 3 + canvasOutlineSize * 2 + artHeight);
    
    // Separation line for Typeline
    
    ctx.fillRect(0, 520 + canvasOutlineSize * 2 + artHeight, canvas.width, canvasOutlineSize);

    // Set Symbol
    if (set_symbol) {
        ctx.font = "240px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.fillText(set_symbol, canvas.width - 200, 465 + canvasOutlineSize * 2 + artHeight)
        // ctx.font = "240px monospace";
        ctx.strokeText(set_symbol, canvas.width - 200, 465 + canvasOutlineSize * 2 + artHeight)
        ctx.fillStyle = "#000000"
    }
    
    // Oracle Font Size
    ctx.font = oracle_size + "px monospace";
    const oracleSpacing = 150 / 120 * oracle_size;
    
    // Card Text
    oracle.split('\n').forEach((line, index) => {
        if (line[0] == '|')
            return ctx.font = line.slice(1) + ' ' + oracle_size + "px monospace"
        ctx.fillText(line, 100, 550 + oracleSpacing + canvasOutlineSize + artHeight + oracleSpacing * index)
    });
    
    // Artist Credit
    ctx.font = "50px monospace";
    ctx.fillRect(0, canvas.height - 70, canvas.width, canvasOutlineSize + 180);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Artist: " + artist, canvasOutlineSize + 40, canvas.height - 20);
    ctx.fillStyle = "#000000";
    
    // Power / Toughness
    if (p_t) {
        const [ power, toughness ] = p_t.split('/').map(e => e.trim());
        if (!power && power !== 0) return;
        if (!toughness && toughness !== 0) return;

        // Cover up artist
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(canvas.width - 560, canvas.height - 340, 560 - canvasOutlineSize, 340 - canvasOutlineSize)
        ctx.fillStyle = "#000000";
        
        // Draw the box
        ctx.fillRect(canvas.width - 560, canvas.height - 340, 560, canvasOutlineSize);
        ctx.fillRect(canvas.width - 560, canvas.height - 340, canvasOutlineSize + 2, 340);
        
        ctx.textAlign = "center";
        ctx.font = "150px monospace";
        ctx.fillText(p_t, canvas.width - 280, canvas.height - 140);
    }
}

window.addEventListener("load", create);

function genFileText() {
    
    let fileText = "";
    
    const obj = getFields();
    Object.keys(obj).forEach(key => {
        fileText += "\n" + key + ": [" + (obj[key].replaceAll("[", "%^&!{").replaceAll("]", "%^&!}") || "") + "]";
    });
    
    return fileText;
}

function save() {
    const { name } = getFields();
    downloadFile(name, genFileText());
}

function interpretFile(file) {
    const out = {};
    let currentField;
    for (let i = 0; i < file.length; i++) {
        if (file[i].match(/[a-z_]/)) {
            let str = file[i];
            while (file[++i].match(/[a-z_]/)) str += file[i];
            currentField = str;
        }
        if (file[i] == '[') {
            if (!currentField) alert("INVALID FILE!");
            out[currentField] = '';
            let balanceBrackets = 1;
            i++;
            while (balanceBrackets) {
                if (file[i] == '[') balanceBrackets++;
                else if (file[i] == ']') balanceBrackets--;
                else {
                    out[currentField] += file[i];
                }
                i++;
            }
            out[currentField] = out[currentField].replaceAll("%^&!{", "[").replaceAll("%^&!}", "]");
        }
    }
    return out
}

function upload() {
    const file = get("upload");
    file.files[file.files.length - 1].text().then(str => {
        const obj = interpretFile(str);
        fields.forEach(field => {
            get(field).value = obj[field];
        });
        create();
    });
}
