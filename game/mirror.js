// Global NVMC Client
// ID 7.1
/***********************************************************************/
var NVMCClient = NVMCClient || {};

NVMCClient.rearMirrorTextureTarget = null;//line 6, Listing 7.5{
TextureTarget = function () {
    this.framebuffer = null;
    this.texture = null;
};

NVMCClient.prepareRenderToTextureFrameBuffer = function (gl, generateMipmap, w, h) {
    var textureTarget = new TextureTarget();
    textureTarget.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, textureTarget.framebuffer);

    if (w) textureTarget.framebuffer.width = w;
    else textureTarget.framebuffer.width = 512;
    if (h) textureTarget.framebuffer.height = h;
    else textureTarget.framebuffer.height = 512;;

    textureTarget.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureTarget.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureTarget.framebuffer.width, textureTarget.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    if (generateMipmap) gl.generateMipmap(gl.TEXTURE_2D);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, textureTarget.framebuffer.width, textureTarget.framebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureTarget.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return textureTarget;
}//line 44}

NVMCClient.createTexture = function (gl, data, nomipmap) {
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.crossOrigin = "anonymous"; // this line is needed only in local-noserv mode (not in the book)
    NVMCClient.n_resources_to_wait_for++;
    var that = texture;
    texture.image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, that);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, that.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (nomipmap) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        if (!nomipmap) gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        NVMCClient.n_resources_to_wait_for--;
    };

    texture.image.src = data;
    return texture;
}


NVMCClient.createObjectBuffers = function (gl, obj, createColorBuffer, createNormalBuffer, createTexCoordBuffer) {
    obj.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    if (createColorBuffer) {
        obj.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_color, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    if (createNormalBuffer) {
        obj.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_normal, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    if (createTexCoordBuffer) {
        obj.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, obj.textureCoord, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    obj.indexBufferTriangles = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // create edges
    var edges = new Uint16Array(obj.numTriangles * 3 * 2);
    for (var i = 0; i < obj.numTriangles; ++i) {
        edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
        edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
        edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
        edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
        edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
        edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
    }

    obj.indexBufferEdges = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

};




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

NVMCClient.createObjects = function () {
    this.cube = new Cube(10);
    this.cylinder = new Cylinder(10);
    this.cone = new Cone(10);

    this.track = new TexturedTrack(this.game.race.track, 0.2);

    var bbox = this.game.race.bbox;
    var quad = [bbox[0], bbox[1] - 0.01, bbox[2], bbox[3], bbox[1] - 0.01, bbox[2], bbox[3], bbox[1] - 0.01, bbox[5], bbox[0], bbox[1] - 0.01, bbox[5]];
    var text_coords = [-200, -200, 200, -200, 200, 200, -200, 200];
    this.ground = new TexturedQuadrilateral(quad, text_coords);
    this.cabin = new CabinNoMirror();
    this.windshield = new Windshield();
    this.rearMirror = new RearMirror();

    var gameBuildings = this.game.race.buildings;
    this.buildings = new Array(gameBuildings.length);
    for (var i = 0; i < gameBuildings.length; ++i) {
        this.buildings[i] = new TexturedFacades(gameBuildings[i], 1);
        this.buildings[i].roof = new TexturedRoof(gameBuildings[i], 5);
    }
};

NVMCClient.createBuffers = function (gl) {
    this.createObjectBuffers(gl, this.cube, false, false, false);

    ComputeNormals(this.cylinder);
    this.createObjectBuffers(gl, this.cylinder, false, true, false);
    

    ComputeNormals(this.cone);
    this.createObjectBuffers(gl, this.cone, false, true, false);
    

    this.createObjectBuffers(gl, this.track, false, false, true);
    this.createObjectBuffers(gl, this.ground, false, false, true);

    this.createObjectBuffers(gl, this.cabin, true, false, false);
    this.createObjectBuffers(gl, this.windshield, true, false, false);

    this.createObjectBuffers(gl, this.rearMirror, false, false, true);

    for (var i = 0; i < this.buildings.length; ++i) {
        this.createObjectBuffers(gl, this.buildings[i], false, false, true);
        this.createObjectBuffers(gl, this.buildings[i].roof, false, false, true);
    }
};

NVMCClient.initializeObjects = function (gl) {
    this.createObjects();
    this.createBuffers(gl);
};

