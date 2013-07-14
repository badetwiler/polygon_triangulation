(function(){
    if(this.SB == undefined){
    	this.SB = {}
    }
})();
/** Namespace which holds data structures
 *  (BSTs,linked-lists,etc)
 * @namespace
 */
SB.Data = {};
(function($) {
	/**
	 *@exports $ as SB.Data
	 */
	
	
	/**
	 * @class
	 * @constructor
	 * @author Ben Detwiler
	 */	
	$.RBtree = function(){

		COLOR = {RED:0,BLACK:1};

		var _NIL = {};
		_NIL.value='nil';
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

		var _leftRotate= function(x){
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
			else if(x.value === x.parent.left.value){
				x.parent.left = y;
			}
			else{
				x.parent.right = y;
			}
			y.left = x;
			x.parent = y;
		};


		var _rightRotate= function(y){
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
			else if(y.value == y.parent.right.value){
				y.parent.right = x;
			}
			else{
				y.parent.left = x;
			}
			x.right = y;
			y.parent = x;
		};

		var _insertFixup = function(z){
			/* pg 316 */
			var y,x;
			while(z.parent.color == COLOR.RED){
				if(z.parent.value == z.parent.parent.left.value){
					y = z.parent.parent.right;
					if(y.color == COLOR.RED){
						z.parent.color = COLOR.BLACK;
						y.color = COLOR.BLACK;
						z.parent.parent.color = COLOR.RED;
						z=z.parent.parent;
					}
					else if(z.value == z.parent.right.value){
						z = z.parent;
						_leftRotate(z);
					}
					else{
						z.parent.color = COLOR.BLACK;
						z.parent.parent.color = COLOR.RED;
						_rightRotate(z.parent.parent);
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
					else if(z.value === z.parent.left.value){
						z = z.parent;
						_rightRotate(z);
					}else{
						z.parent.color = COLOR.BLACK;
						z.parent.parent.color = COLOR.RED;
						_leftRotate(z.parent.parent);
					}
				}
			}//end while
			_root.color = COLOR.BLACK;
		}

		var _transplant = function(u,v){
			/* pg 323 */
			if(u.parent === _NIL){
				_root = v;
			}
			else if(u.value == u.parent.left.value){
				u.parent.left = v;
			}
			else{
				u.parent.right = v;
			}
			v.parent = u.parent;
		}  

		var _deleteFixup = function(x){
			/* pg 326 */
			var w;
			while((x.value != _root.value) &&
					(x.color == COLOR.BLACK)){
				if(x.value == x.parent.left.value){
					w = x.parent.right;
					if(w.color == COLOR.RED){
						w.color = COLOR.BLACK;
						x.parent.color = COLOR.RED;
						_leftRotate(x.parent);
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
						_rightRotate(w);
						w = x.parent.right;
					}
					else{
						w.color = x.parent.color;
						x.parent.color = COLOR.BLACK;
						w.right.color = COLOR.BLACK;
						_leftRotate(x.parent);
						x = _root;
					}
				}
				else{
					w = x.parent.left;
					if(w.color == COLOR.RED){
						w.color = COLOR.BLACK;
						x.parent.color = COLOR.RED;
						_rightRotate(x.parent);
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
						_leftRotate(w);
						w = x.parent.left;
					}
					else{
						w.color = x.parent.color;
						x.parent.color = COLOR.BLACK;
						w.left.color = COLOR.BLACK;
						_rightRotate(x.parent);
						x = _root;
					}
				}
			}//end while
			x.color = COLOR.BLACK;
		};


		/**Testing function
		 * @ignore
		 *
		 */
		this.testFn = function(){
			var node={
					value:10,
					left:_NIL,
					right:_NIL,
					parent:_NIL,
					color:COLOR.BLACK
			};
			if(node != _NIL){console.log('ok');}
			if(node !== _NIL){console.log('ok');}
			if(node.left != _NIL){console.log('ok');}
			if(node.left !== _NIL){console.log('ok');}
			if(node.left == _NIL){console.log('ok');}
			if(node.left === _NIL){console.log('ok');}
		};

		/**Inserts value in the red-black tree, auto rebalances
		 * will not insert duplicates
		 *@function 
		 *@param {int} val index value of leaf
		 *@param {Object} obj the object to be stored at the node
		 */
		this.insert = function(val,obj){  
			/*** pg 315 ***/
			var z={
					value:val,
					obj:obj,
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
				if(val < x.value){
					x = x.left;
				}
				else if(val > x.value){
					x = x.right
				}
				else{console.log('inserted duplicate'); return;}
			}
			z.parent = y;
			if(y ==_NIL){
				_root = z;
			}
			else if(val < y.value){
				y.left = z;
			}
			else{
				y.right = z;
			}
			_insertFixup(z);
		}
		this.contains=function(value){};

		/**Deletes value in the red-black tree
		 * does nothing if value does not exist
		 * auto rebalances
		 *@function 
		 *@param {int} val index value of leaf
		 */
		this.delete=function(val){
			/* pg 324 */
			var x,y;
			var y_orig_color;
			var z = _root;
			while(val != z.value && z != _NIL){
				if(val < z.value){
					z = z.left;
				}
				else{
					z = z.right;
				}
			}
			if(z == _NIL){
				console.log('value not found in tree');
				return;
			}
			y =z;
			y_orig_color = y.color;
			if(z.left == _NIL){
				x = z.right;
				_transplant(z,z.right);
			}
			else if(z.right == _NIL){
				x = z.left;
				_transplant(z,z.left);
			}
			else{
				y = _treeMinimum(z.right);
				y_orig_color = y.color;
				x = y.right;
				if(y.parent.value == z.value){
					x.parent = y;
				}
				else{
					_transplant(y,y.right);
					y.right = z.right;
					y.right.parent = y;
				}
				_transplant(z,y);
				y.left = z.left;
				y.left.parent = y;
				y.color = z.color;
			}
			if(y_orig_color == COLOR.BLACK){
				_deleteFixup(x);
			}
		};
		this.size=function(){};
		
		/**Prints Tree to console, in order
		 * @function
		 * @see <a href="http://stackoverflow.com/questions/3883780/javascript-recursive-anonymous-function">Recursive Anonymous Function</a>
		 */
		this.toArray=function(){
			var a = [];
			(function recursive(n){
				if(n !== _NIL){
					recursive(n.left);
					a.push(n.value);
					recursive(n.right);
				}
			})(_root);
			console.log(a);
		};

		this.toString=function(){};
	}

}(SB.Data));