/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

// var animation = {
//     frames: [
//         {
//             root: {
//                 translation: [translation],
//                 rotation: []
//             },
//             joints: {
//                 name: [euler angles]
//             }
//         }
//     ],
//     sequence: [[frame, duration]]
// };

NVMCClient.createTree = function(options) {

    options.graph = new Node({
        name: "trunk",
        primitives: [
            new Primitive({
                mesh: this.cylinder,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.6, 0.23, 0.12, 1.0],
                transformations: [SglMat4.scaling([0.25, 0.4, 0.25])]
            })
        ],
        joints: [
            new Joint({
                name: "branch",
                child: new Node({
                    name: "top",
                    transformations: [
                        SglMat4.rotationAngleAxis(Math.PI/6, [0, 0, 1]),
                        SglMat4.translation([0, 0.8, 0])
                    ],
                    primitives: [
                        new Primitive({
                            mesh: this.cone,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.2, 0.8, 0.1, 1.0],
                            transformations: [SglMat4.scaling([0.6, 1.65, 0.6])]
                        })
                    ]
                })
            })
        ]
    });

    options.animations = {
        test: {
            frames: [
                { // 0
                    root: {
                        translation: [0, 1, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        branch: [0, 0, 0]
                    }
                },
                { // 1
                    root: {
                        translation: [0, 2, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        branch: [0, 1/2*Math.PI, 0]
                    }
                },
                { // 2
                    root: {
                        translation: [0, 1, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        branch: [0, Math.PI, 0]
                    }
                },
                { // 3
                    root: {
                        translation: [0, 0, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        branch: [0, 3/2*Math.PI, 0]
                    }
                },
                { // 4
                    root: {
                        translation: [0, 1, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        branch: [0, 2*Math.PI, 0]
                    }
                }
            ],
            sequence: [
                [0, 1000],
                [1, 1000],
                [2, 1000],
                [3, 1000],
                [4, 0]
            ]
        }
    };
    return new Body(options);
};

function Body(options) {
    this.client = NVMCClient;

    this.graph = options.graph;
    this.transformation = options.transformations ?
        combineTransformations(options.transformations) : SglMat4.identity();

    this.translation = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.animations = options.animations ? options.animations : [];
    this.animations.transition = {
        frames: [{}, {}],
        sequence: [[0, 100], [1, 100]]
    };
    this.animations.reset = {
        frames: [{}, {}],
        sequence: [[0, 100], [1, 100]]
    };
    this.currentAnimation = options.currentAnimation ? options.currentAnimation : null;
    this.currentFrame = 0;
    this.lastTime = 0;
    this.loop = false;
    this.callback = null;

    this.animate = function(animation, loop, transition, callback, context) {
        // if (transition) {
        //     this.animations.transition.frames[0] = this.getCurrentFrame();
        //     var frameNum = this.animations[animation].sequence[0][0];
        //     this.animations.transition.frames[1] = this.animations[animation].frames[frameNum];
        //     this.animate("transition", false, false,
        //                  function() {
        //                      this.animate(animation, loop, false, callback, context);
        //                  }, this);
        // } else {
        this.currentAnimation = animation;
        this.loop = loop;
        this.lastTime = new Date().getTime();
        if (callback) {
            this.callback = callback.bind(context);
        }
        // }
    };
    
    this.stopAnimation = function() {
        this.currentAnimation = null;
        // this.animations.reset.frames[0] = this.getCurrentFrame();
        // var resetJoints = {};
        // for (var joint in this.animations.reset.frames[0].joints) {
        //     resetJoints[joint] = [0, 0, 0];
        // }
        // this.animations.reset.frames[1] = {
        //     root: {
        //         translation: [0, 0, 0],
        //         rotation: [0, 0, 0]
        //     },
        //     joints: resetJoints
        // };
        // this.animate("reset", false, false);
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
            // if (this.currentFrame == nFrames - 1 && !this.loop) {
            //     this.callback();
            //     this.stopAnimation();
            // }
        }
    };

    this.getCurrentFrame = function() {
        var frame = {
            root: {
                translation: this.translation,
                rotation: this.rotation
            },
            joints: {}
        };

        var toVisit = [this.graph];
        while (toVisit.length > 0) {
            var visiting = toVisit.pop();
            for (var i = 0; i < visiting.joints.length; i++) {
                var joint = visiting.joints[i];
                frame.joints[joint.name] = joint.rotation;
                toVisit.push(joint.child);
            }
        }
        return frame;
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
            for (var i = 0; i < visiting.joints.length; i++) {
                var joint = visiting.joints[i];
                joint.rotation = slerp(u, fStart.joints[joint.name], fEnd.joints[joint.name]);
                toVisit.push(joint.child);
            }
        }
    };

    this.draw = function(gl, depthOnly) {
        if (this.currentAnimation && depthOnly) {
            this.checkAnimation();
            this.processAnimation();
        }

        var stack = this.client.stack;
        stack.push();
        if (!depthOnly) {
            stack.loadIdentity();
        }
        stack.multiply(this.transformation);
        stack.multiply(SglMat4.translation(this.translation));
        stack.multiply(eulerToRot(this.rotation));

        this.graph.draw(gl, depthOnly);

        stack.pop();
    };
}

function Node(options) {
    this.client = NVMCClient;

    this.name = options.name;
    this.primitives = options.primitives ? options.primitives : [];
    this.joints = options.joints ? options.joints : [];
    this.transformation = options.transformations ?
        combineTransformations(options.transformations) : SglMat4.identity();

    this.draw = function(gl, depthOnly) {
        var stack = this.client.stack;
        stack.push();
        stack.multiply(this.transformation);

        for (var i = 0; i < this.joints.length; i++) {
            this.joints[i].draw(gl, depthOnly);
        }

        for (var i = 0; i < this.primitives.length; i++) {
            this.primitives[i].draw(gl, depthOnly);
        }

        stack.pop();
    };
}

function Joint(options) {
    this.client = NVMCClient;

    this.name = options.name;
    this.rotation = [0, 0, 0];
    // heading/yaw (around y-axis)
    // attitude/pitch (around x-axis)
    // bank/roll (around z-axis)

    this.child = options.child;

    this.draw = function(gl, depthOnly) {
        var stack = this.client.stack;
        stack.push();
        stack.multiply(eulerToRot(this.rotation));

        this.child.draw(gl, depthOnly);
        stack.pop();
    };
}

function Primitive(options) {
    this.client = NVMCClient;

    this.mesh = options.mesh;
    this.shader = options.shader;
    this.color = options.color;
    this.texture = options.texture;
    this.transformation = options.transformations ?
        combineTransformations(options.transformations) : SglMat4.identity();

    this.draw = function(gl, depthOnly) {
        var shader = depthOnly ? this.client.shadowMapCreateShader : this.shader;
        gl.useProgram(shader);

        var stack = this.client.stack;
        stack.push();
        stack.multiply(this.transformation);

        if (depthOnly) {
            gl.uniformMatrix4fv(shader.uShadowMatrixLocation, false, stack.matrix);
        } else {
            gl.uniformMatrix4fv(shader.uModelMatrixLocation, false, stack.matrix);
            var InvT = SglMat4.transpose(
                SglMat4.inverse(
                    SglMat4.mul(this.client.viewMatrix, stack.matrix)
                )
            );
            gl.uniformMatrix3fv(shader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
        }

        if (!depthOnly && this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        this.client.drawObject(gl, this.mesh, shader, this.color);
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
    return combineTransformations([rotY, rotX, rotZ]);
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
        heading = Math.atan2(2*y*w - 2*x*z, 1 - 2*y*y - 2*z*z); // Heading
        attitude = Math.asin(2*test); // attitude
        bank = Math.atan2(2*x*w - 2*y*z, 1 - 2*x*x - 2*z*z); // bank
    }

    return [attitude, heading, bank];
}
