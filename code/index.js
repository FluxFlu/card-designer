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
    "art",
    "typeline",
    "p_t",
    "artist",
    "set_symbol",
];

let fontSize = 0;
function getFontSize() {
    return fontSize;
}
function setFontSize(size) {
    fontSize = size;
    ctx.font = size + "px monospace";
}


const textHeightScaling = metrics => (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) * 1;

function wrapText(ctx, str, width, height) {
    ctx.font = getFontSize() + "px monospace";
    let final = []
    let curr = ""
    const words = str.replaceAll('\n', ' \n ').split(' ')
    for (let i = 0; i < words.length; i++) {
        let result = ' ' + words[i];
        if (i == 0) {
            result = words[i];
        }
        if (ctx.measureText((curr + result).trim()).width > width || words[i] == '\n') {
            final.push(curr.trim());
            curr = '';
        }
        curr += result;
    }
    final.push(curr.trim());

    let textHeight = 0;
    final.forEach(line => {
        if (line[0] == '0') {
            ctx.font = line.slice(1) + ' ' + getFontSize() + "px monospace";
            return;
        }
        const metrics = ctx.measureText(line);
        textHeight += textHeightScaling(metrics);
    });
    if (textHeight > height) {
        setFontSize(getFontSize() - 1);
        return wrapText(ctx, str, width, height);
    }
    ctx.font = getFontSize() + "px monospace";
    return {
        length: final.length,
        print: (x, y) => {
            let textOffset = 0;
            final.forEach(line => {
                if (line[0] == '|') {
                    ctx.font = line.slice(1) + ' ' + getFontSize() + "px monospace";
                    return;
                }

                const metrics = ctx.measureText(line);
                textOffset += textHeightScaling(metrics);

                ctx.fillText(line, x, y + canvasOutlineSize + artHeight + textOffset);
            });
            ctx.font = getFontSize() + "px monospace";
        }
    }
}

function getFields() {
    const out = {};
    fields.forEach(field => out[field] = get(field).value);
    if (!out.artist || out.artist == "undefined")
        out.artist = "";
    // if (!out.set_symbol || out.set_symbol == "undefined")
    //     out.set_symbol = "α";
    return out;
}

function createImage(url) {
    const img = new Image();
    img.src = url;
    return img;
}

const canvasOutlineSize = 24;
const artWidth = 2500 - 2 * canvasOutlineSize;
const artHeight = 3 * artWidth / 4;
let canvas;
let ctx;

function create() {
    const { name, cost, oracle, art, typeline, p_t, artist, set_symbol } = getFields();
    canvas = get("result");
    ctx = canvas.getContext("2d");
    ctx.textAlign = "left";
    
    // Card background color
    const backgroundColor = typeline.split(' ').map(e => e.trim().toLowerCase()).includes("token") ? "#c5c5c5" : "#ffffff";
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Card outline
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
    setFontSize(140);
    ctx.fillText(name, 100, 200);
    
    // Separation line for Cardname
    ctx.fillRect(0, 300, canvas.width, canvasOutlineSize);
    
    // Cost
    if (cost && String(cost) !== "undefined") {
        setFontSize(140);
        ctx.textAlign = "right";
        ctx.fillText(cost, canvas.width - 100, 200);
        ctx.textAlign = "left";
        ctx.fillRect(canvas.width - canvasOutlineSize - 180 - ctx.measureText(cost).width, canvasOutlineSize, canvasOutlineSize, 300);
    }
    
    // Art
    const img = createImage(art);
    
    img.addEventListener("load", function () { ctx.drawImage(img, canvasOutlineSize, 300 + canvasOutlineSize, artWidth, artHeight) }, false);
    
    // Separation line for Art
    ctx.fillRect(0, 300 + canvasOutlineSize + artHeight, canvas.width, canvasOutlineSize);
    
    // Typeline
    
    // Shrink the text until it fits on the box
    let fontSize = 140;
    setFontSize(140);
    while (ctx.measureText(typeline).width > canvas.width - canvasOutlineSize * 2 - 340) {
        fontSize--;
        setFontSize(fontSize);
    }
    
    ctx.fillText(typeline, 100, 450 - (140 - fontSize) / 3 + canvasOutlineSize * 2 + artHeight);
    
    // Separation line for Typeline
    
    ctx.fillRect(0, 520 + canvasOutlineSize * 2 + artHeight, canvas.width, canvasOutlineSize);

    // Set Symbol
    if (set_symbol) {
        setFontSize(240);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.fillText(set_symbol, canvas.width - 200, 465 + canvasOutlineSize * 2 + artHeight)
        ctx.strokeText(set_symbol, canvas.width - 200, 465 + canvasOutlineSize * 2 + artHeight)
        ctx.fillStyle = "#000000"
    }
    
    // Card Text
    // ctx.fillStyle = "#cd0000";
    // ctx.fillRect(100, 2490, canvas.width - 200, 870);
    // ctx.fillStyle = "#000000";
    
    setFontSize(120);
    wrapText(ctx, oracle, canvas.width - 200, 870, 20).print(100, 600);
    
    // Artist Credit
    setFontSize(50);
    ctx.fillRect(0, canvas.height - 70, canvas.width, canvasOutlineSize + 180);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(artist && "Artist: " + artist, canvasOutlineSize + 40, canvas.height - 20);
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
        setFontSize(150);
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
    return out;
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
