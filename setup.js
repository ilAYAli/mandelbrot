"use strict";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let mouseX = 0;
let mouseY = 0;

class Fps {
    constructor() {
        this.prevTime = performance.now();
        this.fps = 0;
        this.frame = 1;
    }
    count = function() {
        const delta = (performance.now() - this.prevTime)/1000;
        this.prevTime = performance.now();
        this.fps = 1 / delta;
        this.frame++;
    }
    frameRate = function() {
        return this.fps;
    }
};

function mapRange(value, fmin, fmax, tmin, tmax) {
    value = (value - fmin) / (fmax - fmin);
    return tmin + value * (tmax - tmin);
}

let centered = false;
function centerCanvas() {
    centered = true;
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
}

function centerMouse(cx = canvas.width *.5, cy = canvas.height *.5) {
    return [ mouseX - cx, (mouseY - cy)];
}

function deg2rad(d) {
    return d * (Math.PI/180);
}

function rad2deg(r) {
    return r * (180/Math.PI);
}

function trackMouse(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    if (centered) {
        mouseX -= canvas.width * 0.5;
        mouseY -= canvas.height * 0.5;
        mouseY *= -1;
    }
}

function resizeCanvas() {
    //window.innerWidth = 1280;
    //window.height = 720;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.onload = () => {
    resizeCanvas();
    if (typeof preload === "function") preload();
    if (typeof setup === "function") setup();
    if (typeof draw === "function") draw();
}

class ColorGradient {
    constructor(maximalPosition, colorList) {
        this.DEAD_COLOR = new Color( 0, 0, 0 );
        this.maximalPosition = maximalPosition;
        this.colorList = colorList;
        this.param = 100.0;
        this.offset = 0.0;
    }

    interpolate = function (position) {
        if (position >= this.maximalPosition ) {
            return this.DEAD_COLOR;
        }

        position += this.offset;
        position %= this.maximalPosition;
        if ( position < 0 ) {
            position += this.maximalPosition;
        }

        let colorPosition = ~~ (position * (this.colorList.length - 1) / this.param);
        colorPosition %= (this.colorList.length - 1 );
        position %= this.param / (this.colorList.length - 1);
        position /= this.param / (this.colorList.length - 1);

        return this.colorList[colorPosition].interpolateTo(
            this.colorList[ colorPosition + 1 ], position
        );
    };
}

class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    interpolateTo = function (color, position) {
        return new Color(
            this.r + position * ( color.r - this.r ),
            this.g + position * ( color.g - this.g ),
            this.b + position * ( color.b - this.b )
        );
    };
};


window.addEventListener("mousemove", trackMouse, false);
