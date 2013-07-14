console.log('myscript.js loadedu');
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
var cylStart = new Point(10.0,2.0,0.0);
var cylRad = 3.0;
var poly = new SB.Draw.polygon();



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
    //mat4.perspective(10, gl.viewportWidth / gl.viewportHeight, -1.0, 1.0, pMatrix);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    mat4.identity(mvMatrix); 


    mat4.translate(mvMatrix,[0.0,0.0,zoom]);

    //push matrix here?
    //mat4.multiply(mvMatrix,worldRotationMatrix);
    //mat4.rotate(mvMatrix,degToRad(xRot),[1,0,0]);
    //mat4.rotate(mvMatrix,degToRad(yRot),[0,1,0]);

    if(showAxes){drawAxis();}  
    drawGrid();
    //drawClickPts();
    drawTriangulatedPolygon(tp); 
    
    
//    for(var i = 0 ; i< drawableObjects.length;i++){
//	   var doo = drawableObjects[i];
//	   doo.draw();
//    }
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
 * 
 */
function drawGrid(){
    mvPushMatrix();
    gl.lineWidth(2.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, horizGridBuffer);

    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
		3,
		gl.FLOAT,false,0,0);    
    setMatrixUniforms();
    setDrawColorUniform([1.0,0.0,0.0,1.0]);
    gl.drawArrays(gl.LINES,0,horizGridBuffer.numPts);
	if(!doneOnce)
    	console.log("error code after draw horizGrid: " + gl.getError().toString(16))

    gl.bindBuffer(gl.ARRAY_BUFFER, vertGridBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
		3,
		gl.FLOAT,false,0,0);    
    setMatrixUniforms();
    setDrawColorUniform([0.0,1.0,0.0,1.0]);
    gl.drawArrays(gl.LINES,0,vertGridBuffer.numPts);
	if(!doneOnce)
    	console.log("error code after draw vertGrid: " + gl.getError().toString(16));

    mvPopMatrix();	
}

/**
 * 
 * @param e
 */
function mouseDownEvent(e){
	if(document.getElementById('assignPtRB').checked){
		var x = e.pageX - canvas.offsetLeft;
		var y = e.pageY - canvas.offsetTop;
		var coord = get2dCoordsFromClick(x,y);
		coord[0] = coord[0].toFixed(2);
		coord[1] = coord[1].toFixed(2);
		console.log(coord);
		poly.addVertex(coord);
		clickPts.push(coord[0]);
		clickPts.push(coord[1]);
		clickPts.push(0.0);
	}
	
   
    if(document.getElementById('raysRB').checked){
        mouseDrawRay = true;
		mouseRotate = false;
	
		canvas.removeEventListener("mousemove",mouseMoveEvent,false);
		var x = e.pageX - canvas.offsetLeft;
		var y = e.pageY - canvas.offsetTop;
		var returnVal = {}
		returnVal.x = x;
		returnVal.y = y;
	
		//    var returnVal = {x:x,y:y};
		var p0,p1;
		p0 = unProject(new Point(x,y,0.0));    
		p1 = unProject(new Point(x,y,1.0));
		var line = new Line();
		line.setPoints(new Point(p0[0],p0[1],p0[2]),
	        	       new Point(p1[0],p1[1],p1[2]));
		addObject(line);
		drawScene();            
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

 var tp;
function webGLStart() {


    initEventListeners();
    initGL(canvas);
    initShaders();
    initAxis();
    initGrid();


//    var cylinder = new Cylinder();
//    cylinder.setPoints(cylStart,cylRad,cylHeight);
//    cylinder.setColor(new Color(0.5,0.0,0.5,1.0));
//    addObject(cylinder); 


    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    tp = triangulate(testPolygon);

    tick();

}

/**
 * 
 */
function initEventListeners(){
    canvas = document.getElementById("glcanvas");

    canvas.addEventListener("mousewheel",mouseWheelEvent,false);
    canvas.addEventListener("mousedown",mouseDownEvent,false);
    document.addEventListener("mouseup",mouseUpEvent,false);
    $('#max-diam-slider').bind("slidechange",
    		function(event,ui){
    	    global_max_triang_diam = $('#max-diam-slider').slider("value");
    	    console.log('slider value set to ' + global_max_triang_diam);
    	    tp = triangulate(testPolygon);
    });
	
}

/**
 * 
 */
function drawAxis(){
    mvPushMatrix();
    gl.lineWidth(7.0);
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
	if(!doneOnce)
    	console.log("error code after drawAxis: " + gl.getError().toString(16))

    mvPopMatrix();
}


function drawEyeVector(){
	var p = getEyeVector();
	//console.log('eye vector: ('+p[0]+','+p[1]+','+p[2]+')');

    var eyeVecBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,eyeVecBuffer);
    vertices = [ 0.0, 0.0,  0.0,
                 p[0],p[1], p[2]];

    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW); 
    mvPushMatrix();
    gl.lineWidth(7.0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVecBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
		3,
		gl.FLOAT,false,0,0);    
    setMatrixUniforms();
    setDrawColorUniform([1.0,0.0,0.0,1.0]);
    gl.drawArrays(gl.LINES,0,2);
    mvPopMatrix();

}

var lastTime = 0;
var cylUp = false;
 
function animate() {		
	var u = unProject(new Point(x,y,0.0));
    u[2] *= -1;
    console.log('click in window at: ('+u[0] +','+u[1]+','+u[2]+')');
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        if(cylUp){
	if(cylHeight < 8.0){
                cylHeight += .1;
            }
            else{
                cylUp = false;
            }
        }
        else{
	if(cylHeight > 0.0){
                cylHeight -= .1;
            }
            else{
                cylUp = true;
            }
        }
    }
    lastTime = timeNow;
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
    
function triangulate(vertexArray){
	var numPoints = vertexArray.length;
	var polygon = new SB.Draw.polygon();
	var monos;
	for(var i = 0;i < numPoints;i+=3){
		polygon.addVertex( [vertexArray[i],vertexArray[i+1] ]);
	}
	monos = polygon.toMonotones();
	return polygon.triangulateMonotones(monos);
	
}   


/******************************/
/*  Jquery UI Functionality   */
/******************************/