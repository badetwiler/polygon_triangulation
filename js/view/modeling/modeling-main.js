
var canvas;

var xRot = 0;
var xSpeed = 3;
var yRot = 0;
var ySpeed = -3;
var zoom = -15.0;
var currentlyPressedKeys = {};
var drawableObjects = [];
var worldRotationMatrix = mat4.create(); 
mat4.identity(worldRotationMatrix);
var mouseDown = false;
var prevMouseX = null;
var prevMouseY = null;
var mouseRotate = false;
var mouseDrawRay = true; 

var cylHeight = 2.0;
var cylStart = new Point(-5.0,2.0,2.0);
var cylRad = 3.0;

var xAxisBuffer; 
var yAxisBuffer;
var zAxisBuffer;

var lastTime = 0;
var cylUp = false;


var shell = new Shell();

var canvasMode = SB.CanvasMode.RAYS;
var drawMode = SB.DrawMode.UNDEFINED;


/**
 * 
 * @param event
 */
function handleKeyDown(event) {
currentlyPressedKeys[event.keyCode] = true;
}

/**
 * 
 * @param event
 */
function handleKeyUp(event) {
currentlyPressedKeys[event.keyCode] = false;
}

/**
 * 
 */
function handleKeys() {
    if (currentlyPressedKeys[33]) {
    console.log('zoom decreasing');
    // Page Up
    zoom -= 0.05;
    }
    if (currentlyPressedKeys[34]) {
    // Page Down
    zoom += 0.05;
    }
    if (currentlyPressedKeys[37]) {
    // Left cursor key
    yRot -= 1;
    }
    if (currentlyPressedKeys[39]) {
    // Right cursor key
    yRot += 1;
    }
    if (currentlyPressedKeys[38]) {
    // Up cursor key
    xRot -= 1;
    }
    if (currentlyPressedKeys[40]) {
    // Down cursor key
    xRot += 1;
    }
}

/**
 * 
 */
function addObject(obj){
    drawableObjects.push(obj);
}

/**
 * 
 */
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    if(useWhiteBackground){gl.clearColor(1.0,1.0,1.0,1.0);}
    else{gl.clearColor(0.0,0.0,0.0,1.0);}

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    setDrawColorUniform([1.0,0.4,1.0,1.0]);
    /* (vertical) field of view is 45° width-to-height ratio of our canvas, 
    won't see things closer than0.1 units to our viewpoint,
    wont' see things further than 100 units.
    */

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    mat4.identity(mvMatrix);


    mat4.translate(mvMatrix,[0.0,0.0,zoom]);

    //push matrix here?
    mat4.multiply(mvMatrix,worldRotationMatrix);
    mat4.rotate(mvMatrix,degToRad(xRot),[1,0,0]);
    mat4.rotate(mvMatrix,degToRad(yRot),[0,1,0]);

    if(showAxes){drawAxis();}        

    drawEyeVector();
    
    for(var i = 0 ; i< drawableObjects.length;i++){
	   var doo = drawableObjects[i];
	   doo.draw();
    }
    doneOnce = true;

}

/**
 * 
 */
function tick() {
    requestAnimFrame(tick);
    handleKeys();
    setDrawSettings();
    drawScene();
    //animate();
}

/**
 * 
 */
function setDrawSettings(){
    useWireFrame  = document.getElementById("wireFrameCheckBox").checked;
    useWhiteBackground =document.getElementById("whiteBackgroundCheckBox").checked;
    showAxes = document.getElementById("showAxesCheckBox").checked;
}

/**
 * 
 * @param e
 */
function mouseWheelEvent(e){
    var data = e;
    zoom += e.wheelDelta/100;
}

/**
 * @param e
 */
function mouseDownEvent(e){
    //if(document.getElementById('raysRB').checked){
	if(canvasMode == SB.CanvasMode.ROTATE){
		mouseRotate = true;
		mouseDrawRay = false;
		prevMouseX = e.clientX;
		prevMouseY = e.clientY;
		mouseDown = true;
		canvas.addEventListener("mousemove",mouseMoveEvent,false);
	}
	else if(canvasMode == SB.CanvasMode.PAN){}
	else if(canvasMode == SB.CanvasMode.SELECT){
		
		
	}
	else if(canvasMode == SB.CanvasMode.DRAW){
		var _x = e.pageX - canvas.offsetLeft;
		var _y = e.pageY - canvas.offsetTop;
		var _coord = get2dCoordsFromClick(_x,_y);
		var _tdCoord = get3dCoordsFromClick(_x,_y);
		_tdCoord[0] = _tdCoord[0].toFixed(2);
		_tdCoord[1] = _tdCoord[1].toFixed(2);
		_tdCoord[2] = _tdCoord[2].toFixed(2);
		shell.addPoint(_tdCoord);
		//console.log('add 2d point '+ _coord + ' to shell');
		console.log('add 3d point '+ _tdCoord + ' to shell');
	}
	else if(canvasMode == SB.CanvasMode.RAYS){
        mouseDrawRay = true;
		mouseRotate = false;
	
		canvas.removeEventListener("mousemove",mouseMoveEvent,false);
		var x = e.pageX - canvas.offsetLeft;
		var y = e.pageY - canvas.offsetTop;
		var returnVal = {}
		returnVal.x = x;
		returnVal.y = y;
		
		var p0,p1;
		p0 = unProject(new Point(x,y,0.0));    
		p1 = unProject(new Point(x,y,1.0));
		var line = new Line();
		line.setPoints(new Point(p0[0],p0[1],p0[2]),
	        	       new Point(p1[0],p1[1],p1[2]));
		addObject(line);
		drawScene();            
    }
    else{
    	//undefined or something
    }
}

/**
 * 
 * @param e
 */
function mouseUpEvent(e){
    mouseDown = false;
}

/**
 * 
 * @param e
 */
function mouseMoveEvent(e){
    if (!mouseDown) {
    	return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - prevMouseX
    var newRotationMatrix = mat4.create();
    mat4.identity(newRotationMatrix);
    mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

    var deltaY = newY - prevMouseY;
    mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

    mat4.multiply(newRotationMatrix, worldRotationMatrix, worldRotationMatrix);

    prevMouseX = newX
    prevMouseY = newY;

}

/**
 * 
 */
function webGLStart() {

    
    
    initEventListeners();
    initGL(canvas);
    initShaders();
    initAxis();
    
    
    var cube = new Cube();
    cube.setPoints(new Point(-2,2,2),
	    new Point(2,-2,2));
    cube.initVertexIndexBuffer();
    cube.setColor(new Color(1.0,0.0,0.0,1.0));
    addObject(cube);

    var sphere = new Sphere(); 
    sphere.setPoints(new Point(5.0,0.0,0.0),2.0);
    sphere.setColor(new Color(0.0,1.0,0.0,1.0));
    addObject(sphere);

    var cylinder = new Cylinder();
    cylinder.setPoints(cylStart,cylRad,cylHeight);
    cylinder.setColor(new Color(0.5,0.0,0.5,1.0));
    addObject(cylinder);


    var beamA = new SB.extrusion();
	beamA.setPoints(testPolygon,10);
	addObject(beamA);
	
	addObject(shell);

    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}

/**
 * 
 */
function drawAxis(){
    mvPushMatrix();
    gl.lineWidth(5.0);
    gl.bindBuffer(gl.ARRAY_BUFFER, xAxisBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
		3,
		gl.FLOAT,false,0,0);    
    setMatrixUniforms();
    setDrawColorUniform([1.0,0.0,0.0,1.0]);
    gl.drawArrays(gl.LINES,0,2);

    gl.bindBuffer(gl.ARRAY_BUFFER, yAxisBuffer);

    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
		3,
		gl.FLOAT,false,0,0);    
    setMatrixUniforms();
    setDrawColorUniform([0.0,1.0,0.0,1.0]);
    gl.drawArrays(gl.LINES,0,2);

    gl.bindBuffer(gl.ARRAY_BUFFER, zAxisBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
		3,
		gl.FLOAT,false,0,0);    
    setMatrixUniforms();
    setDrawColorUniform([0.0,0.0,1.0,1.0]);
    gl.drawArrays(gl.LINES,0,2);
    gl.lineWidth(1.0);
    mvPopMatrix();
}

/**
 * 
 */
function drawEyeVector(){
	var p = getEyeVector();
//	console.log('eye vector: ('+p[0]+','+p[1]+','+p[2]+')');

//    var eyeVecBuffer = gl.createBuffer();
//    gl.bindBuffer(gl.ARRAY_BUFFER,eyeVecBuffer);
//    vertices = [ 0.0, 0.0,  0.0,
//                 p[0],p[1], p[2]];
//
//    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW); 
//    mvPushMatrix();
//    gl.lineWidth(7.0);
//    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVecBuffer);
//    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
//		3,
//		gl.FLOAT,false,0,0);    
//    setMatrixUniforms();
//    setDrawColorUniform([1.0,0.0,0.0,1.0]);
//    gl.drawArrays(gl.LINES,0,2);
//    mvPopMatrix();

}


/**
 * 
 */
function initAxis(){
    xAxisBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,xAxisBuffer);
    vertices = [   0.0, 0.0,  0.0,
                 100.0, 0.0,  0.0];
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);

    yAxisBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,yAxisBuffer);
    vertices = [   0.0,   0.0,  0.0,
	0.0,  100.0,  0.0];

    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);

    zAxisBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,zAxisBuffer);
    vertices = [   0.0, 0.0,  0.0,
	0.0, 0.0, 100.0];

    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
}

/**
 * @event
 */
function initEventListeners(){
	var o = $("#selectable-draw-type");
	$("#selectable-draw-type").bind("selectableselected",
		function(event,ui){
			var selected = ui.selected.id;
			$('.draw-options-container').hide();
			switch(selected){
				case "selectable-draw-cube":
					$('#draw-cube-options-container').show();
					drawMode = SB.DrawMode.CUBE;
					break;
				case "selectable-draw-sphere":
					$('#draw-sphere-options-container').show();
					drawMode = SB.DrawMode.SPHERE;
					break;
				case "selectable-draw-cylinder":
					$('#draw-cylinder-options-container').show();
					drawMode = SB.DrawMode.CYLINDER;
					break;
				case "selectable-draw-shell":
					$('#draw-shell-options-container').show();
					drawMode = SB.DrawMode.SHELL;
					break;
			    default:
			    	drawMode = SB.DrawMode.UNDEFINED;
			    	break;
			}
			
			var _event = event;
			var _ui = ui;
		});
	
	$('.mouseClickRB').bind("click",function(event,ui){
		var button_id = event.currentTarget.id;
		switch(button_id){
			case "raysRB":
				canvasMode =  SB.CanvasMode.RAYS;
				break;
			case "rotateRB":
				canvasMode =  SB.CanvasMode.ROTATE;
				break;
			case "drawShapeRB":
				canvasMode =  SB.CanvasMode.DRAW;
				break;
			default:
				canvasMode = SB.CanvasMode.UNDEFINED;
				break;
		}
	});
	
    canvas = document.getElementById("glcanvas");
    canvas.addEventListener("mousewheel",mouseWheelEvent,false);
    canvas.addEventListener("mousedown",mouseDownEvent,false);
    document.addEventListener("mouseup",mouseUpEvent,false);

}

/**
 * 
 */
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        /*animation code goes here*/
    }
    lastTime = timeNow;
}
   
/**
 * 
 */
function drawNewCylinder(){
	var px = parseFloat($("#sb-input-pos-x").val());
	var py = parseFloat($("#sb-input-pos-y").val());
	var pz = parseFloat($("#sb-input-pos-z").val());
	var pLen = parseFloat($("#sb-shape-input-len").val());
	var pRad = parseFloat($("#sb-shape-input-radius").val());
	console.log('place at ('+px+','+py+','+pz+')');
	console.log('length = '+ pLen + ' , radius = ' + pRad);
	
    var cylinder = new Cylinder(new Point(px,py,pz),pRad,pLen);
    cylinder.setPoints(new Point(px,py,pz),pRad,pLen);
    cylinder.setColor(new Color(0.5,0.0,0.5,1.0));
    addObject(cylinder);
}

/**
 * 
 */
function createBeam(){
	var len = 25;
	beamA.setPoints(testPolygon,len);
	addObject(beamA);
	
}

/**
 *Gets the 
 * @param {Number} windowX
 * @param {Number} windowY
 * @returns {Array}
 */
function get2dCoordsFromClick(windowX,windowY){
	var orig = unProject(new Point(windowX,windowY,0.0));
	var dat = unProject(new Point(windowX,windowY,1.0));
	orig[1] *= -1;
	dat[1] *= -1;
	var D = [dat[0]-orig[0],dat[1]-orig[1],dat[2]-orig[2]];
   	var t = -1*orig[2]/D[2];
	var yCoord = orig[1] + D[1]*t;
	var xCoord = orig[0] + D[0]*t;
	var r = [xCoord,yCoord];
	return r;	
}


/**
 *Gets the 
 * @param {Number} windowX
 * @param {Number} windowY
 * @returns {Array}
 */
function get3dCoordsFromClick(windowX,windowY){
	var orig = unProject(new Point(windowX,windowY,0.0));
	var dat = unProject(new Point(windowX,windowY,1.0));
	orig[1] *= -1;
	dat[1] *= -1;
	var D = [dat[0]-orig[0],dat[1]-orig[1],dat[2]-orig[2]];
   	var t = -1*orig[2]/D[2];
	var yCoord = orig[1] + D[1]*t;
	var xCoord = orig[0] + D[0]*t;
	
    //mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    //mat4.identity(mvMatrix);
	var nmvMatrix = mat4.create(mvMatrix);
    mat4.translate(nmvMatrix,[0.0,0.0,-zoom]);
    //push matrix here?
    //mat4.multiply(mvMatrix,worldRotationMatrix);
    //mat4.rotate(mvMatrix,degToRad(xRot),[1,0,0]);
    //mat4.rotate(mvMatrix,degToRad(yRot),[0,1,0]);
	
	var r = [xCoord,yCoord,0.0,1.0];
	var ret = mat4.multiplyVec4(mat4.multiply(pMatrix,nmvMatrix),r);
	
	return [ret[0],ret[1],ret[2]];	
}
