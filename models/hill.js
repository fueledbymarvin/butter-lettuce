/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Hill(options) {
    this.client = NVMCClient;

    this.update = function() {
        this.body.update();
    };

    this.draw = function(gl, depthOnly) {
        this.body.draw(gl, depthOnly);
    };

    var primitives = new Array(Math.floor(Math.random()*3+1));
    for (var i = 0; i < primitives.length; i++) {
        primitives[i] = new Primitive({
            mesh: this.client.texturedSphere,
            shader: this.client.textureShadowShader,
            texture: this.client.rockTextures[Math.floor(Math.random()*3)],
            scaling: [Math.random()*8+2, Math.random()*8+2, Math.random()*8+2],
            rotation: [Math.PI/4*Math.random(), 0, Math.PI/4*Math.random()],
            translation: [Math.random()*8-4, Math.random()*2-1, Math.random()*8-4]
        });
    }

    options.graph = new Node({
        primitives: primitives
    });

    this.body = new Body(options);
}
