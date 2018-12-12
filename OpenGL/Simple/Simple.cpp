#define GL_GLEXT_PROTOTYPES
//http://codegist.net/code/sdl2%20window%20example/


#include <GL/glew.h>
#include <SDL2/SDL.h>
#include <SDL2/SDL_opengl.h>
#include <stdio.h>
#include <vector>
#include <iostream>

using namespace std;

const int WIDTH = 640;
const int HEIGHT = 480;

const char* vertex_source = 

	"	#version 150 \n" 
	"	in vec4 a_Position; \n" 
	"	in vec4 a_Color; \n"
	"	out vec4 v_Color; \n"
	"	void main(){ \n" 
	"		gl_Position = a_Position; \n" 
	"		v_Color = a_Color; \n"
	"	} \n";

const char* fragment_source =

	"	#version 150 \n"
	"	in v_Color; \n"
	"	void main(){ \n" 
	"		gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); \n" 
	"		gl_FragColor = v_Color; \n"
	"	} \n";


typedef enum {
    a_Position,
    a_Color
} attrib_id;


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
    	//fprintf( stderr, "fragment shader compilation failed\n" );
    	
        GLint maxLength = 0;
		glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &maxLength);

		// The maxLength includes the NULL character
		std::vector<GLchar> errorLog(maxLength);
		glGetShaderInfoLog(shader,  maxLength, &maxLength, &errorLog[0]);

		for(int n = 0; n < maxLength; n++){
			cout << errorLog[n];
		}
		cout << endl;

		glDeleteShader( shader ); // Don't leak the shader.
        return -1;
    }	
    return shader;
}




int main(int argc, char* args[])
{
	SDL_Window* window = NULL;
	SDL_Surface* screenSurface = NULL;

	SDL_Init( SDL_INIT_VIDEO );
	SDL_GL_SetAttribute( SDL_GL_DOUBLEBUFFER, 1 );
	SDL_GL_SetAttribute( SDL_GL_ACCELERATED_VISUAL, 1 );
    SDL_GL_SetAttribute( SDL_GL_RED_SIZE, 8 );
    SDL_GL_SetAttribute( SDL_GL_GREEN_SIZE, 8 );
    SDL_GL_SetAttribute( SDL_GL_BLUE_SIZE, 8 );
    SDL_GL_SetAttribute( SDL_GL_ALPHA_SIZE, 8 );

    SDL_GL_SetAttribute( SDL_GL_CONTEXT_MAJOR_VERSION, 3 );
    SDL_GL_SetAttribute( SDL_GL_CONTEXT_MINOR_VERSION, 3 );
    SDL_GL_SetAttribute( SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE );

    window = SDL_CreateWindow( "Title", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, WIDTH, HEIGHT, SDL_WINDOW_OPENGL | SDL_WINDOW_SHOWN );
    SDL_GLContext context = SDL_GL_CreateContext( window );

    glewInit();

    GLuint vs, fs, program;
    vs = initShader( GL_VERTEX_SHADER, vertex_source );
    fs = initShader( GL_FRAGMENT_SHADER, fragment_source );
    if (vs == -1 || fs == -1){ return 0; }

    //Create and use shader program
    program = glCreateProgram();
    glAttachShader( program, vs );
    glAttachShader( program, fs );

    //BindAttrib
    glBindAttribLocation( program, a_Position, "a_Position" );
    glBindAttribLocation( program, a_Color, "a_Color" );

    //Must link after BindAttrib
    glLinkProgram( program );
    glUseProgram( program );

    glDisable( GL_DEPTH_TEST );
    glClearColor( 0.5, 0.0, 0.0, 0.0 );
    glViewport( 0, 0, WIDTH, HEIGHT );

    GLuint vao, vbo;

    glGenVertexArrays( 1, &vao );
    glGenBuffers( 1, &vbo );
    glBindVertexArray( vao );
    glBindBuffer( GL_ARRAY_BUFFER, vbo );

    glEnableVertexAttribArray( 0 ); //a_Position
    glEnableVertexAttribArray( 1 ); //a_Color

    const GLfloat g_vertex_buffer_data[] = {
    /*  X, Y  */
        0, 0,
       .5, 0,
       .5,.5,

        0, 0,
       .5,.5,
        0,.5
    };

    const GLfloat g_color[] = {
    /*  R, G, B  A */
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,

        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0
    };
    int nC = 6;

    glVertexAttribPointer( a_Color, 3, GL_FLOAT, GL_FALSE, sizeof( float ) * 3, 0 );
    glVertexAttribPointer( a_Position, 2, GL_FLOAT, GL_FALSE, sizeof( float ) * 2, 0 );

    bool mainLoop = true;

    while(mainLoop){
        glClear( GL_COLOR_BUFFER_BIT );

        SDL_Event event;
        while( SDL_PollEvent( &event ) )
        {
            switch( event.type )
            { 
                case SDL_KEYUP:
                    if( event.key.keysym.sym == SDLK_ESCAPE )
                    	mainLoop = false;
                    break;
            }
        }  

        glBindVertexArray( vao );
        glDrawArrays( GL_TRIANGLES, 0, nC );

        SDL_GL_SwapWindow( window );
        SDL_Delay( 100 );
    }

  	SDL_GL_DeleteContext( context );
    SDL_DestroyWindow( window );
    SDL_Quit();
    return 0; 


}
