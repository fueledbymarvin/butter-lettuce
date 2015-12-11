// Global NVMC Client
// ID 6.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
NVMCClient.sgl_car_model = null;
NVMCClient.sgl_renderer = null;

NVMCClient.loadCarModel = function (gl, data) {//line 158, Listing 6.5{
    if (!data)
	data = NVMC.resource_path+"geometry/cars/eclipse/eclipse.obj";
    var that = this;
    this.sgl_car_model = null;
    sglRequestObj(data, function (modelDescriptor) {
	that.sgl_car_model = new SglModel(that.ui.gl, modelDescriptor);
	that.ui.postDrawEvent();
    });
};//line 167}

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

NVMCClient.createObjects = function () {
    this.cube = new Cube(10);
    this.cylinder = new Cylinder(10);
    this.cone = new Cone(10);

    this.track = new TexturedTrack(this.game.race.track, 0.2);

    var bbox = this.game.race.bbox;
    var quad = [bbox[0], bbox[1] - 0.01, bbox[2], bbox[3], bbox[1] - 0.01, bbox[2], bbox[3], bbox[1] - 0.01, bbox[5], bbox[0], bbox[1] - 0.01, bbox[5]];
    var text_coords = [-200, -200, 200, -200, 200, 200, -200, 200];
    this.ground = new Primitive({
        mesh: new TexturedQuadrilateral(quad, text_coords),
        shader: this.textureShadowShader
    });

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
    this.createObjectBuffers(gl, this.ground.mesh, false, false, true);

    for (var i = 0; i < this.buildings.length; ++i) {
        this.createObjectBuffers(gl, this.buildings[i], false, false, true);
        this.createObjectBuffers(gl, this.buildings[i].roof, false, false, true);
    }
};

NVMCClient.initializeObjects = function (gl) {
    this.createObjects();
    this.createBuffers(gl);
};

function Body() {

}

function Primitive(options) {
    this.client = NVMCClient;

    this.mesh = options.mesh;
    this.shader = options.shader;
    this.color = options.color;
    this.texture = options.texture;

    this.draw = function(gl) {
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        this.client.drawObject(gl, this.mesh, this.shader, this.color);
    };

    this.drawDepthOnly = function(gl) {
        this.client.drawObject(gl, this.mesh, this.client.shadowMapCreateShader);
    };
}
