"use strict";

let zoomDepth = 0;
let maxIterations =  1000.0;
let followMouse = false;
let redraw = true;
let scaleX;
let scaleY;
let originR;
let originI;

let colorGradient;

// pixel buffer:
let buf8;
let data;
let imageData;
function setup() {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let buf = new ArrayBuffer(imageData.data.length);
    buf8 = new Uint8ClampedArray(buf);
    data = new Uint32Array(buf);

    // check url params:
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('followMouse'))
        followMouse = true;

    const urlIter = urlParams.get('iter')
    if (urlIter)
        maxIterations = Number(urlIter);

    let initialDepth = 0;
    const urlDepth = urlParams.get('depth')
    if (urlDepth)
        initialDepth = Number(urlDepth);

    // initial overview::
    scaleX = 1 / (canvas.width / 4);
    scaleY = 1 / (canvas.height / 4);
    originR = -0.45;
    originI = 0;
    [ originR, originI ] = screenToWorld(canvas.width /2, canvas.height/2)


    // calculate gradient:
    colorGradient = new ColorGradient(
        maxIterations,
        [ new Color( 0, 7, 100 ),
          new Color( 32, 107, 203 ),
          new Color( 237, 255, 255 ),
          new Color( 255, 160, 0 ),
          new Color( 160, 100, 0 ),
          new Color( 0, 0, 0 ),
          new Color( 0, 3, 50 ),
          new Color( 0, 7, 100 )
        ]
    );

    zoom(initialDepth);
}

function screenToWorld(x, y) {
    const r = originR + (x - canvas.width * .5) * scaleX;
    const i = originI + -(y - canvas.height * .5) * scaleY;
    return [r, i];
}

function worldToScreen(i, r) {
    const x = (r - originR) / scaleX + canvas.width * .5;
    const y = -(i - originI) / scaleY + canvas.height * .5;
    return [x, y];
}

function swapBuffer() {
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
}

function drawPixel(x, y, value) {
    const r = (value >> 16) & 0xff;
    const g = (value >> 8) & 0xff;
    const b = value  & 0xff;
    data[y * canvas.width + x] = 255  << 24 | b << 16 | g <<  8 | r;
}

function plotInSet(x, y) {
    const [cr, ci] = screenToWorld(x, y);

    let zr = 0;
    let zi = 0;
    for (let n = 0; n < maxIterations; n++) {
        const _zr = zr * zr - zi * zi + cr;
        const _zi = 2 * zr * zi + ci;
        zr = _zr;
        zi = _zi;
        const dist = Math.sqrt(zr * zr + zi * zi);
        if (dist > 2) {
            const c = colorGradient.interpolate(n);
            drawPixel(x, y, c.r << 16 | c.g << 8 | c.b);
            return;
        }
    }
    drawPixel(x, y, 0);
}

function drawMandelbrot() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            plotInSet(x, y);
        }
    }
    swapBuffer();
}

function forceDraw() {
    redraw = true;

    if (followMouse) {
        [originR, originI] = screenToWorld(mouseClickX, mouseClickY);
    } else {
        originR = -1.999774060136290359312680755960250;
        originI = -0.000000003290040321479435053496978;
    }

    draw();
}

let renderTime = 0;
function draw() {
    if (redraw) {
        redraw = false;

        let start = Date.now();
        drawMandelbrot();
        renderTime = Date.now() - start;
    }
    const [cr, ci] = screenToWorld(mouseX, mouseY);
    pos.innerText = `Render: ${renderTime} ms, depth: ${zoomDepth}, x: ${mouseX}, y: ${mouseY}, cr: ${cr}, ci: ${ci}`;
    requestAnimationFrame(draw);
}


function zoom(level) {
    if (level <= zoomDepth)
        return;

    for (let i = zoomDepth; i < level; i++) {
        scaleX /= 2;
        scaleY /= 2;
    }

    zoomDepth = level;
    forceDraw();
}

let mouseClickX = 0;
let mouseClickY = 0;
function handleMouseClick(e) {
    let isRightMB;
    e = e || window.event;
    if ("which" in e)
        isRightMB = e.which == 3;
    mouseClickX = e.clientX;
    mouseClickY = e.clientY;
    zoom(zoomDepth + 1);
}

document.addEventListener("click", handleMouseClick);
