// Global NVMC Client
// ID 8.1 

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/


// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {
    var gl = this.ui.gl;

    /*************************************************************/
    NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
    /*************************************************************/

    /*************************************************************/
    this.stack 			= new SglMatrixStack();
    this.projection_matrix 	=  SglMat4.identity();
    this.bbox = [ -100, 0, -100, 100, 10, 100 ];
    enlargeBBox(this.bbox,0.01);
    /*************************************************************/
    this.uniformShader 			= new uniformShader(gl);
    this.skyBoxShader 			= new skyBoxShader(gl);
    this.shadowMapCreateShader		= new shadowMapCreateShader(gl);
    this.shadowMapShader		= new shadowMapShader(gl);
    this.textureShadowShader		= new texturePCFShadowShader(gl);
    this.textureNormalMapShadowShader 	= new textureNormalMapShadowShader(gl);
    this.phongSingleColorShadowShader   = new phongSingleColorPCFShadowShader(gl);
    this.onScreenBillboardShader        = new onScreenBillboardShader(gl);

    /*************************************************************/

    this.texture_ground = this.createTexture(gl, NVMC.resource_path+'textures/rocky.jpg');
    this.dotsTexture = this.createTexture(gl, NVMC.resource_path+'textures/dots.jpg');
    this.leafTexture = this.createTexture(gl, NVMC.resource_path+'textures/leaf.jpg');
    this.rockTextures = [this.texture_ground];
    this.rockTextures.push(this.createTexture(gl, NVMC.resource_path+'textures/turquoise_rock.jpg'));
    this.rockTextures.push(this.createTexture(gl, NVMC.resource_path+'textures/emerald_rock.jpg'));
    this.treeTextures = [];
    this.treeTextures.push(this.createTexture(gl, NVMC.resource_path+'textures/blue.jpg'));
    this.treeTextures.push(this.createTexture(gl, NVMC.resource_path+'textures/purple.jpg'));
    this.treeTextures.push(this.createTexture(gl, NVMC.resource_path+'textures/red.jpg'));
    this.treeTextures.push(this.createTexture(gl, NVMC.resource_path+'textures/orange.jpg'));
    this.lettuceTexture = this.createTexture(gl, NVMC.resource_path+'textures/lettuce.png');
    this.lettuceAltTexture = this.createTexture(gl, NVMC.resource_path+'textures/lettuce_alt.png');

    this.aabbs = false;
    this.bvhDepth = 5;
    this.lod = 10;
    this.nLettuce = 5;
    this.movementSpeed = 15;
    this.difficulty = 1;

    this.initializeObjects(gl);

    this.cubeMap = this.createCubeMap(gl,
                                      NVMC.resource_path+'textures/cubemap/negx.jpg',
                                      NVMC.resource_path+'textures/cubemap/posx.jpg',
                                      NVMC.resource_path+'textures/cubemap/negy.jpg',
                                      NVMC.resource_path+'textures/cubemap/posy.jpg',
                                      NVMC.resource_path+'textures/cubemap/posz.jpg',
                                      NVMC.resource_path+'textures/cubemap/negz.jpg'
                                     );

    this.shadowMapTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,4096,4096);
    this.sunLightDirection = [-1,-1,-1,0.0];
};


