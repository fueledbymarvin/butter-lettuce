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

    var vertices = new Array(obj.numVertices);
    for (var i = 0; i < obj.numVertices; i++) {
        vertices[i] = [obj.vertices[i*3], obj.vertices[i*3+1], obj.vertices[i*3+2]];
    }
    obj.aabb = this.findAABB(vertices);
    obj.aabbVertices = new Array(8);
    obj.aabbVertices[0] = [obj.aabb.min[0], obj.aabb.min[1], obj.aabb.min[2], 1];
    obj.aabbVertices[1] = [obj.aabb.min[0], obj.aabb.min[1], obj.aabb.max[2], 1];
    obj.aabbVertices[2] = [obj.aabb.min[0], obj.aabb.max[1], obj.aabb.min[2], 1];
    obj.aabbVertices[3] = [obj.aabb.min[0], obj.aabb.max[1], obj.aabb.max[2], 1];
    obj.aabbVertices[4] = [obj.aabb.max[0], obj.aabb.min[1], obj.aabb.min[2], 1];
    obj.aabbVertices[5] = [obj.aabb.max[0], obj.aabb.min[1], obj.aabb.max[2], 1];
    obj.aabbVertices[6] = [obj.aabb.max[0], obj.aabb.max[1], obj.aabb.min[2], 1];
    obj.aabbVertices[7] = [obj.aabb.max[0], obj.aabb.max[1], obj.aabb.max[2], 1];
};

NVMCClient.findAABB = function(vertices) {
    var min = [vertices[0][0], vertices[0][1], vertices[0][2]];
    var max = [vertices[0][0], vertices[0][1], vertices[0][2]];
    for (var i = 1; i < vertices.length; i++) {
        if (vertices[i][0] < min[0]) {
            min[0] = vertices[i][0];
        } else if (vertices[i][0] > max[0]) {
            max[0] = vertices[i][0];
        }
        if (vertices[i][1] < min[1]) {
            min[1] = vertices[i][1];
        } else if (vertices[i][1] > max[1]) {
            max[1] = vertices[i][1];
        }
        if (vertices[i][2] < min[2]) {
            min[2] = vertices[i][2];
        } else if (vertices[i][2] > max[2]) {
            max[2] = vertices[i][2];
        }
    }
    return {min: min, max: max};
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

NVMCClient.createEntities = function() {
    this.drawables = [];
    this.shadowables = [];
    this.colliders = [];
    this.collideables = [];

    this.player = new Player();
    this.drawables.push(this.player);
    this.shadowables.push(this.player);
    this.colliders.push(this.player);
    
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
    this.drawables.push(this.ground);

    this.catbug = new Catbug({
        transformations: [SglMat4.translation([0, 2, 0])]
    });
    this.catbug.body.animate("fly", true);
    this.drawables.push(this.catbug);
    this.shadowables.push(this.catbug);
    this.colliders.push(this.catbug);

    this.hills = new Array(8);
    for (var i = 0; i < this.hills.length; i++) {
        this.hills[i] = new Hill({
            transformations: [SglMat4.translation([Math.random()*200-100, 0, Math.random()*200-100])]
        });
    }
    this.drawables = this.drawables.concat(this.hills);
    this.shadowables = this.shadowables.concat(this.hills);
    this.collideables = this.collideables.concat(this.hills);

    this.floaters = new Array(8);
    for (var i = 0; i < this.floaters.length; i++) {
        var scale = 0.3+Math.random();
        this.floaters[i] = new Floater({
            transformations: [SglMat4.scaling([scale, scale, scale]), SglMat4.translation([Math.random()*200-100, 1+Math.random()*4, Math.random()*200-100])]
        });
        this.floaters[i].body.animate("spin", true);
    }
    this.drawables = this.drawables.concat(this.floaters);
    this.shadowables = this.shadowables.concat(this.floaters);
    this.collideables = this.collideables.concat(this.floaters);

    this.spinners = new Array(8);
    for (var i = 0; i < this.spinners.length; i++) {
        var scale = 0.3+Math.random();
        this.spinners[i] = new Spinner({
            transformations: [SglMat4.scaling([scale, scale, scale]), SglMat4.translation([Math.random()*200-100, 0, Math.random()*200-100])]
        });
        this.spinners[i].body.animate("spin", true);
    }
    this.drawables = this.drawables.concat(this.spinners);
    this.shadowables = this.shadowables.concat(this.spinners);
    this.collideables = this.collideables.concat(this.spinners);
};

NVMCClient.initializeObjects = function (gl) {
    this.createObjects();
    this.createBuffers(gl);
    this.createEntities();
};

