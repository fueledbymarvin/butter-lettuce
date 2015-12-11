// Global NVMC Client
// ID 7.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
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
	    },
	}
    });
};

