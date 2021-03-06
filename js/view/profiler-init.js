    /* Global Variables   */ 
    var gl;
    var canvas;
    var mvMatrix = mat4.create();
    var mvMatrixStack = [];
    var pMatrix = mat4.create();
    var shaderProgram;
    var drawColor = new Float32Array(new ArrayBuffer(4)); 
    /*Global Options*/
    var useWireFrame;
    var useWhiteBackground;
    var showAxes;
    var horizGridBuffer;
    var vertGridBuffer;
    var xAxisBuffer;
    var yAxisBuffer;
    var global_error = 0x500;
    var global_max_triang_diam = 3.0;


    function mvPushMatrix() {
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
    }

    function mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        mvMatrix = mvMatrixStack.pop();
    }

    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

        /* needed for lighting
        var normalMatrix = mat3.create();
        mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);
        gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
        */
    }

   function setDrawColorUniform(color){
       drawColor = new Float32Array(color);
       gl.uniform4fv(shaderProgram.drawColor,new Float32Array(color));
   }
     
    /**
     * Converts degrees to radians
     * @param degrees
     * @returns {Number}
     */
    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
            //gl.frontFace(gCCW);
            console.log('viewportWidth: ' + gl.viewportWidth);
            console.log('viewportHeight: ' + gl.viewportHeight);

        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialize WebGL. It is recommended you use a Chrome browser and have a graphics card installed.");
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
        	console.log('returning null in getShader()');
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
    function initGrid(){
    	var min = -30.0;
    	var max =  30.0;
        horizGridBuffer=gl.createBuffer();
        vertGridBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,horizGridBuffer); 
        var horizGrid = [];

        for(var i=min; i<=max;i++){
        	horizGrid.push(min);
        	horizGrid.push(i);
        	horizGrid.push(0.0);
        	
        	horizGrid.push(max);
        	horizGrid.push(i);  
        	horizGrid.push(0.0);
        }
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(horizGrid),gl.STATIC_DRAW);
        horizGridBuffer.numPts = 2*(max-min+1);
        
        var vertGrid = [];
        gl.bindBuffer(gl.ARRAY_BUFFER,vertGridBuffer); 
        for(var i=min; i<=max;i++){
        	vertGrid.push(i);
        	vertGrid.push(min);
        	vertGrid.push(1.0);
        	
        	vertGrid.push(i);
        	vertGrid.push(max);
        	vertGrid.push(1.0);
        }
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertGrid),gl.STATIC_DRAW);
        vertGridBuffer.numPts = 2*(max-min+1);
    }
    
    /**
     * 
     */
    function initAxis(){
        xAxisBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,xAxisBuffer);
        vertices = [ -100.0, 0.0,  0.0,
                      100.0, 0.0,  0.0];
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);

        yAxisBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,yAxisBuffer);
        vertices = [ 0.0, -100.0, 0.0,
    	             0.0, 100.0, 0.0];

        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    }
    
    
    var clickPts= testPolygon;
    var clickPtsBuffer;
    
    
   /**
    * 
    */
    function drawPts(pts){

        clickPtsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,
                      clickPtsBuffer);

        gl.bufferData(gl.ARRAY_BUFFER,
                      new Float32Array(pts),
                      gl.STATIC_DRAW);
        gl.lineWidth(5.0);
        mvPushMatrix();
        gl.bindBuffer(gl.ARRAY_BUFFER,clickPtsBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
    		3,
    		gl.FLOAT,false,0,0);    
        setMatrixUniforms();
        setDrawColorUniform([0.0,0.0,1.0,1.0]);
        gl.drawArrays(gl.LINE_STRIP,0,pts.length/3);
        mvPopMatrix();
    }
    
    var tPolyBuffer;
    var _drawSolid = false;
    var _drawLines = true;
    var doneOnce = false;
    /**
     * 
     * @param tPoly
     */
    function drawTriangulatedPolygon(tPoly){
    	/**/
    	var pts=[];
    	var l = tPoly.length;
    	if(_drawSolid){
	    	for(var i = 0; i < l;i+=3){
	    		pts.push(tPoly[i].coord[0]);
	    		pts.push(tPoly[i].coord[1]);
	    		pts.push(0.0);
	    		
	    		pts.push(tPoly[i+1].coord[0]);
	    		pts.push(tPoly[i+1].coord[1]);
	    		pts.push(0.0);
	    		
	    		pts.push(tPoly[i+2].coord[0]);
	    		pts.push(tPoly[i+2].coord[1]);
	    		pts.push(0.0);
	    	}
	    	    	
	    	tPolyBuffer= gl.createBuffer();
	    	
	    	gl.bindBuffer(gl.ARRAY_BUFFER,tPolyBuffer);
	    	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pts),gl.STATIC_DRAW);

	    	gl.lineWidth(3.5);
	    	
	    	mvPushMatrix();
	    	//gl.bindBuffer(gl.ARRAY_BUFFER,tPolyBuffer);
	    	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
	    			3,
	    			gl.FLOAT,false,0,0);
	    	setMatrixUniforms();
	    	setDrawColorUniform([1.0,0.0,0.5,1.0]);
	    	gl.drawArrays(gl.TRIANGLES,0,pts.length/3);
	    	
	    	mvPopMatrix();
    	}
    	else if(_drawLines){
    		
	    	for(var i = 0; i < l;i+=3){
	    		
	    		pts.push(tPoly[i].coord[0].toFixed(1));
	    		pts.push(tPoly[i].coord[1].toFixed(2));
	    		pts.push(0.0);
	    
	    		pts.push(tPoly[i+1].coord[0].toFixed(1));
	    		pts.push(tPoly[i+1].coord[1].toFixed(1));
	    		pts.push(0.0);
	    		
	    		pts.push(tPoly[i+1].coord[0].toFixed(1));
	    		pts.push(tPoly[i+1].coord[1].toFixed(1));
	    		pts.push(0.0);
	    		
	    		pts.push(tPoly[i+2].coord[0].toFixed(1));
	    		pts.push(tPoly[i+2].coord[1].toFixed(1));
	    		pts.push(0.0);
	    		
	    		pts.push(tPoly[i+2].coord[0].toFixed(1));
	    		pts.push(tPoly[i+2].coord[1].toFixed(1));
	    		pts.push(0.0);
	    		
	    		pts.push(tPoly[i].coord[0].toFixed(1));
	    		pts.push(tPoly[i].coord[1].toFixed(1));
	    		pts.push(0.0);
	    	}
	    	
	    	tPolyBuffer= gl.createBuffer();
	    	
	    	gl.bindBuffer(gl.ARRAY_BUFFER,tPolyBuffer);
	    	gl.bufferData(gl.ARRAY_BUFFER,
                              new Float32Array(pts),
                               gl.STATIC_DRAW);	    	
	    	gl.lineWidth(3.5);
	    	mvPushMatrix();
	    	
	    	//gl.bindBuffer(gl.ARRAY_BUFFER,tPolyBuffer);
	    	
	    	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
	    			3,
	    			gl.FLOAT,false,0,0);
	    	
	    	setMatrixUniforms();
	    	
	    	setDrawColorUniform([1.0,0.0,0.5,1.0]);
	    	
	    	gl.drawArrays(gl.LINES,0,pts.length/3);
	    	if(!doneOnce)
	    	mvPopMatrix();    

    	}
    }


    function drawMonotonePolygons(tPoly){

    	var pts=[];
    	var l = tPoly.length;

	for(var i = 0; i < tPoly.length;i+=1) {
          for(var j = 0; j < tPoly[i].length-1; j+=1) {
		pts.push(tPoly[i][j].coord[0].toFixed(1));
		pts.push(tPoly[i][j].coord[1].toFixed(2));
		pts.push(0.0);
		pts.push(tPoly[i][j+1].coord[0].toFixed(1));
		pts.push(tPoly[i][j+1].coord[1].toFixed(2));
		pts.push(0.0);
          }
	    pts.push(tPoly[i][tPoly[i].length-1].coord[0].toFixed(1));
	    pts.push(tPoly[i][tPoly[i].length-1].coord[1].toFixed(2));
	    pts.push(0.0);
	    pts.push(tPoly[i][0].coord[0].toFixed(1));
	    pts.push(tPoly[i][0].coord[1].toFixed(2));
	    pts.push(0.0);
	}

	tPolyBuffer= gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER,tPolyBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,
		      new Float32Array(pts),
		       gl.STATIC_DRAW);	    	
	gl.lineWidth(3.5);
	mvPushMatrix();
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
			3,
			gl.FLOAT,false,0,0);

	setMatrixUniforms();
	setDrawColorUniform([1.0,0.0,0.5,1.0]);
   	gl.drawArrays(gl.LINES,0,pts.length/3);
	mvPopMatrix();    

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
            alert("Could not initialize shaders");
        }

        gl.useProgram(shaderProgram);
	    	
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        shaderProgram.drawColor = gl.getUniformLocation(shaderProgram, "uDrawColor");
        

        
        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        
        /*
         * uncomment below when using lighting
         */
    	//shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        //gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
        //shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
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
	    $("#tabs").height(300);
	    $("button").button();
	    $( "#max-diam-slider" ).slider({min:1,max:6});
	    $( "#max-diam-slider" ).width(200);
    	    global_max_triang_diam = $('#max-diam-slider').slider("value");
    });
