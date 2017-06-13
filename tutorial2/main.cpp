//g++ main.cpp display.cpp -lGL -lGLEW -lSDL2 -std=c++11 -o Test


#include <iostream>
#include <GL/glew.h>
#include "display.h"
#include "shader.h"
#include "mesh.h"
#include "texture.h"

int main(){

	Display display(800,600, "Hello World!");

	Vertex vertices[] = {   Vertex(glm::vec3(-.5, -.5, 0), glm::vec2(0,0) ),
							Vertex(glm::vec3(0, .5, 0), glm::vec2(0.5,1.0)),
							Vertex(glm::vec3(.5, -.5, 0), glm::vec2(1.0,0.0)), };

	Mesh mesh(vertices, sizeof(vertices)/sizeof(vertices[0]));
	Shader shader("./res/basicShader");
	Texture texture("./res/sand.jpg");

	while(!display.isClosed())
	{
		display.Clear(0.0f, 0.15f, 0.3f, 1.0f);

		shader.Bind();
		texture.Bind();//0);
		mesh.Draw();

		display.Update();
	}

	return 0;
}
