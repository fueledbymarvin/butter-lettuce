// Global NVMC Client
// ID 7.1
/***********************************************************************/
var NVMCClient = NVMCClient || {};

NVMCClient.n_resources_to_wait_for = 0;
NVMCClient.texture_ground = null;
NVMCClient.texture_street = null;
NVMCClient.texture_facade = [];
NVMCClient.texture_roof = null;
NVMCClient.normal_map_street;

NVMCClient.createCarTechnique = function (gl, shaderToUse) {
    this.sgl_renderer = new SglModelRenderer(gl);
    this.sgl_technique = new SglTechnique(gl, {
	vertexShader: shaderToUse.vertex_shader,
	fragmentShader: shaderToUse.fragment_shader,
	vertexStreams: {
	    "aPosition": [0.0, 0.0, 0.0, 1.0],
	    "aNormal": [0.0, 0.0, 1.0, 0.0],
	    "aDiffuse": [0.0, 0.0, 0.8, 0.0]
	},
	globals: {
	    "uProjectionMatrix": {
		semantic: "PROJECTION_MATRIX",
		value: this.projectionMatrix
	    },
	    "uModelViewMatrix": {
		semantic: "WORLD_VIEW_MATRIX",
		value: this.stack.matrix
	    },
	    "uViewSpaceNormalMatrix": {
		semantic: "VIEW_SPACE_NORMAL_MATRIX",
		value: SglMat4.to33(this.stack.matrix)
	    },
	    "uLightDirection": {
		semantic: "LIGHTS_GEOMETRY",
		value: this.lightsGeometryViewSpace
	    },
	    "uLightColor": {
		semantic: "LIGHT_COLOR",
		value: this.lightColor
	    }
	}
    });
};

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
};

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
};

