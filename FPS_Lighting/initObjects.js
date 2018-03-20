/*
  LoadModels uses the function loadJsonresource to load a models
  vertex, normal, tangent, bitangent, and uv information from a json
  file.

  I used a command line program called, "Assimp" that converts obj files to JSON.
  From there I followed along with this tutorial,
  https://www.youtube.com/watch?v=sM9n73-HiNA which goes over how to load
  the generated JSON file from assimp.

  Link to the library for Assimp2JSON: https://github.com/acgessler/assimp2json
*/


function loadModels(){

  loadJSONResource('./myCube.json', function(modelErr, modelObj){
    if(modelErr){
      alert("failed to load cube");
    }
    else{
      myCube = modelObj;
      	//main();
      }
  });
  
  loadJSONResource('./myTorus.json', function(modelErr, modelObj){
    if(modelErr){
      alert("failed to load cube");
    }
    else{
      myTorus = modelObj;
      	//main();
      }
  });

  loadJSONResource('./mySphere.json', function(modelErr, modelObj){
    if(modelErr){
      alert("failed to load sphere");
    }
    else{
      mySphere = modelObj;
      	main();
      }
  });
  
}