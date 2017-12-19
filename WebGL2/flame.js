/**
 * flame.js
 * @fileoverview Demonstrates use of closure, Javascript canvas, as well as 
 * user interactivity to call OpenGL shaders and functions.
 * @author Alex Elson
 */

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' + 
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

var upd;

function main() {

  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  var len = cell.length;
  for(var i = 0; i < len; i++) {
	 cell_color[i]=([0.0,0.0,0.0,1.0]);
  }

  canvas.onmousemove = function(ev){ click(ev, gl, canvas, a_Position, u_FragColor) };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //Closure set up for the update function.
  upd = function(ev){ 
    update(ev, gl, canvas, a_Position, u_FragColor) 
  };

  setInterval(upd, 100);

}

var sizex = 60;
var sizey = 50;
var cell  = new Array(sizex*sizey);
var cell_color  = new Array(sizex*sizey);
var old_cell = new Array(sizex*sizey);
var rect;

/**
 * click - Draws in cells at the movement of the mouse
 * @param {Object} ev - event Object used for mousemove
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} canvas - the Javascript display window
 * @param {Object} a_Position - information related to vertex shader position
 * @param {Object} u_FragColor - information related to fragment shader color
 */
function click(ev, gl, canvas, a_Position, u_FragColor) {

  var x = Math.floor(ev.clientX/10);
  var y = Math.floor(ev.clientY/10);
  rect = ev.target.getBoundingClientRect();

  //Draw in cells at mouse clip
  cell[Math.floor(x)+Math.floor(y)*sizex] = 20;
  cell[Math.floor(x)+Math.floor(y)*sizex+1] = 20;
  cell[Math.floor(x)+Math.floor(y)*sizex-1] = 20;
  cell[Math.floor(x)+Math.floor(y)*sizex+sizex] = 20;
  cell[Math.floor(x)+Math.floor(y)*sizex-sizex] = 20;

}

/**
 * update - Animates the cells by sending data to the 
 *          shaders and then drawing the arrays.
 * @param {Object} ev - event Object used for mousemove
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} canvas - the Javascript display window
 * @param {Object} a_Position - information related to vertex shader position
 * @param {Object} u_FragColor - information related to fragment shader color
 */
function update(ev, gl, canvas, a_Position, u_FragColor){

  old_cell = cell;
  for(var n=0; n<cell.length; n+=1){
    var c = 0;
      if (cell[n+1] >=10 ){ c+=1; }
      if (cell[n-1] >= 10 ){ c+=1; }
      if (cell[n+sizex] >= 10 ){ c+=1; }
      if (cell[n-sizex] >= 10 ){ c+=1; }
      if (cell[n+1+sizex] >= 10){ c+=1; }
      if (cell[n-1+sizex] >= 10 ){ c+=1; }

    if (c==0){
      if (cell[n+1] >=1 ){ c+=1; }
      if (cell[n-1] >= 1 ){ c+=1; }
      if (cell[n+sizex] >= 1 ){ c+=1; }
      if (cell[n-sizex] >= 1 ){ c+=1; }
      if (cell[n+1+sizex] >= 1){ c+=1; }
      if (cell[n-1+sizex] >= 1 ){ c+=1; }
      if (c==3){ old_cell[n] = old_cell[n]-1; }
      if (c<=2 || c>4){ old_cell[n] = 0; }
    }else{

      if (c==3){ old_cell[n] = 20; }
      if (c<=3 || c>3){ old_cell[n] -= 5; }
    }


  }
  cell = old_cell;

  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = cell.length;
  for(var n = 0; n < len; n++) {

    if (cell[n]>=15){
      cell_color[n] = ([1.0,0.8,0.0,1.0]);
    }else if (cell[n]>=1){
      cell_color[n] = ([1.0,0.0,0.0,1.0]);
    }

    if (cell[n]==0){
      cell_color[n] = ([0.0,1.0,0.0,1.0]);
    }

    var rgba = cell_color[n];

     if (rgba[0]>0.0){ //Makes sure the cell is not empty.
      x = Math.floor(n%60)*10;
      y = Math.floor(n/60)*10;

      xx = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
      yy = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

      gl.vertexAttrib3f(a_Position, xx, yy, 0.0);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.drawArrays(gl.POINTS, 0, 1);
     }
  }


}
