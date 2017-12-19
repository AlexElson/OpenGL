/**
 * texture.js
 * @fileoverview Game with logic and score. Demonstrates
 * two textures mapped.
 * @author Alex Elson (Oleksiy Al-saadi)
 */

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform mat4 u_ModelMatrix;\n' +

  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +

  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +

  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor  = texture2D(u_Sampler, v_TexCoord) + v_Color;\n' +
  '}\n';

function main() {

  var canvas = document.getElementById('webgl');
  
  var gl = getWebGLContext(canvas);
  
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  
  var modelMatrix = new Matrix4();
  var model = new Float32Array([]);
  var colored = new Float32Array([]);
  var n = initVertexBuffers(gl, model, colored);

  initTextures(gl, n);
  
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);



  //Get the storage location of a_Position, assign and enable buffer
  var FSIZE = model.BYTES_PER_ELEMENT;

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  // Texture coordinates
  var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_TexCoord);  // Enable the buffer assignment

  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

  // Model Matrix index
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

  // Color index
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*3, 0);
  gl.enableVertexAttribArray(a_Color);

  //Object game arrays
  var sx = new Array(5);
  var sy = new Array(5);
  for(var m = 0; m < sx.length; m++){
    sx[m]=Math.floor(Math.random() * 5)-2;
    sy[m]=Math.floor(Math.random() * 5);    
  }


  tick = function(ev) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    draw(gl, ev, model, colored, modelMatrix, n, a_Position, a_TexCoord, u_Sampler, u_ModelMatrix, a_Color, sx, sy);
    requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
  };
  tick();
}





var angle=0;
var speed = .01;
var score = 0;
var lost = 0;

/**
 * draw - Game Logic. Rendering of Models and Textures
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} ev - event Object
 * @param {Array} model - Square model array of floats
 * @param {Array} colored - Foreground model array of floats
 * @param {Object} modelMatrix - Matrix to apply transformations to model
 * @param {Integer} n - Number of vetices for model
 * @param {Object} a_Position - index related to vertex shader position
 * @param {Object} a_TexCoord - index related to fragment shader color
 * @param {Object} u_Sampler - index related to texCoord in shader
 * @param {Object} u_ModelMatrix - index related to ModelMatrix shader position
 * @param {Object} a_Color - index related to the color attribute
 * @param {Array} sx - Object x location array
 * @param {Array} sy - Object y location array
 */
function draw(gl, ev, model, colored, modelMatrix, n, a_Position, a_TexCoord, u_Sampler, u_ModelMatrix, a_Color, sx, sy){


  /////////////////////////////////PLANETS
  gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);

  var FSIZE = model.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.disableVertexAttribArray(a_Color);
  gl.enableVertexAttribArray(a_TexCoord);

  angle+=(1+speed);
  speed+=.00007;
  gl.uniform1i(u_Sampler, 1);

  for(var m = 0; m < sx.length; m++){
    if (sy[m] <= -5 ){ 
      sx[m] = Math.floor(Math.random() * 5) - 2;
      pxx = sx[m]; 
      sy[m] = Math.floor(Math.random() * 5) + 4;
      score+=1;
    }else{
      if (lost==0){ sy[m]-=speed/2; }
    }

    if (sy[m] < -2 && sy[m] > -2.7 && sx[m] == px && lost == 0){
      alert("You lose!");
      lost = 1;
    }

    modelMatrix.setScale(.3,.3,1);
    modelMatrix.translate(sx[m], sy[m] ,0);
    modelMatrix.rotate(angle, 0, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
  }

  //////////////////////////////SPACESHIP
  gl.uniform1i(u_Sampler, 0);
  modelMatrix.setScale(.3,.3,1);
  modelMatrix.translate(px-.2,-2.5,0);
  modelMatrix.rotate(-44, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);

  ///////////////////////////////COLORED TRIANGLE

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  //gl.bufferData(gl.ARRAY_BUFFER, colored, gl.STATIC_DRAW);

  var FSIZE = colored.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  gl.enableVertexAttribArray(a_Color);
  gl.disableVertexAttribArray(a_TexCoord);

  modelMatrix.setScale(.3,.3,1);
  modelMatrix.translate(pxx,+3,0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

  ///////////////////////////////SCORE
  document.getElementById("score").innerHTML = score;

}



var modelBuffer;
var colorBuffer;
/**
 * initVertexBuffers - Initialize Vertex Buffers and Model and Colored
 * @param {Object} gl - the WebGL rendering context
 * @param {Array} model - Square model array of floats
 * @return {Integer} n - number of vertices
 */
function initVertexBuffers(gl, model, colored) {
  model = new Float32Array([
    -0.5,  0.5,   0.0, 1.0,
    -0.5, -0.5,   0.0, 0.0,
     0.5,  0.5,   1.0, 1.0,
     0.5, -0.5,   1.0, 0.0,
  ]);

  colored = new Float32Array ([
    0,.5,   0, 0, .3,
    .5,0,   0, .2, .4,
    -.5,0,  0, 0, .5,
  ]);


  var n = 4; // The number of vertices

  // Create the buffer objects
  colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colored, gl.STATIC_DRAW);

  modelBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, model, gl.STATIC_DRAW);
  return n;
}


/**
 * initTextures - Initialize Textures
 * @param {Object} gl - the WebGL rendering context
 * @param {Integer} n - Number of Vertices
 */
function initTextures(gl, n) {
   
  var texture0 = gl.createTexture();
  var texture1 = gl.createTexture();

  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  
  // wait for image to load
  while (!document.getElementById("stripes").complete){};
  image0 = document.getElementById("stripes");
  image0.src = "spaceship.jpg"

  while (!document.getElementById("planet").complete){};
  image1 = document.getElementById("planet");
  image1.src = "planet.png"

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);
  
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);

  gl.uniform1i(u_Sampler, 0);

  return true;
}


document.onkeydown = checkKey;
var px = 0;
var pxx = 0;
/**
 * checkKey - Checks keypress
 * @param {Object} e - Event Handler
 */
function checkKey(e) {
    e = e || window.event;
    if (e.keyCode == '39' && px < 2) { px+=1; }
    else if (e.keyCode == '37' && px > -2) { px-=1; }
    
}