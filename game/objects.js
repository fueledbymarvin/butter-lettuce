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
    this.sphere = new Sphere(10, 10);
    this.texturedSphere = new TexturedSphere(10, 10);

    var bbox = this.game.race.bbox;
    var quad = [bbox[0], bbox[1] - 0.01, bbox[2], bbox[3], bbox[1] - 0.01, bbox[2], bbox[3], bbox[1] - 0.01, bbox[5], bbox[0], bbox[1] - 0.01, bbox[5]];
    var text_coords = [-10, -10, 10, -10, 10, 10, -10, 10];
    this.texturedQuad = new TexturedQuadrilateral(quad, text_coords);

    this.objects = [];

    this.ground = new Body({
        graph: new Node({
            primitives: [
                new Primitive({
                    mesh: this.texturedQuad,
                    shader: this.textureShadowShader,
                    texture: this.texture_ground
                })
            ]
        })
    });
    this.objects.push(this.ground);

    this.catbug = new Catbug({
        transformations: [SglMat4.translation([0, 2, 0])]
    });
    this.catbug.body.animate("fly", true);
    this.objects.push(this.catbug);

    this.hills = new Array(8);
    for (var i = 0; i < this.hills.length; i++) {
        this.hills[i] = new Hill({
            transformations: [SglMat4.translation([Math.random()*200-100, 0, Math.random()*200-100])]
        });
    }
    this.objects = this.objects.concat(this.hills);

    this.floaters = new Array(8);
    for (var i = 0; i < this.floaters.length; i++) {
        var scale = 0.3+Math.random();
        this.floaters[i] = new Floater({
            transformations: [SglMat4.scaling([scale, scale, scale]), SglMat4.translation([Math.random()*200-100, 1+Math.random()*4, Math.random()*200-100])]
        });
        this.floaters[i].body.animate("spin", true);
    }
    this.objects = this.objects.concat(this.floaters);

    this.spinners = new Array(8);
    for (var i = 0; i < this.spinners.length; i++) {
        var scale = 0.3+Math.random();
        this.spinners[i] = new Spinner({
            transformations: [SglMat4.scaling([scale, scale, scale]), SglMat4.translation([Math.random()*200-100, 0, Math.random()*200-100])]
        });
        this.spinners[i].body.animate("spin", true);
    }
    this.objects = this.objects.concat(this.spinners);
};

NVMCClient.createBuffers = function (gl) {
    this.createObjectBuffers(gl, this.cube, false, false, false);

    ComputeNormals(this.cylinder);
    this.createObjectBuffers(gl, this.cylinder, false, true, false);
    
    ComputeNormals(this.cone);
    this.createObjectBuffers(gl, this.cone, false, true, false);

    ComputeNormals(this.sphere);
    this.createObjectBuffers(gl, this.sphere, false, true, false);

    ComputeNormals(this.texturedSphere);
    this.createObjectBuffers(gl, this.texturedSphere, false, true, true);
    
    this.createObjectBuffers(gl, this.texturedQuad, false, false, true);
};

NVMCClient.initializeObjects = function (gl) {
    this.createObjects();
    this.createBuffers(gl);
};

