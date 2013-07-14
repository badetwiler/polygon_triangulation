SB = SB || {};
/**Namespace which holds utility classes 
 * for drawing 2D or 3D models
 * @namespace
 */
SB.Draw = {};

(function($) {
  /**
   * @exports $ as SB.Draw
   */
	
	/**
	 * ENUM of vertex types 
	 */
	$.VERTEX_TYPE = {
			START:0,
			END:1,
			MERGE:2,
			SPLIT:3,
			UP:4,
			DOWN:5,
			UNKNOWN:6
	}
	
	
	/**
	 * 
	 */
	$.printVertexType = function(t){
		var str;
		switch(t){
		  case 0: str = "start"; break;
		  case 1: str = "end"; break;
		  case 2: str = "merge"; break;
		  case 3: str = "split"; break;
		  case 4: str = "up"; break;
		  case 5: str = "down"; break;
		  case 6: str = "unknown"; break;
		}
		console.log(str);
	}
	
	$.nullEdge = {};
	$.nullEdge.startVertex = null;
	$.nullEdge.endVertex = null;
	$.nullEdge.helper = null;

	$.nullVertex = {};
	$.nullVertex.point = null;

	/**Object representation of an edge of the polygon being drawn
	 * @private
	 * @class
	 * @param {_vertex} a Starting vertex
	 * @param {_vertex} b End vertex
	 * @property {_vertex} startVertex beginning vertex
	 * @property {_vertex} endVertex ending vertex
	 * @property {_vertex} helper helper vertex
	 * @property {Number} node number which vertex is in list
	 * @function {Number} y-value x-value intersect
	 */
	$.edge = function(a,b){
		/* a && b instanceof $.vertex*/
		this.startVertex = a;
		this.endVertex = b;
		this.helper = $.nullVertex;
		this.getXintersection = function(y){

			var A = this.startVertex.coord[1] - this.endVertex.coord[1];
			var B = this.endVertex.coord[0] - this.startVertex.coord[0];
			var C = this.startVertex.coord[0]*this.endVertex.coord[1] - 
			        this.startVertex.coord[1]*this.endVertex.coord[0];
			if(A == 0){/*lines are parallel, no intersection*/return null;}
			else{ return -1*(B*y + C)/A;}
		}
		this.node = -1;
	}
	
	/**
	 * @function
	 * @param {Number} y y-value of sweep line
	 * @return {Boolean} true if sweep line intersects the edge
	 */
	$.edge.prototype.sweepLineIntersects = function(y){
		if(_pointIsBetweenY(this.startVertex,this.stopVertex,y)){
			var xVal = this.getXintersection(y);
			if(_pointIsBetweenX(this.startVertex,this.stopVertex,xVal)){
				return true;
			}
		}
		return false;
	}
	
	/**
	 * 
	 */
	$.edge.prototype.isLeftOfPoint = function(x){
		if(this.startVertex.coord[0] < x && this.endVertex.coord[0] < x){return true;}
		return false;
	}
	
	/**
	 * 
	 */
	$.edge.prototype.setIsAscendingProperty = function(){
			var xVec = this.endVertex.coord[0] - this.startVertex.coord[0];
			var yVec = this.endVertex.coord[1] - this.startVertex.coord[1];
			if(yVec > 0){this.isAscending = true;}
			else if(yVec == 0 && xVec < 0){this.isAscending = true;}
			else{this.isAscending = false;}
	}
	
	/**
	 * Copies the the edge (.coord),
	 * type (.type) of the start and end vertex
	 * to create a new, copied SB.Draw.edge
	 * 
	 *  @returns (SB.Draw.edge) 
	 */
	$.edge.prototype.copy = function(){
		startVtx = new $.vertex(this.startVertex.coord);
		startVtx.type = this.startVertex.type;
		endVtx = new $.vertex(this.endVertex.coord);
		endVtx.type = this.endVertex.type;
		return new $.edge(startVtx,endVtx);
	}

	/**
	 * @param {Array} c xy-coordinates of vertex
	 * @constructor
	 * @class
	 */
	$.vertex = function(c){
		/*c instanceof Array && c.length==2 */
		this.coord = c;
		this.prevEdge = $.nullEdge;
		this.nextEdge =$.nullEdge;
		this.index =  -1;
		this.type = $.VERTEX_TYPE.UNKNOWN;
	}
	
	/**
	 * @function
	 */
	$.vertex.prototype.isLessThan = function(v){
			if(this.coord[1] < v.coord[1]){return true;}
			else if(this.coord[1] > v.coord[1]){return false;}
			else{
				if(this.coord[0] > v.coord[0]){return true;}
				else{return false;}
			}
	}
	
	/**
	 * @function
	 * @returns {Boolean}
	 */
	$.vertex.prototype.isGreaterThan = function(v){
			if(this.coord[1] > v.coord[1]){return true;}
			else if(this.coord[1] < v.coord[1]){return false;}
			else{
				if(this.coord[0] < v.coord[0]){return true;}
				else{return false;}
			}
	}

	/**
	 * @function
	 * @returns {Boolean}
	 */
	$.vertex.prototype.setVertexType = function(prev,next){
		
		/**
		 * @private
		 * @param q 2d vector
		 * @returns {Boolean}
		 */
		var _isAscending = function(q){
			if(q.y > 0){return true;}
			else if(q.y < 0){return false;}
			else{
				if(q.x < 0 ){return true;}
				else{return false;}
			}
		}
		
		/**
		 * @function
		 * @param {SB.Vec2} v vector to be rotated
		 * @returns {SB.Vec2} 90 degree CCW rotated vector
		 */
		var _Rotate90CCW = function(v){
			if(v instanceof SB.Vec2){
				var rotMat = [[0,-1],[1,0]];
				return v.preMultiply(rotMat);
			}
		}
		
		var u = new SB.Vec2([this.coord[0] - prev.coord[0],
		                     this.coord[1]-prev.coord[1]]);
		var u_perp = _Rotate90CCW(u);
		var v = new SB.Vec2([next.coord[0] - this.coord[0],
		                     next.coord[1] - this.coord[1]]);
		var dotVal;
		if(_isAscending(u)){
			if(_isAscending(v)){this.type= $.VERTEX_TYPE.UP;}
			else{
				dotVal = v.dot(u_perp);
				if(dotVal > 0){this.type= $.VERTEX_TYPE.START;}
				else if(dotVal < 0){this.type= $.VERTEX_TYPE.SPLIT;}
				else{ /*handle when dotVal == 0*/}
			}
		}
		else if(!_isAscending(u)){
			if(!_isAscending(v)){this.type = $.VERTEX_TYPE.DOWN;}
			else{
				dotVal = v.dot(u_perp);
				if(dotVal > 0){this.type = $.VERTEX_TYPE.END;}
				else if(dotVal < 0){this.type =  $.VERTEX_TYPE.MERGE;}
				else{ /*handle when dotVal == 0*/}
			}
		}
		
		//this.prevEdge = new $.edge(prev,this);
		if(prev.nextEdge == $.nullEdge){
			this.prevEdge = new $.edge(prev,this);
		}
		else{
			this.prevEdge = prev.nextEdge;
		}
		if(next.prevEdge == $.nullEdge){
			this.nextEdge = new $.edge(this,next);
		}
		else{
			this.nextEdge = next.prevEdge;
		}
		
	}/*end setVertexType*/
	
	
	/**
	 * @function
	 * @returns {Boolean}
	 */
	$.vertex.prototype.equals = function(v){
			if(this.coord[0] == v.coord[0] &&
			   this.coord[1] == v.coord[1]){return true;} 
			else{return false;}
	}	
	
	/**
	 * @function
	 * @returns {Boolean}
	 */
	$.vertex.prototype.isLeftOf = function(v){
			if(this.coord[0] < v.coord[0]){return true;}
			else{return false;}
	}	
	
	/* ********************************************************/
	/* ********************************************************/
	/* ********************************************************/
	
	/**Creates a polygon class used to draw 2D models, then extrude outwards 
	 * for 3D.  Has ability to triangulate any convex or non-convex polygon.
	 * @class
	 * @public
	 * @constructor
	 * @author Ben Detwiler
	 * @see <a href="file:///home/ben/workspace/SandBox/ref/triangulation.ps">Triangulation Algorithm</a> 
	 */
	$.polygon = function(){
		var _vertexes = [];
		var _addedVertices = [];
		var _monoPolygons = [];
		
        /** Used to add a vertex to a list when drawing 2D profile of 3D object
         * @function 
         * @param {Array} p xy-coordinates of point
         */
		this.addVertex = function(p){
			if(!(p instanceof Array) && p.length != 2){return;}
			_vertexes.push(new $.vertex(p));
		}		
		
        /** Used to add a vertex to a list when drawing 2D profile of 3D object
         * @function 
         * @param {Array[SB.Draw.vertex]} p SB.Draw.vertex array
         */
		this.setVertices = function(p){
			_vertexes = p;
		}		
		
        /** Used to add a vertex to a list when drawing 2D profile of 3D object
         * @function 
         * @param {Array} p xy-coordinates of point
         */
		this.addVertexBetween=function(thisVertex,v0,v1){
			var v = new $.vertex(thisVertex);
			var a, b;
			for(var i = 0;i < _vertexes.length;i++){
				if(_vertexes[i].equals(v0)){a = i;}
				if(_vertexes[i].equals(v1)){b = i;}
			}
			if(a != undefined && b != undefined){
				/*should check that a & b are next to each other and not the same*/
				if(a < b){
					_vertexes.splice(a+1,0,thisVertex);
				}
				else{
					_vertexes.splice(b+1,0,thisVertex);
				}
			}
		}

		/**Function which decomposes the current polygon down into a set
		 * of monotone polygons which can then be easily triagulated
		 * @function
		 * @param {[_vertex] v Array of vertices that make a closed polygon
		 */
        this.toMonotones = function(){
        	/*
        	 * need to order the points counter clockwise
        	 * sort vertices from top to bottom
        	 * (using quicksort for simplicity for now)
        	 * NEED to sort by x first for those vertexes with same y
        	 */ 
    		/**Red Black Tree to hold edges that intersect at a given y value
    		 * as the sweep is conducted top to bottom
    		 * @private
    		 * @field
    		 */
    		var _L = new $.edgeRBTree();
    		
    		var _ccwOrderedVertexes =$.sortVertexes(false,_vertexes);
    		
    		/* 
        	var _ccwOrderedVertexes = (function orderCCW(x){
                     //find index where vertex is highest
        		     //pop last off since its repeat of first
        		     if(x[0].equals(x[x.length-1])){
        		    	 x.pop();
        		     }
        		     var h = 0;
        		     var i = 0;
        		     var len = x.length;
        		     var newArr = [];
        		     var l;
        		     var goForward;
        		     // finds index of greatest point 
        		     for(i =1;i<len;i++){
        		    	 if(x[i].isGreaterThan(x[h])){h = i;}
        		     }
        		     i = 0;
        		     //decided to traverse array forward or backward
        		     if(h == len -1){
        		    	 //if last element
        		    	 if(x[h-1].isLeftOf(x[0])){goForward = false;}
        		    	 else{goForward = true;}
        		     }
        		     else if(h == 0){
        		    	 //if first element
        		    	 if(x[len-1].isLeftOf(x[h+1])){goForward = false;}
        		    	 else{goForward = true;}
        		     }
        		     else{
        		    	 if(x[h-1].isLeftOf(x[h+1])){goForward = false;}
        		    	 else{goForward = true;}
        		     }
        		     //should eventually conserve memory better here
        		     while(i<len && i >-1*len ){
        		    	 l = h + i;
        		    	 if(l >= len){l = l-len;}
        		    	 else if(l < 0){l = len + l;}
       		    		 newArr.push(x[l]);
        		    	 goForward ? i++ : i-- ;
        		     }
        		     
        		    // set the edges between vertexes
        		     newArr[0].setVertexType(newArr[len-1],newArr[1]);
        		     newArr[len-1].setVertexType(newArr[len-2],newArr[0]);
        		     for(i=1;i< len-1;i++){
        		    	 newArr[i].setVertexType(newArr[i-1],newArr[i+1]);        		    	 
        		     }     
        		     return newArr;
 	         })(_vertexes);
    		*/
    		
        	/**
        	 * Sort vertexes from top to bottom
        	 * in the case of same y value, the smaller
        	 * x-value is 'greater'
        	 */
        	var sv = (function quicksort(x){
        	           if(x.length <= 1){
        	               return x;
        	           }
        		   else{
        	              var len = x.length;
        	              var pivot_index = Math.round(((x.length-1)/2)+0.49);
        	              var pivot = x[pivot_index];
        	              var pivVal = pivot.coord[1];
        	              var less = [];
        	              var greater = [];
        	              for(var i=0;i<len;i++){
        	            	  if(i==pivot_index){continue;}
        	                  if(x[i].isLessThan(pivot)){
        	                      less.push(x[i]);
        			          }
        			          else{
        			              greater.push(x[i]);
        			          }
        	               }
        	 	       return quicksort(greater).concat(pivot).concat(quicksort(less)); 
        	           }
        	    })(_ccwOrderedVertexes);       	     
        	    
	        	
	        	/**Remove a given edge from the vertex RBtree based on node value
	        	 * 
	        	 * @param {Number} xIntersect
	        	 */
	        	var _removeEdgeFromTree=function(edge,h){
	        		_L.deleteNode(edge,h);
	        	}
        	
        	
	        	/**used to find if a point is located between 2 vertices
	        	 * @function
	        	 * @param {_vertex} one end of the line
	        	 * @param {_vertex} the other end of the line
	        	 * @param  {Number} the y-value in question,
	        	 * @returns {Boolean} true point is in between,vertically 
	        	 */
	        	var _pointIsBetweenY = function(a,b,y){
	        		var upperY,lowerY;
	        		if(a.coord[1] > b.coord[1]){
	        			upperY = a.coord[1];
	        			lowerY = b.coord[1];
	        		}
	        		else if(a.coord[1] < b.coord[1]){
	        			upperY = b.coord[1];
	        			lowerY = a.coord[1];
	        		}
	        		else{/*same y-coord*/return true;}
	        		if(y > lowerY && y < upperY){return true;}
	        		else{return false;}
	        	}
	        	
	        	/**used to find if a point is located between 2 vertices
	        	 * @function
	        	 * @param {_vertex} one end of the line
	        	 * @param {_vertex} the other end of the line
	        	 * @param  {Number} the x-value in question,
	        	 * @returns {Boolean} true point is in between,horizontally 
	        	 */
	        	var _pointIsBetweenX = function(a,b,x){
	        		var upperX,lowerX;
	        		if(a.coord[0] > b.coord[0]){
	        			upperX = a.coord[0];
	        			lowerX = b.coord[0];
	        		}
	        		else if(a.coord[0] < b.coord[0]){
	        			upperX = b.coord[0];
	        			lowerX = a.coord[0];
	        		}
	        		else{/*same x-coord*/return true;}
	        		if(x > lowerX && x < upperX){return true;}
	        		else{return false;}
	        	}
	        
	        	/** Draw diagonal from a to b
	        	 * @param {$.vertex} a
	        	 * @param {$.vertex} b
	        	 */
	        	var _addDiagonal = function(a,b){

	        		var newA = new $.vertex([a.coord[0],a.coord[1]]);
                    var newB = new $.vertex([b.coord[0],b.coord[1]]);

                    var newEdge1 = new $.edge(a,b);
                    var newEdge2 = new $.edge(newB,newA);
                    
                    newA.nextEdge = a.nextEdge;
                    newA.nextEdge.startVertex = newA;
                    newA.prevEdge = newEdge2;
                    newA.setVertexType(newA.prevEdge.startVertex,
                    		           newA.nextEdge.endVertex);
                    
                    newB.nextEdge = newEdge2;
                    newB.prevEdge = b.prevEdge;
                    newB.prevEdge.endVertex = newB;
                    newB.setVertexType(newB.prevEdge.startVertex,
         		                       newB.nextEdge.endVertex);
                    
                    a.nextEdge = newEdge1;
                    b.prevEdge = newEdge1;
                    a.setVertexType(a.prevEdge.startVertex,
                    		        a.nextEdge.endVertex);
                    b.setVertexType(b.prevEdge.startVertex,
            		                b.nextEdge.endVertex);
                    
                    /*probably don't need this*/
                    _addedVertices.push(newA);
                    _addedVertices.push(newB);
                 
                    return [newA,newB];
	        	} 
	        	
	        	var numVertexes = _vertexes.length;
	            var vert, lastVertex;
	            var edgeType;
	            var height;
	            var immLeft;
	            var e,e2;
	            var newVtxs;
	            
	            /*
	             * Actual code
	             */
	        	for(var i=0;i <numVertexes;i++){
	        		/* pop off highest node*/
	        		/* NOTE: need to make sure the x-value is sort properly
	        		 *       for vertexes with same y-coordinate value 
	        		 */
	        		vert = sv.shift();
	        		height = vert.coord[1];
	        		
	        		switch(vert.type){
		        		case $.VERTEX_TYPE.START:
		        			_L.insert(vert.nextEdge,height);
		        			vert.nextEdge.helper = vert;
		        			break;
		        		case $.VERTEX_TYPE.END:
		        			if(vert.prevEdge.helper.type == $.VERTEX_TYPE.MERGE){
		        				_addDiagonal(vert.prevEdge.helper,vert);
		        			}
		        			_L.deleteNode(vert.prevEdge,height);
		        			
		        			break;
		        		case $.VERTEX_TYPE.MERGE:
		        			_L.deleteNode(vert.prevEdge,height);
		        			if(vert.prevEdge.helper.type == $.VERTEX_TYPE.MERGE){
		        				_addDiagonal(vert.prevEdge.helper,vert);
		        			}
		        			
		        			immLeft = _L.getImmediateLeft(vert);
		        			/* might need a copy*/

		        			if(immLeft.helper.type == $.VERTEX_TYPE.MERGE){
		        				_addDiagonal(vert,immLeft.helper);
		        			}
		        			immLeft.helper = vert;
		        			 
		        			break;
		        		case $.VERTEX_TYPE.SPLIT:
		
		        			immLeft = _L.getImmediateLeft(vert);

		        			_addDiagonal(immLeft.helper,vert);
		        			immLeft.helper = vert;
		        			_L.insert(vert.nextEdge,height);

		        			break;
		        		case $.VERTEX_TYPE.UP:
		        			immLeft = _L.getImmediateLeft(vert);

		        			if(immLeft.helper.type == $.VERTEX_TYPE.MERGE){
		        				_addDiagonal(vert,immLeft.helper);
		        			}
		        			immLeft.helper = vert;
		        		
		        			break;
		        		case $.VERTEX_TYPE.DOWN:
		        			_L.deleteNode(vert.prevEdge,height);
		        			if(vert.prevEdge.helper.type == $.VERTEX_TYPE.MERGE){
		        				_addDiagonal(vert.prevEdge.helper,vert);
		        			}
		        			_L.insert(vert.nextEdge,height);
		        			vert.nextEdge.helper = vert;
		        			break;
		        		default:break;
	        		}
	        	}
         var temp;
         var cnt = -1;
         var monotonePolygons=[];
	     for(var b =0;b<_vertexes.length;b++){
	    	 if(_vertexes[b].type == $.VERTEX_TYPE.START){
	    		 cnt++;
	    		 console.log('START: ' + _vertexes[b].coord)
	    		 monotonePolygons[cnt] = [];
	    		 monotonePolygons[cnt].push(_vertexes[b]);
	    		 temp=_vertexes[b].nextEdge.endVertex;
	    		 while(temp.type != $.VERTEX_TYPE.START){
	    			 console.log(temp.coord);
	    			 monotonePolygons[cnt].push(temp);
	    			 temp=temp.nextEdge.endVertex;
	    		 }
	    		 console.log('END POLYGON');
	    	 } 
	     }
	     for(var b =0;b<_addedVertices.length;b++){
	     	 if(_addedVertices[b].type ==$.VERTEX_TYPE.START){
	     		 cnt++;
	    		 console.log('START: ' + _addedVertices[b].coord);
	    		 monotonePolygons[cnt] = [];
	    		 monotonePolygons[cnt].push(_addedVertices[b]);
	    		 temp=_addedVertices[b].nextEdge.endVertex;
	    		 while(temp.type != $.VERTEX_TYPE.START){
	    			 console.log(temp.coord);
	    			 monotonePolygons[cnt].push(temp);
	    			 temp=temp.nextEdge.endVertex;
	    		 }
    			 console.log('END POLYGON');
	     	 } 
	     }
	     return monotonePolygons;
        }
        /*end this.toMonotones */
        
        /**
         * Takes an array of monotone polygons, where a 
         * monotone polygone is an array of SB.Draw.vertexes;
         * @parram {Array[Array[SB.Draw.vertex]] 
         */
        this.triangulateMonotones = function(ms){
        	
            var SIDE = {RIGHT:0,LEFT:1,END:2,TOP:3}
            var sorted;
        	var currentMonotone;
            var point = {};
            point.side = SIDE.RIGHT;
            var stack = [];
        	var _triangles = [];
        	
        	
        	/**
        	 * divides a triangle up in to smaller ones with a max radius
        	 * 
        	 */
        	var _cutTriangle = function(p){
            	var REDUCT_SIZE = .707;
            	var a,b,c;
            	
        		var _length=function(u,v){
        			return Math.sqrt(Math.pow(u.coord[0]-v.coord[0],2),Math.pow(u.coord[1]-v.coord[1],2));
        		}
        		
        		var _cutOnce=function(p){
        			var x = (p[2].coord[0]+p[0].coord[0])/2;
        			var y = (p[2].coord[1]+p[0].coord[1])/2;
        			var d = new SB.Draw.vertex([x,y]);
        			return [p[0],p[1],d,
        			        d,p[1],p[2]];
        		}
        		
                var _cutTwice=function(p){
        			
        			
        			var x1 = (p[1].coord[0]+p[2].coord[0])/2;
        			var y1 = (p[1].coord[1]+p[2].coord[1])/2;
        			
        			var x2 = (p[2].coord[0]+p[0].coord[0])/2;
        			var y2 = (p[2].coord[1]+p[0].coord[1])/2;
        			
        			var d = new SB.Draw.vertex([x1,y1]);
        			var e = new SB.Draw.vertex([x2,y2]);
        			return [p[0],p[1],e,
        			        e,p[1],d,
        			        e,d,p[2] ];
        		}
                
                var _cutThree=function(p){
           			var x1 = (p[0].coord[0]+p[1].coord[0])/2;
        			var y1 = (p[0].coord[1]+p[1].coord[1])/2;
        			
        			var x2 = (p[1].coord[0]+p[2].coord[0])/2;
        			var y2 = (p[1].coord[1]+p[2].coord[1])/2;
        			
        			var x3 = (p[2].coord[0]+p[0].coord[0])/2;
        			var y3 = (p[2].coord[1]+p[0].coord[1])/2;
        			
        			var d = new SB.Draw.vertex([x1,y1]);
        			var e = new SB.Draw.vertex([x2,y2]);
        			var f = new SB.Draw.vertex([x3,y3]);
        			
        			
        			return [p[0],d,f,
        			        d,p[1],e,
        			        f,d,e,
        			        f,e,p[2]];
        		}
            	
            	/*
            	 * returns an array of SB.vertex such that moving forward in the array
            	 * would allow you to recover points a,b,c which are ordered from shortest 
            	 * to longest
            	 */
            	var _orderPts = function(_p){

            		/*
            		 * used for debugging purposes
            		 */
            		var _printFinalOrder = function(r){
            			console.log('ordered triangle to shrink');
            			console.log('   '+r[0].coord+' : length: ' + _length(r[0],r[1]));
            			console.log('   '+r[1].coord+' : length: ' + _length(r[1],r[2]));
            			console.log('   '+r[2].coord+' : length: ' + _length(r[2],r[0]));
            		}
            		//first find longest side
            		var a = _length(_p[0],_p[1]);
            		var b = _length(_p[1],_p[2]);
            		var c = _length(_p[2],_p[0]);
            		_p[0].n = a;
            		_p[1].n = b;
            		_p[2].n = c;
            		
            		_p[0].p = c;
            		_p[1].p = a;
            		_p[2].p = b;
            		
            		var temp;
            		
            		if(a > b){temp = a;a = b;b = temp;}
            		if(a > c){temp = a;a = c;c = temp;}
            		if(b > c){temp = b;b = c;c = temp;}

            		var _r = [];
            		for(var i=0;i<3;i++){
            			if(_p[i].n==a && _p[i].p==c){
            				for(var j=0;j<3;j++){
            					_r.push(_p[ i+j>2 ? i+j-3 : i+j ]);
            					_r[j].nextEdgeLength =p[i+j>2 ? i+j-3 : i+j ].n;
            					delete _r[j].n;
            					delete _r[j].p;
            				}
            				//_printFinalOrder(_r);
            				return _r;
            			}
            			if(_p[i].n==c && _p[i].p==a){
             				for(var j=0;j<3;j++){
            					_r.push(_p[ i-j<0 ? i-j+3 : i-j ]);
            					_r[j].nextEdgeLength =p[i-j<0 ? i-j+3 : i-j ].p;
            					delete _r[j].n;
            					delete _r[j].p;
            				}
             				//_printFinalOrder(_r);
            				return _r;
            			}
            		}
            		
            	}//end _orderPts()
            	
            	var _orderedPts = _orderPts(p);
            	a = _orderedPts[0].nextEdgeLength;
            	b = _orderedPts[1].nextEdgeLength;
            	c = _orderedPts[2].nextEdgeLength;
            	
            	console.log('(a,b,c) :' + [a,b,c]);
            	
            	
            	if(c > global_max_triang_diam){
	            	if(b/c <= REDUCT_SIZE){
	            		return _cutOnce(_orderedPts);
	            	}
	            	else if(a/c <= REDUCT_SIZE*REDUCT_SIZE){
	            		return _cutTwice(_orderedPts);
	            	}
	            	else{
	            		return _cutThree(_orderedPts);
	            	}
            	}
            	else{
            		return p;
            	}
            	
            	
            	
        	}//end _cutTriangle()
        	
        	
      		/**
    		 * 
    		 */
    		var _isConcave = function(next,curr,prev){
    		  	if(prev.coord[0] < curr.coord[0] && next.coord[0] < curr.coord[0] ){
    		  		return false;
    		  	}
    		  	if(prev.coord[0] > curr.coord[0] && next.coord[0] > curr.coord[0] ){
    		  		return false;
    		  	}
    		  	return true;
    		}
    		
    		/**
    		 * 
    		 */
    		var _triangulate = function(a,b,c){
    			_triangles.push(a);
    			_triangles.push(b);
    			_triangles.push(c);
    			console.log('triangle: ('+a.coord+'),('+b.coord+'),('+c.coord+')');
    		}
    		
    		/**returns true if vertex b is visible from vi, where
    		 * b is below a on the stack
    		 * @return {Boolean}
    		 */
    		var _isVisible = function(vi,a,b){
    			if(vi.side != a.side){console.log('vi and a not on same side: ' +
    					              vi.side + ' vs ' + a.side);return true;}
    			if(vi.side == SIDE.LEFT){
    				if(b.coord[0] < a.coord[0]){return false;}
    			}
    			else if(vi.side == SIDE.RIGHT){
    				if(b.coord[0] > a.coord[0]){return false;}
    			}
    			return true;
    		}
    		        	
        	/* begin triangluateMonotones() logic*/
        	for(var m =0;m < ms.length;m++){
        		/*find if its on right or left side*/
        		currentMonotone = ms[m];
        		var onLeft = true;
        		var p = 1;
        		console.log('***************************');
        		if(currentMonotone.length == 3){
        			/* already a triangle*/
        			_triangulate(currentMonotone[0],
        					     currentMonotone[1],
        					     currentMonotone[2]);
        			continue;
        			
        		}
        		currentMonotone[0].side = SIDE.TOP;
        		while(currentMonotone[p].type != $.VERTEX_TYPE.END){
        			currentMonotone[p].side = SIDE.LEFT;
        			p++;
        		}
        		currentMonotone[p].side = SIDE.END;
        		p++;
        		while(p < currentMonotone.length){
        			currentMonotone[p].side = SIDE.RIGHT;
        			p++;
        		}
        		/*sort top to bottom*/
        		/*quicksort*/
        		sorted = (function quicksort(x){
	     	       if(x.length <= 1){
	    	               return x;
	    	       }
	    		   else{
	    	              var len = x.length;
	    	              var pivot_index = Math.round(((x.length-1)/2)+0.49);
	    	              var pivot = x[pivot_index];
	    	              var pivVal = pivot.coord[1];
	    	              var less = [];
	    	              var greater = [];
	    	              for(var i=0;i<len;i++){
	    	            	  if(i==pivot_index){continue;}
	    	                  if(x[i].isLessThan(pivot)){
	    	                      less.push(x[i]);
	    			          }
	    	                  else{
	    			              greater.push(x[i]);
	    			          }
	    	               }
	    	 	       return quicksort(greater).concat(pivot).concat(quicksort(less)); 
	    	        }
	    	    })(currentMonotone);
        		
        	    /*now triangulate the sort vertices*/
                /* push first 2 verticies on to the stack*/
        		var vi;
        		var tNodes = [];
        		var nodesToTriangulate = [];
        		/*sl == stack length*/
        		var sl;
        		var prev;
        		var tempA,tempB;
        		
        		stack.push(sorted.shift());
        		stack.push(sorted.shift());
        		
        		while(sorted.length > 1){
        			/*look at the next node of the polygon*/
        			vi = sorted.shift();
        			sl=stack.length;
        			/*look at the last active node (previous)*/
        			u = stack[sl-1];
        			/*case1*/
        			/*if they are on the same side*/
        			if(vi.side == u.side){
        				if(_isConcave(vi,u,stack[sl-2])){
        					stack.push(vi);
        				}
        				else{ 
        					/*While visible, triangulate*/
        					while( sl >1 &&_isVisible(vi,u,stack[sl-2])){
        						u = stack.pop(); /* u = stack[stack.length -1]*/
        						sl -= 1;
        						_triangulate(vi,u,stack[sl-1]);
        						u = stack[sl -1];
        					}
        					stack.push(vi);
        				}
           			}    			
        			/*case 2*/
        			else{
        				tempA = stack[sl -1];
        				while(sl >1){
        					u = stack.pop();
        					sl = stack.length;
        					_triangulate(vi,u,stack[sl-1]);
        				}
        				stack.pop(); /*should be empty?*/
        				if(stack.length != 0){console.log('stack not empty');}
        				stack.push(tempA);
        				stack.push(vi);
        			}
        		}
    			vi = sorted.shift();
        		while(stack.length > 1){
        			u = stack.pop();
        			_triangulate(vi,u,stack[stack.length-1]);
        		}
        		stack.pop();
        	}/*end for-loop thru each monotone polygon*/
        	
        	/*
        	 * triangles can now be subdivided to have some maximum radius
        	 */
        	var cut;
        	var cutTriangles = [];
//        	for(var i=0;i<_triangles.length;i+=3){
//        		cut = _cutTriangle([_triangles[i],
//        		              _triangles[i+1],
//        		              _triangles[i+2]]);
//        		cutTriangles = cutTriangles.concat(cut);
//
//        	}
        	
        	
        	while(_triangles.length >2){
        		cut = _cutTriangle([_triangles.shift(),
              		                _triangles.shift(),
              		                _triangles.shift()]);
        		if(cut.length > 3){
        			_triangles = cut.concat(_triangles);
        		}
        		else{
        			cutTriangles = cutTriangles.concat(cut);
        		}
           	}
        	
        	
        	return cutTriangles;
        //return _triangles;		 
        		
        }
        	
     }


}(SB.Draw));

/*
 * The Red-Black Tree used in the polygon decomposition
 */
(function($) {
	/**
	 *@exports $ as SB.Draw
	 */
	
	
	/**
	 * @class
	 * @constructor
	 * @author Ben Detwiler
	 */	
	$.edgeRBTree = function(){

		COLOR = {RED:0,BLACK:1};

		var _NIL = {};
		_NIL.value=function(){return 'nil';};
		_NIL.obj='nil';
		_NIL.right = _NIL;
		_NIL.left = _NIL;
		_NIL.parent = _NIL;
		_NIL.color = COLOR.BLACK;

		var _root = _NIL;


		var _treeMinimum = function(x){
			while(x.left != _NIL){
				x = x.left;
			}
			return x;
		};

		var _treeMaximum = function(x){
			while(x.right != _NIL){
				x = x.right;
			}
			return x;
		};

		var _leftRotate= function(x,h){
			/* pg 313 */
			var y;
			y = x.right;
			x.right = y.left;
			if(y.left !== _NIL){
				y.left.parent = x;
			}
			y.parent = x.parent;
			if(x.parent === _NIL){
				_root = y;
			}
			else if(x.value(h) === x.parent.left.value(h)){
				x.parent.left = y;
			}
			else{
				x.parent.right = y;
			}
			y.left = x;
			x.parent = y;
		};


		var _rightRotate= function(y,h){
			var x;
			/* pg 313 */
			x = y.left;
			y.left = x.right;
			if(x.right !== _NIL){
				x.right.parent = y;
			}
			x.parent = y.parent;
			if(y.parent == _NIL){
				_root = x;
			}
			else if(y.value(h) == y.parent.right.value(h)){
				y.parent.right = x;
			}
			else{
				y.parent.left = x;
			}
			x.right = y;
			y.parent = x;
		};

		var _insertFixup = function(z,h){
			/* pg 316 */
			var y,x;
			while(z.parent.color == COLOR.RED){
				if(z.parent.value(h) == z.parent.parent.left.value(h)){
					y = z.parent.parent.right;
					if(y.color == COLOR.RED){
						z.parent.color = COLOR.BLACK;
						y.color = COLOR.BLACK;
						z.parent.parent.color = COLOR.RED;
						z=z.parent.parent;
					}
					else if(z.value(h) == z.parent.right.value(h)){
						z = z.parent;
						_leftRotate(z,h);
					}
					else{
						z.parent.color = COLOR.BLACK;
						z.parent.parent.color = COLOR.RED;
						_rightRotate(z.parent.parent,h);
					}
				}
				else{
					y = z.parent.parent.left;
					if(y.color == COLOR.RED){
						z.parent.color = COLOR.BLACK;
						y.color = COLOR.BLACK;
						z.parent.parent.color = COLOR.RED;
						z=z.parent.parent;
					}
					else if(z.value(h) === z.parent.left.value(h)){
						z = z.parent;
						_rightRotate(z,h);
					}else{
						z.parent.color = COLOR.BLACK;
						z.parent.parent.color = COLOR.RED;
						_leftRotate(z.parent.parent,h);
					}
				}
			}//end while
			_root.color = COLOR.BLACK;
		}

		var _transplant = function(u,v,h){
			/* pg 323 */
			if(u.parent === _NIL){
				_root = v;
			}
			else if(u.value(h) == u.parent.left.value(h)){
				u.parent.left = v;
			}
			else{
				u.parent.right = v;
			}
			v.parent = u.parent;
		}  

		var _deleteFixup = function(x,h){
			/* pg 326 */
			var w;
			while((x.value(h) != _root.value(h)) &&
					(x.color == COLOR.BLACK)){
				if(x.value(h) == x.parent.left.value(h)){
					w = x.parent.right;
					if(w.color == COLOR.RED){
						w.color = COLOR.BLACK;
						x.parent.color = COLOR.RED;
						_leftRotate(x.parent,h);
						w = x.parent.right;
					}
					if((w.left.color == COLOR.BLACK)&&
							(w.right.color == COLOR.BLACK)){
						w.color = COLOR.RED;
						x = x.parent;
					}
					else if(w.right.color == COLOR.BLACK){
						w.left.color = COLOR.BLACK;
						w.color = COLOR.RED;
						_rightRotate(w,h);
						w = x.parent.right;
					}
					else{
						w.color = x.parent.color;
						x.parent.color = COLOR.BLACK;
						w.right.color = COLOR.BLACK;
						_leftRotate(x.parent,h);
						x = _root;
					}
				}
				else{
					w = x.parent.left;
					if(w.color == COLOR.RED){
						w.color = COLOR.BLACK;
						x.parent.color = COLOR.RED;
						_rightRotate(x.parent,h);
						w = x.parent.left;
					}
					if((w.right.color == COLOR.BLACK)&&
							(w.left.color == COLOR.BLACK)){
						w.color = COLOR.RED;
						x = x.parent;
					}
					else if(w.left.color == COLOR.BLACK){
						w.right.color = COLOR.BLACK;
						w.color = COLOR.RED;
						_leftRotate(w,h);
						w = x.parent.left;
					}
					else{
						w.color = x.parent.color;
						x.parent.color = COLOR.BLACK;
						w.left.color = COLOR.BLACK;
						_rightRotate(x.parent,h);
						x = _root;
					}
				}
			}//end while
			x.color = COLOR.BLACK;
		};

		/**Inserts value in the red-black tree, auto rebalances
		 * will not insert duplicates
		 *@function 
		 *@param {int} val index value of leaf (x-intercept for a given Y)
		 *@param {Object} obj the object to be stored at the node
		 */
		this.insert = function(edge,h){  
			/*** pg 315 ***/
			var val = edge.getXintersection(h);
			var z={
					obj:edge,
					value:function(ht){return this.obj.getXintersection.call(this.obj,ht);},
					left:_NIL,
					right:_NIL,
					parent:_NIL,
					color:COLOR.RED
			};
			var current;
			var y = _NIL;
			var x = _root;
			while(x !== _NIL){
				y=x;
				if(val < x.value(h)){
					x = x.left;
				}
				else if(val > x.value(h)){
					x = x.right
				}
				else{console.log('$$ATTN: inserted duplicate'); return;}
			}
			z.parent = y;
			if(y ==_NIL){
				_root = z;
			}
			else if(val < y.value(h)){
				y.left = z;
			}
			else{
				y.right = z;
			}
			_insertFixup(z,h);
		}
		this.contains=function(value){};

		/**Deletes value in the red-black tree
		 * does nothing if value does not exist
		 * auto rebalances
		 *@function 
		 *@param {int} val index value of leaf
		 */
		this.deleteNode=function(edge,h){
			/* pg 324 */
			var val = edge.getXintersection(h);
			var x,y;
			var y_orig_color;
			var z = _root;
			var temp = z.value(h);
			while(z != _NIL && val != temp){
				if(val < z.value(h)){
					z = z.left;
				}
				else{
					z = z.right;
				}
				temp = z.value(h);
			}
			if(z == _NIL){
				console.log('$$ATTN: value not found in tree');
				return;
			}
			y = z;
			y_orig_color = y.color;
			if(z.left == _NIL){
				x = z.right;
				_transplant(z,z.right,h);
			}
			else if(z.right == _NIL){
				x = z.left;
				_transplant(z,z.left,h);
			}
			else{
				y = _treeMinimum(z.right,h);
				y_orig_color = y.color;
				x = y.right;
				if(y.parent.value(h) == z.value(h)){
					x.parent = y;
				}
				else{
					_transplant(y,y.right,h);
					y.right = z.right;
					y.right.parent = y;
				}
				_transplant(z,y,h);
				y.left = z.left;
				y.left.parent = y;
				y.color = z.color;
			}
			if(y_orig_color == COLOR.BLACK){
				_deleteFixup(x,h);
			}
		};
		
		/**
		 * @param {_vertex} vertex which is the reference
		 * 
		 */
		this.getImmediateLeft=function(vertex){
			var val = vertex.coord[0];
			var h = vertex.coord[1];
			var x = _root;
			var nearestLeft = _NIL;
			while(x!= _NIL){
				if(val >  x.value(h)){
					nearestLeft = x;
					x = x.right;
				}
				else{
					x=x.left;
				}
			}
			/* might need to make copy first, then return*/
			if(nearestLeft == _NIL){console.log('nearest left is NIL');return _NIL;}
			else{
//				console.log('nearest left: ' + 
//					         nearestLeft.obj.startVertex.coord +
//					         ' to ' +
//					         nearestLeft.obj.endVertex.coord + 
//					         ' ;helper: ' +
//					         nearestLeft.obj.helper.coord);
			    return nearestLeft.obj;
		    }
		};
		

		/**Prints Tree to console, in order
		 * @function
		 * @see <a href="http://stackoverflow.com/questions/3883780/javascript-recursive-anonymous-function">Recursive Anonymous Function</a>
		 */
		this.toArray=function(h){
			var a = [];
			(function recursive(n){
				if(n !== _NIL){
					recursive(n.left);
					a.push(n.value(h));
					recursive(n.right);
				}
			})(_root);
			console.log(a);
		};

		this.toString=function(){};
	}
	
	/**
	 * @param {Boolean} isCS True if sorting the vertexes in CW order, false
	 *if otherwise.  The vertex with the largest y-value will be the beginning of the 
	 *return array.   
	 *@param {Array[SB.draw.vertex]} x 
	 */
	$.sortVertexes = function(isCW,x){
		 /*find index where vertex is highest*/
	     /*pop last off since its repeat of first*/
	     if(x[0].equals(x[x.length-1])){
	    	 x.pop();
	     }
	     var h = 0;
	     var i = 0;
	     var len = x.length;
	     var newArr = [];
	     var l;
	     var gF;
	     /* finds index of the point with greatest y-value */
	     for(i =1;i<len;i++){
	    	 if(x[i].isGreaterThan(x[h])){h = i;}
	     }
	     i = 0;
	     /*decided to traverse array forward or backward*/
	     if(h == len -1){
	    	 /*if last element*/
	    	 if(x[h-1].isLeftOf(x[0])){if(isCW){gF = true;}else{gF=false;}}
	    	 else{if(isCW){gF = false;}else{gF=true;}}
	     }
	     else if(h == 0){
	    	 /*if first element*/
	    	 if(x[len-1].isLeftOf(x[h+1])){if(isCW){gF = true;}else{gF=false;}}
	    	 else{if(isCW){gF = false;}else{gF=true;}}
	     }
	     else{
	    	 if(x[h-1].isLeftOf(x[h+1])){if(isCW){gF = true;}else{gF=false;}}
	    	 else{if(isCW){gF = false;}else{gF=true;}}
	     }
	     /*should eventually conserve memory better here*/
	     while(i<len && i >-1*len ){
	    	 l = h + i;
	    	 if(l >= len){l = l-len;}
	    	 else if(l < 0){l = len + l;}
	    	 newArr.push(x[l]);
	    	 gF ? i++ : i-- ;
	     }
	     
	    /* set the edges between vertexes*/
	     newArr[0].setVertexType(newArr[len-1],newArr[1]);
	     newArr[len-1].setVertexType(newArr[len-2],newArr[0]);
	     for(i=1;i< len-1;i++){
	    	 newArr[i].setVertexType(newArr[i-1],newArr[i+1]);        		    	 
	     }     
	     return newArr;
	}
	

}(SB.Draw));
