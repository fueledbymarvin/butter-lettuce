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

        gl.uniform4fv(this.uniformShader.uColorLocation, [1, 1, 1, 1]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
        gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);
        gl.useProgram(shader);
    }
};

NVMCClient.drawShadowCastersDepthOnly = function (gl) {

    for (var i = 0; i < this.shadowables.length; i++) {
        this.shadowables[i].draw(gl, true);
    }
};


NVMCClient.drawEverything = function (gl) {

    for (var i = 0; i < this.drawables.length; i++) {
        this.drawables[i].draw(gl);
    }
};

NVMCClient.drawBillboards = function (gl) {

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    for (var i = 0; i < this.billboards.length; i++) {
        this.billboards[i].draw(gl);
    }

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
};

NVMCClient.setupShaders = function(gl) {

    var stack  = this.stack;
    this.viewMatrix = this.stack.matrix;
    this.sunLightDirectionViewSpace = SglMat4.mul4(this.stack.matrix,this.sunLightDirection);

    // set shadow map texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,this.shadowMapTextureTarget.texture);

    // Setup parameters for uniform shader
    gl.useProgram(this.uniformShader);
    gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);

    // Setup parameters for phong shader
    gl.useProgram(this.phongSingleColorShadowShader);

    gl.uniform1i(this.phongSingleColorShadowShader.uShadowMapLocation, 1);

    gl.uniformMatrix4fv(this.phongSingleColorShadowShader.uProjectionMatrixLocation,false,this.projectionMatrix);
    gl.uniformMatrix4fv(this.phongSingleColorShadowShader.uModelViewMatrixLocation,false, this.stack.matrix);
    gl.uniformMatrix4fv(this.phongSingleColorShadowShader.uShadowMatrixLocation,false, this.shadowMatrix);

    gl.uniform4fv(this.phongSingleColorShadowShader.uLightDirectionLocation,this.sunLightDirectionViewSpace);
    gl.uniform3fv(this.phongSingleColorShadowShader.uLightColorLocation,[1.0,1.0,1.0]);

    // Setup parameters for texture shader
    gl.useProgram(this.textureShadowShader);

    gl.uniformMatrix4fv(this.textureShadowShader.uProjectionMatrixLocation, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.textureShadowShader.uModelViewMatrixLocation, false, this.stack.matrix);
    gl.uniformMatrix4fv(this.textureShadowShader.uShadowMatrixLocation, false, this.shadowMatrix);
    gl.uniform4fv(this.textureShadowShader.uLightDirectionLocation, this.sunLightDirectionViewSpace);
    gl.uniform3fv(this.textureShadowShader.uLightColorLocation,[1, 1, 1]);
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

    gl.viewport(0, 0, width, height);

    // Clear the framebuffer
    var stack  = this.stack;
    gl.clearColor(0.4, 0.6, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.projectionMatrix = SglMat4.perspective(3.14/4,ratio,0.1,1000);

    stack.loadIdentity();

    // update positions before checking for collisions
    for (var i = 0; i < this.colliders.length; i++) {
        this.colliders[i].update();
        this.colliders[i].collisions = [];
        this.colliders[i].collisionObjects = [];
    }
    for (var i = 0; i < this.collideables.length; i++) {
        this.collideables[i].update();
    }
    // check for collisions on prospective positions
    for (var i = 0; i < this.colliders.length; i++) {
        for (var j = 0; j < this.collideables.length; j++) {
            this.checkCollision(this.colliders[i], this.collideables[j], false);
        }
        for (var k = i+1; k < this.colliders.length; k++) {
            this.checkCollision(this.colliders[i], this.colliders[k], true);
        }
    }
    // handle collisions
    for (var i = 0; i < this.colliders.length; i++) {
        if (this.colliders[i].collisions.length > 0) {
            this.colliders[i].collisionResponse(this.calcSlide(this.colliders[i].collisions));
        }
    }

    this.cameras[this.currentCamera].setView(this.stack, this.player.getFrame());
    
    this.viewFrame = SglMat4.inverse(this.stack.matrix);
    this.drawSkyBox(gl);
    
    gl.enable(gl.DEPTH_TEST);

    this.setupShaders(gl);

    gl.disable(gl.STENCIL_TEST);

    // set view for creating the shadow map
    this.stack.push();
    this.stack.loadIdentity();
    this.stack.multiply(this.shadowMatrix);

    gl.enable(gl.CULL_FACE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapTextureTarget.framebuffer);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0,0,this.shadowMapTextureTarget.framebuffer.width,this.shadowMapTextureTarget.framebuffer.height);
    gl.useProgram(this.shadowMapCreateShader);
    gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, this.stack.matrix);

    this.drawShadowCastersDepthOnly(gl);// that is,draw everything with shadowMapCreateShader

    gl.disable(gl.CULL_FACE);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    this.stack.pop();
    gl.viewport(0, 0, width, height);
    
    this.drawEverything(gl);

    this.drawBillboards(gl);
};
