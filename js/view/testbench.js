$(document).ready(init);

function init(){
	$('#doTestBtn').click(startTest);
	$('#doTestBtn2').click(anotherTest);
}

function Bar(x,y){
	this.x =  x;
	this.y = y;
}

function Foo(){
	var a = []
	var e = []
	this.addA = function(n){a.push(n);}
	this.setE = function(f){e = f;}
	this.getE = function(){return e;}
}

var foo;
function startTest(){
	var a = [1,2,3]; 
    var b = a[4];
    b = b|| a[1];
   	console.log('not b');

}

function anotherTest(){
	console.log(foo.getE());
}