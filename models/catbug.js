/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Catbug(options) {
    this.client = NVMCClient;

    this.name = "catbug";

    this.translation = options.translation ? options.translation : [0, 3, 0];
    this.last = this.translation;
    this.rotation = [0, 0, 0];
    this.lastTime = new Date().getTime();
    this.dist = this.client.movementSpeed + this.client.difficulty;
    this.period = 1000;
    this.angle = Math.PI/2;

    this.initSpline = function() {

        var p0 = getRandomPoint(this.translation, [0, 0, 1], Math.PI, this.dist);
        var p1 = this.translation;
        var p2 = getRandomPoint(p1, SglVec3.sub(p1, p0), this.angle, this.dist);
        var p3 = getRandomPoint(p2, SglVec3.sub(p2, p1), this.angle, this.dist);
        this.spline = [p0, p1, p2, p3];
    };
    this.initSpline();

    this.update = function() {

        if (this.hasLettuce) {
            var time = new Date().getTime();
            var t = (time - this.lastTime)/this.period;
            if (t > 1) {
                t -= 1;
                this.lastTime += this.period;
                var nextPoint = getRandomPoint(
                    this.spline[3],
                    SglVec3.sub(this.spline[3], this.spline[2]),
                    this.angle, this.dist
                );
                this.spline.shift();
                this.spline.push(nextPoint);
            }
            this.last = this.translation;
            this.translation = catmullRom(this.spline, t);
            this.rotation[1] = calcHeading(SglVec3.sub(this.translation, this.last));
            this.body.transformation = SglMat4.mul(
                SglMat4.translation(this.translation),
                SglMat4.rotationAngleAxis(this.rotation[1], [0, 1, 0])
            );
        }

        this.body.update();
    };

    this.draw = function(gl, depthOnly) {

        this.body.draw(gl, depthOnly);
    };

    this.collisionResponse = function(slide) {

        this.translation = SglVec3.add(this.translation, slide);
        this.body.transformation = SglMat4.mul(
            SglMat4.translation(this.translation),
            SglMat4.rotationAngleAxis(this.rotation[1], [0, 1, 0])
        );

        this.lastTime = new Date().getTime();
        this.spline[0] = this.last;
        this.spline[1] = this.translation;
        this.spline[2] = getRandomPoint(
            this.spline[1], SglVec3.sub(this.spline[1], this.spline[0]),
            this.angle, this.dist
        );
        this.spline[3] = getRandomPoint(
            this.spline[2], SglVec3.sub(this.spline[2], this.spline[1]),
            this.angle, this.dist
        );
    };

    this.hasLettuce = true;
    this.removeLettuce = function() {

        this.hasLettuce = false;
        delete this.body.graph.joints.lettuce;
    };

    options = getCatbugOptions(true);
    this.body = new Body(options);
    this.body.animate("fly", true);
};

function catmullRom(p, t) {
    var t2 = t*t;
    var t3 = t*t2;

    var w0 = 0.5 * (-1*t + 2*t2 - t3);
    var w1 = 0.5 * (2 - 5*t2 + 3*t3);
    var w2 = 0.5 * (t + 4*t2 - 3*t3);
    var w3 = 0.5 * (-1*t2 + t3);
    var x = p[0][0]*w0 + p[1][0]*w1 + p[2][0]*w2 + p[3][0]*w3;
    var y = p[0][1]*w0 + p[1][1]*w1 + p[2][1]*w2 + p[3][1]*w3;
    var z = p[0][2]*w0 + p[1][2]*w1 + p[2][2]*w2 + p[3][2]*w3;

    return [x, y, z];
}

function getRandomPoint(p, v, maxAngle, dist) {

    var dir = SglVec3.normalize(v);
    dir[1] = 0; // only want heading
    dir.push(0);
    var angle = Math.random()*2*maxAngle - maxAngle;
    var newDir = SglMat4.mul4(SglMat4.rotationAngleAxis(angle, [0, 1, 0]), dir);
    var res = SglVec3.add(p, SglVec3.muls(newDir, dist));
    while (res[0] > 100 || res[0] < -100 || res[2] > 100 || res[2] < -100) {
        maxAngle += Math.PI/8;
        angle = Math.random()*2*maxAngle - maxAngle;
        newDir = SglMat4.mul4(SglMat4.rotationAngleAxis(angle, [0, 1, 0]), dir);
        res = SglVec3.add(p, SglVec3.muls(newDir, dist));
    }
    var dAlt = Math.random()*2 - 1; // alter altitude
    while (res[1]+dAlt > 4 || res[1]+dAlt < 2) {
        dAlt += Math.random()*2 - 1; // alter altitude
    }
    res[1] += dAlt;
    return res;
}

function calcHeading(v) {
    
    v = SglVec3.normalize(v);
    var angle = Math.acos(SglVec3.dot(v, [0, 0, 1]));
    if (SglVec3.cross(v, [0, 0, 1])[1] > 0) {
        return -angle;
    } else {
        return angle;
    }
}

function getCatbugOptions(lettuce) {

    var client = NVMCClient;

    var options = {};
    options.graph = new Node({
        name: "body",
        rotation: [Math.PI/4, 0, 0],
        primitives: [
            new Primitive({
                mesh: client.sphere,
                shader: client.phongSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.55, 0.6, 0.5]
            }),
            new Primitive({ // left cover
                mesh: client.texturedSphere,
                shader: client.textureShadowShader,
                texture: client.dotsTexture,
                scaling: [0.4, 0.7, 0.08],
                rotation: [-Math.PI/4, -Math.PI/4, Math.PI/3],
                translation: [-0.4, 0.6, -0.8]
            }),
            new Primitive({ // right cover
                mesh: client.texturedSphere,
                shader: client.textureShadowShader,
                texture: client.dotsTexture,
                scaling: [0.4, 0.7, 0.08],
                rotation: [-Math.PI/4, Math.PI/4, -Math.PI/3],
                translation: [0.4, 0.6, -0.8]
            }),
            new Primitive({ // left leg
                mesh: client.sphere,
                shader: client.phongSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [-0.3, -0.45, 0.2],
                rotation: [-Math.PI/6, 0, 0]
            }),
            new Primitive({ // right leg
                mesh: client.sphere,
                shader: client.phongSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [0.3, -0.45, 0.2],
                rotation: [-Math.PI/6, 0, 0]
            }),
            new Primitive({ // left arm
                mesh: client.sphere,
                shader: client.phongSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.1, 0.2],
                translation: [-0.3, 0.2, 0.35],
                rotation: [0, Math.PI/12, 0]
            }),
            new Primitive({ // right arm
                mesh: client.sphere,
                shader: client.phongSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.1, 0.2],
                translation: [0.3, 0.2, 0.35],
                rotation: [0, -Math.PI/12, 0]
            })
        ],
        joints: {
            leftWing: new Joint({
                translation: [-0.15, 0.2, -0.35],
                child: new Node({
                    translation: [-0.05, 0.05, -0.6],
                    primitives: [
                        new Primitive({
                            mesh: client.sphere,
                            shader: client.phongSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.6, 0.3, 0.1],
                            rotation: [Math.PI/4, -Math.PI/2, 0]
                        })
                    ]
                })
            }),
            rightWing: new Joint({
                translation: [0.15, 0.2, -0.35],
                child: new Node({
                    translation: [0.05, 0.05, -0.6],
                    primitives: [
                        new Primitive({
                            mesh: client.sphere,
                            shader: client.phongSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.6, 0.3, 0.1],
                            rotation: [Math.PI/4, Math.PI/2, 0]
                        })
                    ]
                })
            }),
            head: new Joint({
                translation: [0, 0.3, 0.2],
                child: new Node({
                    name: "head",
                    translation: [0, 0.4, 0],
                    rotation: [-Math.PI/6, 0, 0],
                    primitives: [
                        new Primitive({
                            mesh: client.sphere,
                            shader: client.phongSingleColorShadowShader,
                            color: [0.67, 0.81, 0.93, 1.0],
                            scaling: [0.5, 0.4, 0.5]
                        }),
                        new Primitive({ // left ear
                            mesh: client.cone,
                            shader: client.phongSingleColorShadowShader,
                            color: [0.67, 0.81, 0.93, 1.0],
                            scaling: [0.15, 0.15, 0.15],
                            rotation: [0, 0, Math.PI/8],
                            translation: [-0.25, 0.25, 0.05]
                        }),
                        new Primitive({ // right ear
                            mesh: client.cone,
                            shader: client.phongSingleColorShadowShader,
                            color: [0.67, 0.81, 0.93, 1.0],
                            scaling: [0.15, 0.15, 0.15],
                            rotation: [0, 0, -Math.PI/8],
                            translation: [0.25, 0.25, 0.05]
                        }),
                        new Primitive({ // left eye
                            mesh: client.sphere,
                            shader: client.phongSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.05, 0.06, 0.03],
                            rotation: [-Math.PI/12, 0, 0],
                            translation: [-0.18, 0.1, 0.45]
                        }),
                        new Primitive({ // right eye
                            mesh: client.sphere,
                            shader: client.phongSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.05, 0.06, 0.03],
                            rotation: [-Math.PI/12, 0, 0],
                            translation: [0.18, 0.1, 0.45]
                        })
                    ]
                })
            })
        }
    });
    if (lettuce) {
        options.graph.joints.lettuce = new Joint({
            child: new Node({
                translation: [0, 0.05, 0.7],
                scaling: [1, 1, 0.7],
                primitives: [
                    new Primitive({
                        mesh: client.texturedSphere,
                        shader: client.textureShadowShader,
                        texture: client.leafTexture,
                        scaling: [0.25, 0.3, 0.25]
                    }),
                    new Primitive({
                        mesh: client.texturedSphere,
                        shader: client.textureShadowShader,
                        texture: client.leafTexture,
                        scaling: [0.2, 0.35, 0.1],
                        translation: [0, 0.05, 0.25],
                        rotation: [Math.PI/10, 0, 0]
                    }),
                    new Primitive({
                        mesh: client.texturedSphere,
                        shader: client.textureShadowShader,
                        texture: client.leafTexture,
                        scaling: [0.2, 0.35, 0.1],
                        translation: [0.15, 0.02, 0.15],
                        rotation: [Math.PI/10, Math.PI/3, 0]
                    }),
                    new Primitive({
                        mesh: client.texturedSphere,
                        shader: client.textureShadowShader,
                        texture: client.leafTexture,
                        scaling: [0.2, 0.35, 0.1],
                        translation: [0.2, 0.04, -0.1],
                        rotation: [Math.PI/10, 3*Math.PI/5, 0]
                    }),
                    new Primitive({
                        mesh: client.texturedSphere,
                        shader: client.textureShadowShader,
                        texture: client.leafTexture,
                        scaling: [0.2, 0.35, 0.1],
                        translation: [0.05, 0.03, -0.2],
                        rotation: [Math.PI/10, 7*Math.PI/8, 0]
                    }),
                    new Primitive({
                        mesh: client.texturedSphere,
                        shader: client.textureShadowShader,
                        texture: client.leafTexture,
                        scaling: [0.2, 0.35, 0.1],
                        translation: [-0.1, 0.05, -0.15],
                        rotation: [Math.PI/10, 9*Math.PI/7, 0]
                    }),
                    new Primitive({
                        mesh: client.texturedSphere,
                        shader: client.textureShadowShader,
                        texture: client.leafTexture,
                        scaling: [0.2, 0.35, 0.1],
                        translation: [-0.1, 0.02, 0.1],
                        rotation: [Math.PI/10, 8*Math.PI/5, 0]
                    }),
                ]
            })
        });
    }

    options.animations = {
        fly: {
            frames: [
                {
                    root: {
                        translation: [0, 0, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        leftWing: [0, 0, 0],
                        rightWing: [0, 0, 0],
                        head: [Math.PI/72, 0, 0],
                        lettuce: [0, 0, 0]
                    }
                },
                {
                    root: {
                        translation: [0, -0.05, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        leftWing: [-Math.PI/6, Math.PI/3, Math.PI/3],
                        rightWing: [-Math.PI/6, -Math.PI/3, -Math.PI/3],
                        head: [Math.PI/36, 0, 0],
                        lettuce: [0, 0, 0]
                    }
                },
                {
                    root: {
                        translation: [0, -0.1, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        leftWing: [0, 0, 0],
                        rightWing: [0, 0, 0],
                        head: [Math.PI/72, 0, 0],
                        lettuce: [0, 0, 0]
                    }
                },
                {
                    root: {
                        translation: [0, -0.05, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        leftWing: [-Math.PI/6, Math.PI/3, Math.PI/3],
                        rightWing: [-Math.PI/6, -Math.PI/3, -Math.PI/3],
                        head: [0, 0, 0],
                        lettuce: [0, 0, 0]
                    }
                }
            ],
            sequence: [
                [0, 200],
                [1, 200],
                [2, 200],
                [3, 200],
            ]
        }
    };

    return options;
}
