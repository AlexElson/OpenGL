#define GL_GLEXT_PROTOTYPES

//g++ main.c -lglut -lGL -lGLEW
//glxinfo | grep "version"

#include <GL/glew.h>
#include <GL/freeglut.h>
#include "../SOIL.h"
#include <time.h>

#include <stdio.h>
#include <vector>
#include <iostream>
#include <cstring>
#include <cmath>

using namespace std;

const int WIDTH = 1200;
const int HEIGHT = 800;

static const char* vertex_source = 
    "   #version 130 \n" 

    "   uniform vec4 u_Translation; \n"
    " 	uniform mat4 u_ViewMatrix; \n"
  	"	uniform mat4 u_ProjMatrix; \n"
  	"	uniform mat4 u_ModelMatrix; \n"

    "   in vec4 a_Position; \n" 
    "   in vec4 a_Color; \n"
    "   in vec2 a_TexCoord; \n"
    "   out vec4 v_Color; \n"

    "   varying vec2 v_TexCoord;\n"

    "   void main() { \n" 
    "       gl_Position = a_Position * u_ModelMatrix * u_ViewMatrix * u_ProjMatrix;  \n" 
    "       v_Color = a_Color; \n"
    "       v_TexCoord = a_TexCoord;\n"
    "   } \n";

//http://webstaff.itn.liu.se/~stegu/jgt2012/article.pdf

static const char* fragment_source =
    "   #version 130 \n"
    "   in vec4 v_Color; \n"

    "	uniform sampler2D u_Sampler;\n"
    "	varying vec2 v_TexCoord;\n"
    "	uniform float u_Time; \n"

    "   vec3 permute(vec3 x){ \n"
    "		return mod(((x*34.0)+1.0)*x, 289.0); \n"
    "	} \n"

    "	vec3 taylorInvSqrt(vec3 r){ \n"
    "		return 1.79284291400159 - 0.85373472095314 * r; \n"
    "	} \n"

    "   float noise(vec2 P){ \n"
    "		const vec2 C = vec2(0.21132486540518713, 0.36602540378443859); \n"
    "		vec2 i = floor(P + dot(P, C.yy) ); \n"
    "		vec2 x0 = P - i + dot(i, C.xx); \n"
    "		vec2 i1; \n"
    "		i1.x = step( x0.y, x0.x ); \n"
    "		i1.y = 1.0 - i1.x; \n"
    "		vec4 x12 = x0.xyxy +  vec4( C.xx, C.xx * 2.0 - 1.0); \n"
    "		x12.xy -= i1; \n"
    "		i = mod(i, 289.0); \n"
    "		vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 )); \n"
    "		vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0); \n"
    "		m = m*m; \n"
    "		m = m*m; \n"
    "		vec3 x = fract(p*(1.0/41.0)) * 2.0 - 1.0; \n"
    "		vec3 gy = abs(x)-0.5; \n"
    "		vec3 ox = floor(x + 0.5); \n"
    "		vec3 gx = x - ox; \n"
    "		m *= taylorInvSqrt( gx*gx + gy*gy ); \n"
    "		vec3 g; \n"
    "		g.x = gx.x * x0.x + gy.x * x0.y; \n"
    "		g.yz = gx.yz * x12.xz + gy.yz * x12.yw; \n"
    "		return 130.0 * dot(m, g); \n"
    "	} \n"

    "	float turb(float cx, float cy){ \n"
    "		return .5 * noise(vec2(cx,cy)) + .25 * noise(vec2(2*cx,2*cy)) + .125 * noise(vec2(4*cx,4*cy)); \n"
    "	} \n"

    "   void main(){ \n"
    "		float cx = v_TexCoord.x; \n"
    "		float cy = v_TexCoord.y; \n"
    "		float n = (1 + sin((cx+cy + noise( vec2(cx/4 ,cy/16) ) * .5) * 50)) * .5; \n"
    //"		float m = (1 + sin((cx+cy + sin(u_Time*.01) * turb(cx*10,cy*5) *.1) * 50))/2; \n"
    "		float m = (1 + sin((cx + turb(cx,cy) * .1) * 25)) * .5; \n"

    "       vec4 color = texture2D(u_Sampler, v_TexCoord); \n"
    "       gl_FragColor = v_Color * vec4(color.rgb, color.a); \n"
    //"       gl_FragColor = vec4(color.rgb, color.a); \n"
    //"       gl_FragColor = gl_FragColor + vec4( m,m,m, 1.0); \n"
    "   }\n";

typedef enum {
    a_Position,
    a_Color,
    a_TexCoord,
} attrib_id;

struct Matrix4 {
    float elements[16] = {1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1};

	void setElements(float (&e)[16]){
		for (int n = 0; n < 16; n++){
            elements[n] = e[n];
        }
	}

    //Set default matrix
    void setIdentity(){
        float e[16];
        e[0] = 1;   e[4] = 0;   e[8]  = 0;   e[12] = 0;
        e[1] = 0;   e[5] = 1;   e[9]  = 0;   e[13] = 0;
        e[2] = 0;   e[6] = 0;   e[10] = 1;   e[14] = 0;
        e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1;
        setElements(e);
    }

    //Copies Matrix to another
    void copyFrom(Matrix4 old){
        for(int n = 0; n < 16; n++){
            elements[n] = old.elements[16-n];
        }
    }

    //Print Matrix
    void print(){
        for(int n = 0; n < 16; n++){
            cout << elements[n] << " ";
            if (n%4 == 3) cout << endl;
        }
        cout << endl;
    }

    //Reverse matrix
	void transpose(){
		float t;
		float e[16];
		for (int n = 0; n < 16; n++){
            e[n] = elements[n];
        }
		t = e[ 1];  e[ 1] = e[ 4];  e[ 4] = t;
		t = e[ 2];  e[ 2] = e[ 8];  e[ 8] = t;
		t = e[ 3];  e[ 3] = e[12];  e[12] = t;
		t = e[ 6];  e[ 6] = e[ 9];  e[ 9] = t;
		t = e[ 7];  e[ 7] = e[13];  e[13] = t;
		t = e[11];  e[11] = e[14];  e[14] = t;
		setElements(e);
	}

	//SetTranslate on Translation matrix
	void setTranslate(float x, float y, float z) {
		float e[16];
		for (int n = 0; n < 16; n++){
            e[n] = elements[n];
        }
		e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x;
		e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y;
		e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z;
		e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
		setElements(e);
		return;
	};

	//Translate matrix by x, y, z - multiply by x, y, z
	void translate(float x, float y, float z) {
		float e[16]; 
  		for (int n = 0; n < 16; n++){
            e[n] = elements[n];
        }
		e[12] += e[0] * x + e[4] * y + e[8]  * z;
		e[13] += e[1] * x + e[5] * y + e[9]  * z;
		e[14] += e[2] * x + e[6] * y + e[10] * z;
		e[15] += e[3] * x + e[7] * y + e[11] * z;
		setElements(e);
		return;
	}

	//SetScale on Model matrix
	void setScale(float x, float y, float z) {
		float e[16];
		for (int n = 0; n < 16; n++){
            e[n] = elements[n];
        }
		e[0] = x;  e[4] = 0;  e[8]  = 0;  e[12] = 0;
		e[1] = 0;  e[5] = y;  e[9]  = 0;  e[13] = 0;
		e[2] = 0;  e[6] = 0;  e[10] = z;  e[14] = 0;
		e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
		setElements(e);
		return;
	};

	//Scale on Model matrix, multiply by x y z
	void scale(float x, float y, float z) {
		float e[16];
		for (int n = 0; n < 16; n++){
            e[n] = elements[n];
        }
		e[0] *= x;  e[4] *= y;  e[8]  *= z;
		e[1] *= x;  e[5] *= y;  e[9]  *= z;
		e[2] *= x;  e[6] *= y;  e[10] *= z;
		e[3] *= x;  e[7] *= y;  e[11] *= z;
		setElements(e);
		return;
	};

	void setRotate( float angle, float x, float y, float z) {
		float s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;
		float e[16];
		for (int n = 0; n < 16; n++){
	        e[n] = elements[n];
	    }

		angle = M_PI * angle / 180.0;

		s = sin(angle);
		c = cos(angle);

		if (0 != x && 0 == y && 0 == z) {
	    	// Rotation around X axis
			if (x < 0) {
				s = -s;
			}
			e[0] = 1;  e[4] = 0;  e[ 8] = 0;  e[12] = 0;
			e[1] = 0;  e[5] = c;  e[ 9] =-s;  e[13] = 0;
			e[2] = 0;  e[6] = s;  e[10] = c;  e[14] = 0;
			e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
		} else if (0 == x && 0 != y && 0 == z) {
		    // Rotation around Y axis
		    if (y < 0) {
				s = -s;
		    }
		    e[0] = c;  e[4] = 0;  e[ 8] = s;  e[12] = 0;
		    e[1] = 0;  e[5] = 1;  e[ 9] = 0;  e[13] = 0;
		    e[2] =-s;  e[6] = 0;  e[10] = c;  e[14] = 0;
		    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
		} else if (0 == x && 0 == y && 0 != z) {
	    	// Rotation around Z axis
	    	if (z < 0) {
				s = -s;
			}
		    e[0] = c;  e[4] =-s;  e[ 8] = 0;  e[12] = 0;
		    e[1] = s;  e[5] = c;  e[ 9] = 0;  e[13] = 0;
		    e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0;
		    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
		} else {
	    	// Rotation around another axis
	    	len = sqrt(x*x + y*y + z*z);
	    	if (len != 1) {
				rlen = 1 / len;
				x *= rlen;
				y *= rlen;
				z *= rlen;
			}
			nc = 1 - c;
			xy = x * y;
			yz = y * z;
			zx = z * x;
			xs = x * s;
			ys = y * s;
			zs = z * s;

			e[ 0] = x*x*nc +  c;
			e[ 1] = xy *nc + zs;
			e[ 2] = zx *nc - ys;
			e[ 3] = 0;

			e[ 4] = xy *nc - zs;
			e[ 5] = y*y*nc +  c;
			e[ 6] = yz *nc + xs;
			e[ 7] = 0;

			e[ 8] = zx *nc + ys;
			e[ 9] = yz *nc - xs;
			e[10] = z*z*nc +  c;
			e[11] = 0;

			e[12] = 0;
			e[13] = 0;
			e[14] = 0;
			e[15] = 1;
		}
		setElements(e);

		return;
	};

	void rotate( float angle, float x, float y, float z ){
		Matrix4 temp;
		temp.setRotate(angle, x, y, z);
		concat( temp.elements );
	}

	void concat( float (&other)[16] ) {
		int i;
		float ai0, ai1, ai2, ai3;
		float e[16];
		float a[16];
		float b[16];
		// Calculate e = a * b
		for (int n = 0; n < 16; n++){
	        e[n] = elements[n];
	        a[n] = elements[n];
	        b[n] = other[n];
	    }
  
		for (i = 0; i < 4; i++) {
			ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];
			e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
			e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
			e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
			e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
		}
		setElements(e);

		return;
	};

	// Set Perspective for Perspective Matrix
	void setPerspective(float fovy, float aspect, float near, float far) {
		float rd, s, ct;

		if (near == far || aspect == 0) {
			cerr << 'null frustum' << endl;
		}
		if (near <= 0) {
			cerr << 'near <= 0' << endl;
		}
		if (far <= 0) {
			cerr << 'far <= 0' << endl;
		}

		fovy = M_PI * fovy / 180.0 / 2.0;
  		s = sin(fovy);
		if (s == 0) {
			cerr << 'null frustum' << endl;
		}

		rd = 1.0 / (far - near);
		ct = cos(fovy) / s;

		float e[16]; 
  		for (int n = 0; n < 16; n++){
            e[n] = elements[n];
        }
		e[0]  = ct / aspect;
		e[1]  = 0;
		e[2]  = 0;
		e[3]  = 0;

		e[4]  = 0;
		e[5]  = ct;
		e[6]  = 0;
		e[7]  = 0;

		e[8]  = 0;
		e[9]  = 0;
		e[10] = -(far + near) * rd;
		e[11] = -1;

		e[12] = 0;
		e[13] = 0;
		e[14] = -2 * near * far * rd;
		e[15] = 0;
		setElements(e);
		return;
	}

	//Set Look At for Projection Matrix
	void setLookAt(float eyeX, float eyeY, float eyeZ, 
				float centerX, float centerY, float centerZ, 
				float upX, float upY, float upZ) {
		float fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

		fx = centerX - eyeX;
		fy = centerY - eyeY;
		fz = centerZ - eyeZ;

		// Normalize f.
		rlf = 1.0 / sqrt(fx*fx + fy*fy + fz*fz);
		fx *= rlf;
		fy *= rlf;
		fz *= rlf;

		// Calculate cross product of f and up.
		sx = fy * upZ - fz * upY;
		sy = fz * upX - fx * upZ;
		sz = fx * upY - fy * upX;

		// Normalize s.
		rls = 1.0 / sqrt(sx*sx + sy*sy + sz*sz);
		sx *= rls;
		sy *= rls;
		sz *= rls;

		// Calculate cross product of s and f.
		ux = sy * fz - sz * fy;
		uy = sz * fx - sx * fz;
		uz = sx * fy - sy * fx;

		// Set to this.
		float e[16]; 
  		for (int n = 0; n < 16; n++){
            e[n] = elements[n];
        }
		e[0] = sx;
		e[1] = ux;
		e[2] = -fx;
		e[3] = 0;

		e[4] = sy;
		e[5] = uy;
		e[6] = -fy;
		e[7] = 0;

		e[8] = sz;
		e[9] = uz;
		e[10] = -fz;
		e[11] = 0;

		e[12] = 0;
		e[13] = 0;
		e[14] = 0;
		e[15] = 1;
		setElements(e);
		// Translate.
		translate(-eyeX, -eyeY, -eyeZ);
		return;
	};

};

/////////////////////Simplex Noise

static int SEED;

static int hash_noise[] = {208,34,231,213,32,248,233,56,161,78,24,140,71,48,140,254,245,255,247,247,40,
                     185,248,251,245,28,124,204,204,76,36,1,107,28,234,163,202,224,245,128,167,204,
                     9,92,217,54,239,174,173,102,193,189,190,121,100,108,167,44,43,77,180,204,8,81,
                     70,223,11,38,24,254,210,210,177,32,81,195,243,125,8,169,112,32,97,53,195,13,
                     203,9,47,104,125,117,114,124,165,203,181,235,193,206,70,180,174,0,167,181,41,
                     164,30,116,127,198,245,146,87,224,149,206,57,4,192,210,65,210,129,240,178,105,
                     228,108,245,148,140,40,35,195,38,58,65,207,215,253,65,85,208,76,62,3,237,55,89,
                     232,50,217,64,244,157,199,121,252,90,17,212,203,149,152,140,187,234,177,73,174,
                     193,100,192,143,97,53,145,135,19,103,13,90,135,151,199,91,239,247,33,39,145,
                     101,120,99,3,186,86,99,41,237,203,111,79,220,135,158,42,30,154,120,67,87,167,
                     135,176,183,191,253,115,184,21,233,58,129,233,142,39,128,211,118,137,139,255,
                     114,20,218,113,154,27,127,246,250,1,8,198,250,209,92,222,173,21,88,102,219};

int noise2(int x, int y)
{
    int tmp = hash_noise[(y + SEED) % 256];
    return hash_noise[(tmp + x) % 256];
}

float lin_inter(float x, float y, float s)
{
    return x + s * (y-x);
}

float smooth_inter(float x, float y, float s)
{
    return lin_inter(x, y, s * s * (3-2*s));
}

float noise2d(float x, float y)
{
    int x_int = x;
    int y_int = y;
    float x_frac = x - x_int;
    float y_frac = y - y_int;
    int s = noise2(x_int, y_int);
    int t = noise2(x_int+1, y_int);
    int u = noise2(x_int, y_int+1);
    int v = noise2(x_int+1, y_int+1);
    float low = smooth_inter(s, t, x_frac);
    float high = smooth_inter(u, v, x_frac);
    return smooth_inter(low, high, y_frac);
}

float perlin2d(float x, float y, float freq, int depth)
{
    float xa = x*freq;
    float ya = y*freq;
    float amp = 1.0;
    float fin = 0;
    float div = 0.0;

    int i;
    for(i=0; i<depth; i++)
    {
        div += 256 * amp;
        fin += noise2d(xa, ya) * amp;
        amp /= 2;
        xa *= 2;
        ya *= 2;
    }

    return fin/div;
}

float ridgenoise(float x, float y, float f, int d){
	float e = 2 * (.5 - abs(.5 - perlin2d(x,y,f,d)));
	return pow(e, 1);
}

float turb(float cx, float cy, float f, int d){
	/*float e0 = 1 * perlin2d(cx,cy,f,d);
	float e1 = .5 * perlin2d(2*cx,2*cy,f,d) * e0;
	float e2 = .25 * perlin2d(4*cx,4*cy,f,d) * (e0+e1);
	float e = e0 + e1 + e2;
	return e; */
	return .5 * perlin2d(cx,cy,f,d) + 
		  .25 * perlin2d(2*cx,2*cy,f,d) + 
		 .125 * perlin2d(4*cx,4*cy,f,d);
}

///////////////////////Structs

GLuint vao;

struct uniformStruct {
    GLuint Translation;
    GLuint ViewMatrix;
    GLuint ProjMatrix;
    GLuint ModelMatrix;
    GLuint Sampler;
    GLfloat Time;
    float Tx = 0.0;
    float Ty = 0.0;
    float Tz = 0.0;
} u;


struct Primitives {
    GLuint vertexBuffer;
    GLuint colorBuffer;
    GLuint indexBuffer;
    GLuint texCoordBuffer;
    GLuint textureID;
    int numIndices;
};

Primitives oneCube;
Primitives onePlane;
Primitives oneLand, twoLand, threeLand, fourLand;

struct moveMent {
	float px = 0; //Player Position
	float py = -0;
	float pz = 1;
	float lx = 0; //Look
	float ly = -0.25;
	float lz = 0;
	float turn = -90;
	int moveUp = 0;
	int moveDown = 0;
	int moveLeft = 0;
	int moveRight = 0;
	int jumping = 0;
	float jump_vec = 0.0;
} user;

void NormalKeyHandler(unsigned char key, int x, int y){
	if (key == 32 && user.jumping == 0){ //Space
		user.jumping = 1;
		user.jump_vec = .6;
	}
	if (key == 120){
		user.py = user.py -4;
		user.ly = user.ly -4;	
	}
	if (key == 122){
		exit(0);
	}
}

void SpecialKeyUpHandler(int key, int x, int y){
	if (key == GLUT_KEY_RIGHT) user.moveRight = 0;
	if (key == GLUT_KEY_LEFT) user.moveLeft = 0;
	if (key == GLUT_KEY_UP) user.moveUp = 0;
	if (key == GLUT_KEY_DOWN) user.moveDown = 0;
}
void SpecialKeyHandler(int key, int x, int y){
	if (key == GLUT_KEY_RIGHT) user.moveRight = 1;
	if (key == GLUT_KEY_LEFT) user.moveLeft = 1;
	if (key == GLUT_KEY_UP) user.moveUp = 1;
	if (key == GLUT_KEY_DOWN) user.moveDown = 1;
}

void smoothNavigate(){
	float e = 3.15;
	if (user.moveRight == 1){
		user.turn += 4;
	}
	if (user.moveLeft == 1){
		user.turn -= 4;
	}
	if (user.moveUp){
		user.px = user.px + cos(user.turn*3.14/180)*e;
        user.pz = user.pz + sin(user.turn*3.14/180)*e; 
	}
	if (user.moveDown){
		user.px = user.px - cos(user.turn*3.14/180)*e;
        user.pz = user.pz - sin(user.turn*3.14/180)*e; 
	}
	//Jumping with velocity
	if (user.jumping == 1){
		user.jump_vec -= .02;
		user.ly += user.jump_vec;
		user.py += user.jump_vec;
	}

	//Hit Detection
	if (user.jumping == 1 || user.moveRight == 1 || user.moveLeft == 1 || user.moveUp == 1 || user.moveDown == 1){
		int ls = 216; //land size
		float cx = 0.0 + ls;
		float cy = 0.0 + ls;
		float x = user.px * .21;
		float y = user.pz * .21;
		float h[] = {0,0,0,0};
		float H[] = {0,0,0,0};
		for (int it = 0; it < 4; it++){
			int iy = it % 2;
			int ix = floor(it/2);
			float temp_x = (x+ix+cx-ls);
			float temp_y = (y+iy+cy-ls);
			float z = sqrt( temp_x * temp_x + temp_y * temp_y) / (128.0) * 2.5;
			if (z > 4){ z = 4; }
			//Fine Ridges
			h[it] = ridgenoise( (y+iy+cy)*.025, (x+ix+cx)*.025,  1, 1);
			if (h[it] >= .9) h[it] = h[it] = .9;
			//Rolling Mountains (height of ridges across an area)
			H[it] = perlin2d( (y+iy+cy)*.015, (x+ix+cx)*.015, .5, 1)+1;
			h[it] = pow(h[it], 2);
			H[it] = pow(H[it], z*2);
			if (z < .5) h[it]*=(z*2);
			
		}

		for (int it = 0; it < 4; it++){
			if (h[1] > h[0]) h[0] = h[1];
			if (h[2] > h[0]) h[0] = h[2];
			if (h[3] > h[0]) h[0] = h[2];
			if (H[1] > H[0]) H[0] = H[1];
			if (H[2] > H[0]) H[0] = H[2];
			if (H[3] > H[0]) H[0] = H[3];
		}
		if (user.py < h[0]*H[0]-4.5){
			user.py = h[0]*H[0]-4.5;
			user.jumping = 0;
			user.jump_vec = 0.0;
		}else{
			user.jumping = 1;
		}
		user.ly = user.py-.25;
	}

    user.lx = user.px + cos(user.turn*3.14/180);
    user.lz = user.pz + sin(user.turn*3.14/180);
}


GLuint initShader( GLenum type, const char* source ){

    GLuint shader;
    shader = glCreateShader( type );

    ///Compile Vertex shader
    GLint status;
    int length = strlen( source );
    glShaderSource( shader, 1, ( const GLchar ** )&source, &length );
    glCompileShader( shader );
    glGetShaderiv( shader, GL_COMPILE_STATUS, &status );

    if( status == GL_FALSE )
    {
        fprintf( stderr, "Fragment shader compilation failed.\n" );

        GLint maxLength = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &maxLength);

        // The maxLength includes the NULL character
        std::vector<GLchar> errorLog(maxLength);
        glGetShaderInfoLog(shader,  maxLength, &maxLength, &errorLog[0]);

        for(int n = 0; n < maxLength; n++){
            cerr << errorLog[n];
        }
        cerr << endl;

        glDeleteShader( shader ); // Don't leak the shader.
        return -1;
    }   
    return shader;
}

//https://www.opengl.org/archives/resources/code/samples/glut_examples/examples/examples.html

float red;
float gre;
float blu;

void initLand(Primitives &o, const char* file, int chunk_x, int chunk_y){
	// Create a Plane
	//  v1------v0----
	//  |       | 
	//  |       |
	//  |       |
	//  v2------v3---- 
	//  |       |
	//  |       |

	vector<float> v;
	vector<float> cs;
	vector<float> t;
	vector<unsigned int> i;
	int c = 0; //count
	int tex = 1;
	float s = .1; //size
	float f = s *.5; //offset
	float old_h = 0;

	int ls = 216; //land size
	float cx = (chunk_x) * ls;
	float cy = (chunk_y) * ls;

	cout << cx << " " << cy << endl;

  	for (int y = 0; y < ls; y++){
		for (int x = 0; x < ls; x++){

			float h[] = {0,0,0,0};
			float H[] = {0,0,0,0};
			//Generate individual height of plane corners that make up land
			for (int it = 0; it < 4; it++){
				int iy = it % 2;
				int ix = floor(it/2);
				float z = sqrt( (x+ix+cx-ls)*(x+ix+cx-ls)+(y+iy+cy-ls)*(y+iy+cy-ls)) / (128.0) * 2.5;
				if (z > 4){ z = 4; }
				//Fine Ridges                  //.025 default
				h[it] = ridgenoise( (y+iy+cy)*.025, (x+ix+cx)*.025,  1, 1);
				if (h[it] >= .9) h[it] = h[it] = .9;
				//Rolling Mountains (height of ridges across an area)
				                           //.015 default
				H[it] = perlin2d( (y+iy+cy)*.015, (x+ix+cx)*.015, .5, 1)+1;
				h[it] = pow(h[it], 2);
				H[it] = pow(H[it], z*2);
				if (z < .5){
					h[it]*=(z*2);
				}
				
			}
			v.insert(v.end(), {
				f+x*s, h[3]*H[3], f+y*s,
			   -f+x*s, h[1]*H[1], f+y*s,
			   -f+x*s, h[0]*H[0], -f+y*s,
				f+x*s, h[2]*H[2], -f+y*s} );
			t.insert(t.end(), {tex+x, tex+y,    0.0+x, tex+y,     0.0+x, 0.0+y,   tex+x, 0.0+y} );
			i.insert(i.end(), {0+c*4, 1+c*4, 2+c*4,    0+c*4, 2+c*4, 3+c*4} );
			
			float g[] = {0,0,0,0}; //Sharpness of colors on ends of mountains
			for(int it = 0; it < 4; it++){
				g[it] = pow(h[it],1); //*.5+.25
			}
			//cout << H[0] << endl;
			
			/*float red = 255.0/255.0;
			float gre = 258/255.0;
			float blu = 100/255.0;
			float q = .7;
			float w = 1;
			float j = 1; */

            //PINK PURPLE
            //float q = 1.26; float w = 1.5; float j = .52;
            //r 1.28387 g 0.735484 b 1.09677

            //PINK PURPLE 2
			//red = 1.25806; gre = 0.722581; blu = 1.2;
			//0.925 0.6375 0.2875

			//TAN
			//r 0.890323 g 0.8 b 0.735484
			//float q = 0.91; float w = 1.12; float j = 1.38;

			//WHITE
			//r 0.787097 g 1.23226 b 1.6
			//float q = 0.84; float w = 1.13; float j = 1.31;

			//BLUE
			//red = 0.135484; gre = 0.206452; blu = 1.43226;
			//1.27 0.79 1.54

			//GREEN WHITE
			//red = 1.43871; gre = 1.31613; blu = 1.1871;
			//float q = 1.45; float w = 0.58; float j = 1.28;

			//RED
			//red = 1.47742; gre = 0.083871; blu = 0.16129;
			//1.44 0.79 1.41

			//TAN DESERT?
			//red = 1.07097; gre = 0.819355; blu = 0.632258;
			//1.26 0.76 1.19


			srand(SEED);
			float q = rand()%100; q/=100; q+=.5;
			float w = rand()%100; w/=100; w+=.5;
			float j = rand()%100; j/=100; j+=.5;
			if (y == 0 && x == 0)
				cout << q << " " << w << " " << j << endl;
			//cout << "r:" << red << " g:" << gre << " b:" << blu << endl;
			cs.insert(cs.end(), {red-g[3]*q, gre-g[3]*w, blu-g[3]*j, 1,
        						 red-g[1]*q, gre-g[1]*w, blu-g[1]*j, 1, 
        						 red-g[0]*q, gre-g[0]*w, blu-g[0]*j, 1,
    							 red-g[2]*q, gre-g[2]*w, blu-g[2]*j, 1 } ); 
			/*cs.insert(cs.end(), {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 } );*/
			c += 1;
		}
	}

	GLfloat vertices[ v.size() ];
	copy(v.begin(), v.end(), vertices);

	GLfloat colors[ cs.size() ];
	copy(cs.begin(), cs.end(), colors);

	GLfloat texCoords[ t.size() ];
	copy(t.begin(), t.end(), texCoords);

	GLuint indices[ i.size() ];
	copy(i.begin(), i.end(), indices);

    o.numIndices = sizeof(indices) / 4;

    // Create buffer objects
	glGenBuffers( 1, &o.vertexBuffer);
	glGenBuffers( 1, &o.colorBuffer );
	glGenBuffers( 1, &o.indexBuffer );
	glGenBuffers( 1, &o.texCoordBuffer );
	glGenTextures( 1, &o.textureID );

    //Position
    glBindBuffer( GL_ARRAY_BUFFER, o.vertexBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(vertices), &vertices[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_Position, 3, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(a_Position);

    //Color
    glBindBuffer( GL_ARRAY_BUFFER, o.colorBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(colors), &colors[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_Color, 4, GL_FLOAT, GL_FALSE, 0, 0 );
    glEnableVertexAttribArray(a_Color);

    //Index Buffer
    glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, o.indexBuffer);
    glBufferData( GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), &indices[0], GL_STATIC_DRAW);

	//Texture Coordinates
    glBindBuffer( GL_ARRAY_BUFFER, o.texCoordBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(texCoords), &texCoords[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_TexCoord, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(a_TexCoord);

    //Bind Texture
    glEnable(GL_TEXTURE_2D);
    glActiveTexture( GL_TEXTURE0);
    glBindTexture(   GL_TEXTURE_2D, o.textureID);

    if (file != "None"){
	    int w, h;
	    unsigned char* image = SOIL_load_image(file, &w, &h, 0, SOIL_LOAD_RGB);
	    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, w,h,
	    	0, GL_RGB, GL_UNSIGNED_BYTE, image);
        SOIL_free_image_data(image);
	}else{	
   		float pixels[] = {
    		1.0f, .9f, 1.0f,   .9f, 1.0f, .9f,
    		1.0f, .9f, .9f,   .9f, .9f, 1.0f,
		};

	    //Target active unit, level, internalformat, width, height, border, format, type, data
	    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 2, 2,
	    	0, GL_RGB, GL_FLOAT, pixels);
    }

    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_MIRRORED_REPEAT);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_MIRRORED_REPEAT);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glGenerateMipmap(GL_TEXTURE_2D);

    //No Buffer Bound
	glBindBuffer( GL_ARRAY_BUFFER, NULL);
	glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, NULL);
}


void initPlane(Primitives &o, const char* file){
	// Create a Plane
	//  v1------v0
	//  |       | 
	//  |       |
	//  |       |
	//  v2------v3

    const GLfloat vertices[] = {
     //  X   Y  Z
		.5, .5,  0,  -.5, .5,  0,  -.5,-.5,  0,   .5,-.5,  0,  
    };

    const GLfloat colors[] = {
     // R, G, B, A,
        1, 1, 0, 1,
        0, 1, 0, 1, 
        0, 0, 1, 1,

        1, 1, 0, 1, 
        0, 0, 1, 1, 
        1, 1, 1, 1,
    };

    float n = 5;
    const GLfloat texCoords[] = {
		0.0, 0.0,   n,0.0,   n,n,   0.0, n  // v0-v5-v6-v1 up
    };

    const GLuint indices[] = {
		 0, 1, 2,   0, 2, 3,    // front 
    };

    o.numIndices = sizeof(indices) / 4;

    // Create buffer objects
	glGenBuffers( 1, &o.vertexBuffer);
	glGenBuffers( 1, &o.colorBuffer );
	glGenBuffers( 1, &o.indexBuffer );
	glGenBuffers( 1, &o.texCoordBuffer );
	glGenTextures( 1, &o.textureID );

    //Position
    glBindBuffer( GL_ARRAY_BUFFER, o.vertexBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(vertices), &vertices[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_Position, 3, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(a_Position);

    //Color
    glBindBuffer( GL_ARRAY_BUFFER, o.colorBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(colors), &colors[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_Color, 4, GL_FLOAT, GL_FALSE, 0, 0 );
    glEnableVertexAttribArray(a_Color);

    //Index Buffer
    glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, o.indexBuffer);
    glBufferData( GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), &indices[0], GL_STATIC_DRAW);

	//Texture Coordinates
    glBindBuffer( GL_ARRAY_BUFFER, o.texCoordBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(texCoords), &texCoords[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_TexCoord, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(a_TexCoord);

    //Bind Texture
    glEnable(GL_TEXTURE_2D);
    glActiveTexture( GL_TEXTURE0);
    glBindTexture(   GL_TEXTURE_2D, o.textureID);

    if (file != "None"){
	    int w, h;
	    unsigned char* image = SOIL_load_image(file, &w, &h, 0, SOIL_LOAD_RGB);
	    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, w,h,
	    	0, GL_RGB, GL_UNSIGNED_BYTE, image);
        SOIL_free_image_data(image);
	}else{	
   		float pixels[] = {
    		.9f, .8f, .58f,   .66f, .54f, .33f,
    		.66f, .54f, .33f,   .9f, .8f, .58f
		};
	    //Target active unit, level, internalformat, width, height, border, format, type, data
	    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 2, 2,
	    	0, GL_RGB, GL_FLOAT, pixels);
    }

    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_MIRRORED_REPEAT);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_MIRRORED_REPEAT);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glGenerateMipmap(GL_TEXTURE_2D);

    //No Buffer Bound
	glBindBuffer( GL_ARRAY_BUFFER, NULL);
	glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, NULL);
}

void initCube(Primitives &o, const char* file) {
	// Create a cube
	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3

	const GLfloat vertices[] = {
	    /*X,  Y,  Z  */
		 .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,  
		 .5, .5, .5,   .5,-.5, .5,   .5,-.5,-.5,   .5, .5,-.5,
		 .5, .5, .5,   .5, .5,-.5,  -.5, .5,-.5,  -.5, .5, .5,
		-.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5,  -.5,-.5, .5, 
		-.5,-.5,-.5,   .5,-.5,-.5,   .5,-.5, .5,  -.5,-.5, .5, 
		 .5,-.5,-.5,  -.5,-.5,-.5,  -.5, .5,-.5,   .5, .5,-.5 
    };

    float n = 3;
    const GLfloat texCoords[] = {
		1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
		0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
		n,   0.0,   n,n,        0.0, n,     0.0, 0.0,    // v0-v5-v6-v1 up
		1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
		0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
		0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
    };

    const GLfloat colors[] = {
     /* R,   G,   B,  A, */
	    0.1, 0.1, 1.0,1,  0.1, 0.1, 1.0,1,  0.1, 0.1, 1.0,1,  0.1, 0.1, 1.0,1,
	    0.1, 1.0, 0.1,1,  0.1, 1.0, 0.1,1,  0.1, 1.0, 0.1,1,  0.1, 1.0, 0.1,1,
	    1.0, 0.1, 0.1,1,  1.0, 0.1, 0.1,1,  1.0, 0.1, 0.1,1,  1.0, 0.1, 0.1,1,
	    1.0, 1.0, 0.1,1,  1.0, 1.0, 0.1,1,  1.0, 1.0, 0.1,1,  1.0, 1.0, 0.1,1,
	    1.0, 1.0, 1.0,1,  1.0, 1.0, 1.0,1,  1.0, 1.0, 1.0,1,  1.0, 1.0, 1.0,1,
	    0.1, 1.0, 1.0,1,  0.1, 1.0, 1.0,1,  0.1, 1.0, 1.0,1,  0.1, 1.0, 1.0,1
    };

    const GLuint indices[] = {
		 0, 1, 2,   0, 2, 3,    // front
		 4, 5, 6,   4, 6, 7,    // right
		 8, 9,10,   8,10,11,    // up
		12,13,14,  12,14,15,    // left
		16,17,18,  16,18,19,    // down
		20,21,22,  20,22,23     // back    	
    };
  
    o.numIndices = sizeof(indices) / 4;

    // Create buffer objects
	glGenBuffers( 1, &o.vertexBuffer );
	glGenBuffers( 1, &o.colorBuffer );
	glGenBuffers( 1, &o.indexBuffer );
	glGenBuffers( 1, &o.texCoordBuffer );
	glGenTextures( 1, &o.textureID );

    //Position
    glBindBuffer( GL_ARRAY_BUFFER, o.vertexBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(vertices), &vertices[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_Position, 3, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(a_Position);

    //Color
    glBindBuffer( GL_ARRAY_BUFFER, o.colorBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(colors), &colors[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_Color, 4, GL_FLOAT, GL_FALSE, 0, 0 );
    glEnableVertexAttribArray(a_Color);

    //Texture Coordinates
    glBindBuffer( GL_ARRAY_BUFFER, o.texCoordBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(texCoords), &texCoords[0], GL_STATIC_DRAW);
    glVertexAttribPointer(a_TexCoord, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(a_TexCoord);

    //Bind Texture
    glActiveTexture( GL_TEXTURE0);
    glBindTexture(   GL_TEXTURE_2D, o.textureID);

    if (file != "None"){
	    int w, h;
	    unsigned char* image = SOIL_load_image(file, &w, &h, 0, SOIL_LOAD_RGB);
	    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, w,h,
	    	0, GL_RGB, GL_UNSIGNED_BYTE, image);
	    SOIL_free_image_data(image);
	}else{
	    float pixels[] = {
	    	1.0f, 1.0f, 1.0f,   0.0f, 0.0f, 0.0f,
	    	0.0f, 0.0f, 0.0f,   1.0f, 1.0f, 1.0f,
	    };
	    //Target active unit, level, internalformat, width, height, border, format, type, data
	    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 2, 2,
	    	0, GL_RGB, GL_FLOAT, pixels);
    }

    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_MIRRORED_REPEAT);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_MIRRORED_REPEAT);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glGenerateMipmap(GL_TEXTURE_2D);

    //Index Buffer
    glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, o.indexBuffer);
    glBufferData( GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), &indices[0], GL_STATIC_DRAW);

    //No Buffer Bound
	glBindBuffer( GL_ARRAY_BUFFER, NULL);
	glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, NULL);

}




Matrix4 viewMatrix;
Matrix4 projMatrix;
Matrix4 modelMatrix;

void render(Primitives &o){

	//Activate Vertex Coordinates
    glBindBuffer( GL_ARRAY_BUFFER, o.vertexBuffer);
    glVertexAttribPointer(a_Position, 3, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(a_Position);

  	//Activate Color Coordinates
	glBindBuffer( GL_ARRAY_BUFFER, o.colorBuffer);
	glVertexAttribPointer(a_Color, 4, GL_FLOAT, GL_FALSE, 0, 0);
	glEnableVertexAttribArray(a_Color);

	//Activate Texture Coordinates
	glBindBuffer( GL_ARRAY_BUFFER, o.texCoordBuffer);
	glVertexAttribPointer(a_TexCoord, 2, GL_FLOAT, GL_FALSE, 0, 0);
	glEnableVertexAttribArray(a_TexCoord);

	//Bind Texture
	glActiveTexture(GL_TEXTURE0);
	glBindTexture( GL_TEXTURE_2D, o.textureID);

	//Bind Indices
	glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, o.indexBuffer);

	//Update uniforms in frag vertex  //1 denotes number of matrixes to update
    glUniformMatrix4fv( u.ViewMatrix, 1, GL_TRUE, viewMatrix.elements);
    glUniformMatrix4fv( u.ProjMatrix, 1, GL_TRUE, projMatrix.elements);
    glUniformMatrix4fv( u.ModelMatrix, 1, GL_TRUE, modelMatrix.elements);
    glUniform1i( u.Sampler, 0);

    //DrawElements allows to display Cube, etc, with fewer indices
    glDrawElements( GL_TRIANGLES, o.numIndices, GL_UNSIGNED_INT, 0);

   
}


void display(int te){

    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glutTimerFunc(1000.0/60.0, display, 1);
    smoothNavigate(); //Update user movement

    u.Tx += 1;
    glUniform4f(u.Translation, u.Tx, u.Ty, u.Tz, 0.0);

    //Initialize Matrices
	projMatrix.setPerspective(90.0, (float)WIDTH/(float)HEIGHT, 0.1, 1450.0);
	//eyeX, eyeY, eyeZ, (at)centerX, (at)centerY, (at)centerZ, upX, upY, upZ
	viewMatrix.setLookAt(user.px, user.py, user.pz,    user.lx, user.ly, user.lz,    0.0, 1.0, 0.0);

	//Update Time
	glUniform1f( u.Time, u.Tx);

	//Cube
	modelMatrix.setTranslate(-1,0,-1);
	modelMatrix.rotate(u.Tx, 1*sin(u.Tx*.01),1,0);
	render(oneCube);
    
    //Plane
	modelMatrix.setTranslate(1,0,-1);
	render(onePlane);

	//Land
	int rrr = SEED % 2;
	if (rrr == 0) rrr = 2;
	int s = 48;
	modelMatrix.setScale(s,rrr,s);
	modelMatrix.translate(0,-8,0);
	render(oneLand);

	modelMatrix.setScale(s,rrr,s);
	modelMatrix.translate(0,-8,-216*.1);
	render(twoLand);

	modelMatrix.setScale(s,rrr,s);
	modelMatrix.translate(-216*.1,-8,-216*.1);
	render(threeLand);

	modelMatrix.setScale(s,rrr,s);
	modelMatrix.translate(-216*.1,-8,0);
	render(fourLand);
   
    glutSwapBuffers();
}




int main(int argc, char** argv)
{

	srand(time(0));
	SEED = rand() % 999;

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
    glutInitContextVersion (3, 2);
    glutInitContextFlags (GLUT_FORWARD_COMPATIBLE | GLUT_DEBUG);
    
    glutInitWindowSize(WIDTH, HEIGHT);
    glutInitWindowPosition(100,100);
    glutCreateWindow("OpenGL - First window demo");
    glutSpecialFunc(SpecialKeyHandler);
    glutSpecialUpFunc(SpecialKeyUpHandler);
    glutKeyboardFunc(NormalKeyHandler);

    // Initialize GLEW
    glewExperimental = GL_TRUE; 
    if (glewInit() != GLEW_OK) {
        fprintf(stderr, "Failed to initialize GLEW\n");
        return -1;
    }

    if(GLEW_VERSION_3_0)
    {
        //cerr << "GlEW Available";
    }else
        return 0;

    GLuint vs, fs, program;
    vs = initShader( GL_VERTEX_SHADER, vertex_source );
    fs = initShader( GL_FRAGMENT_SHADER, fragment_source );
    if (vs == -1 || fs == -1){ return 0; }

    //Create and use shader program
    program = glCreateProgram();
    glAttachShader( program, vs );
    glAttachShader( program, fs );

    //Must link after BindAttrib
    glLinkProgram( program );
    glUseProgram( program );

	glEnable( GL_DEPTH_TEST );
    glDepthFunc( GL_LESS );

			red = rand() % 255; red/=155;
			gre = rand() % 255; gre/=155;
			blu = rand() % 255; blu/=155;
			//PINK PURPLE
			//red = 1.28387; gre = 0.735484; blu = 1.09677;
			//WHITE
			//red = 0.787097; gre = 1.23226; blu = 1.6;
			//TAN
			//red = 0.890323; gre = 0.8; blu = 0.735484;
			//GREEN WHITE
			//red = 1.43871; gre = 1.31613; blu = 1.1871;
			cout << "red = " << red << "; gre = " << gre << "; blu = " << blu << ";" << endl;
			glClearColor(red,gre,blu,1.0);

    //glClearColor( 80.0/255.0, 170/255.0, 220.0/255.0, 1.0 );
    glViewport( 0, 0, WIDTH, HEIGHT );

    //VAO?
    glGenVertexArrays( 1, &vao );
    glBindVertexArray( vao );


    //Storage Locations for Uniforms
    u.Translation = glGetUniformLocation( program, "u_Translation" );
	u.ProjMatrix = glGetUniformLocation( program, "u_ProjMatrix");
	u.ViewMatrix = glGetUniformLocation( program, "u_ViewMatrix");
	u.ModelMatrix = glGetUniformLocation( program, "u_ModelMatrix");
	u.Sampler = glGetUniformLocation( program, "u_Sampler");
	u.Time = glGetUniformLocation( program, "u_Time");

    //Storage locations for Attributes
    glBindAttribLocation( program, a_Position, "a_Position" );
    glBindAttribLocation( program, a_Color, "a_Color" );
    glBindAttribLocation( program, a_TexCoord, "a_TexCoord" );

    //Buffers (a_ attributes)
    initPlane(onePlane, "None");
    initLand(oneLand, "None", 1, 1);
    initLand(twoLand, "None", 1, 0);
    initLand(threeLand, "None", 0, 0);
    initLand(fourLand, "None", 0, 1);
    initCube(oneCube, "../old_trinity.png");

    glutTimerFunc(1000.0/60.0, display, 1);
    glutMainLoop();

    return 0;
}


