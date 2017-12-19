/**
 * landscape.js
 * @fileoverview Navigate a 3-D landscape with buildings and a windmill.
 * @author Alex Elson (Oleksiy Al-saadi)
 */

// Vertex shader for single color drawing
var SOLID_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_MvpMatrix;\n' +

  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +

  'void main() {\n' +
  '  v_Color = a_Color;\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '}\n';

// Fragment shader for single color drawing
var SOLID_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Vertex shader for texture drawing
var TEXTURE_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader for texture drawing
var TEXTURE_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
  '  gl_FragColor = vec4(color.rgb, color.a);\n' +
  '}\n';

function main() {

  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);

  var solidProgram = createProgram(gl, 
    SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
  var texProgram = createProgram(gl, 
    TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);

  // Get storage locations of attribute and uniform variables in program object 
  // for single color drawing
  solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
  solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram,'u_MvpMatrix');
  solidProgram.a_Color = gl.getAttribLocation(solidProgram, 'a_Color');

  // Get storage locations of attribute and uniform variables in program object 
  // for texture drawing
  texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
  texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
  texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
  texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');

  // Set the vertex information
  var cube = initVertexBuffers(gl);

  // Set texture
  var texture = initTextures(gl, texProgram);

  // Set the clear color and enable the depth test
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Calculate the view projection matrix
  var viewProjMatrix = new Matrix4();

  var currentAngle = 0.0;

  m = new Object(); //Movement and animation variables
  m.px = 0;
  m.pz = 15;
  m.py = 0;
  m.lx = 0;
  m.lz = 0;
  m.turn = -90;
  m.yturn = 0;
  m.jump = 0.0;
  m.dir = 0;
  m.on = 1;

  //Closure for Key Press Down 
  document.onkeydown = function(e){ checkKey(e, m) };
  
  var tick = function() {
    currentAngle = animate(currentAngle, m);  // Update current rotation angle
    
    viewProjMatrix.setPerspective(60.0, canvas.width/canvas.height, 1.0, 150.0);
    viewProjMatrix.lookAt(m.px, m.py, m.pz ,   m.lx, m.py, m.lz, 0.0, 1.0, 0.0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    drawSolidCube(gl, solidProgram, cube, currentAngle, viewProjMatrix);
    drawTexCube(gl, texProgram, cube, texture, currentAngle, viewProjMatrix);

    window.requestAnimationFrame(tick, canvas);
  };
  tick();
}

/**
 * initVertexBuffers - Initialize Vertex Buffers, 
 * 					   vertices, texture coordinates, and color
 * @param {Object} gl - the WebGL rendering context
 * @return {Object} o - Object containing buffers
 */

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, 
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, 
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0 
  ]);

  var n = 3;
  var texCoords = new Float32Array([   // Texture coordinates
     1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
     0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
     n,   0.0,   n,n,        0.0, n,     0.0, 0.0,    // v0-v5-v6-v1 up
     1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
     0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
     0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
  ]);

  var indices = new Uint8Array([        // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  var color = new Float32Array([     // Colors
    0.1, 0.1, 1.0,  0.1, 0.1, 1.0,  0.1, 0.1, 1.0,  0.1, 0.1, 1.0, 
    0.1, 1.0, 0.1,  0.1, 1.0, 0.1,  0.1, 1.0, 0.1,  0.1, 1.0, 0.1,
    1.0, 0.1, 0.1,  1.0, 0.1, 0.1,  1.0, 0.1, 0.1,  1.0, 0.1, 0.1,
    1.0, 1.0, 0.1,  1.0, 1.0, 0.1,  1.0, 1.0, 0.1,  1.0, 1.0, 0.1,
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
    0.1, 1.0, 1.0,  0.1, 1.0, 1.0,  0.1, 1.0, 1.0,  0.1, 1.0, 1.0
  ]);


  var o = new Object(); // Utilize Object to to return multiple buffer objects

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, 
        indices, gl.UNSIGNED_BYTE);
  o.colorBuffer = initArrayBufferForLaterUse(gl, color, 3, gl.FLOAT);

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}




/**
 * drawSolidCube - Transforms all the solid cubes in the landscape 
 *				   making up windmill and all structures.
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which shader program GL will use.
 * @param {Object} o - Object containing buffers
 * @param {Float} angle - Angle of windmill and floating cube
 * @param {Array} viewProjMatrix - View projection matrix for perspective view.
 */
function drawSolidCube(gl, program, o, angle, viewProjMatrix) {
  gl.useProgram(program);   // Tell that this program object is used

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); // Vertex coord
  initAttributeVariable(gl, program.a_Color, o.colorBuffer); // Vertex coord
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices

  g_modelMatrix.setTranslate(0, 2, -10.0);
  g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  /////////////HOUSE 1
  g_modelMatrix.setTranslate(30, 0, 0.0);
  g_modelMatrix.scale(4,8,4);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  g_modelMatrix.setTranslate(32, 0, 5.0);
  g_modelMatrix.scale(2,4,4);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o); 

  ///////////////HOUSE 2
  g_modelMatrix.setTranslate(30, 10, -30.0);
  g_modelMatrix.scale(2,14,5);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  ///////////////HOUSE 3
  g_modelMatrix.setTranslate(-7, 4, -30.0);
  g_modelMatrix.scale(2,8,4);
  g_modelMatrix.rotate(180, 0.0, 1.0, 0.0);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  g_modelMatrix.setTranslate(-3, 10, -30.0);
  g_modelMatrix.scale(6,2,4);
  g_modelMatrix.rotate(180, 0.0, 1.0, 0.0);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  ///////////////HOUSE 4
  g_modelMatrix.setTranslate(0, -3.9, 40.0);
  g_modelMatrix.scale(10,1,10);
  g_modelMatrix.rotate(45, 0.0, 1.0, 0.0);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  g_modelMatrix.setTranslate(0, -3.9, 40.0);
  g_modelMatrix.scale(10,1,10);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  ///////////////HOUSE 5
  g_modelMatrix.setTranslate(-30, 0, 30.0);
  g_modelMatrix.scale(4,4,4);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  ///////////////WINDMILL
  g_modelMatrix.setTranslate(10, -2, -10);
  g_modelMatrix.scale(.3,2,.3);
  g_modelMatrix.rotate(m.yturn, 0.0, 1.0, 0.0);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

  for (n = 0; n < 4; n++){
	g_modelMatrix.setTranslate(10, 0, -10);
	g_modelMatrix.rotate(m.yturn, 0.0, 1.0, 0);
	g_modelMatrix.translate(0, 0, .6);
	g_modelMatrix.rotate(angle+n*90, 0.0, 0.0, 1.0);

	g_modelMatrix.translate(0,1.3,0);
	g_modelMatrix.scale(.3,1,.3);
	render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);
  }

}


/**
 * render - Draws cubes and elements transformed in DrawSolidCube();
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which shader program GL will use.
 * @param {Object} g_mvpMatrix -Index of model-view-projection matrix in Shader.
 * @param {Array} viewProjMatrix - View projection matrix for perspective view.
 * @param {Object} g_modelMatrix - Index for the model matrix in the Shader.
 * @param {Object} o - Object containing buffers
 */
function render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o){
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);
  gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);   
}

/**
 * render - Draws cubes and elements transformed in DrawSolidCube();
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which shader program GL will use.
 * @param {Object} g_mvpMatrix -Index of model-view-projection matrix in Shader.
 * @param {Array} viewProjMatrix - View projection matrix for perspective view.
 * @param {Object} g_modelMatrix - Index for the model matrix in the Shader.
 * @param {Object} o - Object containing buffers
 */
function drawTexCube(gl, program, o, texture, angle, viewProjMatrix) {
  gl.useProgram(program);  

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); // Vertex coord
  initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);//TextureCoord
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); // Bind indices

  // Bind texture object to texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  g_modelMatrix.setTranslate(0, -4, 0.0);
  g_modelMatrix.scale(80,.1,80);
  render(gl, program, g_mvpMatrix, viewProjMatrix, g_modelMatrix, o);

}



/**
 * initAttributeVariable - Assign buffer objects, then enable assignment
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} a_attribute - Index of a_attribute in Shader
 * @param {Object} buffer - Buffer object sent in containing num and type.
 */
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}



// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
/**
 * initArrayBufferForLaterUse - Create and Bind Buffers
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} data - Index of attribute or uniform variable in Shader.
 * @param {Integer} num - Number of vertices.
 * @param {Object} type - Type of variable used by the buffer 
 *                        (gl.FLOAT, gl.UNSIGNED_BYTE, etc.)
 * @return {Object} buffer - Buffer object returned.
 */
function initArrayBufferForLaterUse(gl, data, num, type) {
  var buffer = gl.createBuffer();   // Create a buffer object

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Keep the information necessary to assign to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}


/**
 * initElementBufferForLaterUse - Create and Bind Buffers for Elements
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} data - Index of attribute or uniform variable in Shader.
 * @param {Object} type - Type of variable used by the buffer 
 *                        (gl.FLOAT, gl.UNSIGNED_BYTE, etc.)
 * @return {Object} buffer - Buffer object returned.
 */
function initElementArrayBufferForLaterUse(gl, data, type) {
  var buffer = gl.createBuffer();  // Create a buffer object

  // Write date into the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}


/**
 * initTextures - Create and Bind Buffers for Elements
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @return {Object} texture - Returns texture object.
 */
function initTextures(gl, program) {
  var texture = gl.createTexture();   // Create a texture object

  while (!document.getElementById("land").complete){};
  image = document.getElementById("land");
  image.src = "land.jpg";
  // Register the event handler to be called when image loading is completed
  image.onload = function() {
    // Write the image data to texture object
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Pass the texure unit 0 to u_Sampler
    gl.useProgram(program);
    gl.uniform1i(program.u_Sampler, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);
  };


  return texture;
}

/**
 * animate - Updates rotation and jump view animation.
 * @param {Float} angle - Angle of rotation for windmill and floating cube.
 * @param {Object} m - Holds movement variables.
 * @return {Float} angle - returns new angle of rotation.
 */
function animate(angle, m) {
  var newAngle = angle + m.on;
  if (m.jump > 0){
  	m.jump -=.01;
  	m.py += m.jump-.5;
  }else{
  	if (m.py < 0){
  		m.py = 0;
  	}
  	m.jump = 0;
  }
  return newAngle % 360;
}


/**
 * checkKey - Checks keypress
 * @param {Object} e - Event Handler
 * @param {Object} m - Holds movement variables.
 */
function checkKey(e, m) {
    e = e || window.event;
    if (e.keyCode == '39') {  // right
    	m.turn += 4;
    }
    if (e.keyCode == '37') { //left
    	m.turn -= 4;
    }
    if (e.keyCode == '38') { //up
    	m.px = m.px + Math.cos(m.turn*3.14/180);
        m.pz = m.pz + Math.sin(m.turn*3.14/180); 
    }
    if (e.keyCode == '40') { //down
    	m.px = m.px - Math.cos(m.turn*3.14/180);
        m.pz = m.pz - Math.sin(m.turn*3.14/180); 
    }
    if (e.keyCode == '32' && m.jump == 0) { //down
	    m.jump = 1;
    }
    if (e.keyCode == '87') { //w
	    m.on = 1 - m.on;
    }
    if (e.keyCode == '89') { //w
	    m.yturn -= 4;
    }
    m.lx = m.px + Math.cos(m.turn*3.14/180);
    m.lz = m.pz + Math.sin(m.turn*3.14/180);
    
}