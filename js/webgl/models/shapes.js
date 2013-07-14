ls
console.log('shapes.js loaded');

function Point(x,y,z){
    this.x = x;
    this.y = y;
    this.z = z;
}

function Color(r,g,b,a){
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
}

/*****************************************************/

function Shape(position) {
    this.position = position;
    this.color;
}

Shape.prototype.setColor = function(color){
    this.color = color;
}

Shape.prototype.initVertexPositionBuffer = function(vertices,itemSize,numItems){
    this.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = itemSize;
    this.vertexPositionBuffer.numItems = numItems;
}

Shape.prototype.draw2dBoundingVolume = function(){}

Shape.prototype.initVertexNormalBuffer = function(vertexNormals,itemSize,numItems){
    this.vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertexNormals), gl.STATIC_DRAW);
    this.vertexNormalBuffer.itemSize = itemSize;
    this.vertexNormalBuffer.numItems = numItems;
}

Shape.prototype.initVertexColorBuffer =  function(colors,itemSize,numItems){
    this.vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
    this.vertexColorBuffer.itemSize = itemSize;
    this.vertexColorBuffer.numItems = numItems;
}


Shape.prototype.initVertexIndexBuffer =  function(vertexIndices,itemSize,numItems){
    this.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(vertexIndices),gl.STATIC_DRAW);
    this.vertexIndexBuffer.itemSize = itemSize;
    this.vertexIndexBuffer.numItems = numItems;
}

Shape.prototype.draw = function(){
    mvPushMatrix();
    if(!(this.position === undefined)){
        mat4.translate(mvMatrix,[this.position.x,this.position.y,this.position.z]);
    }

    if(!(this.color === undefined)){
        setDrawColorUniform([this.color.r,this.color.g,this.color.b,this.color.a]);
    }
    //need to do rotation 
    //maybe need to set gl.bindBuffer to a null value to clear buffer

/*
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
                               this.vertexColorBuffer.itemSize,
                               gl.FLOAT, false, 0,0);
  */
  
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                               this.vertexPositionBuffer.itemSize,
                               gl.FLOAT, false, 0,0);
    
    //console.log('test vector: ('+this.vertexPositionBuffer[0]+','+this.vertexPositionBuffer[1]+','+this.vertexPositionBuffer[2]+')');
    
    	
    if(!(this.vertexNormalBuffer === undefined)){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                               this.vertexNormalBuffer.itemSize,
                               gl.FLOAT, false, 0,0);
    }

    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(useWireFrame ? gl.LINE_STRIP : gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);


    //    gl.drawArrays(useWireFrame ? gl.LINES : gl.TRIANGLES,
    //              0,this.vertexPositionBuffer.numItems);

    mvPopMatrix();
}

/************************************************/

 Cube.prototype = new Shape();
 Cube.prototype.constructor = Cube;
 function Cube(position){
     Shape.call(this,position);
     this.drawStyle = gl.LINES;
 }


Cube.prototype.initVertexIndexBuffer = function(){
        var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];

        var itemSize = 1;
        var numItems = 36;
	Shape.prototype.initVertexIndexBuffer.call(this,cubeVertexIndices,itemSize,numItems);
}



Cube.prototype.setPoints = function(p0,p1){
    //check that these are Point objects
    var l = p1.x - p0.x;
    //make 8 verticles
    var xMin = p0.x;
    var xMax = p1.x;
    var yMin = p0.y - l;
    var yMax = p0.y;
    var zMin = p0.z - l;
    var zMax = p0.z;

    var v0 = new Point(xMin,yMax,zMax);//maybe work on fn overloading
    var v1 = new Point(xMin,yMin,zMax);
    var v2 = new Point(xMax,yMin,zMax);
    var v3 = new Point(xMax,yMax,zMax);

    var v4 = new Point(xMax,yMin,zMin);
    var v5 = new Point(xMin,yMin,zMin);
    var v6 = new Point(xMin,yMax,zMin);
    var v7 = new Point(xMax,yMax,zMin);
	
    this.vertices = [
            // Front face
	        v0.x, v0.y , v0.z,//0 
	        v1.x, v1.y , v1.z,//1
	        v2.x, v2.y , v2.z,//2
	        v3.x, v3.y , v3.z,//3
 
           // Back face
		v4.x, v4.y , v4.z,
		v5.x, v5.y , v5.z,
		v6.x, v6.y , v6.z,
		v7.x, v7.y , v7.z,
 
           // Top face
		v0.x, v0.y , v0.z,
		v3.x, v3.y , v3.z,
		v7.x, v7.y , v7.z,
		v6.x, v6.y , v6.z,

            // Bottom face
		v1.x, v1.y , v1.z,
		v5.x, v5.y , v5.z,
		v4.x, v4.y , v4.z,
		v2.x, v2.y , v2.z,
           // Right face
		v2.x, v2.y , v2.z,
		v4.x, v4.y , v4.z,
		v7.x, v7.y , v7.z,
         	v3.x, v3.y , v3.z,
 
           // Left face
		v0.x, v0.y , v0.z,
		v6.x, v6.y , v6.z,
		v5.x, v5.y , v5.z,
		v1.x, v1.y , v1.z
         ];
        
     normals = []
    var fnt = getNormalizedNormal([v0.x, v0.y , v0.z], 
                                  [v1.x, v1.y , v1.z],
	                              [v2.x, v2.y , v2.z]);
    var bk = getNormalizedNormal([v4.x, v4.y , v4.z], 
                                 [v5.x, v5.y , v5.z],
	                             [v6.x, v6.y , v6.z]);
    var tp = getNormalizedNormal([v0.x, v0.y , v0.z], 
                                 [v3.x, v3.y , v3.z],
	                             [v7.x, v7.y , v7.z]);
    var btm = getNormalizedNormal([v1.x, v1.y , v1.z], 
                                  [v5.x, v5.y , v5.z],
	                              [v4.x, v4.y , v4.z]);
    var r = getNormalizedNormal([v2.x, v2.y , v2.z], 
                                [v4.x, v4.y , v4.z],
	                            [v7.x, v7.y , v7.z]);
    var l = getNormalizedNormal([v0.x, v0.y , v0.z], 
                                [v6.x, v6.y , v6.z],
	                            [v5.x, v5.y , v5.z]);

    normals = [
	fnt[0],fnt[1],fnt[2],
	fnt[0],fnt[1],fnt[2],
	fnt[0],fnt[1],fnt[2],
	fnt[0],fnt[1],fnt[2],
	bk[0],bk[1],bk[2],
	bk[0],bk[1],bk[2],
	bk[0],bk[1],bk[2],
	bk[0],bk[1],bk[2],
      	tp[0],tp[1],tp[2],
      	tp[0],tp[1],tp[2],
      	tp[0],tp[1],tp[2],
      	tp[0],tp[1],tp[2],
      	btm[0],btm[1],btm[2],
      	btm[0],btm[1],btm[2],
      	btm[0],btm[1],btm[2],
      	btm[0],btm[1],btm[2],
        r[0],r[1],r[2],
        r[0],r[1],r[2],
        r[0],r[1],r[2],
        r[0],r[1],r[2],
        l[0],l[1],l[2],
        l[0],l[1],l[2],
        l[0],l[1],l[2],
        l[0],l[1],l[2]];
     
    console.log(fnt);
    console.log(bk);
    console.log(tp);
    console.log(btm);
    console.log(r);
    console.log(l);

    Shape.prototype.initVertexPositionBuffer.call(this,this.vertices,3,24);
    Shape.prototype.initVertexNormalBuffer.call(this,this.vertices,3,24);
}


/************************************************/

 Sphere.prototype = new Shape();
 Sphere.prototype.constructor = Sphere;
 function Sphere(p,r){
     Shape.call(this,p);
     this.radius = r;

 }

Sphere.prototype.setPoints = function(p,r){
        this.position = p;
        var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = r;

        var vertexPositionData = [];
        var normalData = [];
   
        for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;

                normalData.push(x);
                normalData.push(y);
                normalData.push(z);
                vertexPositionData.push(radius * x);
                vertexPositionData.push(radius * y);
                vertexPositionData.push(radius * z);
            }
        }

        var indexData = [];
        for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }

    Shape.prototype.initVertexPositionBuffer.call(this,vertexPositionData,3,vertexPositionData.length/3);

    Shape.prototype.initVertexIndexBuffer.call(this,indexData,1,indexData.length);

    Shape.prototype.initVertexNormalBuffer.call(this,normalData,3,normalData.length/3);

}

/************************************************/
 Line.prototype = new Shape();
 Line.prototype.constructor = Line;

function Line(){
    Shape.call(this);
 }

Line.prototype.setPoints = function(p0,p1){
    var v = [p1.x-p0.x,
             p1.y-p0.y,
             p1.z-p0.z];
   
    var scale = 700;

   var vertexPositions = [p0.x,p0.y,p0.z,
                          p0.x+scale*v[0],p0.y+scale*v[1],p0.z+scale*v[2] ];

    Shape.prototype.initVertexPositionBuffer.call(this,vertexPositions,3,2);

    var indexData = [0,1];
    Shape.prototype.initVertexIndexBuffer.call(this,indexData,1,2);

}

Line.prototype.draw = function(){
    mvPushMatrix();
//    mat4.translate(mvMatrix,[this.position.x,this.position.y,this.position.z]);
    //need to do roation 
    //maybe need to set gl.bindBuffer to a null value to clear buffer
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                               this.vertexPositionBuffer.itemSize,
                               gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    setMatrixUniforms();

    gl.drawElements(gl.LINES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();
}

/************************************************/

 Cylinder.prototype = new Shape();
 Cylinder.prototype.constructor = Cylinder;
function Cylinder(p,r,h){
     Shape.call(this,p);
     this.drawStyle = gl.LINES;
     this.radius = r;
     this.height = h;
 }

Cylinder.prototype.setPoints = function(p,r,h){
        this.position = p;
        var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = r;
        var n = 36;
        var vertexPositionData = [];
        var normalData = [];
        var faceNormals = [];
        var indexData = [];
        var bFaceVertexData = [];
        var faceVertexData = [];
        var y = p.y;
        var x,z, theta;
        var center = [p.x,p.y,p.z];
        var height = h;
        var v1,v2,v3;

    /***look at single circular face for vertex points***/
    for(var i = 0; i < n; i++){
        theta = i*2*Math.PI/n;
        x = Math.cos(theta);
        z = Math.sin(theta);

        faceNormals.push(x);
        faceNormals.push(0);
        faceNormals.push(z);

        faceVertexData.push(x*radius + p.x);
        faceVertexData.push(y);
        faceVertexData.push(z*radius + p.z);

        bFaceVertexData.push(x*radius + p.x);
        bFaceVertexData.push(y-height);
        bFaceVertexData.push(z*radius + p.z);
    }

    /*** Top Face ***/
    /*** Top Center ***/
    vertexPositionData.push(p.x);
    vertexPositionData.push(p.y);
    vertexPositionData.push(p.z);
        normalData.push(0);
        normalData.push(1);
        normalData.push(0);
    for(var i = 0; i<n; i++){
        vertexPositionData.push(faceVertexData[i*3]);
        vertexPositionData.push(faceVertexData[i*3+1]);
        vertexPositionData.push(faceVertexData[i*3+2]);
        normalData.push(0);
        normalData.push(1);
        normalData.push(0);
    }

    /*** Bottom Face   ***/
    /*** Bottom Center ***/
    vertexPositionData.push(p.x);
    vertexPositionData.push(p.y-height);
    vertexPositionData.push(p.z);
        normalData.push(0);
        normalData.push(-1);
        normalData.push(0);
    for(var i = 0; i < n; i++){
        vertexPositionData.push(bFaceVertexData[i*3]);
        vertexPositionData.push(bFaceVertexData[i*3+1]);
        vertexPositionData.push(bFaceVertexData[i*3+2]);
        normalData.push(0);
        normalData.push(-1);
        normalData.push(0);
    }
    /*** do indexes ***/
    /***    top    ***/
    //console.log('**top face**');
    for(var i = 1; i <= n; i++){
        v1 = 0;
        v2 = i;
        if(i == 1){v3=n;}
        else{v3=i-1;}  
        indexData.push(v1);
        indexData.push(v2);
        indexData.push(v3);
        //console.log('['+v1+','+v2+','+v3+']');
    }
    /*** bottom     ***/
    //console.log('**bottom face**');
    for(var i = n+2; i <= 2*n+1; i++){
        v1=n+1;
        v2 = i;
        if(i == 2*n+1){v3=n+2;}
        else{v3=i+1;} 
        indexData.push(v1);
        indexData.push(v2);
        indexData.push(v3);
        //console.log('['+v1+','+v2+','+v3+']');
    }
    
    for(var i=0;i<n;i++){
        vertexPositionData.push(faceVertexData[i*3]);
        vertexPositionData.push(faceVertexData[i*3+1]);
        vertexPositionData.push(faceVertexData[i*3+2]);
        normalData.push(faceNormals[i*3]);
        normalData.push(faceNormals[i*3+1]);
        normalData.push(faceNormals[i*3+2]);

    } 
    
    for(var i=0;i<n;i++){
        vertexPositionData.push(bFaceVertexData[i*3]);
        vertexPositionData.push(bFaceVertexData[i*3+1]);
        vertexPositionData.push(bFaceVertexData[i*3+2]);
        normalData.push(faceNormals[i*3]);
        normalData.push(faceNormals[i*3+1]);
        normalData.push(faceNormals[i*3+2]);

    }
    
    var topOS = 2*n+2;
    var botOS = 3*n+2;
    //console.log('(topOS,botOS): ('+topOS+','+botOS+')');
    //console.log('**side part 1**');
    for(var i=0;i < n;i++){
	v1 = i + topOS;
        v2 = i+1+topOS;
        if(v2 == botOS){v2=topOS;}
        v3 = i + botOS;    
        indexData.push(v1);
        indexData.push(v2);
        indexData.push(v3);
        //console.log('['+v1+','+v2+','+v3+']');
    } 
//    console.log('**side part 2**');
    for(var i=0;i < n;i++){
	v1 = i + botOS;
        v2 = i+1+botOS;
        if(v2 == (botOS+n)){v2=botOS;}
        v3 = i + topOS +1;
        if(v3 == botOS){v3=topOS;}            
        indexData.push(v1);
        indexData.push(v2);
        indexData.push(v3);
       // console.log('['+v1+','+v2+','+v3+']');
    } 

    Shape.prototype.initVertexPositionBuffer.call(this,vertexPositionData,3,vertexPositionData.length/3);

    Shape.prototype.initVertexIndexBuffer.call(this,indexData,1,indexData.length);

    Shape.prototype.initVertexNormalBuffer.call(this,normalData,3,normalData.length/3);

}
