function VertexPoint(x,y){
	var point = [x,y];
	var nextVertexPoint;
	this.x = function(){
		return point[0];
	};
	this.y = function(){
		return point[1];
	};
	
	this.nextPoint = function(){
		if
	}
	
	
}

function BeamProfile(){
	var vertexPoints=[];
	var profileLineColor = [0.0,0.0,1.0,1.0];
	
	this.getVertexPoint = function(index){
        if(index < vertexPoints.length && index > 0){
        	return vertexPoints[index];
        }
        else{return null;}
	};
	
	this.addVertexPoint = function(pt){
		vertexPoints.push(pt);
	}
	
	this.setLineColor =function(color){
		if(color instanceof Array){
			//color = [r,g,b,a]
		    this.profileLineColor=[color[0],color[1],color[2]],color || this.profileLineColor[3]];
		}
	}
	
}