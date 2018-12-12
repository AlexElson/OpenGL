#define GL_GLEXT_PROTOTYPES

//g++ main.c -lglut -lGL -lGLEW
//glxinfo | grep "version"

#include <GL/glew.h>
#include <GL/freeglut.h>

#include <stdio.h>
#include <vector>
#include <iostream>
#include <cstring>
#include <cmath>

using namespace std;

const int WIDTH = 640;
const int HEIGHT = 480;

static const char* vertex_source = 
    "   #version 130 \n" 

    "   uniform vec4 u_Translation; \n"
    " 	uniform mat4 u_ViewMatrix; \n"
  	"	uniform mat4 u_ProjMatrix; \n"
  	"	uniform mat4 u_ModelMatrix; \n"

    "   in vec4 a_Position; \n" 
    "   in vec4 a_Color; \n"
    "   out vec4 v_Color; \n"
    "   void main() { \n" 
    //"		gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position; \n"
    "       gl_Position = a_Position * u_ModelMatrix * u_ViewMatrix * u_ProjMatrix;  \n" 
    //"       gl_Position = a_Position + u_Translation;  \n"
    "       v_Color = a_Color; \n"
    "   } \n";

static const char* fragment_source =
    "   #version 130 \n"
    "   in vec4 v_Color; \n"
    "   void main(){ \n" 
    "       gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); \n" 
    "       gl_FragColor = v_Color; \n"
    "   }\n";

typedef enum {
    a_Position,
    a_Color
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
        //float e[16];
        for(int n = 0; n < 16; n++){
            elements[n] = old.elements[16-n];
        }
        //elements = &e;
    }

    //Print Matrix
    void print(){
        for(int n = 0; n < 16; n++){
            cout << elements[n] << " ";
            if (n%4 == 3) cout << endl;
        }
        cout << endl;
        /*for(int j = 0; j < 4; j++){
	        for(int n = 0; n < 4; n++){
	            cout << elements[n*4+j] << " ";
	        }
	        cout << endl;
    	}
    	cout << endl;*/
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

		/*e[0]  = 1; e[1]  = 0; e[2]  = 0;  e[3]  = x;
		e[4]  = 0; e[5]  = 1; e[6]  = 0;  e[7]  = y;
		e[8]  = 0; e[9]  = 0; e[10] = 1;  e[11] = z;
		e[12] = 0; e[13] = 0; e[14] = 0;  e[15] = 1;*/

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

GLuint vao;

struct uniformStruct {
    GLuint Translation;
    GLuint ViewMatrix;
    GLuint ProjMatrix;
    GLuint ModelMatrix;
    float Tx = 0.0;
    float Ty = 0.0;
    float Tz = 0.0;
} u;


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
 
int initVertexBuffers(){

    const GLfloat vertices[] = {
    /*   X,  Y  */
      -.5, -.5,
       .5, -.5,
       .5,  .5,

      -.5, -.5,
       .5,  .5,
      -.5,  .5
    };

    const GLfloat colors[] = {
     /* R, G, B, A, */
        1, 1, 0, 1,
        0, 1, 0, 1, 
        0, 0, 1, 1,

        1, 1, 0, 1, 
        0, 0, 1, 1, 
        1, 1, 1, 1,
    };
    int n = 6;

    // Create a buffer object
    GLuint vertexBuffer;
    GLuint colorBuffer;
    glGenBuffers( 1, &vertexBuffer);
    glGenBuffers( 1, &colorBuffer );

    //Position
    glBindBuffer( GL_ARRAY_BUFFER, vertexBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(a_Position, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(a_Position);

    //Color
    glBindBuffer( GL_ARRAY_BUFFER, colorBuffer);
    glBufferData( GL_ARRAY_BUFFER, sizeof(colors), colors, GL_STATIC_DRAW);
    glVertexAttribPointer(a_Color, 4, GL_FLOAT, GL_FALSE, 0, 0 );
    glEnableVertexAttribArray(a_Color);

    return n;
}


Matrix4 viewMatrix;
Matrix4 projMatrix;
Matrix4 modelMatrix;

void display(int te){

    glClear(GL_COLOR_BUFFER_BIT);
    glutTimerFunc(1000.0/60.0, display, 1);

    u.Tx += 1;
    glUniform4f(u.Translation, u.Tx, u.Ty, u.Tz, 0.0);

    //Initialize Matrices
	projMatrix.setPerspective(90.0, (float)WIDTH/(float)HEIGHT, 0.1, 250.0);
	//eyeX, eyeY, eyeZ, (at)centerX, (at)centerY, (at)centerZ, upX, upY, upZ
	viewMatrix.setLookAt(0.0, 0.0, 0.0,    0.0, 0.0, -1.0,    0.0, 1.0, 0.0);

	modelMatrix.setRotate(u.Tx, 0,0,1);
	modelMatrix.translate(0.0,0,-u.Tx*.1);
	//modelMatrix.setTranslate(u.Tx, 0, 0);
	//modelMatrix.scale(u.Tx,u.Tx, 1);

	viewMatrix.print();
	projMatrix.print();
	//modelMatrix.print();
    
    //Update uniforms in frag vertex  //1 denotes number of matrixes to update
    glUniformMatrix4fv( u.ViewMatrix, 1, GL_FALSE, viewMatrix.elements);
    glUniformMatrix4fv( u.ProjMatrix, 1, GL_TRUE, projMatrix.elements);
    glUniformMatrix4fv( u.ModelMatrix, 1, GL_TRUE, modelMatrix.elements);

    glDrawArrays( GL_TRIANGLES, 0, 6 ); //mmust match number of vertices per object
    glutSwapBuffers();
    //glutPostRedisplay();
}


int main(int argc, char** argv)
{

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitContextVersion (3, 2);
    glutInitContextFlags (GLUT_FORWARD_COMPATIBLE | GLUT_DEBUG);
    
    glutInitWindowSize(WIDTH, HEIGHT);
    glutInitWindowPosition(100,100);
    glutCreateWindow("OpenGL - First window demo");

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

    glDisable( GL_DEPTH_TEST );
    glClearColor( 0.5, 0.0, 0.0, 1.0 );
    glViewport( 0, 0, WIDTH, HEIGHT );

    //VAO?
    glGenVertexArrays( 1, &vao ); 
    glBindVertexArray( vao );


    //Storage Locations for Uniforms
    u.Translation = glGetUniformLocation( program, "u_Translation" );
	u.ProjMatrix = glGetUniformLocation( program, "u_ProjMatrix");
	u.ViewMatrix = glGetUniformLocation( program, "u_ViewMatrix");
	u.ModelMatrix = glGetUniformLocation( program, "u_ModelMatrix");

    //Storage locations for Attributes
    glBindAttribLocation( program, a_Position, "a_Position" );
    glBindAttribLocation( program, a_Color, "a_Color" );

    //Buffers (a_ attributes)
    int n = initVertexBuffers();

    glutTimerFunc(1000.0/60.0, display, 1);
    glutMainLoop();

    return 0;
}

