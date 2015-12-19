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
        vertices[i] = [obj.vertices[i*3], obj.vertices[i*3+1], obj.vertices[i*3+2], 1];
    }
    var triangles = new Array(obj.numTriangles);
    for (var i = 0; i < obj.numTriangles; ++i) {
        triangles[i] = [obj.triangleIndices[i*3], obj.triangleIndices[i*3+1], obj.triangleIndices[i*3+2]];
    }
    obj.vertices = vertices;
    obj.triangles = triangles;
    obj.aabb = this.findAABB(vertices);
    obj.aabbVertices = this.findAABBVertices(obj.aabb);
};

NVMCClient.buildBVH = function(vertices, triangles, depth) {
    if (depth < 0 || triangles.length <= 1) { return null; }

    // find min and max points of aabb
    var firstV = vertices[triangles[0][0]];
    var min = [firstV[0], firstV[1], firstV[2]];
    var max = [firstV[0], firstV[1], firstV[2]];
    for (var i = 0; i < triangles.length; i++) {
        var vs = [
            vertices[triangles[i][0]],
            vertices[triangles[i][1]],
            vertices[triangles[i][2]],
        ];
        
        for (var j = 0; j < vs.length; j++) {
            this.updateMinMax(vs[j], min, max);
        }
    }

    // find split
    var diff = [max[0]-min[0], max[1]-min[1], max[2]-min[2]];
    var axis;
    if (diff[0] > diff[1] && diff[0] > diff[2]) {
        axis = 0;
    } else if (diff[1] > diff[2]) {
        axis = 1;
    } else {
        axis = 2;
    }
    var split = (min[axis]+max[axis])/2;

    // split triangles
    var left = [];
    var right = [];
    for (var i = 0; i < triangles.length; i++) {
        var vs = [
            vertices[triangles[i][0]],
            vertices[triangles[i][1]],
            vertices[triangles[i][2]],
        ];
        
        var nRight = 0;
        for (var j = 0; j < vs.length; j++) {
            if (vs[j][axis] > split) {
                nRight++;
            }
        }
        if (nRight <= 1) {
            left.push(triangles[i]);
        } else {
            right.push(triangles[i]);
        }
    }

    return {
        min: min,
        max: max,
        left: this.buildBVH(vertices, left, depth-1),
        right: this.buildBVH(vertices, right, depth-1)
    };
};

NVMCClient.updateMinMax = function(vertex, min, max) {

    if (vertex[0] < min[0]) {
        min[0] = vertex[0];
    } else if (vertex[0] > max[0]) {
        max[0] = vertex[0];
    }
    if (vertex[1] < min[1]) {
        min[1] = vertex[1];
    } else if (vertex[1] > max[1]) {
        max[1] = vertex[1];
    }
    if (vertex[2] < min[2]) {
        min[2] = vertex[2];
    } else if (vertex[2] > max[2]) {
        max[2] = vertex[2];
    }
};

NVMCClient.findAABB = function(vertices) {

    var min = [vertices[0][0], vertices[0][1], vertices[0][2]];
    var max = [vertices[0][0], vertices[0][1], vertices[0][2]];
    for (var i = 1; i < vertices.length; i++) {
        this.updateMinMax(vertices[i], min, max);
    }
    return {min: min, max: max};
};

NVMCClient.findAABBVertices = function(aabb) {

    var vertices = new Array(8);
    vertices[0] = [aabb.min[0], aabb.min[1], aabb.min[2], 1];
    vertices[1] = [aabb.min[0], aabb.min[1], aabb.max[2], 1];
    vertices[2] = [aabb.min[0], aabb.max[1], aabb.min[2], 1];
    vertices[3] = [aabb.min[0], aabb.max[1], aabb.max[2], 1];
    vertices[4] = [aabb.max[0], aabb.min[1], aabb.min[2], 1];
    vertices[5] = [aabb.max[0], aabb.min[1], aabb.max[2], 1];
    vertices[6] = [aabb.max[0], aabb.max[1], aabb.min[2], 1];
    vertices[7] = [aabb.max[0], aabb.max[1], aabb.max[2], 1];
    return vertices;
};

NVMCClient.createObjects = function () {
    this.cube = new Cube(16);
    this.cylinder = new Cylinder(16);
    this.cone = new Cone(16);
    this.sphere = new Sphere(16, 16);
    this.texturedSphere = new TexturedSphere(16, 16);

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

    // this.floaters = new Array(8);
    // for (var i = 0; i < this.floaters.length; i++) {
    //     var scale = 0.3+Math.random();
    //     this.floaters[i] = new Floater({
    //         transformations: [SglMat4.scaling([scale, scale, scale]), SglMat4.translation([Math.random()*200-100, 1+Math.random()*4, Math.random()*200-100])]
    //     });
    //     this.floaters[i].body.animate("spin", true);
    // }
    // this.drawables = this.drawables.concat(this.floaters);
    // this.shadowables = this.shadowables.concat(this.floaters);
    // this.collideables = this.collideables.concat(this.floaters);

    // this.spinners = new Array(8);
    // for (var i = 0; i < this.spinners.length; i++) {
    //     var scale = 0.3+Math.random();
    //     this.spinners[i] = new Spinner({
    //         transformations: [SglMat4.scaling([scale, scale, scale]), SglMat4.translation([Math.random()*200-100, 0, Math.random()*200-100])]
    //     });
    //     this.spinners[i].body.animate("spin", true);
    // }
    // this.drawables = this.drawables.concat(this.spinners);
    // this.shadowables = this.shadowables.concat(this.spinners);
    // this.collideables = this.collideables.concat(this.spinners);
};

NVMCClient.initializeObjects = function (gl) {
    this.createObjects();
    this.createBuffers(gl);
    this.createEntities();
};

