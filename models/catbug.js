/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.createCatbug = function(options) {
    options.graph = new Node({
        name: "body",
        primitives: [
            new Primitive({
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.6, 0.7, 0.5]
            }),
            new Primitive({ // left cover
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.89, 0.17, 0.31, 1.0],
                scaling: [0.4, 0.7, 0.08],
                rotation: [-Math.PI/6, Math.PI/6, Math.PI/4],
                translation: [-0.7, 0.9, -0.4]
            }),
            new Primitive({ // right cover
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.89, 0.17, 0.31, 1.0],
                scaling: [0.4, 0.7, 0.08],
                rotation: [-Math.PI/6, -Math.PI/6, -Math.PI/4],
                translation: [0.7, 0.9, -0.4]
            }),
            new Primitive({ // left leg
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [-0.3, -0.6, 0.2],
                rotation: [-Math.PI/6, 0, 0]
            }),
            new Primitive({ // right leg
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [0.3, -0.6, 0.2],
                rotation: [-Math.PI/6, 0, 0]
            }),
            new Primitive({ // left arm
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [-0.4, 0.2, 0.3],
                rotation: [-Math.PI/4, 0, -Math.PI/6]
            }),
            new Primitive({ // right arm
                mesh: this.sphere,
                shader: this.lambertianSingleColorShadowShader,
                color: [0.67, 0.81, 0.93, 1.0],
                scaling: [0.1, 0.2, 0.1],
                translation: [0.4, 0.2, 0.3],
                rotation: [-Math.PI/4, 0, Math.PI/6]
            }),
        ],
        joints: {
            leftWing: new Joint({
                translation: [-0.3, 0.3, -0.4],
                child: new Node({
                    translation: [-0.45, 0.15, -0.15],
                    primitives: [
                        new Primitive({
                            mesh: this.sphere,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.6, 0.3, 0.1],
                            rotation: [Math.PI/6, -Math.PI/6, 0]
                        })
                    ]
                })
            }),
            rightWing: new Joint({
                translation: [0.3, 0.3, -0.4],
                child: new Node({
                    translation: [0.45, 0.15, -0.15],
                    primitives: [
                        new Primitive({
                            mesh: this.sphere,
                            shader: this.lambertianSingleColorShadowShader,
                            color: [0.93, 0.96, 0.97, 1.0],
                            scaling: [0.6, 0.3, 0.1],
                            rotation: [Math.PI/6, Math.PI/6, 0]
                        })
                    ]
                })
            })
        }
    });

    return new Body(options);
};

