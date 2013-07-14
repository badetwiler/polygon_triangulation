(function(){
    if(this.SB == undefined){
    	this.SB = {}
    }
}());
/**
 * @namespace
 */
SB.Math = {};
(function($) {
	/**
	 * Calculates the dot product of 2 2D Vectors
	 * @exports $.Dot2 as SB.Math.Dot2
	 * @function
	 * @param {Array} a 2D Vector
	 * @param {Array} b 2D Vector
	 * @returns {float} scalar return value
	 */
	$.Dot2 = function(a,b){
		//a dot b = c
		//leaving checks out for speed reasons...
//		if(!(a instanceof Array)||(a.length != 2)){return;}
//		if(!(b instanceof Array)||(b.length != 2)){return;};
		return a[0]*b[0] + a[1]*b[1];
	}
	
	/**
	 * Calculates the dot product of 2 3D Vectors
	 * @exports $.Dot3 as SB.Math.Dot3
	 * @function
	 * @param {Array} a 3D Vector
	 * @param {Array} b 3D Vector
	 * @returns {float} scalar return value
	 */
	$.Dot3 = function(a,b){
		//a dot b = c
		//leaving checks out for speed reasons...
//		if(!(a instanceof Array)||(a.length != 3)){return;}
//		if(!(b instanceof Array)||(b.length != 3)){return;};
		return a[0]*b[0] + a[1]*b[1] +a[2]*b[2];
	}
	

}(SB.Math));