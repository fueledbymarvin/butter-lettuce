// Global NVMC Client
// ID 8.0

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.texture_facade = [];
NVMCClient.texture_roof = null;

NVMCClient.createFullScreenQuad = function (gl) {
    var quad = [	-1.0,-1,0,
			1.0,-1,0,
			1.0,1,0,
			-1.0,1,0];
    var text_coords = 	[ 0.0,0.0, 1.0,0.0, 1.0,1.0, 0.0,1.0];
    this.quad = new TexturedQuadrilateral(quad,text_coords);
    this.createObjectBuffers(gl, this.quad,false,false,true);
};

NVMCClient.shadowMapTextureTarget = null;
NVMCClient.shadowMatrix = null;
NVMCClient.viewMatrix = null;

NVMCClient.createTechniqueShadow = function (gl) {
    var options = { vertexShader: this.reflectionMapShadowShader.vertex_shader, 
		    fragmentShader: this.reflectionMapShadowShader.fragment_shader,
		    vertexStreams: {
			"aPosition": [ 0.0,0.0,0.0],
			"aDiffuse": [ 0.0,0.0,0.0,1.0],
			"aSpecular": [ 0.0,0.0,0.0,1.0],
			"aNormal": [ 0.0,1.0,1.0 ],
			"aAmbient": [ 0.0,0.0,0.0,1.0]
		    },
		    globals: {
			"uProjectionMatrix": { semantic: "PROJECTION_MATRIX", value: this.projectionMatrix },
			"uModelViewMatrix": { semantic: "WORLD_VIEW_MATRIX", value: this.stack.matrix },
			"uViewSpaceNormalMatrix": { semantic: "VIEW_SPACE_NORMAL_MATRIX", value:SglMat4.to33(this.stack.matrix) },
			"uViewToWorldMatrix": { semantic: "VIEW_TO_WORLD_MATRIX", value: SglMat4.identity()},
			"uShadowMatrix": { semantic: "SHADOW_MATRIX", value: SglMat4.identity()},
 			"uCubeMap": {semantic: "CUBE_MAP", value:2},
			"uShadowMap": {semantic:"SHADOW_MAP",value:1},
			"uLightDirection": {semantic: "LIGHTS_GEOMETRY", value: this.sunLightDirectionViewSpace},
			"uLightColor": {semantic: "LIGHT_COLOR",value: [0.9,0.9,0.9]},
			"uAmbient": {semantic: "AMBIENT",value: [0.4,0.4,0.4]}
                    }
		  };

    this.sgl_renderer = new SglModelRenderer(gl);	
    this.sgl_technique = new SglTechnique(gl, options);
};

NVMCClient.createDepthOnlyTechnique = function (gl) {
    this.depthOnlyRenderer = new SglModelRenderer(gl);
    this.depthOnlyTechnique = new SglTechnique(gl, {
        vertexShader: this.shadowMapCreateShader.vertex_shader,
        fragmentShader: this.shadowMapCreateShader.fragment_shader,
        vertexStreams: {
            "a_position": [0.0, 0.0, 0.0, 1.0]
        },
        globals: {
            "uShadowMatrix": {
                semantic: "SHADOW_MATRIX",
                value: this.stack.matrix
            }
        }
        
    });

};

updateBBox = function ( bbox, newpoint){
    if(newpoint[0] < bbox[0]) bbox[0] = newpoint[0]; 
    else
	if(newpoint[0] > bbox[3]) bbox[3] = newpoint[0];

    if(newpoint[1] < bbox[1]) bbox[1] = newpoint[1]; 
    else
	if(newpoint[1] > bbox[4]) bbox[4] = newpoint[1];

    if(newpoint[2] < bbox[2]) bbox[2] = newpoint[2]; 
    else
	if(newpoint[2] > bbox[5]) bbox[5] = newpoint[2];

    return bbox;

};

enlargeBBox = function (bbox,perc){
    var center =[];
    center[0] =  (bbox[0]+bbox[3])*0.5;
    center[1] =  (bbox[1]+bbox[4])*0.5;
    center[2] =  (bbox[2]+bbox[5])*0.5;
    
    bbox[0] += (bbox[0] - center[0]) * perc;
    bbox[1] += (bbox[1] - center[1]) * perc;
    bbox[2] += (bbox[2] - center[2]) * perc;
    bbox[3] += (bbox[3] - center[0]) * perc;
    bbox[4] += (bbox[4] - center[1]) * perc;
    bbox[5] += (bbox[5] - center[2]) * perc;
    return bbox;
};

NVMCClient.findMinimumViewWindow = function (bbox, projMatrix){
    var bbox_vs = [];
    
    // corner 0,0,0
    var p = SglMat4.mul4(projMatrix,[bbox[0],bbox[1],bbox[2],1.0]) ;  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = [p[0],p[1],p[2],p[0],p[1],p[2]];

    // corner 1,0,0
    p = SglMat4.mul4(projMatrix,[bbox[3],bbox[1],bbox[2],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

    // corner 1,1,0
    p = SglMat4.mul4(projMatrix,[bbox[3],bbox[4],bbox[2],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


    // corner 0,1,0
    p = SglMat4.mul4(projMatrix,[bbox[0],bbox[4],bbox[2],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


    // corner 0,0,1
    var p = SglMat4.mul4(projMatrix,[bbox[0],bbox[1],bbox[5],1.0]) ;  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

    // corner 1,0,1
    p = SglMat4.mul4(projMatrix,[bbox[3],bbox[1],bbox[5],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

    // corner 1,1,1
    p = SglMat4.mul4(projMatrix,[bbox[3],bbox[4],bbox[5],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


    // corner 0,1,1
    p = SglMat4.mul4(projMatrix,[bbox[0],bbox[4],bbox[5],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

    return bbox_vs;
};

