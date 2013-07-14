SB = SB || {};

//SB.td = {};

(function($){
	

	/**
	 * @contructor
	 * 
	 */
	$.extrusion = function(){}
	/*
	 * Inherits from Shape which is defined in sb-shapes.js
	 */
	$.extrusion.prototype = new Shape();
	$.extrusion.prototype.constructor = $.extrusion;
	
	
	
	/**Given a 2d profile of points, extrude out, length of len
	 * The first and last points of profile may or may not be the same
	 * @param {Array[int]} profile array of 2d points which are the x,y coords of each vertex
	 * @param {int} length the extrude
	 * @param{Array} vertices empty array
	 * @param{Array} normals empty array
	 * @param{Array} indices empty array
	 */
	$.extrusion.prototype.setPoints = function(profile,len) { 
		var vd = [];
		var nd = [];
		var id = [];

		/**
		 * @param {Array[float} p 2d array (xy-coord)to add
		 * @param {float} z the z-value
		 */
		var _addVertex = function(p){
			    vd.push(p[0]);
			    vd.push(p[1]);
			    vd.push(p[2]);
		}
		
		/**
		 * @param {Array[SB.Draw.vertex]} t Three (3) vertexes of the triangle
		 * @param {float} z z-coordinate
		 */
		var _addTriangle = function(isCW,t,z){
			/* find order for CCW traversal*/
			var a,b,c,gF;
			/*sort highest to lowest*/
			var p = SB.Draw.sortVertexes(isCW,t)
			if(p[1].isLeftOf(p[0])){gF=true;}
			else{gF=false;}
			if(gF){
				a = [t[0].coord[0],t[0].coord[1],z];
				b = [t[1].coord[0],t[1].coord[1],z];
				c = [t[2].coord[0],t[2].coord[1],z];
			}
			else{
				a = [t[0].coord[0],t[0].coord[1],z];
				b = [t[2].coord[0],t[2].coord[1],z];
				c = [t[1].coord[0],t[1].coord[1],z];
			}
			_addVertex(a);
			_addVertex(b);
			_addVertex(c);
		}
		
		
		/**
		 * add the normalized normal vector to this.normals
		 * uses function getNormalizedNormal(l,m,n) defined in 
		 * webgl-utils.js
		 * 
		 */
		var _addNormal = function(l,m,n){
			    /*{Array[float] v 3 dimensional vector*/
				var v = getNormalizedNormal(l,m,n);
				nd.push(v[0]);
				nd.push(v[1]);
				nd.push(v[2]);
		}
		
		/**
		 * @param {Array[float]} v 3d array (xyz-coord)to add
		 */
		var _addNormVec = function(v){
			nd.push(v[0]);
			nd.push(v[1]);
			nd.push(v[2]);
		}
		
		var pts = profile;
		var len = len;
		var v = [];
		
		/*
		 * if profile is not an array of SB.Draw.vertex, then
		 * convert from 2d array to that
		 */
		
	    var trig = new SB.Draw.polygon();

		if(!(profile[0] instanceof SB.Draw.vertex)){
			for(var i =0;i<profile.length;i+=3){
				v.push(new SB.Draw.vertex([profile[i],profile[i+1]]));
				trig.addVertex([profile[i],profile[i+1]]);
			}
		}
		else{v = profile;}
		
		/*
		 * STEP 0
         * Sort so that vertices are CW, top to bottom
         * 
         * NOTE: might have to remove repeated first and last vertex
         * if that is the case
         * 
		 */
    	 v = SB.Draw.sortVertexes(true,v);
		
		/*
		 * STEP 1
		 * Using outer circumference of points, generate the points and normals
		 * of the extruded edges
		 */
		 var defZ = 0.0;
		 var backZ = defZ - len;
		 var numPts = v.length;
		 var n = v.length;
		 var botOS = n;
		 var topOS = 0;
		 var v1,v2,v3;
		 var norm = getNormalizedNormal;
		 var a,b,c;
         var index = 0;
         
		 for(var i=0; i<n; i++){
			 v1 = i;
			 v2 = i + 1;
			 v3 = i;
			 if(v2 == n){v2=0;}
			 //if(v3 >= n){v3 = v3-n;}
			 
			 a = [v[v1].coord[0],v[v1].coord[1],defZ];
			 b = [v[v2].coord[0],v[v2].coord[1],defZ];
			 c = [v[v3].coord[0],v[v3].coord[1],backZ];
			 
    		 _addVertex(a);
	         _addVertex(b);
	         _addVertex(c);
			 
//			 id.push(v1);
//			 id.push(v2);
//			 id.push(v3+n);
//			 
			 _addNormal(a,b,c);//var testPolygon = [-3.00,-3.10,0.0,
//           -5.54,0.45,0.0,
//           -2.55,0.10,0.0,
//           -1.55,4.10,0.0,
//           -4.10,2.20,0.0,
//           -5.10,4.40,0.0,
//           -2.40,6.10,0.0,
//           1.90,2.40,0.0,
//           4.10,7.10,0.0,
//           4.87,4.41,0.0,
//           6.17,6.56,0.0,
//           5.25,1.04,0.0,
//           -3.00,-3.10,0.0];

			 _addNormal(b,c,a);
			 _addNormal(c,a,b);		
	    	 id.push(index++);
	    	 id.push(index++);
	    	 id.push(index++);
		 }
		 
	    for(var i=1;i <= n;i++){
		    v1 = i;
	        v2 = i;
	        v3 = i-1;
	        if(v1 == n){v1=0;v2=0;}
	        
			 a = [v[v1].coord[0],v[v1].coord[1],defZ];
			 b = [v[v2].coord[0],v[v2].coord[1],backZ];
			 c = [v[v3].coord[0],v[v3].coord[1],backZ];
			 
    		 _addVertex(a);
	         _addVertex(b);
	         _addVertex(c);
			 
//			 id.push(v1);
//			 id.push(v2+n);
//			 id.push(v3+n);
	         
	    	 id.push(index++);
	    	 id.push(index++);
	    	 id.push(index++);
			 
			 _addNormal(a,b,c);
			 _addNormal(b,c,a);
			 _addNormal(c,a,b);	
	    } 
		
		/*
		 * STEP 1.5
		 * triangulate faces
		 */
		
//	    var trig = new SB.Draw.polygon();
//	    trig.setVertices(v);
	    var monotones = trig.toMonotones();
	    /*
	     *tpa ==triangle points array
	     *just an array of all points...taking off groups of 
	     * 3 starting at beginning will form each triangle 
	     */
	    var tpa = trig.triangulateMonotones(monotones);
	    var m = tpa.length;
	    var goClockwise;
		/*//var testPolygon = [-3.00,-3.10,0.0,
//                    -5.54,0.45,0.0,
//                    -2.55,0.10,0.0,
//                    -1.55,4.10,0.0,
//                    -4.10,2.20,0.0,
//                    -5.10,4.40,0.0,
//                    -2.40,6.10,0.0,
//                    1.90,2.40,0.0,
//                    4.10,7.10,0.0,
//                    4.87,4.41,0.0,
//                    6.17,6.56,0.0,
//                    5.25,1.04,0.0,
//                    -3.00,-3.10,0.0];

		 * STEP 2
		 * add front face vertices, and normalbs
		 */
//	     var index = 2*n;
	     for(var i = 0;i<m; i+=3){
	    	 goClockwise = false;
			 _addTriangle(goClockwise,
					      [tpa[i],tpa[i+1],tpa[i+2]],
					      defZ);    	 
	    	 _addNormVec([0.0,0.0,1.0]);
	    	 _addNormVec([0.0,0.0,1.0]);
	    	 _addNormVec([0.0,0.0,1.0]);
	    	 id.push(index++);
	    	 id.push(index++);
	    	 id.push(index++);
	     }
		/*
		 * STEP 3
		 * add back face vertices, and normals
		 * (make sure to flip everything)
		 */
	     for(var i = 0;i<m; i+=3){
	    	 goClockwise = true;
	    	 _addTriangle(goClockwise,
				          [tpa[i],tpa[i+1],tpa[i+2]],
				          backZ);
	    	 _addNormVec([0.0,0.0,-1.0]);
	    	 _addNormVec([0.0,0.0,-1.0]);
	    	 _addNormVec([0.0,0.0,-1.0]);
	    	 id.push(index++);
	    	 id.push(index++);
	    	 id.push(index++);
	     }
	     console.log("index data...");
	     for(var i =0;i<id.length;i+=3){
	    	 console.log([id[i],id[i+1],id[i+2]]);
	     }
	     
	     Shape.prototype.initVertexPositionBuffer.call(this,vd,3,vd.length/3);
	     Shape.prototype.initVertexIndexBuffer.call(this,id,1,id.length);
	     Shape.prototype.initVertexNormalBuffer.call(this,nd,3,nd.length/3);
	}
	
}(SB))