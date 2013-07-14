/* Global Variables   */ 
SB = SB || {};

/**
 * mode to define what happens when the canvas is clicked
 */
SB.CanvasMode = {
		ROTATE:0,
		PAN:1,
		SELECT:2,
		DRAW:3,
		RAYS:4, 
		UNDEFINED:5 
};

/**
 * if canvas is clicked in 'DRAW' mode, this is the 
 * shape being drawn
 */
SB.DrawMode = {
		CUBE:0,
		SPHERE:1,
		CYLINDER:2,
		SHELL:3,
		UNDEFINED:4
};

var gl;
 
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var shaderProgram;
var drawColor = new Float32Array(new ArrayBuffer(4)); 

var global_max_triang_diam = 2.0;
var doneOnce = false;


/*Global Options*/
var useWireFrame;
var useWhiteBackground;
var showAxes;

/**
 * 
 */
function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}
/**
 * 
 */
function mvPopMatrix() {
    if(mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

/**
 * 
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

/**
 * 
 * @param color
 */
function setDrawColorUniform(color){
    drawColor = new Float32Array(color);
    gl.uniform4fv(shaderProgram.drawColor,new Float32Array(color));
}

/**
 * 
 * @param degrees
 * @returns {Number}
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/**
 * 
 * @param canvas
 */
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
        gl.frontFace(CCW);
        console.log('viewportWidth: ' + gl.viewportWidth);
        console.log('viewportHeight: ' + gl.viewportHeight);
    } catch (e) {}
    
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

/**
 * 
 * @param gl
 * @param id
 * @returns
 */
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

/**
 * 
 */
function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.drawColor = gl.getUniformLocation(shaderProgram, "uDrawColor");
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

}

/**
 * 
 * @param l
 * @param u
 * @returns
 */
function getRandom(l,u){
    var R = Math.random();
    return Math.floor( ((u-l)*R)+l );
}


/**********************/
/*  Jquery UI Inits  */
/**********************/

$(function() {
	$("#tabs").tabs();
	$("#selectable-draw-type").selectable();
	$("button").button();
	$("#sb-ui-draw-btn").click(drawNewCylinder);
});