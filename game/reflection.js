// Global NVMC Client
// ID 7.4

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
NVMCClient.reflectionMap = null;
NVMCClient.reflectionMapShader = null;	
NVMCClient.cubeMapFrameBuffers = [];

NVMCClient.prepareRenderToCubeMapFrameBuffer= function (gl) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.reflectionMap);
    var faces = [ 	gl.TEXTURE_CUBE_MAP_POSITIVE_X,gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			gl.TEXTURE_CUBE_MAP_POSITIVE_Y,gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			gl.TEXTURE_CUBE_MAP_POSITIVE_Z,gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
    
    for(var f = 0; f < 6; ++f){
	var newframebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, newframebuffer);
	newframebuffer.width = 512;
	newframebuffer.height = 512;	

	var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, newframebuffer.width, newframebuffer.height);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, faces[f], this.reflectionMap, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	
	var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if (status != gl.FRAMEBUFFER_COMPLETE) {
	    throw("gl.checkFramebufferStatus() returned " + WebGLDebugUtils.glEnumToString(status));
	}
	this.cubeMapFrameBuffers [f] = newframebuffer;

    }

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}


NVMCClient.createReflectionMap = function(gl){
    this.reflectionMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,  this.reflectionMap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X,		0, 	gl.RGBA, 512,512,0,	gl.RGBA, 	gl.UNSIGNED_BYTE,null);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 	0, 	gl.RGBA, 512,512,0,	gl.RGBA, 	gl.UNSIGNED_BYTE,null);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 	0, 	gl.RGBA, 512,512,0,	gl.RGBA, 	gl.UNSIGNED_BYTE,null);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 	0, 	gl.RGBA, 512,512,0,	gl.RGBA, 	gl.UNSIGNED_BYTE,null);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 	0, 	gl.RGBA, 512,512,0,	gl.RGBA, 	gl.UNSIGNED_BYTE,null);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 	0, 	gl.RGBA, 512,512,0,	gl.RGBA, 	gl.UNSIGNED_BYTE,null);
    
    gl.texParameteri(	gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(	gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);        
    gl.texParameteri(	gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(	gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
};

NVMCClient.drawOnReflectionMap = function (gl, position){//line61, Listing 7.9{
    this.projectionMatrix = SglMat4.perspective(Math.PI/2.0,1.0,0.1,300);
    gl.viewport(0,0,this.cubeMapFrameBuffers[0].width,this.cubeMapFrameBuffers[0].height);
    gl.clearColor(0,0,0,1);
    // +x
    this.stack.load(SglMat4.lookAt(position,SglVec3.add(position,[1.0,0.0,0.0]),[0.0,-1.0,0.0]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cubeMapFrameBuffers[0]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.drawSkyBox(gl);
    this.drawEverything(gl,true, this.cubeMapFrameBuffers[0]);	
    
    // -x
    this.stack.load(SglMat4.lookAt(position,SglVec3.add(position,[-1.0,0.0,0.0]),[0.0,-1.0,0.0]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cubeMapFrameBuffers[1]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.drawSkyBox(gl);//line 76}
    this.drawEverything(gl,true, this.cubeMapFrameBuffers[1]);	
    
    // +z
    this.stack.load(SglMat4.lookAt(position,SglVec3.add(position,[0.0,0.0,1.0]),[0.0,-1.0,0.0]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cubeMapFrameBuffers[4]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.drawSkyBox(gl);
    this.drawEverything(gl,true, this.cubeMapFrameBuffers[2]);

    // -z
    this.stack.load(SglMat4.lookAt(position,SglVec3.add(position,[0.0,0.0,-1.0]),[0.0,-1.0,0.0]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cubeMapFrameBuffers[5]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.drawSkyBox(gl);
    this.drawEverything(gl,true, this.cubeMapFrameBuffers[3]);
    
    // +y
    this.stack.load(SglMat4.lookAt(position,SglVec3.add(position,[0.0,1.0,0.0]),[0.0,0.0,1.0]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cubeMapFrameBuffers[2]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.drawSkyBox(gl);
    this.drawEverything(gl,true, this.cubeMapFrameBuffers[4]);

    // -y
    this.stack.load(SglMat4.lookAt(position,SglVec3.add(position,[ 0.0,-1.0,1.0]),[0.0,0.0,-1.0]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cubeMapFrameBuffers[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.drawSkyBox(gl);
    this.drawEverything(gl,true, this.cubeMapFrameBuffers[5]);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

