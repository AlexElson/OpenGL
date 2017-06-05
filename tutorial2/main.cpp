//g++ main.cpp display.cpp -lGL -lGLEW -lSDL2 -std=c++11 -o Test


#include <iostream>
#include <GL/glew.h>
#include "display.h"
#include "shader.h"

int main(){

	Display display(800,600, "Hello World!");

	Shader shader("./res/basicShader");

	while(!display.isClosed()){
		display.Clear(0.0f, 0.15f, 0.3f, 1.0f);
		shader.Bind();

		display.Update();
	}

	return 0;
}
