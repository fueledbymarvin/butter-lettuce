/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.buildBVH = function(vertices, triangles) {
    return this.buildBVHHelper(vertices, triangles, this.bvhDepth, null, {id: 0});
};

NVMCClient.buildBVHHelper = function(vertices, triangles, depth, parent, id) {
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

    var aabb = {
        id: id.id++,
        min: min,
        max: max,
        parent: parent
    };
    aabb.left = this.buildBVHHelper(vertices, left, depth-1, aabb, id);
    aabb.right = this.buildBVHHelper(vertices, right, depth-1, aabb, id);
    return aabb;
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

NVMCClient.checkCollision = function(a, b, colliders) {

    if (this.intersectAABBs(a.body.aabb, b.body.aabb)) {
        var toTest = [];
        var aPrims = a.body.getPrimitives();
        var bPrims = b.body.getPrimitives();
        for (var i = 0; i < aPrims.length; i++) {
            if (this.intersectAABBs(aPrims[i].aabb, b.body.aabb)) {
                for (var j = 0; j < bPrims.length; j++) {
                    if (this.intersectAABBs(aPrims[i].aabb, bPrims[j].aabb)) {
                        toTest.push([aPrims[i], bPrims[j]]);
                    }
                }
            }
        }

        for (var i = 0; i < toTest.length; i++) {
            // make world space bvh if not already done
            var aPrim = toTest[i][0];
            var bPrim = toTest[i][1];

            var aCollided = {};
            var bCollided = {};
            var foundCollision = false;

            if (aPrim.bvh == null) {
                aPrim.updateBVH();
            }
            if (bPrim.bvh == null) {
                bPrim.updateBVH();
            }
            var aStack = [aPrim.bvh];
            while (aStack.length > 0) {
                var aAABB = aStack.pop();
                if (this.intersectAABBs(aAABB, bPrim.aabb)) {
                    // if hit a leaf, search through b's bvh
                    if (aAABB.left == null && aAABB.right == null) {
                        var bStack = [bPrim.bvh];
                        while (bStack.length > 0) {
                            var bAABB = bStack.pop();
                            if (this.intersectAABBs(aAABB, bAABB)) {
                                // if bvh at the leaf level, then count as intersection
                                if (bAABB.left == null && bAABB.right == null) {
                                    foundCollision = true;
                                    aCollided[aAABB.id] = aAABB;
                                    bCollided[bAABB.id] = bAABB;
                                }
                                if (bAABB.left) {
                                    bStack.push(bAABB.left);
                                }
                                if (bAABB.right) {
                                    bStack.push(bAABB.right);
                                }
                            }
                        }
                    }
                    if (aAABB.left) {
                        aStack.push(aAABB.left);
                    }
                    if (aAABB.right) {
                        aStack.push(aAABB.right);
                    }
                }
            }

            if (foundCollision) {
                var lcaA = this.lowestCommonAncestor(aCollided);
                var lcaB = this.lowestCommonAncestor(bCollided);
                a.collisions.push([lcaA, lcaB]);
                a.collisionObjects.push(b);
                if (colliders) {
                    b.collisions.push([lcaB, lcaA]);
                    a.collisionObjects.push(a);
                }
            }
        }
    }
};

NVMCClient.intersectAABBs = function(a, b) {
    return a.max[0] > b.min[0] && 
           a.max[1] > b.min[1] &&
           a.max[2] > b.min[2] &&
           a.min[0] < b.max[0] &&
           a.min[1] < b.max[1] &&
           a.min[2] < b.max[2];
};

NVMCClient.lowestCommonAncestor = function(aabbs) {
    
    var lca;
    for (var i in aabbs) {
        if (lca) {
            lca = this.lcaPair(lca, aabbs[i]);
        } else {
            lca = aabbs[i];
        }
    }
    return lca;
};

NVMCClient.lcaPair = function(a, b) {

    var aPath = [];
    var bPath = [];
    while (a) {
        aPath.unshift(a);
        a = a.parent;
    }
    while (b) {
        bPath.unshift(b);
        b = b.parent;
    }
    var i = 0;
    while (i < aPath.length && i < bPath.length && aPath[i] === bPath[i]) {
        i++;
    }
    return aPath[i - 1];
};

NVMCClient.calcSlide = function(collisions) {

    var slide = [0, 0, 0];
    for (var i = 0; i < collisions.length; i++) {
        var a = collisions[i][0];
        var b = collisions[i][1];

        var vectors = new Array(4);
        vectors[0] = [b.min[0] - a.max[0], 0, 0];
        vectors[1] = [0, 0, b.min[2] - a.max[2]];
        vectors[2] = [b.max[0] - a.min[0], 0, 0];
        vectors[3] = [0, 0, b.max[2] - a.min[2]];
        vectors.sort(function(v, w) {
            return SglVec3.length(v) - SglVec3.length(w);
        });

        var newSlide = vectors[0];
        for (var j = 0; j < slide.length; j++) {
            if (Math.abs(newSlide[j]) > Math.abs(slide[j])) {
                slide[j] = newSlide[j];
            }
        }
    }
    return slide;
};

NVMCClient.checkInitCollision = function(obj) {

    obj.collisions = [];
    obj.collisionObjects = [];
    for (var i = 0; i < this.colliders.length; i++) {
        this.checkCollision(obj, this.colliders[i]);
        if (obj.collisions.length > 0) {
            return true;
        }
    }
    for (var i = 0; i < this.collideables.length; i++) {
        this.checkCollision(obj, this.collideables[i]);
        if (obj.collisions.length > 0) {
            return true;
        }
    }
    return false;
};
