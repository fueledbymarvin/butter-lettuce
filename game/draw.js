// Global NVMC Client
// ID 8.0

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.drawObject = function (gl, obj, shader, fillColor, drawWire) {
    // Draw the primitive
    gl.useProgram(shader);
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.enableVertexAttribArray(shader.aPositionIndex);
    gl.vertexAttribPointer(shader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);


    if (shader.aColorIndex && obj.colorBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.enableVertexAttribArray(shader.aColorIndex);
        gl.vertexAttribPointer(shader.aColorIndex, 4, gl.FLOAT, false, 0, 0);
    }

    if (shader.aNormalIndex && obj.normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
        gl.enableVertexAttribArray(shader.aNormalIndex);
        gl.vertexAttribPointer(shader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
    }

    if (shader.aTextureCoordIndex && obj.textureCoordBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordBuffer);
        gl.enableVertexAttribArray(shader.aTextureCoordIndex);
        gl.vertexAttribPointer(shader.aTextureCoordIndex, 2, gl.FLOAT, false, 0, 0);
    }

    if (fillColor && shader.uColorLocation) gl.uniform4fv(shader.uColorLocation, fillColor);

    gl.enable(gl.POLYGON_OFFSET_FILL);

    gl.polygonOffset(1.0, 1.0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
    gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);


    if (drawWire) {
        gl.disable(gl.POLYGON_OFFSET_FILL);

        gl.useProgram(this.uniformShader);
        gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixMatrixLocation, false, this.stack.matrix);

        gl.uniform4fv(this.uniformShader.uColorLocation, [0, 0, 1, 1]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
        gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);
        gl.useProgram(shader);
    }

};

NVMCClient.drawTree = function (gl) {
    var stack = this.stack;

    stack.push();
    var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
    stack.multiply(M_0_tra1);

    var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
    stack.multiply(M_0_sca);

    gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uModelMatrixLocation, false, stack.matrix);
    var InvT = SglMat4.inverse(SglMat4.mul(this.viewMatrix,this.stack.matrix));
    InvT = SglMat4.transpose(InvT);
    gl.uniformMatrix3fv(this.lambertianSingleColorShadowShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
    this.drawObject(gl, this.cone, this.lambertianSingleColorShadowShader, [0.2, 0.8, 0.1, 1.0]);
    stack.pop();

    stack.push();
    var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
    stack.multiply(M_1_sca);

    gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uModelMatrixLocation, false, stack.matrix);
    var InvT = SglMat4.inverse(SglMat4.mul(this.viewMatrix,this.stack.matrix));
    InvT = SglMat4.transpose(InvT);
    gl.uniformMatrix3fv(this.lambertianSingleColorShadowShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
    this.drawObject(gl, this.cylinder, this.lambertianSingleColorShadowShader, [0.6, 0.23, 0.12, 1.0]);
    stack.pop();
};


NVMCClient.drawTreeDepthOnly = function (gl) {
    var stack = this.stack;

    stack.push();
    var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
    stack.multiply(M_0_tra1);

    var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
    stack.multiply(M_0_sca);

    gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, stack.matrix);
    this.drawObject(gl, this.cone, this.shadowMapCreateShader);
    stack.pop();

    stack.push();
    var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
    stack.multiply(M_1_sca);

    gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, stack.matrix);
    this.drawObject(gl, this.cylinder, this.shadowMapCreateShader);
    stack.pop();
};


NVMCClient.drawCarDepthOnly = function (gl) {
    var fb = new SglFramebuffer(gl, {handle: this.shadowMapTextureTarget.framebuffer,autoViewport:false});

    this.depthOnlyRenderer.begin();
    this.depthOnlyRenderer.setFramebuffer(fb);

    this.depthOnlyRenderer.setTechnique(this.depthOnlyTechnique);

    this.depthOnlyRenderer.setGlobals({
	"SHADOW_MATRIX": this.stack.matrix
    });

    this.depthOnlyRenderer.setPrimitiveMode("FILL");

    this.depthOnlyRenderer.setModel(this.sgl_car_model);
    this.depthOnlyRenderer.renderModel();
    this.depthOnlyRenderer.end();
};



NVMCClient.drawShadowCastersDepthOnly = function (gl) {

    var pos  = this.game.state.players.me.dynamicState.position;	
    
    for (var i in this.buildings){
	this.drawObject(gl, this.buildings[i],this.shadowMapCreateShader);
    }	
    for (var i in this.buildings){
	this.drawObject(gl, this.buildings[i].roof,this.shadowMapCreateShader);
    }	
    
    var trees = this.game.race.trees;
    for (var t in trees) {
	this.stack.push();
	var M_8 = SglMat4.translation(trees[t].position);
	this.stack.multiply(M_8);
	this.drawTreeDepthOnly(gl,this.shadowMapCreateShader);
	this.stack.pop();
    }
    
    var M_9 = SglMat4.translation(pos);
    this.stack.multiply(M_9);

    var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
    this.stack.multiply(M_9bis);

    this.drawCarDepthOnly(gl);
};


NVMCClient.drawCar = function (gl,toWordMatrix){
    this.sgl_renderer.begin();
    this.sgl_renderer.setTechnique(this.sgl_technique);
    
    
    this.sgl_renderer.setGlobals({
   	"PROJECTION_MATRIX":this.projectionMatrix,
	"WORLD_VIEW_MATRIX":this.stack.matrix,
	"SHADOW_MATRIX": SglMat4.mul(this.shadowMatrix ,toWordMatrix),
	"VIEW_SPACE_NORMAL_MATRIX"     : SglMat4.to33(this.stack.matrix) ,
	"CUBE_MAP"            : 2,
	"SHADOW_MAP"            : 3,
	"VIEW_TO_WORLD_MATRIX": this.viewFrame,
	"LIGHTS_GEOMETRY":		this.sunLightDirectionViewSpace,
	"LIGHT_COLOR":	[0.9,0.9,0.9]	});
    
    this.sgl_renderer.setPrimitiveMode("FILL");
    
    this.sgl_renderer.setModel(this.sgl_car_model);
    this.sgl_renderer.setTexture(2,new SglTextureCubeMap(gl,this.reflectionMap));
    this.sgl_renderer.setTexture(3,new SglTexture2D(gl,this.shadowMapTextureTarget.texture));
    this.sgl_renderer.renderModel();
    this.sgl_renderer.end();
};		

NVMCClient.drawEverything = function (gl,excludeCar) {
    var stack  = this.stack;
    this.viewMatrix = this.stack.matrix;
    this.sunLightDirectionViewSpace = SglMat4.mul4(this.stack.matrix,this.sunLightDirection);
    var pos  = this.game.state.players.me.dynamicState.position;	

    // set shadow map texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,this.shadowMapTextureTarget.texture);

    // Setup parameters for uniform shader
    gl.useProgram(this.uniformShader);
    gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);

    // Setup parameters for phong shader
    gl.useProgram(this.phongShader);
    gl.uniformMatrix4fv(this.phongShader.uProjectionMatrixLocation,false,this.projectionMatrix);
    gl.uniformMatrix4fv(this.phongShader.uModelViewMatrixLocation,false,stack.matrix  );
    gl.uniformMatrix3fv(this.phongShader.uViewSpaceNormalMatrixLocation,false, SglMat4.to33(this.stack.matrix) );	
    gl.uniform4fv(this.phongShader.uLightDirectionLocation,this.sunLightDirectionViewSpace);
    
    gl.uniform3fv(this.phongShader.uLightColorLocation,[0.9,0.9,0.9]);
    gl.uniform1f(this.phongShader.uShininessLocation,0.2);
    gl.uniform1f(this.phongShader.uKaLocation,0.5);
    gl.uniform1f(this.phongShader.uKdLocation,0.5);
    gl.uniform1f(this.phongShader.uKsLocation, 1.0);
    
    // Setup parameters for lambertian shader
    gl.useProgram(this.lambertianSingleColorShadowShader);

    gl.uniform1i(this.lambertianSingleColorShadowShader.uShadowMapLocation, 1);

    gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uProjectionMatrixLocation,false,this.projectionMatrix);
    gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uViewMatrixLocation,false, this.stack.matrix);
    gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uShadowMatrixLocation,false, this.shadowMatrix);

    gl.uniform4fv(this.lambertianSingleColorShadowShader.uLightDirectionLocation,this.sunLightDirectionViewSpace);
    gl.uniform3fv(this.lambertianSingleColorShadowShader.uLightColorLocation,[1.0,1.0,1.0]);

    // Setup parameters for texture shader
    gl.useProgram(this.textureShadowShader);

    gl.uniformMatrix4fv(this.textureShadowShader.uProjectionMatrixLocation, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.textureShadowShader.uModelViewMatrixLocation, false, this.stack.matrix);
    gl.uniformMatrix4fv(this.textureShadowShader.uShadowMatrixLocation, false, this.shadowMatrix);
    gl.uniform1i(this.textureShadowShader.uTextureLocation, 0);
    gl.uniform1i(this.textureShadowShader.uShadowMapLocation, 1);

    // Setup parameters for texture bump shader
    gl.useProgram(this.textureNormalMapShadowShader);

    gl.uniformMatrix4fv(this.textureNormalMapShadowShader.uProjectionMatrixLocation, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.textureNormalMapShadowShader.uModelViewMatrixLocation, false, stack.matrix);
    gl.uniformMatrix4fv(this.textureNormalMapShadowShader.uShadowMatrixLocation, false, this.shadowMatrix);
    gl.uniform4fv(this.textureNormalMapShadowShader.uLightDirectionLocation,this.sunLightDirection);
    gl.uniform1i(this.textureNormalMapShadowShader.uTextureLocation,0);
    gl.uniform1i(this.textureNormalMapShadowShader.uShadowMapLocation,1);
    gl.uniform1i(this.textureNormalMapShadowShader.uNormalMapLocation,2);

    gl.useProgram(this.lambertianSingleColorShadowShader);
    var trees = this.game.race.trees;
    
    for (var t in trees) {
	stack.push();
	stack.loadIdentity();
	var M_8 = SglMat4.translation(trees[t].position);
	this.stack.multiply(M_8);
  	this.drawTree(gl);
	stack.pop();
    }
    
    gl.useProgram(this.textureNormalMapShadowShader);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,this.texture_street);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D,this.normal_map_street);

    this.drawObject(gl, this.track,this.textureNormalMapShadowShader, [0.9, 0.8, 0.7,1.0]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,this.texture_ground);

    this.ground.draw(gl);

    gl.activeTexture(gl.TEXTURE0);

    for (var i in this.buildings) {
 	gl.bindTexture(gl.TEXTURE_2D, this.texture_facade[i%this.texture_facade.length]);
	this.drawObject(gl, this.buildings[i], this.textureShadowShader);
    }
    
    gl.bindTexture(gl.TEXTURE_2D,this.texture_roof);
    for (var i in this.buildings){
	this.drawObject(gl, this.buildings[i].roof,this.textureShadowShader);
    }

    if( !excludeCar &&  this.currentCamera!=3 ){
 	stack.push();
	var M_9 = SglMat4.translation(pos);
	stack.multiply(M_9);

	var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
	stack.multiply(M_9bis);

	var toWordMatrix = SglMat4.mul(M_9, M_9bis);

	this.drawCar(gl,toWordMatrix);
	stack.pop();
	
    }
};


NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0)return;
    var width  = this.ui.width;
    var height = this.ui.height;
    var ratio  = width / height;
    
    // compute the shadow matrix
    var bbox =  this.game.race.bbox;

    var eye = SglVec3.muls(this.sunLightDirection,-0.0);
    var target = SglVec3.add(eye, this.sunLightDirection);

    var mview = SglMat4.lookAt(eye,target, [0,1,0]);
    
    var newbbox = this.findMinimumViewWindow(bbox,mview);
    var proj = SglMat4.ortho([ newbbox[0],newbbox[1],-newbbox[5] ], [ newbbox[3], newbbox[4],-newbbox[2] ] );

    this.shadowMatrix = SglMat4.mul(proj,mview);

    this.drawOnReflectionMap(gl,SglVec3.add(this.game.state.players.me.dynamicState.position,[0.0,1.5,0.0]));
    
    gl.viewport(0, 0, width, height);

    // Clear the framebuffer
    var stack  = this.stack;
    gl.clearColor(0.4, 0.6, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.projectionMatrix = SglMat4.perspective(3.14/4,ratio,0.1,1000);

    stack.loadIdentity();
    var pos = this.game.state.players.me.dynamicState.position;
    var orientation = this.game.state.players.me.dynamicState.orientation;
    this.cameras[this.currentCamera].setView(this.stack, this.myFrame());
    
    this.viewFrame = SglMat4.inverse(this.stack.matrix);
    this.drawSkyBox(gl);
    
    gl.enable(gl.DEPTH_TEST);

    gl.disable(gl.STENCIL_TEST);

    // set view for creating the shadow map
    this.stack.push();
    this.stack.loadIdentity();
    this.stack.multiply(this.shadowMatrix);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapTextureTarget.framebuffer);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0,0,this.shadowMapTextureTarget.framebuffer.width,this.shadowMapTextureTarget.framebuffer.height);
    gl.useProgram(this.shadowMapCreateShader);
    gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, this.stack.matrix);

    this.drawShadowCastersDepthOnly(gl);// that is,draw everything with shadowMapCreateShader

    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    this.stack.pop();
    gl.viewport(0, 0, width, height);
    
    this.drawEverything(gl);
};

