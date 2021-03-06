/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Body(options) {
    this.client = NVMCClient;

    this.graph = options.graph;
    this.transformation = options.transformations ?
        combineTransformations(options.transformations) : SglMat4.identity();
    this.aabb = null;

    /*** ANIMATION ***/

    this.translation = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.animations = options.animations ? options.animations : {};
    this.currentAnimation = options.currentAnimation ? options.currentAnimation : null;
    this.currentFrame = 0;
    this.lastTime = 0;
    this.loop = false;
    this.callback = null;

    this.animate = function(animation, loop, transition, callback, context) {
        this.currentAnimation = animation;
        this.loop = loop;
        this.lastTime = new Date().getTime();
        if (callback) {
            this.callback = callback.bind(context);
        }
    };
    
    this.stopAnimation = function() {
        this.currentAnimation = null;
    };
    
    this.checkAnimation = function() {
        var animation = this.animations[this.currentAnimation];

        var frameDuration = animation.sequence[this.currentFrame];
        var duration = frameDuration[1];
        var time = new Date().getTime();
        if (time - this.lastTime >= duration) {
            this.lastTime = time;
            var nFrames = animation.sequence.length;
            this.currentFrame = (this.currentFrame + 1) % nFrames;
        }
    };

    this.processAnimation = function() {

        var animation = this.animations[this.currentAnimation];
        var nFrames = animation.sequence.length;
        var fdStart = animation.sequence[this.currentFrame];
        var fStartIndex = fdStart[0];
        var fdEnd = animation.sequence[(this.currentFrame+1)%nFrames];
        var fEndIndex = fdEnd[0];
        var time = new Date().getTime();

        var fStart = animation.frames[fStartIndex];
        var fEnd = animation.frames[fEndIndex];
        var duration = fdStart[1];
        var u = (time - this.lastTime) / duration;
        this.translation = linearInterpolation(u, fStart.root.translation, fEnd.root.translation);
        this.rotation = slerp(u, fStart.root.rotation, fEnd.root.rotation);

        var toVisit = [this.graph];
        while (toVisit.length > 0) {
            var visiting = toVisit.pop();
            for (var j in visiting.joints) {
                var joint = visiting.joints[j];
                joint.rotation = slerp(u, fStart.joints[j], fEnd.joints[j]);
                toVisit.push(joint.child);
            }
        }
    };

    /*** Drawing and Collisions ***/

    this.wrap = function(f, gl, depthOnly) {
        var stack = this.client.stack;
        stack.push();
        if (!depthOnly) {
            stack.loadIdentity();
        }

        stack.multiply(this.transformation);
        stack.multiply(SglMat4.translation(this.translation));
        stack.multiply(eulerToRot(this.rotation));

        f(gl, depthOnly);
        stack.pop();
    };

    this.update = function() {
        this.wrap((function() {
            if (this.currentAnimation) {
                this.checkAnimation();
                this.processAnimation();
            }
            this.graph.update();

            var vertices = [];
            var toVisit = [this.graph];
            while (toVisit.length > 0) {
                var visiting = toVisit.pop();
                for (var i = 0; i < visiting.primitives.length; i++) {
                    vertices = vertices.concat(visiting.primitives[i].aabbVertices);
                }
                for (var j in visiting.joints) {
                    toVisit.push(visiting.joints[j].child);
                }
            }
            this.aabb = this.client.findAABB(vertices);
        }).bind(this));
    };

    this.draw = function(gl, depthOnly) {
        this.wrap((function(gl, depthOnly) {
            this.graph.draw(gl, depthOnly);
        }).bind(this), gl, depthOnly);
    };

    this.getPrimitives = function() {

        var primitives = [];
        var toVisit = [this.graph];
        while (toVisit.length > 0) {
            var visiting = toVisit.pop();
            for (var i = 0; i < visiting.primitives.length; i++) {
                primitives.push(visiting.primitives[i]);
            }
            for (var j in visiting.joints) {
                toVisit.push(visiting.joints[j].child);
            }
        }
        return primitives;
    };
}

function Node(options) {
    this.client = NVMCClient;

    this.name = options.name;
    this.primitives = options.primitives ? options.primitives : [];
    this.joints = options.joints ? options.joints : {};
    this.scaling = options.scaling ? options.scaling : [1, 1, 1];
    this.rotation = options.rotation ? options.rotation : [0, 0, 0];
    this.translation = options.translation ? options.translation : [0, 0, 0];
    this.flipOrder = options.flipOrder;

    this.wrap = function(f, gl, depthOnly) {
        var stack = this.client.stack;
        stack.push();
        stack.multiply(SglMat4.translation(this.translation));
        stack.multiply(eulerToRot(this.rotation));
        stack.multiply(SglMat4.scaling(this.scaling));

        f(gl, depthOnly);
        stack.pop();
    };

    this.update = function() {
        this.wrap((function() {
            for (var joint in this.joints) {
                this.joints[joint].update();
            }

            for (var i = 0; i < this.primitives.length; i++) {
                this.primitives[i].update();
            }
        }).bind(this));
    };

    this.draw = function(gl, depthOnly) {
        this.wrap((function(gl, depthOnly) {
            for (var joint in this.joints) {
                this.joints[joint].draw(gl, depthOnly);
            }

            for (var i = 0; i < this.primitives.length; i++) {
                this.primitives[i].draw(gl, depthOnly);
            }
        }).bind(this), gl, depthOnly);
    };
}

function Joint(options) {
    this.client = NVMCClient;

    this.name = options.name;
    this.rotation = [0, 0, 0];
    this.translation = options.translation ? options.translation : [0, 0, 0];
    // heading/yaw (around y-axis)
    // attitude/pitch (around x-axis)
    // bank/roll (around z-axis)
    this.marker = new Primitive({
        mesh: this.client.sphere,
        shader: this.client.phongSingleColorShadowShader,
        color: [1, 1, 1, 1],
        scaling: [0.1, 0.1, 0.1]
    });
    this.child = options.child;

    this.wrap = function(f, gl, depthOnly) {
        var stack = this.client.stack;
        stack.push();
        stack.multiply(SglMat4.translation(this.translation));
        stack.multiply(eulerToRot(this.rotation));

        f(gl, depthOnly);
        stack.pop();
    };

    this.update = function() {
        this.wrap((function() {
            this.child.update();
        }).bind(this));
    };

    this.draw = function(gl, depthOnly) {
        this.wrap((function(gl, depthOnly) {
            // this.marker.draw(gl, depthOnly);
            this.child.draw(gl, depthOnly);
        }).bind(this), gl, depthOnly);
    };
}

function Primitive(options) {
    this.client = NVMCClient;

    this.mesh = options.mesh;
    this.shader = options.shader;
    this.color = options.color;
    this.texture = options.texture;
    this.phong = options.phong ? options.phong : [0.2, 0.8, 0.2, 1];
    this.scaling = options.scaling ? options.scaling : [1, 1, 1];
    this.rotation = options.rotation ? options.rotation : [0, 0, 0];
    this.translation = options.translation ? options.translation : [0, 0, 0];

    this.mat = null;
    this.aabb = null;
    this.bvh = null;

    this.wrap = function(f, gl, depthOnly) {
        var stack = this.client.stack;
        stack.push();
        stack.multiply(SglMat4.translation(this.translation));
        stack.multiply(eulerToRot(this.rotation));
        stack.multiply(SglMat4.scaling(this.scaling));

        f(gl, depthOnly);
        stack.pop();
    };

    this.update = function() {
        this.wrap((function() {
            this.bvh = null;
            this.mat = this.client.stack.matrix;
            
            var transformed = new Array(this.mesh.aabbVertices.length);
            for (var i = 0; i < transformed.length; i++) {
                transformed[i] = SglMat4.mul4(this.mat, this.mesh.aabbVertices[i]);
            }
            this.aabb = this.client.findAABB(transformed);
            this.aabbVertices = this.client.findAABBVertices(this.aabb);
        }).bind(this));
    };
    
    this.updateBVH = function() {

        var transformed = new Array(this.mesh.vertices.length);
        for (var i = 0; i < transformed.length; i++) {
            transformed[i] = SglMat4.mul4(this.mat, this.mesh.vertices[i]);
        }
        this.bvh = this.client.buildBVH(transformed, this.mesh.triangles);
    };

    this.draw = function(gl, depthOnly) {
        this.wrap((function(gl, depthOnly) {
            var stack = this.client.stack;

            var shader = depthOnly ? this.client.shadowMapCreateShader : this.shader;
            gl.useProgram(shader);

            if (depthOnly) {
                gl.uniformMatrix4fv(shader.uShadowMatrixLocation, false, stack.matrix);
            } else {
                gl.uniform1f(shader.uKaLocation, this.phong[0]);
                gl.uniform1f(shader.uKdLocation, this.phong[1]);
                gl.uniform1f(shader.uKsLocation, this.phong[2]);
                gl.uniform1f(shader.uShininessLocation, this.phong[3]);

                if (this.client.aabbs && this.mesh != this.client.texturedQuad) {
                    this.drawBVH(gl);
                }
                if (this.texture) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                }

                gl.uniformMatrix4fv(shader.uModelMatrixLocation, false, stack.matrix);
                var InvT = SglMat4.inverse(SglMat4.mul(this.client.viewMatrix, stack.matrix));
                InvT = SglMat4.transpose(InvT);
                gl.uniformMatrix3fv(shader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
            }

            this.client.drawObject(gl, this.mesh, shader, this.color);
        }).bind(this), gl, depthOnly);
    };

    this.drawBVH = function(gl) {
        if (this.bvh) {
            var toVisit = [this.bvh];
            while (toVisit.length > 0) {
                var visiting = toVisit.pop();
                if (visiting.left == null && visiting.right == null) {
                    this.drawAABB(gl, visiting);
                }
                if (visiting.left) {
                    toVisit.push(visiting.left);
                }
                if (visiting.right) {
                    toVisit.push(visiting.right);
                }
            }
        }
    };

    this.drawAABB = function(gl, aabb) {

        var translation = [
            (aabb.max[0]+aabb.min[0])/2,
            (aabb.max[1]+aabb.min[1])/2,
            (aabb.max[2]+aabb.min[2])/2
        ];
        var scaling = [
            (aabb.max[0]-aabb.min[0])/2,
            (aabb.max[1]-aabb.min[1])/2,
            (aabb.max[2]-aabb.min[2])/2
        ];
        var shader = this.client.phongSingleColorShadowShader;

        var stack = this.client.stack;
        stack.push();
        stack.loadIdentity();
        stack.multiply(SglMat4.translation(translation));
        stack.multiply(SglMat4.scaling(scaling));
        gl.useProgram(shader);
        gl.uniformMatrix4fv(shader.uModelMatrixLocation, false, stack.matrix);
        var InvT = SglMat4.inverse(SglMat4.mul(this.client.viewMatrix, stack.matrix));
        InvT = SglMat4.transpose(InvT);
        gl.uniformMatrix3fv(shader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
        this.client.drawObject(gl, this.client.cube, shader, [1, 1, 1, 1]);
        gl.useProgram(this.shader);
        stack.pop();
    };
}

function combineTransformations(transformations) {

    var res = SglMat4.identity();
    for (var i = 0; i < transformations.length; i++) {
        res = SglMat4.mul(transformations[i], res);
    }
    return res;
}

function eulerToRot(rot) {

    var rotY = SglMat4.rotationAngleAxis(rot[1], [0, 1, 0]);
    var rotX = SglMat4.rotationAngleAxis(rot[0], [1, 0, 0]);
    var rotZ = SglMat4.rotationAngleAxis(rot[2], [0, 0, 1]);
    return combineTransformations([rotZ, rotX, rotY]);
}

function linearInterpolation(u, start, end) {

    var res = new Array(start.length);
    for (var i = 0; i < start.length; i++) {
        res[i] = start[i]*(1-u) + end[i]*(u);
    }
    return res;
}

function slerp(u, start, end) {
    var qa = eulerToQuaternion(start);
    var qax = qa[0];
    var qay = qa[1];
    var qaz = qa[2];
    var qaw = qa[3];

    var qb = eulerToQuaternion(end);
    var qbx = qb[0];
    var qby = qb[1];
    var qbz = qb[2];
    var qbw = qb[3];

    // Calculate angle between them.
    var cosTheta = qax * qbx + qay * qby + qaz * qbz + qaw * qbw;
    // if qa=qb or qa=-qb then theta = 0 and we can return qa
    if (Math.abs(cosTheta) >= 1.0){
	return start;
    }
    // Calculate temporary values.
    var theta = Math.acos(cosTheta);
    var sinTheta = Math.sqrt(1.0 - cosTheta*cosTheta);
    // if theta = 180 degrees then result is not fully defined
    // we could rotate around any axis normal to qa or qb
    var x, y, z, w;
    if (Math.abs(sinTheta) < 0.001) {
        // what to do here???
	x = qax * (1-u) + qbx * u;
	y = qay * (1-u) + qby * u;
	z = qaz * (1-u) + qbz * u;
	w = qaw * (1-u) + qbw * u;
    } else {
        var ratioA = Math.sin((1 - u) * theta) / sinTheta;
        var ratioB = Math.sin(u * theta) / sinTheta; 
        // calculate Quaternion.
        w = qaw * ratioA + qbw * ratioB;
        x = qax * ratioA + qbx * ratioB;
        y = qay * ratioA + qby * ratioB;
        z = qaz * ratioA + qbz * ratioB;
    }
    return quaternionToEuler([x, y, z, w]);
}

function eulerToQuaternion(euler) {

    var attitude = euler[0];
    var heading = euler[1];
    var bank = euler[2];
    var c1 = Math.cos( heading / 2 );
    var c2 = Math.cos( attitude / 2 );
    var c3 = Math.cos( bank / 2 );
    var s1 = Math.sin( heading / 2 );
    var s2 = Math.sin( attitude / 2 );
    var s3 = Math.sin( bank / 2 );
 
    var x = s1 * s2 * c3 + c1 * c2 * s3;
    var y = s1 * c2 * c3 + c1 * s2 * s3;
    var z = c1 * s2 * c3 - s1 * c2 * s3;
    var w = c1 * c2 * c3 - s1 * s2 * s3;
 
    return [x, y, z, w];
}

function quaternionToEuler(quaternion) {
    var x = quaternion[0];
    var y = quaternion[1];
    var z = quaternion[2];
    var w = quaternion[3];

    var heading, attitude, bank;
    var test = x*y + z*w;
    if (test > 0.499) { // singularity at north pole
        heading = 2 * Math.atan2(x,w);
        attitude = Math.PI/2;
        bank = 0;
    } else if (test < -0.499) { // singularity at south pole
        heading = -2 * Math.atan2(x,w);
        attitude = -Math.PI/2;
        bank = 0;
    } else {
        heading = Math.atan2(2*y*w - 2*x*z, 1 - 2*y*y - 2*z*z); // heading
        attitude = Math.asin(2*test); // attitude
        bank = Math.atan2(2*x*w - 2*y*z, 1 - 2*x*x - 2*z*z); // bank
    }

    return [attitude, heading, bank];
}

