// Global NVMC Client
// ID 7.3
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.cubeMap = null;
NVMCClient.skyBoxShader = null;

NVMCClient.setCubeFace = function (gl, texture, face, imgdata) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgdata);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
};

NVMCClient.loadCubeFace = function (gl, texture, face, path) {
    NVMCClient.n_resources_to_wait_for++;
    var imgdata = new Image();
    imgdata.crossOrigin = "anonymous"; // this line is needed only in local-noserv mode (not in the book)
    var that = this;
    imgdata.onload = function () {
	that.setCubeFace(gl, texture, face, imgdata);
        NVMCClient.n_resources_to_wait_for--;
    };
    imgdata.src = path;
};

NVMCClient.createCubeMap = function (gl, posx, negx, posy, negy, posz, negz) {
    var texture = gl.createTexture();
    this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_X, posx);
    this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, negx);
    this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, posy);
    this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, negy);
    this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, posz);
    this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, negz);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    return texture;
};

NVMCClient.drawSkyBox = function (gl) {//line 47, Listnig 7.6
    gl.useProgram(this.skyBoxShader);
    gl.uniformMatrix4fv(this.skyBoxShader.uProjectionMatrixLocation, false, this.projectionMatrix);
    var orientationOnly = this.stack.matrix;
    SglMat4.col$(orientationOnly, 3, [0.0, 0.0, 0.0, 1.0]);

    gl.uniformMatrix4fv(this.skyBoxShader.uModelViewMatrixLocation, false, orientationOnly);
    gl.uniform1i(this.skyBoxShader.uCubeMapLocation, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    this.drawObject(gl, this.cube, this.skyBoxShader);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
};

