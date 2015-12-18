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
    enlargeBBox(this.game.race.bbox,0.01);
    /*************************************************************/
    this.uniformShader 			= new uniformShader(gl);
    this.perVertexColorShader 		= new perVertexColorShader(gl);
    this.lambertianSingleColorShader 	= new lambertianSingleColorShader(gl);
    this.phongShader 			= new phongShader(gl);
    this.textureShader 			= new textureShader(gl);
    this.skyBoxShader 			= new skyBoxShader(gl);
    this.showCubeMapShader		= new showCubeMapShader(gl);
    this.shadowMapCreateShader		= new shadowMapCreateShader(gl);
    this.shadowMapShader		= new shadowMapShader(gl);

    this.textureShadowShader		= new texturePCFShadowShader(gl);
    this.textureNormalMapShadowShader 	= new textureNormalMapShadowShader(gl);

    this.reflectionMapShadowShader 	= new reflectionMapPCFShadowShader(gl);
    this.lambertianSingleColorShadowShader = new lambertianSingleColorPCFShadowShader(gl);

    /*************************************************************/

    this.texture_street = this.createTexture(gl, NVMC.resource_path+'textures/street4.png');
    this.normal_ground = this.createTexture(gl, NVMC.resource_path+'textures/rocky_normal.jpg');
    this.texture_ground = this.createTexture(gl, NVMC.resource_path+'textures/rocky.jpg');
    this.dotsTexture = this.createTexture(gl, NVMC.resource_path+'textures/dots.jpg');
    this.rockTextures = [this.texture_ground];
    this.rockTextures.push(this.createTexture(gl, NVMC.resource_path+'textures/turquoise_rock.jpg'));
    this.rockTextures.push(this.createTexture(gl, NVMC.resource_path+'textures/emerald_rock.jpg'));
    this.texture_facade.push(this.createTexture(gl, NVMC.resource_path+'textures/facade1.jpg'));
    this.texture_facade.push(this.createTexture(gl, NVMC.resource_path+'textures/facade2.jpg'));
    this.texture_facade.push(this.createTexture(gl, NVMC.resource_path+'textures/facade3.jpg'));
    this.texture_roof = this.createTexture(gl, NVMC.resource_path+'textures/concreteplane2k.jpg');

    this.initializeObjects(gl);
    this.createFullScreenQuad(gl);

    this.cubeMap = this.createCubeMap(gl,
                                      NVMC.resource_path+'textures/cubemap/posx.png',
                                      NVMC.resource_path+'textures/cubemap/negx.png',
                                      NVMC.resource_path+'textures/cubemap/posy.png',
                                      NVMC.resource_path+'textures/cubemap/negy.png',
                                      NVMC.resource_path+'textures/cubemap/posz.png',
                                      NVMC.resource_path+'textures/cubemap/negz.png'
                                     );
    this.createReflectionMap(gl);
    
    this.createTechniqueShadow(gl);

    this.createDepthOnlyTechnique(gl);

    this.shadowMapTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,4096,4096);
    this.prepareRenderToCubeMapFrameBuffer(gl);
    this.sunLightDirection = [-2.4,-1,-0,0.0];
};


