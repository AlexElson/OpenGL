/**
 * Clock.js
 * @fileoverview Demonstrates the use of buffer objects and various
 * primitives using attributes and uniform variables in shaders.
 * @author Alex Elson
 */

"use strict";

function main() {

   // vertex shader program
   var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'uniform float u_xTranslate;\n' +
      'uniform float u_xRotate;\n' +
      'uniform float u_yRotate;\n' +
      'void main() {\n' +
      '  gl_Position = vec4(a_Position.x + u_xRotate, a_Position.y + u_yRotate, a_Position.zw);\n' +
      '  gl_PointSize = 5.0;\n' +
      '}\n';

   // fragment shader program
   var FSHADER_SOURCE =
      'precision mediump float;\n' +
      'uniform vec4 u_Color;\n' +
      'void main() {\n' +
      '  gl_FragColor = u_Color;\n' +
      '}\n';

   // shader vars
   var shaderVars = {
      u_xTranslate:0,      // location of uniform for translate in shader
      u_yRotate:0,
      u_xRotate:0,
      a_Position:0,        // location of attribute for position in shader
      u_Color:0            // location of uniform for color in shader
   };

   var circle = {
      vertices:   new Float32Array([
         Math.cos(0*3.14/180), Math.sin(0*3.14/180),
         Math.cos(30*3.14/180), Math.sin(30*3.14/180),
         Math.cos(60*3.14/180), Math.sin(60*3.14/180),
         Math.cos(90*3.14/180), Math.sin(90*3.14/180),
         Math.cos(120*3.14/180), Math.sin(120*3.14/180),
         Math.cos(150*3.14/180), Math.sin(150*3.14/180),
         Math.cos(180*3.14/180), Math.sin(180*3.14/180),

         Math.cos(210*3.14/180), Math.sin(210*3.14/180),
         Math.cos(240*3.14/180), Math.sin(240*3.14/180),
         Math.cos(270*3.14/180), Math.sin(270*3.14/180),
         Math.cos(300*3.14/180), Math.sin(300*3.14/180),
         Math.cos(330*3.14/180), Math.sin(330*3.14/180),
         Math.cos(360*3.1415/180), Math.sin(360*3.1415/180),

      ]),
      n: 13,
      xTranslate: 0,
      buffer: 0
   };

   var points = {
      vertices:   new Float32Array([
         0.0, 0.8,

         0.8, 0.0,
         0.7, 0.1,
         0.7, -0.1,

      ]),
      n: 4,
      xTranslate: 0,
      buffer: 0
   };

   var loop = {
      vertices:   new Float32Array([
         0.0, -0.8,
         0.1, -0.7,
         0.0, -0.6,
         -0.1, -0.5,
         0.0, -0.4,
         -0.1, -0.5,
         0.0, -0.6,
         -0.1, -0.7,

      ]),
      n: 8,
      xTranslate: 0,
      buffer: 0
   };


   var nine = {
      vertices:   new Float32Array([
         -.7, -.2,
         -.7, .2,
         -.8, .2,
         -.8, 0,
         -.7, 0,

      ]),
      n: 5,
      xTranslate: 0,
      buffer: 0
   };

   var hand = {
      vertices:   new Float32Array([
         -.1, 0,
         .1, 0,
         0.0, .6,
         -.1,0

      ]),
      n: 4,
      xTranslate: 0,
      xRotate: 0,
      yRotate: 0,
      buffer: 0
   };


   // get WebGL rendering context
   var canvas = document.getElementById('webgl');
   var gl = getWebGLContext(canvas);

   // set up shaders & locations of shader variables
   initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
   shaderVars.u_xTranslate = gl.getUniformLocation(gl.program, 'u_xTranslate');
   shaderVars.u_xRotate = gl.getUniformLocation(gl.program, 'u_xRotate');
   shaderVars.u_yRotate = gl.getUniformLocation(gl.program, 'u_yRotate');
   shaderVars.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
   shaderVars.u_Color = gl.getUniformLocation(gl.program, 'u_Color');
   
   //Closure
   canvas.onmousemove = function(ev){ 
      click(ev, canvas, gl, shaderVars, circle, points, loop, nine, hand) 
   };
   upd = function(ev){ 
      render(gl, shaderVars, circle, points, loop, nine, hand) 
   };

   // set up models
   var n = initModels(gl, shaderVars, circle, points, loop, nine, hand);
   
   setInterval(upd, 40);
}

var upd;
var rect;

/**
 * click - Gets mousemove information. SImply rotates hands.
 * @param {Object} ev - event Object used for mousemove
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} canvas - the Javascript display window
 * @param {Object} shaderVars - object for variables related to the Shader.
 * @param {Object} circle - circle OpenGL object
 * @param {Object} points - points OpenGL object
 * @param {Object} loop - loop OpenGL object
 * @param {Object} nine - nine OpenGL object
 * @param {Object} hand - hand OpenGL object
 */
function click(ev, canvas, gl, shaderVars, circle, points, loop, nine, hand) {

   var xx = Math.floor(ev.clientX);
   var yy = Math.floor(ev.clientY);
   rect = ev.target.getBoundingClientRect();

   xx = ((xx - rect.left) - canvas.width/2)/(canvas.width/2);
   yy = (canvas.height/2 - (yy - rect.top))/(canvas.height/2);

   rot+=0.06;
}

/**
 * render - Constantly updated to re-render Clock image and move hands.
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} shaderVars - object for variables related to the Shader.
 * @param {Object} circle - circle OpenGL object
 * @param {Object} points - points OpenGL object
 * @param {Object} loop - loop OpenGL object
 * @param {Object} nine - nine OpenGL object
 * @param {Object} hand - hand OpenGL object
 */
function render(gl, shaderVars, circle, points, loop, nine, hand) {

   gl.clearColor(0, 0, 0, 1);
   gl.clear(gl.COLOR_BUFFER_BIT);

   // draw circle
   gl.uniform4f(shaderVars.u_Color, 1, 1, 1, 1);
   gl.uniform1f(shaderVars.u_xTranslate, circle.xTranslate);
   gl.bindBuffer(gl.ARRAY_BUFFER, circle.buffer);
   var FSIZE = circle.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.drawArrays(gl.TRIANGLE_FAN, 0, circle.n);

   // draw rim
   gl.uniform4f(shaderVars.u_Color, 1, 0, 0, 1);
   gl.uniform1f(shaderVars.u_xTranslate, circle.xTranslate);
   gl.bindBuffer(gl.ARRAY_BUFFER, circle.buffer);
   var FSIZE = circle.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, circle.n);

   // draw 1 and 3
   gl.uniform4f(shaderVars.u_Color, 0, 0, 0, 1);
   gl.uniform1f(shaderVars.u_xTranslate, points.xTranslate);
   gl.bindBuffer(gl.ARRAY_BUFFER, points.buffer);
   var FSIZE = points.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.drawArrays(gl.POINTS, 0, points.n);

   // draw 6
   gl.uniform4f(shaderVars.u_Color, 0, 0, 0, 1);
   gl.uniform1f(shaderVars.u_xTranslate, loop.xTranslate);
   gl.bindBuffer(gl.ARRAY_BUFFER, loop.buffer);
   var FSIZE = loop.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.drawArrays(gl.LINE_LOOP, 0, loop.n);

   // draw 9
   gl.uniform4f(shaderVars.u_Color, 0, 0, 0, 1);
   gl.uniform1f(shaderVars.u_xTranslate, nine.xTranslate);
   gl.bindBuffer(gl.ARRAY_BUFFER, nine.buffer);
   var FSIZE = nine.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.drawArrays(gl.LINE_STRIP, 0, nine.n);

   // draw hand
   rot-=0.05;
   //hand.xRotate=Math.cos(rot);
   //hand.yRotate=Math.sin(rot);
   
   hand.vertices[4] = Math.cos(rot)*.6;
   hand.vertices[5] = Math.sin(rot)*.6;

   gl.uniform4f(shaderVars.u_Color, 1, 0, 0, 1);
   //gl.uniform1f(shaderVars.u_xRotate, hand.xRotate);
   //gl.uniform1f(shaderVars.u_yRotate, hand.yRotate);
   gl.bindBuffer(gl.ARRAY_BUFFER, hand.buffer);
   //Update hand vertices
   gl.bufferData(gl.ARRAY_BUFFER, hand.vertices, gl.STATIC_DRAW);
   var FSIZE = hand.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2,0);
   gl.drawArrays(gl.TRIANGLES, 0, hand.n);
   
   hand.vertices[4] = Math.cos(rot*.5)*.3;
   hand.vertices[5] = Math.sin(rot*.5)*.3;
 
   gl.bindBuffer(gl.ARRAY_BUFFER, hand.buffer);
   //Update hand vertices
   gl.bufferData(gl.ARRAY_BUFFER, hand.vertices, gl.STATIC_DRAW);
   var FSIZE = hand.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2,0);
   gl.drawArrays(gl.LINES, 0, hand.n);

   gl.uniform1f(shaderVars.u_xRotate, 0);
   gl.uniform1f(shaderVars.u_yRotate, 0);
}

var rot = 0.0;

/**
 * initModels- Call once to initialize and buffer all OpenGL objects..
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} shaderVars - object for variables related to the Shader.
 * @param {Object} circle - circle OpenGL object
 * @param {Object} points - points OpenGL object
 * @param {Object} loop - loop OpenGL object
 * @param {Object} nine - nine OpenGL object
 * @param {Object} hand - hand OpenGL object
 */
function initModels(gl, shaderVars, circle, points, loop, nine, hand) {

   // set up circle
   circle.buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, circle.buffer);
   gl.bufferData(gl.ARRAY_BUFFER, circle.vertices, gl.STATIC_DRAW);
   var FSIZE = circle.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.enableVertexAttribArray(shaderVars.a_Position);

   // set up points
   points.buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, points.buffer);
   gl.bufferData(gl.ARRAY_BUFFER, points.vertices, gl.STATIC_DRAW);
   var FSIZE = points.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.enableVertexAttribArray(shaderVars.a_Position);


   // set up loop
   loop.buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, loop.buffer);
   gl.bufferData(gl.ARRAY_BUFFER, loop.vertices, gl.STATIC_DRAW);
   var FSIZE = loop.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.enableVertexAttribArray(shaderVars.a_Position);

   // set up nine
   nine.buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, nine.buffer);
   gl.bufferData(gl.ARRAY_BUFFER, nine.vertices, gl.STATIC_DRAW);
   var FSIZE = nine.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.enableVertexAttribArray(shaderVars.a_Position);

   // set up hand
   hand.buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, hand.buffer);
   gl.bufferData(gl.ARRAY_BUFFER, hand.vertices, gl.STATIC_DRAW);
   var FSIZE = hand.vertices.BYTES_PER_ELEMENT;
   gl.vertexAttribPointer(shaderVars.a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
   gl.enableVertexAttribArray(shaderVars.a_Position);


}