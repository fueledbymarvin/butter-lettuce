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


NVMCClient.drawEverything = function (gl,excludeCar) {

    for (var i = 0; i < this.drawables.length; i++) {
        this.drawables[i].draw(gl);
    }
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
    for (var i = 0; i < this.colliders.length; i++) {
        this.colliders[i].update();
    }
    for (var i = 0; i < this.collideables.length; i++) {
        this.collideables[i].update();
    }
    for (var i = 0; i < this.colliders.length; i++) {
        this.colliders[i].collision = false;
        for (var j = 0; j < this.collideables.length; j++) {
            this.checkCollision(this.colliders[i], this.collideables[j]);
        }
        for (var k = i+1; k < this.colliders.length; k++) {
            this.checkCollision(this.colliders[i], this.colliders[k]);
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

NVMCClient.checkCollision = function(a, b) {

    if (this.intersectAABBs(a.body.aabb, b.body.aabb)) {
        var toTest = [];
        var aPrims = a.body.getPrimitives();
        var bPrims = b.body.getPrimitives();
        for (var i = 0; i < aPrims.length; i++) {
            if (this.intersectAABBs(aPrims[i].aabb, b.body.aabb)) {
                for (var j = 0; j < bPrims.length; j++) {
                    if (this.intersectAABBs(aPrims[i].aabb, bPrims[j].aabb)) {
                        toTest.push([aPrims[i], bPrims[j]]);
                    }
                }
            }
        }

        for (var i = 0; i < toTest.length; i++) {
            // make world space bvh if not already done
            if (toTest[i][0].bvh == null) {
                toTest[i][0].updateBVH();
            }
            if (toTest[i][1].bvh == null) {
                toTest[i][1].updateBVH();
            }
            var aPrim = toTest[i][0];
            var bPrim = toTest[i][1];
            var aStack = [aPrim.bvh];
            while (aStack.length > 0) {
                var aAABB = aStack.pop();
                var foundIntersection = false;
                if (this.intersectAABBs(aAABB, bPrim.aabb)) {
                    // if hit a leaf, search through b's bvh
                    if (aAABB.left == null && aAABB.right == null) {
                        var bStack = [bPrim.bvh];
                        while (bStack.length > 0) {
                            var bAABB = bStack.pop();
                            if (this.intersectAABBs(aAABB, bAABB)) {
                                // if bvh at the leaf level, then count as intersection
                                if (bAABB.left == null && bAABB.right == null) {
                                    foundIntersection = true;
                                    break;
                                }
                                if (bAABB.left) {
                                    bStack.push(bAABB.left);
                                }
                                if (bAABB.right) {
                                    bStack.push(bAABB.right);
                                }
                            }
                        }
                    }
                    // otherwise continue searching
                    if (aAABB.left) {
                        aStack.push(aAABB.left);
                    }
                    if (aAABB.right) {
                        aStack.push(aAABB.right);
                    }
                }
                if (foundIntersection) {
                    a.collision = true;
                    b.collision = true;
                    break;
                }
            }
        }
    }
};

NVMCClient.intersectAABBs = function(a, b) {
    return a.max[0] > b.min[0] && 
           a.min[0] < b.max[0] &&
           a.max[1] > b.min[1] &&
           a.min[1] < b.max[1] &&
           a.max[2] > b.min[2] &&
           a.min[2] < b.max[2];
};
