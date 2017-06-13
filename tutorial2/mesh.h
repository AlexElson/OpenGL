#ifndef MESH_INCLUDED_H
#define MESH_INCLUDED_H

#include <GL/glew.h>
#include <glm/glm.hpp>
#include <string>
#include <vector>

class Vertex
{
public:

	Vertex(const glm::vec3& pos, const glm::vec2& texCoord){
		this->pos = pos;
		this->texCoord = texCoord;
	}

	inline glm::vec3* GetPos(){ return &pos; }
	inline glm::vec2* GetTexCoord(){ return &texCoord; }

private:
	glm::vec3 pos;
	glm::vec2 texCoord;

};



class Mesh
{
public:

	Mesh(Vertex* vertices, unsigned int numVertices);

	void Draw();

	virtual ~Mesh();

private:
	Mesh(const Mesh& other);
	void operator=(const Mesh& other);

	enum
	{
		POSITION_VB,
		TEXCOORD_VB,

		NUM_BUFFERS
	};

	GLuint m_vertexArrayObject;
	GLuint m_vertexArrayBuffers[NUM_BUFFERS];
	unsigned int m_drawCount;
};

#endif
