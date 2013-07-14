/**
 * @author <a href="mailto:bendetwiler@gmail.com">Ben Detwiler</a>
 */


/**
 * @namespace SB
 */
SB = {};

(function($) {
	/**
	 * @exports $.2dPoint as SB.Point2d
	 * @class
	 * @constructor
	 */
	$.Point2d = function(){
		if(arguments.length = 2){
			this.x = arguments[0];
			this.y = arguments[1];
		}
		else if(arguments.length == 1 && 
			    (arguments instanceof Array)){
			this.x = arguments[0][0];
			this.y = arguments[0][1];
		}
	}
	
	/**
	 * @exports $.Vec2 as SB.Vec2
	 * @class
	 * @constructor
	 */
    $.Vec2 = function(){
    	var tempX = 0,tempY = 0;
    	var a,b;
    	if(arguments.length = 1){
    		a = arguments[0];
    		if(a instanceof Array && a.length==2){
    			tempX = a[0];
    			tempY = a[1];
    		}
    	}
    	else if(arguments.length = 2){
    		a = arguments[0];
    		b  = arguments[1];
    		tempX = b[0]-a[0];
    		tempY = b[1]-a[1];
    	}
    	
    	this.x = tempX;
    	this.y = tempY;
    }
    
	/** 
	 * @function
	 * @param {SB.Vec2|Array} b 2D vector
	 * @returns {float} scalar value of dot product
	 */
    $.Vec2.prototype.dot = function(b){
    	if(b instanceof $.Vec2){
    		return this.x*b.x + this.y*b.y; 
    	}
    	else if(b instanceof Array){
    		return this.x*b[0] +this.y*b[1];
    	}
    }
    
	/** 
	 * @function
	 * @param {Array[Array]} m 2x2 matrix
	 * @returns {SB.Vec2} 2D vector
	 */
    $.Vec2.prototype.preMultiply = function(m){
    	//I assumed 2x2 matrix...should clarify
    	var rows = m.length;
    	var cols = m[0].length;
    	var ret = new Array(rows);
    	var thisVec = [this.x,this.y];
    	for(var i = 0;i < rows;i++){
    		ret[i] = 0;
    	}
    	for(var r = 0;r < rows;r++){
    		for(var c = 0;c<cols;c++){
    			ret[r] += m[r][c]*thisVec[c];
    		}
    	}
    	return new $.Vec2([ret[0],ret[1]]);
    }
    
	
}(SB));


