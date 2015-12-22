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

    var texture = this.client.rockTextures[Math.floor(Math.random()*3)];

    var primitives = [];
    var nPrimsLevel = Math.floor(Math.random()*5+1);
    var scale = 3;
    var avgPos = [0, -2, 0];
    while (nPrimsLevel > 0) {
        var sum = [0, 0, 0];
        for (var i = 0; i < nPrimsLevel; i++) {
            var scaling = [Math.random()*scale+1, Math.random()*scale+1, Math.random()*scale+1];
            var translation = [
                avgPos[0] + (2*Math.random()-1)*scaling[0],
                avgPos[1] + Math.random()*scaling[1],
                avgPos[2] + (2*Math.random()-1)*scaling[2]
            ];
            sum = SglVec3.add(sum, translation);
            primitives.push(new Primitive({
                mesh: this.client.sphere,
                shader: this.client.textureShadowShader,
                texture: texture,
                rotation: [Math.PI/4*Math.random(), 0, Math.PI/4*Math.random()],
                scaling: scaling,
                translation: translation
            }));
        }
        avgPos = SglVec3.muls(sum, 1/nPrimsLevel);
        nPrimsLevel -= Math.floor(Math.random()*2);
    }

    options.graph = new Node({
        primitives: primitives
    });

    this.body = new Body(options);
}
