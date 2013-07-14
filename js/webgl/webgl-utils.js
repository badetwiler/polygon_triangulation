

/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of one way or another.
 *
 * Instead of setting up a context manually it is recommended to
 * use. This will check for success or failure. On failure it
 * will attempt to present an approriate message to the user.
 *
 *       gl = WebGLUtils.setupWebGL(canvas);
 *
 * For animated WebGL apps use of setTimeout or setInterval are
 * discouraged. It is recommended you structure your rendering
 * loop like this.
 *
 *       function render() {
 *         window.requestAnimFrame(render, canvas);
 *
 *         // do rendering
 *         ...
 *       }
 *       render();
 *
 * This will call your rendering function up to the refresh rate
 * of your display but will stop rendering if your app is not
 * visible.
 */

WebGLUtils = function() {

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
var makeFailHTML = function(msg) {
  return '' +
    '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
    '<td align="center">' +
    '<div style="display: table-cell; vertical-align: middle;">' +
    '<div style="">' + msg + '</div>' +
    '</div>' +
    '</td></tr></table>';
};

/**
 * Mesasge for getting a webgl browser
 * @type {string}
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
var OTHER_PROBLEM = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';

/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @param {function:(msg)} opt_onError An function to call
 *     if there is an error during creation.
 * @return {WebGLRenderingContext} The created context.
 */
var setupWebGL = function(canvas, opt_attribs, opt_onError) {
  function handleCreationError(msg) {
    var container = canvas.parentNode;
    if (container) {
      var str = window.WebGLRenderingContext ?
           OTHER_PROBLEM :
           GET_A_WEBGL_BROWSER;
      if (msg) {
        str += "<br/><br/>Status: " + msg;
      }
      container.innerHTML = makeFailHTML(str);
    }
  };

  opt_onError = opt_onError || handleCreationError;

  if (canvas.addEventListener) {
    canvas.addEventListener("webglcontextcreationerror", function(event) {
          opt_onError(event.statusMessage);
        }, false);
  }
  var context = create3DContext(canvas, opt_attribs);
  if (!context) {
    if (!window.WebGLRenderingContext) {
      opt_onError("");
    }
  }
  return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
var create3DContext = function(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
}

return {
  create3DContext: create3DContext,
  setupWebGL: setupWebGL
};
}();

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();

/** Returns eye vector from where camera is in Model space
 * @function
 * @author Ben Detwiler
 * @returns {Array}
 */
function getEyeVector(){
    //formula from:  http://www.opengl.org/sdk/docs/man/xhtml/gluUnProject.xml
    //also worth a read:  http://myweb.lmu.edu/dondi/share/cg/unproject-explained.pdf
    //sp == screenPoint
    var sp = [0.0,0.0,0.0,1.0];
    var pvMatrix = mat4.create();
    var pvMatrixInv = mat4.create();
    var returnVec4 = [0,0,0,0];
    var View = {};

    //needs to be not hardcoded in for x & y
    View.x = 0;
    View.y = 0;
    View.width = gl.viewportWidth;
    View.height = gl.viewportHeight;

    mat4.multiply(pMatrix,mvMatrix,pvMatrix);
    mat4.inverse(pvMatrix,pvMatrixInv);

    mat4.multiplyVec4(pvMatrixInv,sp,returnVec4);
    
    if(returnVec4[3] === 0.0){
        console.log('unProject() has "w" value of 0'); 
        return [];
    }
    returnVec4[0] /= returnVec4[3];
    returnVec4[1] /= returnVec4[3];
    returnVec4[2] /= returnVec4[3];
//    console.log('eye vec: ('+ returnVec4[0] +','+ returnVec4[1]+','+ returnVec4[2]+')');
    return returnVec4;	
	
}

/**Unprojects a click on the screen, to 3D Model Space THIS NEEDS FIXED
 * @function
 * @param point xyz coordingates of point clicked
 * @see <a href="http://www.opengl.org/sdk/docs/man/xhtml/gluUnProject.xml">Background Formula</a>
 * @see <a href="http://myweb.lmu.edu/dondi/share/cg/unproject-explained.pdf">More Background</a>
 * @author Ben Detwiler
 */
function unProject(point){
    var sp = [point.x,point.y,point.z,1.0];
    var pvMatrix = mat4.create();
    var pvMatrixInv = mat4.create();
    var returnVec4 = [0,0,0,0];
    var View = {};

    //needs to be not hardcoded in for x & y
    View.x = 0;
    View.y = 0;
    View.width = gl.viewportWidth;
    View.height = gl.viewportHeight;

    mat4.multiply(pMatrix,mvMatrix,pvMatrix);
    mat4.inverse(pvMatrix,pvMatrixInv);

    /* map x & y from window coordinates*/
    sp[0] = (sp[0]-View.x)/View.width;
    sp[1] = (sp[1]-View.y)/View.height;
    /* map from -1 to 1 */
    sp[0] = sp[0] *2 -1;
    sp[1] = sp[1] *2 -1
    sp[2] = sp[2] - 1;
    
    mat4.multiplyVec4(pvMatrixInv,sp,returnVec4);
    
    if(returnVec4[3] === 0.0){
        console.log('unProject() has "w" value of 0'); 
        return [];
    }
    returnVec4[0] /= returnVec4[3];
    returnVec4[1] /= returnVec4[3];
    returnVec4[2] /= returnVec4[3]; 
    return returnVec4;
}

/**Returns the normalized value of the vector.  By definition
 * the magnitude == 1
 * @function
 * @param {Array} v 3D vector
 * @author Ben Detwiler
 */
function NormalizeVec3(v){
    var mag = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    return [v[0]/mag,v[1]/mag,v[2]/mag];   
}

/** Finds the normalized normal to vectors lm and ln
 * @function
 * @param {Array} l xyz-coordinates of point 
 * @param {Array} m xyz-coordinates of point 
 * @param {Array} n xyz-coordinates of point 
 * @returns Normalized Vector of length 3
 */
function getNormalizedNormal(l,m,n){
    //AB = m-l & AC = n-l
    // return = ABxAC
    var AB = [m[0]-l[0],m[1]-l[1],m[2]-l[2]];
    var AC = [n[0]-l[0],n[1]-l[1],n[2]-l[2]];
    var a = AB[0],b=AB[1],c=AB[2],d=AC[0],e=AC[1],f=AC[2];
   
    return NormalizeVec3([ b*f-c*e,c*d-a*f,a*e-b*d]);
}
/*
 * http://www.opengl.org/resources/faq/technical/transformations.htm

Given the current ModelView matrix, how can I determine the object-space location of the camera?
The "camera" or viewpoint is at (0., 0., 0.) in eye space. 
When you turn this into a vector [0 0 0 1] and multiply it by the inverse 
of the ModelView matrix, the resulting vector is the object-space location
 of the camera.
*/