/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Spinner(options) {
    this.client = NVMCClient;

    this.update = function() {
        this.body.update();
    };

    this.draw = function(gl, depthOnly) {
        this.body.draw(gl, depthOnly);
    };

    var rotator = (function(d) {
        return new Joint({
            child: new Node({
                rotation: [Math.PI/6, 0, 0],
                primitives: [
                    new Primitive({
                        mesh: this.client.sphere,
                        shader: this.client.lambertianSingleColorShadowShader,
                        color: [0.40, 0.25, 0.45, 1],
                        scaling: [0.2, 0.2, 0.2],
                        translation: [0, 0, d]
                    })
                ]
            })
        });
    }).bind(this);

    options.graph = new Node({
        name: "base",
        primitives: [
            new Primitive({
                mesh: this.client.cone,
                shader: this.client.lambertianSingleColorShadowShader,
                color: [0.2, 0.2, 0.2, 1],
                rotation: [0, 0, 0],
                scaling: [0.5, 1, 0.5]
            })
        ],
        joints: {
            trunk: new Joint({
                translation: [0, 2.6, 0],
                child: new Node({
                    primitives: [
                        new Primitive({
                            mesh: this.client.texturedSphere,
                            shader: this.client.textureShadowShader,
                            texture: this.client.rockTextures[1+Math.floor(Math.random()*2)],
                            scaling: [0.3, 0.3, 0.3]
                        })
                    ],
                    joints: {
                        rotator1: rotator(1),
                        rotator2: rotator(-1)
                    }
                })
            })
        }
    });

    options.animations = {
        spin: {
            frames: [
                {
                    root: {
                        translation: [0, 0, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        trunk: [0, 0, 0],
                        rotator1: [0, 0, 0],
                        rotator2: [0, 0, 0]
                    }
                },
                {
                    root: {
                        translation: [0, 0, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        trunk: [2*Math.PI/3, 0, 0],
                        rotator1: [0, 2*Math.PI/3, 0],
                        rotator2: [0, 2*Math.PI/3, 0]
                    }
                },
                {
                    root: {
                        translation: [0, 0, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        trunk: [4*Math.PI/3, 0, 0],
                        rotator1: [0, 4*Math.PI/3, 0],
                        rotator2: [0, 4*Math.PI/3, 0]
                    }
                },
                {
                    root: {
                        translation: [0, 0, 0],
                        rotation: [0, 0, 0]
                    },
                    joints: {
                        trunk: [2*Math.PI, 0, 0],
                        rotator1: [0, 2*Math.PI, 0],
                        rotator2: [0, 2*Math.PI, 0]
                    }
                }
            ],
            sequence: [
                [0, 300],
                [1, 300],
                [2, 300],
                [3, 1],
            ]
        }
    };

    this.body = new Body(options);
}
