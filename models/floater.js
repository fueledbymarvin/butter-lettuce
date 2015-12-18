/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Floater(options) {
    this.client = NVMCClient;

    this.update = function() {
        this.body.update();
    };

    this.draw = function(gl, depthOnly) {
        this.body.draw(gl, depthOnly);
    };

    var branch = (function() {
        return new Joint({
            translation: [0, 1.5, 0],
            child: new Node({
                rotation: [Math.PI/4, 0, 0],
                primitives: [
                    new Primitive({
                        mesh: this.client.cylinder,
                        shader: this.client.lambertianSingleColorShadowShader,
                        color: [0.94, 0.28, 0.21, 1],
                        scaling: [0.15, 0.6, 0.15]
                    }),
                    new Primitive({
                        mesh: this.client.cube,
                        shader: this.client.lambertianSingleColorShadowShader,
                        color: [0.40, 0.25, 0.45, 1],
                        rotation: [Math.PI/4, 0, Math.PI/4],
                        scaling: [0.2, 0.2, 0.2],
                        translation: [0, 1.2, 0]
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
                color: [1, 1, 1, 1],
                rotation: [0, 0, Math.PI],
                scaling: [1, 0.5, 1]
            })
        ],
        joints: {
            trunk: new Joint({
                child: new Node({
                    primitives: [
                        new Primitive({
                            mesh: this.client.cylinder,
                            shader: this.client.lambertianSingleColorShadowShader,
                            color: [0.94, 0.28, 0.21, 1],
                            scaling: [0.3, 0.7, 0.3]
                        }),
                        new Primitive({
                            mesh: this.client.sphere,
                            shader: this.client.lambertianSingleColorShadowShader,
                            color: [0.94, 0.28, 0.21, 1],
                            scaling: [0.3, 0.3, 0.3],
                            translation: [0, 1.4, 0]
                        })
                    ],
                    joints: {
                        branch1: branch(),
                        branch2: branch(),
                        branch3: branch()
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
                        branch1: [0, 0, 0],
                        branch2: [0, 2*Math.PI/3, 0],
                        branch3: [0, 4*Math.PI/3, 0]
                    }
                },
                {
                    root: {
                        translation: [0, 0.1, 0],
                        rotation: [0, Math.PI/4, 0]
                    },
                    joints: {
                        trunk: [0, 0, 0],
                        branch1: [Math.PI/4, 0, 0],
                        branch2: [Math.PI/4, 2*Math.PI/3, 0],
                        branch3: [Math.PI/4, 4*Math.PI/3, 0]
                    }
                },
                {
                    root: {
                        translation: [0, 0.2, 0],
                        rotation: [0, Math.PI/2, 0]
                    },
                    joints: {
                        trunk: [0, 0, 0],
                        branch1: [Math.PI/2, 0, 0],
                        branch2: [Math.PI/2, 2*Math.PI/3, 0],
                        branch3: [Math.PI/2, 4*Math.PI/3, 0]
                    }
                },
                {
                    root: {
                        translation: [0, 0.1, 0],
                        rotation: [0, Math.PI, 0]
                    },
                    joints: {
                        trunk: [0, 0, 0],
                        branch1: [Math.PI/4, 0, 0],
                        branch2: [Math.PI/4, 2*Math.PI/3, 0],
                        branch3: [Math.PI/4, 4*Math.PI/3, 0]
                    }
                },
                {
                    root: {
                        translation: [0, 0, 0],
                        rotation: [0, 2*Math.PI, 0]
                    },
                    joints: {
                        trunk: [0, 0, 0],
                        branch1: [0, 0, 0],
                        branch2: [0, 2*Math.PI/3, 0],
                        branch3: [0, 4*Math.PI/3, 0]
                    }
                }
            ],
            sequence: [
                [0, 300],
                [1, 300],
                [2, 300],
                [3, 300],
                [4, 1],
            ]
        }
    };

    this.body = new Body(options);
}
