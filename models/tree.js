/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Tree(options) {
    this.client = NVMCClient;

    this.update = function() {
        this.body.update();
    };

    this.draw = function(gl, depthOnly) {
        this.body.draw(gl, depthOnly);
    };

    var options = {};

    var primitives = [
        new Primitive({
            mesh: this.client.texturedSphere,
            texture: this.client.treeTextures[Math.floor(Math.random()*this.client.treeTextures.length)],
            shader: this.client.textureShadowShader,
            translation: [0, 1.5, 0],
            scaling: [0.7, 0.7, 0.7]
        }),
        new Primitive({
            mesh: this.client.texturedSphere,
            texture: this.client.treeTextures[Math.floor(Math.random()*this.client.treeTextures.length)],
            shader: this.client.textureShadowShader,
            scaling: [1.2, 1.2, 1.2]
        }),
    ];
    
    var joints = {};
    var nPetals = Math.floor(Math.random()*5+3);
    var texture = this.client.treeTextures[Math.floor(Math.random()*this.client.treeTextures.length)];
    var scaling = [Math.random()*0.5+0.5, Math.random()*1.5+0.5, Math.random()*0.2+0.1];
    for (var i = 0; i < nPetals; i++) {
        joints["petal"+i] = new Joint({
            translation: [
                Math.sin(2*Math.PI/nPetals * i)*0.2,
                1,
                Math.cos(2*Math.PI/nPetals * i)*0.2
            ],
            child: new Node({
                primitives: [
                    new Primitive({
                        mesh: this.client.texturedSphere,
                        texture: texture,
                        shader: this.client.textureShadowShader,
                        scaling: scaling,
                        translation: [0, scaling[1], 0]
                    })
                ]
            })
        });
    }

    options.graph = new Node({
        primitives: primitives,
        joints: joints
    });

    var jointsFrame0 = {};
    var start = Math.PI/8 + Math.random()*Math.PI/8;
    for (var i = 0; i < nPetals; i++) {
        jointsFrame0["petal"+i] = [start, 2*Math.PI/nPetals*i, 0];
    }
    var jointsFrame1 = {};
    var end = Math.PI/2 - Math.random()*Math.PI/6;
    for (var i = 0; i < nPetals; i++) {
        jointsFrame1["petal"+i] = [end, 2*Math.PI/nPetals*i, 0];
    }

    var animations = {};
    animations.close = {
        frames: [
            {
                root: {
                    translation: [0, 0, 0],
                    rotation: [0, 0, 0]
                },
                joints: jointsFrame0
            },
            {
                root: {
                    translation: [0, 0, 0],
                    rotation: [0, 0, 0]
                },
                joints: jointsFrame1
            }
        ],
        sequence: [[1, Math.random()*1000+200], [0, Math.random()*1000+200]]
    };
    options.animations = animations;

    this.body = new Body(options);
    this.body.animate("close", true);
}

