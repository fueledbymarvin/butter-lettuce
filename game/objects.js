// Global NVMC Client
// ID 6.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

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

NVMCClient.createObjects = function () {
    this.cube = new Cube(this.lod);
    this.cylinder = new Cylinder(this.lod);
    this.cone = new Cone(this.lod);
    this.sphere = new Sphere(this.lod);

    var bbox = this.bbox;
    var quad = [bbox[0], bbox[1] - 0.01, bbox[2], bbox[3], bbox[1] - 0.01, bbox[2], bbox[3], bbox[1] - 0.01, bbox[5], bbox[0], bbox[1] - 0.01, bbox[5]];
    var textCoords = [-10, -10, 10, -10, 10, 10, -10, 10];
    this.texturedQuad = new TexturedQuadrilateral(quad, textCoords);

    var quadGeo = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
    var tex = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
    this.billboardQuad = new TexturedQuadrilateral(quadGeo, tex);
};

NVMCClient.createBuffers = function (gl) {
    this.createObjectBuffers(gl, this.cube, false, false, false);

    ComputeNormals(this.cylinder);
    this.createObjectBuffers(gl, this.cylinder, false, true, false);
    
    ComputeNormals(this.cone);
    this.createObjectBuffers(gl, this.cone, false, true, false);

    ComputeNormals(this.sphere);
    this.createObjectBuffers(gl, this.sphere, false, true, true);

    this.createObjectBuffers(gl, this.texturedQuad, false, false, true);
    this.createObjectBuffers(gl, this.billboardQuad, false, false, true);
};

NVMCClient.createEntities = function() {
    this.drawables = [];
    this.shadowables = [];
    this.colliders = [];
    this.collideables = [];
    this.billboards = [];

    this.player = new Player();
    this.drawables.push(this.player);
    this.shadowables.push(this.player);
    this.colliders.push(this.player);
    this.player.update();
    
    this.ground = new Body({
        graph: new Node({
            primitives: [
                new Primitive({
                    mesh: this.texturedQuad,
                    shader: this.textureShadowShader,
                    texture: this.texture_ground,
                    phong: [0.8, 0.2, 0, 0]
                })
            ]
        })
    });
    this.drawables.push(this.ground);

    this.hills = new Array(20);
    for (var i = 0; i < this.hills.length; i++) {
        var hill = new Hill({});

        var foundCollision = true;
        while (foundCollision) {
            hill.body.transformation = SglMat4.translation(this.getRandomPoint(0));
            hill.update();
            foundCollision = this.checkInitCollision(hill);
        }
        this.hills[i] = hill;
        this.collideables.push(hill);
    }
    this.drawables = this.drawables.concat(this.hills);
    this.shadowables = this.shadowables.concat(this.hills);

    this.trees = new Array(10);
    for (var i = 0; i < this.trees.length; i++) {
        var tree = new Tree({});

        var foundCollision = true;
        while (foundCollision) {
            var size = Math.random()+0.8;
            tree.body.transformation = SglMat4.mul(
                SglMat4.translation(this.getRandomPoint(Math.random())),
                SglMat4.scaling([size, Math.random()+0.8, size])
            );
            tree.update();
            foundCollision = this.checkInitCollision(tree);
        }
        this.trees[i] = tree;
        this.collideables.push(tree);
    }
    this.drawables = this.drawables.concat(this.trees);
    this.shadowables = this.shadowables.concat(this.trees);

    this.catbugs = new Array(this.nLettuce);
    for (var i = 0; i < this.catbugs.length; i++) {
        var catbug = new Catbug({});

        var foundCollision = true;
        while (foundCollision) {
            catbug.translation = this.getRandomPoint(3);
            catbug.initSpline();
            catbug.update();
            foundCollision = this.checkInitCollision(catbug);
        }
        this.catbugs[i] = catbug;
        this.colliders.push(catbug);
    }
    this.drawables = this.drawables.concat(this.catbugs);
    this.shadowables = this.shadowables.concat(this.catbugs);

    var spacing = 0.15;
    var scale = 0.07;
    this.lettuces = new Array(this.nLettuce);
    for (var i = 0; i < this.catbugs.length; i++) {
        this.lettuces[i] = new Body({
            graph: new Node({
                primitives: [
                    new Primitive({
                        mesh: this.billboardQuad,
                        shader: this.onScreenBillboardShader,
                        texture: this.lettuceAltTexture,
                        translation: [(i-this.nLettuce/2)*spacing + spacing/2, -0.75, 0],
                        scaling: [scale, scale*3/2, 1]
                    })
                ]
            })
        });
    }
    this.billboards = this.billboards.concat(this.lettuces);
};

NVMCClient.initializeObjects = function (gl) {
    this.createObjects();
    this.createBuffers(gl);
    this.createEntities();
};

NVMCClient.getRandomPoint = function(y) {
    
    var size = 180;
    return [Math.random()*size - size/2, y, Math.random()*size - size/2];
};

