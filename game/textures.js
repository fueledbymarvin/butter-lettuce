// Global NVMC Client
// ID 7.1
/***********************************************************************/
var NVMCClient = NVMCClient || {};

NVMCClient.n_resources_to_wait_for = 0;

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

