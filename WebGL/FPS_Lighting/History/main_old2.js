/*
  @author Nathan Davidson
  This program goes over the basic usage of lighting.
  In this program I do a little bit of normal mapping and specularity.

  Any calculations that I performed in the fragment shader regarding normal
  mapping comes from this tutorial,
  https://learnopengl.com/#!Advanced-Lighting/Normal-Mapping

  I also used the same tutorial website to perform any calculations
  done in the fragment shader for specularity,
  https://learnopengl.com/#!Lighting/Basic-Lighting

  The linked tutorial goes over normal mapping and specularity
  inside OpenGL. So I had to do minor tweaks to what was taught to convert
  it to WebGL.
*/

// Vertex shader for texture drawing
var TEXTURE_VSHADER_SOURCE =
  `
  attribute vec2 a_TexCoord;

  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec4 a_Color;
  attribute vec3 a_Tangent;
  attribute vec3 a_BiTangent;

  //Matrices
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjMatrix;
  uniform mat4 u_NormalMatrix;

  varying vec2 v_TexCoord;

  varying vec3 v_Normal;
  varying vec3 v_Position;

  varying vec4 v_Color;

  varying mat3 v_TBN;
  varying vec3 FragPos;
  varying vec3 viewPos;

  //Fog
  uniform vec4 u_Eye;
  varying float v_Dist;

  void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    FragPos = vec3(u_ModelMatrix * a_Position);
    viewPos = vec3(u_ProjMatrix * a_Position);

    v_TexCoord = a_TexCoord;
    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Color = a_Color;

    vec3 T = normalize( vec3(u_ModelMatrix * vec4(a_Tangent, 0.0)).xyz);
    vec3 B = normalize( vec3(u_ModelMatrix * vec4(a_BiTangent, 0.0)));
    vec3 N = normalize( vec3(u_ModelMatrix * vec4(a_Normal, 0.0)));
    mat3 TBN = mat3(T, B, N);
    v_TBN = TBN;

    //mat4 modelViewMatrix = u_ViewMatrix * u_ModelMatrix;
    //v_Normal = normalize( mat3(modelViewMatrix) * a_Normal);
    v_Normal = normalize(vec3(u_NormalMatrix) * a_Normal);
    v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);
  }`

// Fragment shader for texture drawing
var TEXTURE_FSHADER_SOURCE =
  `
  #ifdef GL_ES
  precision mediump float;
  #endif

  //Texture
  uniform sampler2D u_Sampler;
  uniform sampler2D normalMap;

  //Light Variables and Vectors
  uniform vec3 u_LightColor;
  uniform vec3 u_LightPosition;
  uniform vec3 u_LightColor2;
  uniform vec3 u_LightPosition2;
  
  const int nL = 20;
  uniform vec3 u_LightColorArray[nL];
  uniform vec3 u_LightPositionArray[nL];
  uniform int u_LightActive[nL];

  uniform vec3 u_AmbientLight;

  //Sunlight
  uniform vec3 u_DiffuseLight;
  uniform vec3 u_LightDirection;

  //Fog
  uniform vec3 u_FogColor;
  uniform vec2 u_FogDist;
  uniform vec4 u_Eye2;
  varying float v_Dist;

  varying vec3 viewPos;

  varying vec2 v_TexCoord;

  varying vec3 v_Position;

  varying vec4 v_Color;
  varying mat3 v_TBN;
  varying vec3 FragPos;
  varying vec3 v_Normal;


  void main() {

    vec4 color = texture2D(u_Sampler, v_TexCoord);

    //Normal Maps
    vec3 testNormal = texture2D(normalMap, v_TexCoord).rgb;
    testNormal = normalize(testNormal * 2.0 -1.0);
    testNormal.xyz = normalize(v_TBN * testNormal);
    //End

    //Sunlight
    float nDotL_Sun = max(dot(u_LightDirection, testNormal), 0.0); //Sunlight
    vec3 diffuse_Sun = u_DiffuseLight * color.rgb * nDotL_Sun; //Sunlight

    //Ambient
    vec3 ambient = u_AmbientLight * color.rgb;

    vec3 added = diffuse_Sun + ambient;

    float specularStrength = 2.0;
    float spec = 0.0;


    for(int n = 0; n < nL; n++){
      if (u_LightActive[n] == 1){

        //Diffuse Lighting

        vec3 LightDirection = normalize(u_LightPositionArray[n] - v_Position);
        float nDotL = max(dot(LightDirection, testNormal), 0.0);
        vec3 diffuse = u_LightColorArray[n] * color.rgb * nDotL;
        added += diffuse;

        //Specular Lighting

        vec3 reflectVec;
        if (u_LightColorArray[n] != vec3(0,0,0) ){
            reflectVec = reflect(-LightDirection, testNormal);
        }
        vec3 viewDir = normalize(viewPos - FragPos + vec3(u_Eye2));
        spec += pow(max(dot(viewDir, reflectVec), 0.0), 32.0);


      }else{
        break;
      }
    } 

    added += specularStrength * spec * color.rgb;


    //Fog Effect
    float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
    // Stronger fog as it gets further: 
    //fogFactor = u_FogColor * (1.0 - fogFactor) + v_Color * fogFactor;
    
    vec3 fogColor = mix(u_FogColor, vec3(v_Color), fogFactor);

    gl_FragColor = vec4(added, color.a);

  }`

var g_modelMatrix = new Matrix4();
var g_viewMatrix = new Matrix4();
var g_projMatrix = new Matrix4();
var normalMatrix = new Matrix4();

var g_mvpMatrix = new Matrix4();

var myCube;
var mySphere;
var myTorus;




var SKYBOX_VERTEX_SHADER =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

var SKYBOX_FRAGMENT_SHADER =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
  '  gl_FragColor = vec4(color.rgb, color.a);\n' +
  '  gl_FragColor = vec4(1.0,1.0,1.0,1.0);\n' +
  '}\n';


//////////////////////////////////////////////////////////////





function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);

	// Initialize shaders
	var texProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);
  gl.useProgram(texProgram);

	// Get storage locations of attribute and uniform variables in program object for texture drawing
	texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
	texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
	texProgram.a_Normal = gl.getAttribLocation(texProgram, 'a_Normal');
	texProgram.a_Tangent = gl.getAttribLocation(texProgram, 'a_Tangent');
	texProgram.a_BiTangent = gl.getAttribLocation(texProgram, 'a_BiTangent');

	//get storage location for uniform variables
	texProgram.u_ProjMatrix = gl.getUniformLocation(texProgram, 'u_ProjMatrix');
	texProgram.u_ViewMatrix = gl.getUniformLocation(texProgram, 'u_ViewMatrix');
	texProgram.u_ModelMatrix = gl.getUniformLocation(texProgram, 'u_ModelMatrix');
	texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');
	texProgram.normalMap = gl.getUniformLocation(texProgram, 'normalMap');
	texProgram.u_NormalMatrix = gl.getUniformLocation(texProgram, 'u_NormalMatrix');

  //Ambient Light
	texProgram.u_AmbientLight = gl.getUniformLocation(texProgram, 'u_AmbientLight');    

  //Point Array Active
  for (var n = 0; n < 10; n++){
    texProgram.u_LightActive = gl.getUniformLocation(texProgram, "u_LightActive["+ n +"]");
    gl.uniform1i(texProgram.u_LightActive, 0); 
  }

  //Point light 1
	texProgram.u_LightColor = gl.getUniformLocation(texProgram, 'u_LightColor');
	texProgram.u_LightPosition = gl.getUniformLocation(texProgram, 'u_LightPosition');
   
	//Point light 2
	texProgram.u_LightColor2 = gl.getUniformLocation(texProgram, 'u_LightColor2');
	texProgram.u_LightPosition2 = gl.getUniformLocation(texProgram, 'u_LightPosition2');

	//Sunlight
	texProgram.u_DiffuseLight = gl.getUniformLocation(texProgram, 'u_DiffuseLight');
	texProgram.u_LightDirection = gl.getUniformLocation(texProgram, 'u_LightDirection');

    
	// Color of Fog
	var fogColor = new Float32Array([0.137, 0.231, 0.423]); //0.137, 0.231, 0.423
	// Distance of fog [where fog starts, where fog completely covers object]
	var fogDist = new Float32Array([15, 25]);
	// Position of eye point (world coordinates)
	var eye = new Float32Array([0,0,0, 1.0]);
	texProgram.u_Eye = gl.getUniformLocation(texProgram, 'u_Eye');
  texProgram.u_Eye2 = gl.getUniformLocation(texProgram, 'u_Eye2');
	texProgram.u_FogColor = gl.getUniformLocation(texProgram, 'u_FogColor');
	texProgram.u_FogDist = gl.getUniformLocation(texProgram, 'u_FogDist');



	// Set the vertex information
	var cube = initVertexBuffers(gl, myCube);
	var sphere = initVertexBuffers(gl, mySphere);
  var torus = initVertexBuffers(gl, myTorus);


	if (!cube || !sphere || !torus) {
		console.log('Failed to set the vertex information');
		return;
	}
	var sphereMaterial = initTextures(gl, texProgram, './Textures/Sphere/mySphere_Sphere_BaseColor.png', 0);
	var sphereNormalMap = initTextures(gl, texProgram, './Textures/Sphere/mySphere_Sphere_Normal.png', 1);
	if (!sphereMaterial) {
		console.log('Failed to intialize the texture.');
		return;
	}
    
  var torusMaterial = initTextures(gl, texProgram, './Textures/Torus/torusBase.png', 0);
	var torusNormalMap = initTextures(gl, texProgram, './Textures/Torus/torusNormal.png', 1);
	if (!torusMaterial) {
		console.log('Failed to intialize the texture.');
		return;
	}

	var woodMaterial = initTextures(gl, texProgram, './Textures/WoodPanel.png', 0);
	var woodNormal = initTextures(gl, texProgram, './Textures/WoodNormal.png', 1);
	if (!woodMaterial) {
		console.log('Failed to intialize the texture.');
		return;
	}

	var brickMaterial = initTextures(gl, texProgram, './Textures/BrickBaseColor.png', 0);
	var brickNormal = initTextures(gl, texProgram, './Textures/BrickNormal.png', 1);
	if (!brickMaterial) {
		console.log('Failed to intialize the texture.');
		return;
	}
    

	var solidGray = initTextures(gl, texProgram, './Textures/SolidGray_BaseColor.png', 0);
	var solidGrayNormal = initTextures(gl, texProgram, './Textures/SolidGray_Normal.png', 1);

    

	// Set the clear color and enable the depth test
	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0);






  //Skybox Shader
  var skyProgram = createProgram(gl, SKYBOX_VERTEX_SHADER, SKYBOX_FRAGMENT_SHADER);
  skyProgram.a_Position = gl.getAttribLocation(skyProgram, 'a_Position');
  skyProgram.a_TexCoord = gl.getAttribLocation(skyProgram, 'a_TexCoord');
  skyProgram.u_MvpMatrix = gl.getUniformLocation(skyProgram, 'u_MvpMatrix');
  skyProgram.u_Sampler = gl.getUniformLocation(skyProgram, 'u_Sampler');

  var skyboxObj = initCube(gl);

  var texID;
  var g_skyBoxUrls = [
      './Textures/Sky/skyposx1.png',
      './Textures/Sky/skynegx1.png',
      './Textures/Sky/skyposy1.png',
      './Textures/Sky/skynegy1.png',
      './Textures/Sky/skyposz1.png',
      './Textures/Sky/skynegz1.png'
      ];

  //loadTextureCube(g_skyBoxUrls);
  var skyTex = initTexturesSky(gl, skyProgram, './Textures/Sky/skyposx1.png');
  gl.useProgram(texProgram);




    
	var viewMatrix = new Matrix4();
	var projMatrix = new Matrix4();

	var viewProjMatrix = {viewMatrix, projMatrix};

  document.onkeydown = function(e){ checkKey(e, m) };


  //Point lights 1 and 2 // Pos           //Color
  var k = createLight(-0.4, 0.0, 2.0,     0.6, 0.6, .6);
  var k = createLight(0.4, 0.5, -2.3,     .3, .3, .8);



	var tick = function() {
		m.angle = animate(m.angle, m);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffers

    // Pass fog color, distances, and eye point to uniform variable
    eye[0] = m.px;
    eye[1] = m.py;
    eye[2] = m.pz;
    gl.uniform3fv(texProgram.u_FogColor, fogColor); // Colors
    gl.uniform2fv(texProgram.u_FogDist, fogDist);   // Starting point and end point
    gl.uniform4fv(texProgram.u_Eye, eye);           // Eye point
    gl.uniform4fv(texProgram.u_Eye2, eye);
    
    viewMatrix.setPerspective(90.0, canvas.width/canvas.height, 0.1, 100.0);
    projMatrix.setLookAt(m.px, m.py, m.pz ,   m.lx, m.ly, m.lz, 0.0, 1.0, 0.0);



    //Lights
    drawLights(gl, texProgram);
        

    //Wood Floor
    for (var n = 0; n < 1; n++){
  		var transformations = {};
  		var translation = [0.0+n*10, -2.0, 0.0];
  		var scale = [10.0, 0.2, 10.0];
  		var rotation =  [0.0,0.0,1.0,0.0];

  		transformations.translation = translation;
  		transformations.scale = scale;
  		transformations.rotation = rotation;

  		drawTexObj(gl, texProgram, cube, woodMaterial, transformations, viewProjMatrix, woodNormal);

    }

   

    //Brick Cube
		var transformations = {};
		var translation = [0.0, -1.0, 0.0];
		var scale = [2, 2, 2];
		var rotation =  [45.0,0.0,1.0,0.0];

		transformations.translation = translation;
		transformations.scale = scale;
		transformations.rotation = rotation;

		drawTexObj(gl, texProgram, cube, brickMaterial, transformations, viewProjMatrix, brickNormal);




		//Sphere for Light
		var transformations = {};
		var translation = [ -0.4, 0.0, 2.0];
		var scale = [0.05, 0.05, 0.05];
		var rotation =  [0.0,0.0,1.0,0.0];

		transformations.translation = translation;
		transformations.scale = scale;
		transformations.rotation = rotation;

		drawTexObj(gl, texProgram, sphere, solidGray, transformations, viewProjMatrix, solidGrayNormal);



		//Sphere for Light
		var transformations = {};
		var translation = [0.4, 0.5, -2.3];
		var scale = [0.05, 0.05, 0.05];
		var rotation =  [0.0,0.0,1.0,0.0];

		transformations.translation = translation;
		transformations.scale = scale;
		transformations.rotation = rotation;

		drawTexObj(gl, texProgram, sphere, solidGray, transformations, viewProjMatrix, solidGrayNormal);



    //Sphere Big
		var transformations = {};
		var translation = [0.0, -1.0, -2.5];
		var scale = [.4, .4, .4];
		var rotation =  [0.0,1.0,0.0,0.0];

		transformations.translation = translation;
		transformations.scale = scale;
		transformations.rotation = rotation;

		drawTexObj(gl, texProgram, sphere, sphereMaterial, transformations, viewProjMatrix, sphereNormalMap);



    //Sphere Big Rotating
		var transformations = {};
		var translation = [Math.sin(m.angle/30)*5, -1.0, Math.cos(m.angle/30)*5];
		var scale = [.2, .2, .2];
		var rotation =  [0.0,1.0,0.0,0.0];

		transformations.translation = translation;
		transformations.scale = scale;
		transformations.rotation = rotation;

		drawTexObj(gl, texProgram, sphere, solidGray, transformations, viewProjMatrix, sphereNormalMap);



    //Torus
		var transformations = {};
		var translation = [-0.0,1.0,0];
		var scale = [1.0, 1.0, 1.0];
		var rotation =  [0.0,1.0,0.0,0.0];

		transformations.translation = translation;
		transformations.scale = scale;
		transformations.rotation = rotation;

		drawTexObj(gl, texProgram, torus, torusMaterial, transformations, viewProjMatrix, torusNormalMap);



    

    renderSkybox(gl, skyProgram, viewProjMatrix, skyboxObj, skyTex);
    gl.useProgram(texProgram);

		window.requestAnimationFrame(tick, canvas);
	}
	tick();
}



function renderSkybox(gl, program, viewProjMatrix, o, tex){
  gl.useProgram(program);

  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); //Vertex coord
  initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer); //Texture coord
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); // Bind indices

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  g_modelMatrix.setTranslate(0.0, 0.0, 0.0);
  g_modelMatrix.scale(1,5,1);

  g_mvpMatrix.set(viewProjMatrix.viewMatrix).multiply(viewProjMatrix.projMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);
  gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);   
}



function initCube(gl) {
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
     2.0, 2.0, 2.0,  -2.0, 2.0, 2.0,  -2.0,-2.0, 2.0,   2.0,-2.0, 2.0, // v0-v1-v2-v3 front
     2.0, 2.0, 2.0,   2.0,-2.0, 2.0,   2.0,-2.0,-2.0,   2.0, 2.0,-2.0, // v0-v3-v4-v5 right
     2.0, 2.0, 2.0,   2.0, 2.0,-2.0,  -2.0, 2.0,-2.0,  -2.0, 2.0, 2.0, // v0-v5-v6-v1 up
    -2.0, 2.0, 2.0,  -2.0, 2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0,-2.0, 2.0, // v1-v6-v7-v2 left
    -2.0,-2.0,-2.0,   2.0,-2.0,-2.0,   2.0,-2.0, 2.0,  -2.0,-2.0, 2.0, // v7-v4-v3-v2 down
     2.0,-2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0, 2.0,-2.0,   2.0, 2.0,-2.0  // v4-v7-v6-v5 back
  ]);

  // Colors
  var r = 1;
  var b = 1;
  var g = 1;
  var colors = new Float32Array([
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v3-v4-v5 right
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v5-v6-v1 up
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v1-v6-v7-v2 left
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v7-v4-v3-v2 down
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v4-v7-v6-v5 back
  ]);  

  var n = 1.0;
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
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
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
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_SHORT); 

  o.tangentBuffer = initArrayBufferForLaterUse(gl, 0, 3, gl.FLOAT);
  o.bitangentBuffer = initArrayBufferForLaterUse(gl, 0, 3, gl.FLOAT);

  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);

  if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null;

  o.numIndices = indices.length;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}





/*
Create Model based on given model Data
*/
function initVertexBuffers(gl, myModel) {

    var vertices = new Float32Array(myModel.meshes[0].vertices);
    var texCoords = new Float32Array(myModel.meshes[0].texturecoords[0]);
    var normals = new Float32Array(myModel.meshes[0].normals);
    var tangents = new Float32Array(myModel.meshes[0].tangents);
    var bitangents = new Float32Array(myModel.meshes[0].bitangents);

    var indices = new Uint16Array([].concat.apply([], myModel.meshes[0].faces));

    var o = new Object(); // Utilize Object to to return multiple buffer objects together

    // Write vertex information to buffer object
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
    o.tangentBuffer = initArrayBufferForLaterUse(gl, tangents, 3, gl.FLOAT);
    o.bitangentBuffer = initArrayBufferForLaterUse(gl, bitangents, 3, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_SHORT);

    if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}




function loadTextureCube(urls) {
    var ct = 0;
    var img = new Array(6);
    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function() {
            ct++;
            if (ct == 6) {
                texID = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID);
                var targets = [
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
                    gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
                    gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z 
                        ];
                for (var j = 0; j < 6; j++) {
                    gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                //drawScene();
            }
        }
        img[i].src = urls[i];
    }

}






/*
@param gl - webgl context
@param program - the shader program that is used
@param imSrc - the image source
Attach the specified texture image to the specified shader program.
*/
function initTextures(gl, program, imSrc, texUnit) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return null;
    }

    var image = new Image();  // Create a image object
    if (!image) {
        console.log('Failed to create the image object');
        return null;
    }
    // Register the event handler to be called when image loading is completed
    image.onload = function() {
        // Write the image data to texture object
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
        if(texUnit == 0){
            gl.activeTexture(gl.TEXTURE0);
        }
        else {
            gl.activeTexture(gl.TEXTURE1);
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Pass the texure unit 0 to u_Sampler
        gl.useProgram(program);
        if(texUnit == 0){
            gl.uniform1i(program.u_Sampler, 0);
        }
        else{
            gl.uniform1i(program.normalMap, 1);
        }

        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
    };

    // Tell the browser to load an Image
    image.src = imSrc;

    return texture;
}


function initTexturesSky(gl, program, imSrc) {
  var texture = gl.createTexture();   // Create a texture object
  var image = new Image();  // Create a image object

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

  image.src = imSrc;

  return texture;
}



/*
@param gl - WebGL context
@param program - the shader program
@param o - object that is being rendered
@param texture - the texture that will be used with our object.
@param transformations - the transformations that will be used for the cube
@param viewProjMatrix - Object that contains view matrix and projection matrix
the goal of drawTexObj is to place the specified texture onto the cube and
then call drawCube to render said cube.
*/
function drawTexObj(gl, program, o, texture, transformations, viewProjMatrix, normal) {
    gl.useProgram(program);   // Tell that this program object is used

    // Assign the buffer objects and enable the assignment
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);  // Vertex coordinates
    initAttributeVariable(gl, program.a_Normal, o.normalBuffer);  // Vertex coordinates
    initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);// Texture coordinates
    initAttributeVariable(gl, program.a_Tangent, o.tangentBuffer);// Texture coordinates
    initAttributeVariable(gl, program.a_BiTangent, o.bitangentBuffer);// Texture coordinates
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); // Bind indices

    // Bind texture object to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, normal);
    drawCube(gl, program, o, transformations, viewProjMatrix); // Draw
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}





/*
Create Light objects and push to stack
*/

lightVector = [];
numLights = 0;

function createLight(x, y, z, r, g ,b){
    let objLight = new LightObject(x, y, z, numLights, r, g, b);
    lightVector.push(objLight);
    
    numLights++;
    
    return objLight.get_ID();
}



function drawLights(gl, program){
    gl.useProgram(program);

    //Add a Light
    if (m.clight == 1){
      m.clight = 0;
      var k = createLight(m.px, m.py, m.pz, 0,.5,0);
    }

    //Pop off a Light
    if (m.clight == -1){
      m.clight = 0;
      if (numLights > 0){
        numLights-=1;
        lightVector.pop();
      }
      var n = numLights;
      program.u_LightActive = gl.getUniformLocation(program, "u_LightActive["+ n +"]");

      gl.uniform1i(program.u_LightActive, 0); 

    }
    
    //Cycle through the number of lights and set all according to what is stored in lightVector objects
    for (var n = 0; n < numLights; n++){
        var s = [0,0,0];
        var c = [0,0,0];
        for (var j = 0; j < 3; j ++){
          s[j] = lightVector[n].get_Pos()[j];
          c[j] = lightVector[n].get_Color()[j];
        }

        program.u_LightActive = gl.getUniformLocation(program, "u_LightActive["+ n +"]");
        program.u_LightColorArray = gl.getUniformLocation(program, "u_LightColorArray["+ n +"]");
        program.u_LightPositionArray = gl.getUniformLocation(program, "u_LightPositionArray["+ n +"]");

        gl.uniform1i(program.u_LightActive, 1); 
        gl.uniform3f(program.u_LightColorArray, c[0], c[1], c[2]); 
        gl.uniform3f(program.u_LightPositionArray, s[0], s[1], s[2]); 
    }


    //Sunlight
    gl.uniform3f(program.u_DiffuseLight, 0.6, 0.6, 0.6);
    gl.uniform3f(program.u_LightDirection, Math.cos(m.angle/30),1,Math.sin(m.angle/30));

    //Ambient Light
    gl.uniform3f(program.u_AmbientLight, 0.1,.1,.1);
    
}



/*
@param gl - WebGL context
@param program - the shader program
@param o - object that is being rendered
@param transformations - the transformations that will be used for the cube
@param viewProjMatrix - Object that contains view matrix and projection matrix
Draw cube is used to render out the cube instance that we create.
*/
function drawCube(gl, program, o, transformations, viewProjMatrix) {

    //Calculate a model matrix
    g_modelMatrix.setTranslate(
        transformations.translation[0], 
        transformations.translation[1] + (transformations.translation[1]/2 + 1),
        transformations.translation[2]);
    g_modelMatrix.rotate(
        transformations.rotation[0], 
        transformations.rotation[1], 
        transformations.rotation[2], 
        transformations.rotation[3]);
    g_modelMatrix.translate(0, -1 * (transformations.translation[1]/2 + 1), 0);
    g_modelMatrix.scale(transformations.scale[0], transformations.scale[1], transformations.scale[2]);

    //transform normal based on model matrix
    normalMatrix.setInverseOf(g_modelMatrix);
    normalMatrix.transpose();

    //set the shader matrices values to our global ones
    gl.uniformMatrix4fv(program.u_ViewMatrix, false, viewProjMatrix.projMatrix.elements);
    gl.uniformMatrix4fv(program.u_ProjMatrix, false,  viewProjMatrix.viewMatrix.elements);
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, g_modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);

    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);   // Draw
}










function initArrayBufferForLaterUse(gl, data, num, type) {
    var buffer = gl.createBuffer();   // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // Write data into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Keep the information necessary to assign to the attribute variable later
    buffer.num = num;
    buffer.type = type;

    return buffer;
}



function initElementArrayBufferForLaterUse(gl, data, type) {
    var buffer = gl.createBuffer();  // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}














var g_last = Date.now();
function animate(angle, m){
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    if (m.ro == 0x0){
        elapsed = 0;
    }
    var newAngle = angle + elapsed/50;

    if (m.jump > 0){
        m.jump -=.01*elapsed/15;
        m.py += (m.jump-.5);
        m.ly += (m.jump-.5);
    }else{
        m.jump = 0;
        
    }

    var look = 0;
    var speed = .2;
  
    if (m.moveup >= 1){
        m.px = m.px + Math.cos(m.turn*3.14/180)*speed;
        m.pz = m.pz + Math.sin(m.turn*3.14/180)*speed; 

        look = 1;
        m.moveup-=1;
    }
    if (m.movedown >= 1){
        m.px = m.px - Math.cos(m.turn*3.14/180)*speed;
        m.pz = m.pz - Math.sin(m.turn*3.14/180)*speed; 

        look = 1;
        m.movedown-=1;
    }
  
    if (m.tright >= 1){
        //m.turn+=4;
        m.px = m.px + Math.cos((m.turn+90)*3.14/180)*speed;
        m.pz = m.pz + Math.sin((m.turn+90)*3.14/180)*speed;

        look = 1;
        //m.lx = m.px + Math.cos(m.turn*3.14/180);
        //m.lz = m.pz + Math.sin(m.turn*3.14/180);
        m.tright-=1;
    }
    if (m.tleft >= 1){
        //m.turn-=4;
        m.px = m.px + Math.cos((m.turn-90)*3.14/180)*speed;
        m.pz = m.pz + Math.sin((m.turn-90)*3.14/180)*speed;

        look = 1;
        m.tleft-=1;
    }
    m.turn += x/5;
    //m.ly += y/10;
    if (x != 0 || y != 0 || look == 1){
        m.lx = m.px + Math.cos(m.turn*3.14/180);
        m.lz = m.pz + Math.sin(m.turn*3.14/180);
        m.ly -= y/150;
    }

    x = 0;
    y = 0;

    return newAngle % 360;
}



function checkKey(e, m) {
    console.log(e.keyCode);
    e = e || window.event;
    if (e.keyCode == '67'){ //c key
      m.clight = 1;
    }
    if (e.keyCode == '88'){
      m.clight = -1;
    }
    if (e.keyCode == '39' || e.keyCode == '68') {  // right
      m.tright = 5;
    }
    if (e.keyCode == '37' || e.keyCode == '65') { //left
      m.tleft = 5;
    }
    if (e.keyCode == '38' || e.keyCode == '87') { //up
      m.moveup = 5;
    }
    if (e.keyCode == '40' || e.keyCode == '83') { //down
      m.movedown = 5;
    }
    if (e.keyCode == '32' && m.jump == 0) { //down
      m.jump = 1;
    }

    
    if (e.keyCode == '82'){ //r
      m.ro = m.ro + 1;
            
      if (m.ro > 0x03){ m.ro = 0x0; }
      pointLight1 = m.ro & 0x01; 
      pointLight2 = m.ro & 0x02;
      
      //console.log(m.ro);
      console.log(pointLight1 + " " + pointLight2);
    }
    
}

