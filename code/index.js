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
];

function getFields() {
    const out = {};
    fields.forEach(field => out[field] = get(field).value);
    return out;
}

function createImage(url) {
    const img = new Image();
    img.src = url;
    return img;
}

function create() {
    const { name, cost, oracle_size, oracle, art, typeline, p_t } = getFields();
    const canvas = get("result");
    const ctx = canvas.getContext("2d");
    ctx.textAlign = "left";
    
    // Card background color
    ctx.fillStyle = typeline.split(' ').map(e => e.trim().toLowerCase()).includes("token") ? "#c5c5c5" : "#ffffff";
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
    ctx.fillText(typeline, 100, 450 + canvasOutlineSize * 2 + artHeight);
    
    // Separation line for Typeline
    
    ctx.fillRect(0, 520 + canvasOutlineSize * 2 + artHeight, canvas.width, canvasOutlineSize);
    
    
    ctx.font = oracle_size + "px monospace";
    const oracleSpacing = 150 / 120 * oracle_size;
    // Oracle
    oracle.split('\n').forEach((line, index) =>
        ctx.fillText(line, 100, 550 + oracleSpacing + canvasOutlineSize + artHeight + oracleSpacing * index)
    );
    
    if (p_t) {
        const [ power, toughness ] = p_t.split('/').map(e => e.trim());
        if (!power && power !== 0) return;
        if (!toughness && toughness !== 0) return;
        
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
