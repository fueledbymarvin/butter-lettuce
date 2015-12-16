/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.createCatbug = function(options) {
    options.graph = new Node({
        name: "body",
        rotation: [Math.PI/5, 0, 0],
        primitives: [
            new Primitive({
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.55, 0.6, 0.5]
            }),
            new Primitive({ // left cover
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.89, 0.17, 0.31, 1.0],
                scaling: [0.4, 0.7, 0.08],
                rotation: [-Math.PI/4, Math.PI/6, Math.PI/4],
                translation: [-0.6, 0.7, -0.5]
            }),
            new Primitive({ // right cover
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.89, 0.17, 0.31, 1.0],
                scaling: [0.4, 0.7, 0.08],
                rotation: [-Math.PI/4, -Math.PI/6, -Math.PI/4],
                translation: [0.6, 0.7, -0.5]
            }),
            new Primitive({ // left leg
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [-0.3, -0.45, 0.2],
                rotation: [-Math.PI/6, 0, 0]
            }),
            new Primitive({ // right leg
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [0.3, -0.45, 0.2],
                rotation: [-Math.PI/6, 0, 0]
            }),
            new Primitive({ // left arm
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [-0.3, 0.2, 0.3],
                rotation: [-Math.PI/4, 0, -Math.PI/6]
            }),
            new Primitive({ // right arm
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [0.3, 0.2, 0.3],
                rotation: [-Math.PI/4, 0, Math.PI/6]
            }),
        ],
        joints: {
            leftWing: new Joint({
                translation: [-0.2, 0.3, -0.3],
                child: new Node({
                    translation: [-0.45, 0, -0.3],
                    primitives: [
                        new Primitive({
                            mesh: this.sphere,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.6, 0.3, 0.1],
                            rotation: [Math.PI/6, -Math.PI/4, Math.PI/6]
                        })
                    ]
                })
            }),
            rightWing: new Joint({
                translation: [0.2, 0.3, -0.3],
                child: new Node({
                    translation: [0.45, 0, -0.3],
                    primitives: [
                        new Primitive({
                            mesh: this.sphere,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.6, 0.3, 0.1],
                            rotation: [Math.PI/6, Math.PI/4, -Math.PI/6]
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
                            mesh: this.sphere,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.67, 0.81, 0.93, 1.0],
                            scaling: [0.5, 0.4, 0.5]
                        }),
                        new Primitive({ // left ear
                            mesh: this.cone,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.67, 0.81, 0.93, 1.0],
                            scaling: [0.15, 0.15, 0.15],
                            rotation: [0, 0, Math.PI/8],
                            translation: [-0.25, 0.25, 0.05]
                        }),
                        new Primitive({ // right ear
                            mesh: this.cone,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.67, 0.81, 0.93, 1.0],
                            scaling: [0.15, 0.15, 0.15],
                            rotation: [0, 0, -Math.PI/8],
                            translation: [0.25, 0.25, 0.05]
                        }),
                        new Primitive({ // left eye
                            mesh: this.sphere,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.05, 0.06, 0.03],
                            rotation: [-Math.PI/12, 0, 0],
                            translation: [-0.18, 0.1, 0.45]
                        }),
                        new Primitive({ // right eye
                            mesh: this.sphere,
                            shader: this.lambertianSingleColorShadowShader,
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
                        head: [0, 0, 0]
                    }
                },
                {
                    root: {
                        translation: [0, 0, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        leftWing: [0, Math.PI/6, Math.PI/3],
                        rightWing: [0, -Math.PI/6, -Math.PI/3],
                        head: [0, 0, 0]
                    }
                }
            ],
            sequence: [
                [0, 100],
                [1, 200]
            ]
        }
    };

    return new Body(options);
};

