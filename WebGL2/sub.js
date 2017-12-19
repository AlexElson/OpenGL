/**
 * sub.js
 * @fileoverview Game using animation and user input, along with
 * varying vec4 and matrix transformations.
 * @author Alex Elson
 */

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '	 v_Color = a_Color;\n' +
  '  gl_PointSize = 10.0;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor + v_Color;\n' +
  '}\n';

var tick;

var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas, {preserveDrawingBuffer: true});
initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
var modelMatrix = new Matrix4();
var modelMatrix2 = new Matrix4();



var sizex = 60;
var sizey = 50;
var cell  = new Array(sizex*sizey);
var cell_color  = new Array(sizex*sizey);
var old_cell = new Array(sizex*sizey);
var tile = new Array(sizex*sizey);
var rect;

var px = new Array(22);
var py = new Array(22);
var palive = new Array(22);
var bx = new Array(22);
var by = new Array(22);
var btime = new Array(22);
var fx = 0;
var fy = 0;

var vertexBuffer;
var colorBuffer;
var nn;


/**
 * main - Initialize declared arrays and main game loop.
 */
function main() {

  initVertexBuffers();

  var len = cell.length;
  for(var i = 0; i < len; i++) {
	 cell_color[i]=([0.0,0.0,0.0,1.0]);
	 cell[i]=0;
  }

  for(var i = 0; i < len; i++) {
     var num;
  	 if (Math.random() > .55){ num = 0; }
  	 else{ num = 1; }
	 tile[i] = num;
	 if (i%60<=0 || i%60>=59){ tile[i]=1; }
     if (i<60 || i>len-60){ tile[i]=1; }
  }
  for(var n = 0; n < 20; n++){
  	genMap();
  }

  ///////////////////////////Random entity placement
  var len = px.length;
  for(var n = 0; n < len; n++) {

  	var a = 0;
  	for(var m = 0; m < tile.length; m++){
  		if (tile[m] == 0){
  			a+=1; }}
  	var b = Math.floor(Math.random() * (a)); a = 0;
   	for(var m = 0; m < tile.length; m++){
  		if (tile[m] == 0){
  			a+=1;
  			if (b == a){
  				px[n] = Math.floor(m%sizex);
  				py[n] = Math.floor(m/sizex);
  			} } }

    if (n <=12){
  	   palive[n]=1;
    }
  	bx[n]=0;
  	by[n]=0;
  	btime[n]=0;
  }


  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  canvas.onmousemove = function(ev){ click(ev) };
  //Closure set up for the update function.

  tick = function(ev) {
  	//.clear(gl.COLOR_BUFFER_BIT);
  	drawTiles(ev);
  	drawEntity(ev);
    update(ev);
    //draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw the triangle
    //requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
  };
  tick();

  setInterval(tick, 100);

}


var vertices;
var colored;

/**
 * initVertexBuffers - Call once to initialize and buffer all OpenGL objects.
 */
function initVertexBuffers(){

	vertices = new Float32Array ([
	  0,  0,
	  .035, 0,
	   .035, -.04,
	   0,  -.04,
	]);
	nn = 4;

	colored = new Float32Array ([
		-1,-1,   .8, 0, .3,
		1,-1,   0, .8, .4,
		1,1,  0, 0, .5,
		-1,1,  .7, .7, .8,
	]);

	vertexBuffer = gl.createBuffer();
	colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colored, gl.STATIC_DRAW);

}


/**
 * initVertexBuffers - Call once to initialize and buffer all OpenGL objects.
 */
function genMap(){
  var len = tile.length;
  for(var n = 0; n < len; n++) {
    var a=0;
    if (tile[n]==0){ a+=1; }
    if (tile[n+1]==0){ a+=1; }
    if (tile[n-1]==0){ a+=1; }
    if (tile[n+sizex]==0){ a+=1; }
    if (tile[n-sizex]==0){ a+=1; }
    if (tile[n+1+sizex]==0){ a+=1; }
    if (tile[n-1+sizex]==0){ a+=1; }
    if (tile[n+1-sizex]==0){ a+=1; }
    if (tile[n-1-sizex]==0){ a+=1; }
    cell[n]=1;
    if (a>=5){ cell[n]=0; }
  }
  for(var n = 0; n < len; n++) {
  	tile[n] = cell[n];
  	cell[n] = 0;
  }
}





/**
 * click - Obtains location of mouse location.
 * @param {Object} ev - event Object used for mouse_move
 */
function click(ev) {

  var x = Math.floor(ev.clientX/10);
  var y = Math.floor(ev.clientY/10);
  rect = ev.target.getBoundingClientRect();

  //Draw in cells at mouse clip
  /*
  cell[Math.floor(x)+Math.floor(y)*sizex] = 20;
  cell[Math.floor(x)+Math.floor(y)*sizex+1] = 20;
  cell[Math.floor(x)+Math.floor(y)*sizex-1] = 20;
  cell[Math.floor(x)+Math.floor(y)*sizex+sizex] = 20;
  cell[Math.floor(x)+Math.floor(y)*sizex-sizex] = 20;
  */

}




var dir = -1;
var bomb = 0;
var bomb_size = 2.0;
var amount = .5;

document.onkeydown = checkKey;

/**
 * checkKey - Keyboard input to move player and place bomb.
 * @param {Object} e - event Object used for keyboard input.
 */
function checkKey(e) {
    e = e || window.event;
    if (e.keyCode == '38') { dir = 0; }
    else if (e.keyCode == '40') { dir = 1; }
    else if (e.keyCode == '37') { dir = 2; }
    else if (e.keyCode == '39') { dir = 3; }
    else if (e.keyCode == '32') { bomb = 1; }
}



var score = 0;

/**
 * drawEntity - Draws player and all live enemies. Draws bombs.
 * @param {Object} ev - event Object used for input.
 */
function drawEntity(ev){
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  var len = px.length;
  for(var n = 0; n < len; n++) {

  	if (palive[n] == 1){
		//Character movement
		oldx = px[n];
		oldy = py[n];
		if (n==0){ //ONLY player
			if (dir == 0){ py[0]-=1; }
			if (dir == 1){ py[0]+=1; }
			if (dir == 2){ px[0]-=1; }
			if (dir == 3){ px[0]+=1; }
			if (bomb == 1){
				bomb = 0;
        if (btime[0]<=0){
				    bx[0] = px[0];
				    by[0] = py[0];
				    btime[0] = 25;
        }else{ //Add extra bombs for player
            for(var m = 13; m<21; m++){
              if (btime[m]<=0){
                btime[m]=25;
                bx[m] = px[0];
    				    by[m] = py[0];
                break;
              }
            }
        }
			}
		}else{ //Only Enemies
			ran = Math.random();
			if (ran > .85){ py[n]-=1; }
			else if (ran > .7){ py[n]+=1; }
			else if (ran > .55){ px[n]-=1; }
			else if (ran > .4){ px[n]+=1; }
			place_bomb = Math.random()*1000;
			if (place_bomb < 20 && btime[n] <=0){
				bx[n] = px[n];
				by[n] = py[n];
				btime[n] = 30;
			}
			if (px[0] == px[n] && py[0] == py[n] && palive[n]==1){
				palive[n] = 0;
				score+=1;
        if (score==12){
          alert("You win!");
          score+=1;
        }
			}
		}
		if (tile[px[n]+py[n]*sizex]%2 == 1){ px[n] = oldx; py[n] = oldy; }
		if (px[n] == 0 || px[n] == sizex-1){ px[n] = oldx; py[n] = oldy; }
		if (py[n] == 0 || py[n] == sizey-1){ px[n] = oldx; py[n] = oldy; }

		//Check to kill player by fire
		if (cell[px[0]+py[0]*sizex] >= 15){
			palive[0]=0;
		}

	  	var m = px[n]+py[n]*sizex;
	    var x = Math.floor(m%60)*10;
	    var y = Math.floor(m/60)*10;
	    var xx = ((x) - canvas.width/2)/(canvas.width/2);
	    var yy = (canvas.height/2 - (y))/(canvas.height/2);

	  	modelMatrix.setTranslate(xx, yy, 0);
	  	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  	if (n==0){
			gl.uniform4f(u_FragColor, 1, 0, 1, 1); //Player draw
		}else{
			gl.uniform4f(u_FragColor, 1, 0, 0, 1); //Enemy draw
		}

		gl.drawArrays(gl.TRIANGLE_FAN, 0, nn);

	}
	///////////////////////Bombs Explode
	if (btime[n] > 0){
		btime[n]-=1;
		if (btime[n] == 0){
			bz = Math.floor(bomb_size);
			for(var x = -bz; x < bz; x++){
				for(var y = -bz; y < bz; y++){
					p = Math.random();
					if (p<.5)
						cell[Math.floor(bx[n]+x)+Math.floor(by[n]+y)*sizex]=20;
					if (n==0 || n>12){
						for(var m = 1; m < 12; m++){
						 if (px[m]==x+bx[n] && py[m]==by[n]+y && palive[m]==1){
							palive[m]=0;
							score+=1;
                if (score==12){
                  alert("You win!");
                  score+=1;
                }
							}
						}
					}
				}
			}
			if (bomb_size<5){
				bomb_size+=.01;
			}
		}

	    var x = bx[n]*10;
	    var y = by[n]*10;
	    var xx = ((x) - canvas.width/2)/(canvas.width/2);
	    var yy = (canvas.height/2 - (y))/(canvas.height/2);

	  	modelMatrix.setTranslate(xx, yy, 0);
	  	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
		gl.uniform4f(u_FragColor, 0, 0, 0, 1);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, nn);
	}
  }
}

var angle = 0;

/**
 * drawTiles - Cycles through and draws all cells and background.
 * @param {Object} ev - event Object used for mouse_move
 */
function drawTiles(ev){

  ////////////////////////Binding Rotating background
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  var FSIZE = colored.BYTES_PER_ELEMENT;

  angle+=3;
  modelMatrix2.setScale(1.41,1.41,1);
  modelMatrix2.rotate(angle, 0, 0, 1);
  //modelMatrix2.translate(1,-1,0);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix2.elements);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform4f(u_FragColor, 0, 0, 0, 1)
  gl.drawArrays(gl.TRIANGLE_FAN, 0, nn);


  /////////////////////////////////////Binding tiles
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.disableVertexAttribArray(a_Color);


  var len = tile.length;
  for(var n = 0; n < len; n++) {

    var x = Math.floor(n%60)*10;
    var y = Math.floor(n/60)*10;

    var xx = ((x) - canvas.width/2)/(canvas.width/2);
    var yy = (canvas.height/2 - (y))/(canvas.height/2);

	 if (tile[n]%2 == 0){

	 	modelMatrix.setTranslate(xx, yy, 0);
	 	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	 	gl.uniform4f(u_FragColor, .4, .3, .75, 1);
	 }
	 if (tile[n]%2 == 1){
	 	//gl.vertexAttrib3f(a_Position, xx, yy, 0.0);
	 	//modelMatrix.setTranslate(xx, yy, 0);
	 	//gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	 	//gl.uniform4f(u_FragColor, .2, .15, .05, 1);
	 }

	 if (upd >= 1 && tile[n]%2 == 0){
	   gl.drawArrays(gl.TRIANGLE_FAN, 0, nn);
	 }
	 if (tile[n] > 1){
	 	tile[n]-=2;
	 }
  }

}


var upd = 5;

/**
 * update - Animation frames. Performs game logic and matrix transformations.
 * @param {Object} ev - event Object used for input.
 */
function update(ev){

  modelMatrix.setTranslate(0, 0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

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

  var len = cell.length;
  for(var n = 0; n < len; n++) {

    if (cell[n]>=15){
      cell_color[n] = ([1.0,0.8,0.0, 1]);
      if (tile[n] == 1){
      	tile[n] = 0;
      }
    }else if (cell[n]>=1){
      cell_color[n] = ([1.0,0.0,0.0, 1]);
    }

    if (cell[n]==0){
      cell_color[n] = ([0.0,1.0,0.0,0.0]);
    }

    var rgba = cell_color[n];

     if (rgba[0]>0.0){ //Makes sure the cell is not empty.
      var x = Math.floor(n%60)*10+5;
      var y = Math.floor(n/60)*10+5;

      var xx = ((x) - canvas.width/2)/(canvas.width/2);
      var yy = (canvas.height/2 - (y))/(canvas.height/2);

      tile[n]+=2;
      upd+=1;

      gl.vertexAttrib3f(a_Position, xx, yy, 0.0);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.disableVertexAttribArray(a_Position);
      gl.drawArrays(gl.POINTS, 0, 1);
     }
  }


}
