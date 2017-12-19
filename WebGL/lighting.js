/**
 * lighting.js
 * @fileoverview Navigate a 3-D landscape with port, waves, and lighting.
 * @author Alex (Oleksiy Al-saadi)
 */


var SOLID_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' + // Coord transformation matrix of normal
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightColor2;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_LightPosition2;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'uniform vec3 u_LightDir;\n' +       // Light Dir
  'uniform vec3 u_DirColor;\n' +       // Light Dir Color
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Recalculate the normal based on the model matrix and make its length 1.
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
     // Calculate world coordinate of vertex
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
     // Calculate the light direction and make it 1.0 in length
  '  vec3 lightDirection=normalize(u_LightPosition - vec3(vertexPosition));\n' +
  '  vec3 lightDirection2=normalize(u_LightPosition2-vec3(vertexPosition));\n' +
     // Calculate the dot product of the normal and light direction
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  float nDot2 = max(dot(normal, u_LightDir), 0.0);\n' +
  '  float nDotL2 = max(dot(normal, lightDirection2), 0.0);\n' +
     // Calculate the color due to diffuse reflection
  '  vec3 diffus2 = u_DirColor * a_Color.rgb * nDot2;\n' +
  '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '  vec3 diffuseL2 = u_LightColor2 * a_Color.rgb * nDotL2;\n' +
     // Calculate the color due to ambient reflection
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
     // Add the surface colors due to diffuse reflection and ambient reflection
  '  v_Color = vec4(diffuse + ambient + diffus2 + diffuseL2, a_Color.a);\n' + 
  '}\n';


var SOLID_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


//////////////////////////////////////////////////////////////


var TEXTURE_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform vec3 u_AmbientLight;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 ambient = u_AmbientLight;\n' +
  '  v_Color = vec4(ambient, 1);\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

var TEXTURE_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
  '  gl_FragColor = vec4(color.rgb, color.a) + v_Color;\n' +
  '}\n';


function main() {

  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);

  var solidProgram = 
    createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
  var texProgram = 
    createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);

  // Various primitive objects
  var cube = initCube(gl, 1);
  var plane = initPlane(gl);
  var moon = initPlane(gl);
  var sun = initPlane(gl);
  var sphere = initSphere(gl);

  var texture = initTextures(gl, texProgram);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
  solidProgram.a_Normal = gl.getAttribLocation(solidProgram,'a_Normal');
  solidProgram.a_Color = gl.getAttribLocation(solidProgram, 'a_Color');

  solidProgram.u_ModelMatrix = 
    gl.getUniformLocation(solidProgram, 'u_ModelMatrix');
  solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
  solidProgram.u_NormalMatrix = 
    gl.getUniformLocation(solidProgram, 'u_NormalMatrix');
  solidProgram.u_LightColor = 
    gl.getUniformLocation(solidProgram, 'u_LightColor');
  solidProgram.u_LightColor2 = 
    gl.getUniformLocation(solidProgram, 'u_LightColor2');
  solidProgram.u_LightPosition =
    gl.getUniformLocation(solidProgram, 'u_LightPosition');
  solidProgram.u_LightPosition2 = 
    gl.getUniformLocation(solidProgram, 'u_LightPosition2');
  solidProgram.u_AmbientLight =
    gl.getUniformLocation(solidProgram, 'u_AmbientLight');
  solidProgram.u_LightDir = gl.getUniformLocation(solidProgram, 'u_LightDir');
  solidProgram.u_DirColor = gl.getUniformLocation(solidProgram, 'u_DirColor');

  texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
  texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
  texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
  texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');
  texProgram.u_AmbientLight=gl.getUniformLocation(texProgram, 'u_AmbientLight');

  var j = new Object();
  j.modelMatrix = new Matrix4();  // Model matrix
  j.mvpMatrix = new Matrix4();    // Model view projection matrix
  j.normalMatrix = new Matrix4(); // Transformation matrix for normals
  j.vpMatrix = new Matrix4();   // View projection matrix
  j.perspectiveMatrix = new Matrix4();
  j.viewMatrix = new Matrix4();

  m = new Object(); //Movement and animation variables
  m.px = 0;
  m.pz = 35;
  m.py = 0;
  m.lx = 0;
  m.lz = 0;
  m.turn = -90;
  m.yturn = 0;
  m.jump = 0.0;
  m.dir = 0;
  m.on = 1;
  m.on2 = 1;
  m.on3 = 1;
  m.ro = 0;
  m.angle = 0.0;
  m.light = 0.0;

  document.onkeydown = function(e){ checkKey(e, m) };

  var tick = function() {
    m.angle = animate(m.angle, m);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    j.perspectiveMatrix.setPerspective(90.0,
        canvas.width/canvas.height, 1.0, 250.0);
    j.viewMatrix.lookAt(m.px, m.py, m.pz ,   m.lx, m.py, m.lz, 0.0, 1.0, 0.0);
    j.vpMatrix.setPerspective(90.0, canvas.width/canvas.height, 1.0, 250.0);
    j.vpMatrix.lookAt(m.px, m.py, m.pz ,   m.lx, m.py, m.lz, 0.0, 1.0, 0.0);

    //White Port light
    if (m.on2 == 1) setSpotLight2(gl, solidProgram, m, .5, 1 ,.5);
    else            setSpotLight2(gl, solidProgram, m, 0,0,0);
    
    //Red Light
    if (m.on3 == 1) setSpotLight(gl, solidProgram, m, 1,0,0);
    else            setSpotLight(gl, solidProgram, m, 0,0,0);

    //Ground
    setDirLight(gl, solidProgram, m, 0,0,1);
    setAmbientLight(gl, solidProgram, m, 0,0,0);
    if (m.yturn == 1) drawPlane(gl, solidProgram, m, j, cube);
    if (m.yturn == 0) drawPlane(gl, solidProgram, m, j, plane);
    //Uncomment to add option for spheres
    //if (m.yturn == 2) drawPlane(gl, solidProgram, m, j, sphere);

    //Port
    setDirLight(gl, solidProgram, m, .3,.3,.3);
    if (m.on3 == 1) setSpotLight(gl, solidProgram, m, .7,.5,.5); //Adds grayness
    drawCube(gl, solidProgram, m, j, cube);

    //Near Red Light
    if (m.on3 == 1){
      setAmbientLight(gl, solidProgram, m, 1,0,0);
      drawRed(gl, solidProgram, j, sphere);
    }

    //Moon
    setAmbientLight(gl, texProgram, m, 0,0,0);
    drawTex(gl, texProgram, j, m, moon, texture);

    requestAnimationFrame(tick, canvas);
  };
  tick();
}



/**
 * setSpotLight - Sets uniform variables of Red Light
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} m - Object holding movement variables.
 * @param {Float} r - Red value
 * @param {Float} g - Green value
 * @param {Float} b - Blue value
 */
function setSpotLight(gl, program, m, r,g,b){
  gl.useProgram(program);
  gl.uniform3f(program.u_LightColor, r,g,b);  
  gl.uniform3f(program.u_LightPosition, 
    Math.cos(m.angle/10)*40, 0, Math.sin(m.angle/10)*20);
}

/**
 * setSpotLight2 - Sets uniform variables of White Light
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} m - Object holding movement variables.
 * @param {Float} r - Red value
 * @param {Float} g - Green value
 * @param {Float} b - Blue value
 */
function setSpotLight2(gl, program, m, r,g,b){
  gl.useProgram(program);
  gl.uniform3f(program.u_LightColor2, r,g,b);  
  gl.uniform3f(program.u_LightPosition2, -32, 0, -59+5*10);
}

/**
 * setDirLight - Sets uniform variables of Light Direction
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} m - Object holding movement variables.
 * @param {Float} r - Red value
 * @param {Float} g - Green value
 * @param {Float} b - Blue value
 */
function setDirLight(gl, program, m, r,g,b){
  gl.useProgram(program);
  gl.uniform3f(program.u_DirColor, r,g,b); 
  if (m.ro == 1){
    gl.uniform3f(program.u_LightDir, 0, Math.sin(m.light),Math.cos(m.light)); 
  }else{
    gl.uniform3f(program.u_LightDir, 1, 1, 1); 
  }

}

/**
 * setAmbientLight - Sets uniform variables of Ambient Light
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} m - Object holding movement variables.
 * @param {Float} r - Red value
 * @param {Float} g - Green value
 * @param {Float} b - Blue value
 */
function setAmbientLight(gl, program, m, r,g,b){
  gl.useProgram(program);
  gl.uniform3f(program.u_AmbientLight, r,g,b); 
}


/**
 * drawPlane - Matrix transformations of instances of the water/wave
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} m - Object holding movement variables.
 * @param {Object} j - Holds Matrices
 * @param {Object} o - Holds Buffers
 */
function drawPlane(gl, program, m, j, o){

  gl.useProgram(program);
  initAttributeVariable(gl, 'a_Position', o.vertexBuffer, program); // Vertex
  initAttributeVariable(gl, 'a_Color', o.colorBuffer, program); // Color coord
  initAttributeVariable(gl, 'a_Normal', o.normalBuffer, program);   // Normal
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices

  for (n = 0; n < 20*20; n++){
    
    if (m.yturn == 1){                                                    
      j.modelMatrix.setTranslate(Math.floor(n/20)*8-60,
        -20+Math.cos(m.angle/3-n/40*1+n%20*.35)*4, (n%20)*8-60);
        //n/40 Dist of waves
    }else{
      j.modelMatrix.setTranslate(Math.floor(n/20)*8-60,
        -16+Math.cos(m.angle/3-n/40*1+n%20*.35)*4, (n%20)*8-60);
    }
    j.modelMatrix.rotate(Math.cos((m.angle/3-n/40+n%20*.35-20.5))*15, 1, 0, 1);
    if (m.yturn == 2){
      j.modelMatrix.scale(2.5, 2.5 , 2.5);
    }else{
      j.modelMatrix.scale(1.5, 2 , 1.5);
    }
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);

    render(gl, program, j, o);
  }

}

/**
 * drawCube - Matrix transformations of instances of the Port deck and poles
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} m - Object holding movement variables.
 * @param {Object} j - Holds Matrices
 * @param {Object} o - Holds Buffers
 */
function drawCube(gl, program, m, j, o){

  gl.useProgram(program);
  initAttributeVariable(gl, 'a_Position', o.vertexBuffer, program); // Vertex
  initAttributeVariable(gl, 'a_Color', o.colorBuffer, program); // Color coord
  initAttributeVariable(gl, 'a_Normal', o.normalBuffer, program);   // Normal
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices

  j.modelMatrix.setTranslate(-40,-6,-45);
  j.modelMatrix.rotate(0,1,0,0);
  j.modelMatrix.scale(12,.2,8);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
  render(gl, program, j, o);

  j.modelMatrix.setTranslate(-24,-6,-19);
  j.modelMatrix.scale(4,.2,5);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
  render(gl, program, j, o);

  for (n = 0; n < 6; n++){     //-64
    j.modelMatrix.setTranslate(-16,-11,-59+n*10);
    j.modelMatrix.scale(.2,4,.2);
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
    render(gl, program, j, o);

    if (n>0){
      j.modelMatrix.setTranslate(-16,-3,-64+n*10);
      j.modelMatrix.scale(.2,.2,3);
      gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
      render(gl, program, j, o);
    }

  }
  for (n = 0; n < 4; n++){
    j.modelMatrix.setTranslate(-64+n*10.7,-11,-59+3*10);
    j.modelMatrix.scale(.2,4,.2);
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
    render(gl, program, j, o);
  }
  //Single bar
  j.modelMatrix.setTranslate(-24,-3,-59+5*10);
  j.modelMatrix.scale(4.5,.2,.2);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
  render(gl, program, j, o);

  //Light Pole
  j.modelMatrix.setTranslate(-32,-5,-59+5*10);
  j.modelMatrix.scale(.2,8,.2);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
  render(gl, program, j, o);

  setAmbientLight(gl, program, m, 1,1,1); //Top light piece
  if (m.on2 == 0)
    setAmbientLight(gl, program, m, 0,0,0); //Top light piece
  j.modelMatrix.setTranslate(-32,10,-59+5*10); 
  j.modelMatrix.scale(.6,.6,.6);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
  render(gl, program, j, o);
    

}




/**
 * drawRed - Matrix transformations Red Light
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} j - Holds Matrices
 * @param {Object} o - Holds Buffers
 */
function drawRed(gl, program, j, o){

  gl.useProgram(program);
  initAttributeVariable(gl, 'a_Position', o.vertexBuffer, program); // Vertex
  initAttributeVariable(gl, 'a_Color', o.colorBuffer, program); // Color coord
  initAttributeVariable(gl, 'a_Normal', o.normalBuffer, program);   // Normal
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices

  j.modelMatrix.setTranslate(Math.cos(m.angle/10)*40-1, 0, 
    Math.sin(m.angle/10)*20);
  j.modelMatrix.rotate(0,1,0,0);
  j.modelMatrix.scale(1.5,1.5,1.5);
  
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);
  render(gl, program, j, o);

}

/**
 * drawTex - Matrix transformations of instances of the Port deck and poles
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} j - Holds Matrices
 * @param {Object} o - Holds Buffers
 * @param {Object} m - Object holding movement variables.
 * @param {Object} texture - Texture object (moon)
 */
function drawTex(gl, program, j, m, o, texture){

  gl.useProgram(program);
  initAttributeVariable(gl, 'a_TexCoord', o.texCoordBuffer, program); //Texture
  initAttributeVariable(gl, 'a_Position', o.vertexBuffer, program); // Vertex
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  if (m.ro == 1){
    j.modelMatrix.setTranslate(0,Math.sin(m.light)*100,Math.cos(m.light)*100);
    j.modelMatrix.rotate(90,1,0,0);
  }else{
    j.modelMatrix.setTranslate(50,50,50);
    j.modelMatrix.rotate(45,1,1,0);
  }
  j.modelMatrix.scale(4,1,4);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, j.modelMatrix.elements);

  if (Math.sin(m.light)>-.2){
    render(gl, program, j, o);
  } 
}

/**
 * render - Model view and Normal matrix calculations. Draws all primitives.
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 * @param {Object} j - Holds Matrices
 * @param {Object} o - Holds Buffers
 */
function render(gl, program, j, o){
    j.mvpMatrix.set(j.vpMatrix);
    j.mvpMatrix.multiply(j.modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, j.mvpMatrix.elements);
    // Pass the matrix to transform the normal based on the model matrix
    // to u_NormalMatrix
    j.normalMatrix.setInverseOf(j.modelMatrix);
    j.normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, j.normalMatrix.elements);

    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}




/**
 * initCube - Initialize Cube arrays and buffers
 * @param {Object} gl - the WebGL rendering context
 * @param {Float} c - Color shade of cube
 * @param {Object} o - Holds cube object informations (Buffers and indices)
 */
function initCube(gl, c) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // Coordinates
  var vertices = new Float32Array([
     2.0, 2.0, 2.0,  -2.0, 2.0, 2.0,  -2.0,-2.0, 2.0,   2.0,-2.0, 2.0,
        // v0-v1-v2-v3 front
     2.0, 2.0, 2.0,   2.0,-2.0, 2.0,   2.0,-2.0,-2.0,   2.0, 2.0,-2.0,
        // v0-v3-v4-v5 right
     2.0, 2.0, 2.0,   2.0, 2.0,-2.0,  -2.0, 2.0,-2.0,  -2.0, 2.0, 2.0, 
        // v0-v5-v6-v1 up
    -2.0, 2.0, 2.0,  -2.0, 2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0,-2.0, 2.0, 
        // v1-v6-v7-v2 left
    -2.0,-2.0,-2.0,   2.0,-2.0,-2.0,   2.0,-2.0, 2.0,  -2.0,-2.0, 2.0, 
        // v7-v4-v3-v2 down
     2.0,-2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0, 2.0,-2.0,   2.0, 2.0,-2.0  
        // v4-v7-v6-v5 back
  ]);

  // Colors
  n = c;
  var colors = new Float32Array([
    n, n, n,   n, n, n,   n, n, n,  n, n, n,     // v0-v1-v2-v3 front
    n, n, n,   n, n, n,   n, n, n,  n, n, n,     // v0-v3-v4-v5 right
    n, n, n,   n, n, n,   n, n, n,  n, n, n,     // v0-v5-v6-v1 up
    n, n, n,   n, n, n,   n, n, n,  n, n, n,     // v1-v6-v7-v2 left
    n, n, n,   n, n, n,   n, n, n,  n, n, n,     // v7-v4-v3-v2 down
    n, n, n,   n, n, n,   n, n, n,  n, n, n,     // v4-v7-v6-v5 back
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

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  
        // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0, 
        // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  
        // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  
        // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0, 
        // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   
        // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  var o = new Object();
  o.vertexBuffer = initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT);
  o.colorBuffer = initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT);
  o.normalBuffer = initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBuffer(gl, 'a_TexCoord', texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementBuffer(gl, indices, gl.UNSIGNED_BYTE);
  o.numIndices = indices.length;

  return o;
}


/**
 * initPlane - Initialize Plane arrays and buffers
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} o - Holds cube object informations (Buffers and indices)
 */
function initPlane(gl){
  // v1-----v0
  //  |      |
  //  |      |
  //  |      |
  // v2-----v3
  var vertices = new Float32Array([
    2, 0, 2,   -2, 0, 2,    -2, 0, -2,   2, 0, -2, //v0-1-2-3
  ]);

  var colors = new Float32Array([
    1, 1, 1,   1, 1, 1,    1, 1, 1,   1, 1, 1, //v0-1-2-3
  ]);

  var normals = new Float32Array([
    0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,  // v0-v1-v2-v3 front
  ]);

  var n = 1;
  var texCoords = new Float32Array([   // Texture coordinates
     n, n,       0.0, n,     0.0, 0.0,   n, 0.0,    // v0-v1-v2-v3 front
  ]);

  var indices = new Uint8Array([0,1,2,  0,2,3]);

  var o = new Object();
  o.vertexBuffer = initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT);
  o.colorBuffer = initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT);
  o.normalBuffer = initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBuffer(gl, 'a_TexCoord', texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementBuffer(gl, indices, gl.UNSIGNED_BYTE);
  o.numIndices = indices.length;

  return o;

}




/**
 * initSphere - Initialize Sphere arrays and buffers
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} o - Holds cube object informations (Buffers and indices)
 */
function initSphere(gl) {
  var SPHERE_DIV = 8;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];
  var colors = []
  var texCoords = [];

  // Generate coordinates
  var n = -1;

  while(1){
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai) * n;
      ci = Math.cos(ai) * n;

      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z
      colors.push(1);
      colors.push(1);
      colors.push(1);
      texCoords.push(0);
      texCoords.push(0);
      texCoords.push(0);
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }
  n+=2;
  if (n > 1){ break };
  }

  var o = new Object();
  o.vertexBuffer = initArrayBuffer(gl, 'a_Position', 
    new Float32Array(positions), 3, gl.FLOAT);
  o.colorBuffer = initArrayBuffer(gl, 'a_Color',
    new Float32Array(colors), 3, gl.FLOAT);
  o.normalBuffer = initArrayBuffer(gl, 'a_Normal',
    new Float32Array(positions), 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBuffer(gl, 'a_TexCoord',
    new Float32Array(texCoords), 2, gl.FLOAT);
  o.indexBuffer = initElementBuffer(gl,
    new Uint16Array(indices), gl.UNSIGNED_BYTE);
  o.numIndices = indices.length;
  return o;

}




/**
 * initArrayBuffer - Initialize Buffer Array data
 * @param {Object} gl - the WebGL rendering context
 * @param {String} attribute - Attribute variable from Shader
 * @param {Array} data - Float array used for Array Buffer
 * @param {Integer} num - Number of vertices
 * @param {Object} type - Buffer type (gl.FLOAT for Array Buffers)
 * @return {Object} buffer - Returns array buffer
 */
function initArrayBuffer(gl, attribute, data, num, type) {

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  buffer.num = num;
  buffer.type = type;
  return buffer;
}

/**
 * initElementBuffer - Initialize Buffer Element data
 * @param {Object} gl - the WebGL rendering context
 * @param {Array} data - Uint8Array used for Element Buffer (indices)
 * @param {Object} type - Buffer type (gl.UNSIGNED_BYTE for elements)
 * @return {Object} buffer - Returns element buffer
 */
function initElementBuffer(gl, data, type) {

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  buffer.type = type;
  return buffer;
}


/**
 * initAttributeVariable - Initialize Attribute Variable
 * @param {Object} gl - the WebGL rendering context
 * @param {String} a_attribute - Attribute variable from Shader
 * @param {Object} buffer - Buffer to bind
 * @param {Object} program -Which Shader program to attain attribute information
 */
function initAttributeVariable(gl, a_attribute, buffer, program) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  var a_attribute = gl.getAttribLocation(program, a_attribute);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}



/**
 * initTextures - Initialize Textures
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} program - Determines which Shader program to be used.
 */
function initTextures(gl, program) {
  var texture = gl.createTexture();   // Create a texture object

  while (!document.getElementById("moon_img").complete){};
  image = document.getElementById("moon_img");
  image.src = "moon_img.jpeg";
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
 * animate - Update angle and jumping
 * @param {Float} angle - Angle to update
 * @param {Object} m - Holds movement variables.
 */
var g_last = Date.now();
function animate(angle, m) {
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  var newAngle = angle + (m.on/200 * elapsed);
  if (m.jump > 0){
    m.jump -=.01*elapsed/15;
    m.py += (m.jump-.5);
  }else{
    if (m.py < 0){
      m.py = 0;
    }
    m.jump = 0;
  }

  if (m.ro == 1)
    m.light += .01;
  else
    m.light = 90.5;
  
  if (m.moveup >= 1){
      m.px = m.px + Math.cos(m.turn*3.14/180);
      m.pz = m.pz + Math.sin(m.turn*3.14/180); 
 
      m.lx = m.px + Math.cos(m.turn*3.14/180);
      m.lz = m.pz + Math.sin(m.turn*3.14/180);
      m.moveup-=1;
  }
  if (m.movedown >= 1){
      m.px = m.px - Math.cos(m.turn*3.14/180);
      m.pz = m.pz - Math.sin(m.turn*3.14/180); 
 
      m.lx = m.px + Math.cos(m.turn*3.14/180);
      m.lz = m.pz + Math.sin(m.turn*3.14/180);
      m.movedown-=1;
  }
  
   if (m.tright >= 1){
      m.turn+=4;
 
      m.lx = m.px + Math.cos(m.turn*3.14/180);
      m.lz = m.pz + Math.sin(m.turn*3.14/180);
      m.tright-=1;
  }
    if (m.tleft >= 1){
      m.turn-=4;
 
      m.lx = m.px + Math.cos(m.turn*3.14/180);
      m.lz = m.pz + Math.sin(m.turn*3.14/180);
      m.tleft-=1;
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
      m.tright = 5;
    }
    if (e.keyCode == '37') { //left
      m.tleft = 5;
    }
    if (e.keyCode == '38') { //up
      m.moveup = 5;
    }
    if (e.keyCode == '40') { //down
      m.movedown = 5;
    }
    if (e.keyCode == '32' && m.jump == 0) { //down
      m.jump = 1;
    }
    if (e.keyCode == '82') { //r stop
      m.on = 1 - m.on;
    }
    if (e.keyCode == '84') { //t 3d
      m.yturn++;
      if (m.yturn > 1){
        m.yturn = 0;
      }

    }
    if (e.keyCode == '81') { //q green
      m.on2 = 1 - m.on2;
    }
    if (e.keyCode == '87') { //w red
      m.on3 = 1 - m.on3;
    }
    if (e.keyCode == '69') { //e moon
      m.ro = 1 - m.ro;
    }
    
}
