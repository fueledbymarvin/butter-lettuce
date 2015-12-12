/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

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
                    transformations: [SglMat4.translation([0, 0.8, 0])],
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
    return new Body(options);
};

function Body(options) {
    this.client = NVMCClient;
    this.stack = this.client.stack;

    this.graph = options.graph;
    this.transformation = options.transformations ?
        combineTransformations(options.transformations) : SglMat4.identity();
    
    this.draw = function(gl, depthOnly) {
        this.stack.push();
        this.stack.multiply(this.transformation);

        this.graph.draw(gl, depthOnly);

        this.stack.pop();
    };
}

function Node(options) {
    this.client = NVMCClient;
    this.stack = this.client.stack;

    this.name = options.name;
    this.primitives = options.primitives ? options.primitives : [];
    this.joints = options.joints ? options.joints : [];
    this.transformation = options.transformations ?
        combineTransformations(options.transformations) : SglMat4.identity();

    this.draw = function(gl, depthOnly) {
        this.stack.push();
        this.stack.multiply(this.transformation);

        for (var i = 0; i < this.primitives.length; i++) {
            this.primitives[i].draw(gl, depthOnly);
        }

        for (var i = 0; i < this.joints.length; i++) {
            this.joints[i].draw(gl, depthOnly);
        }

        this.stack.pop();
    };
}

function Joint(options) {
    this.name = options.name;
    this.theta = 0; // heading/yaw (around y-axis)
    this.phi = 0; // attitude/pitch (around x-axis)
    this.psi = 0; // bank/roll (around z-axis)

    this.child = options.node;

    this.draw = function(gl, depthOnly) {
        this.child.draw(gl, depthOnly);
    };
}

function Primitive(options) {
    this.client = NVMCClient;
    this.stack = this.client.stack;

    this.mesh = options.mesh;
    this.shader = options.shader;
    this.color = options.color;
    this.texture = options.texture;
    this.transformation = options.transformations ?
        combineTransformations(options.transformations) : SglMat4.identity();

    this.draw = function(gl, depthOnly) {
        var viewMatrix = this.stack.matrix;

        this.stack.push();
        this.stack.multiply(this.transformation);

        if (depthOnly) {
            gl.uniformMatrix4fv(this.shader.uShadowMatrixLocation, false, this.stack.matrix);
        } else {
            gl.uniformMatrix4fv(this.shader.uModelMatrixLocation, false, this.stack.matrix);
            var InvT = SglMat4.transpose(
                SglMat4.inverse(
                    SglMat4.mul(viewMatrix, this.stack.matrix)
                )
            );
            gl.uniformMatrix3fv(this.shader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
        }

        if (!depthOnly && this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        if (depthOnly) {
            this.client.drawObject(gl, this.mesh, this.client.shadowMapCreateShader);
        } else {
            this.client.drawObject(gl, this.mesh, this.shader, this.color);
        }
        this.stack.pop();
    };
}

function combineTransformations(transformations) {

    var res = SglMat4.identity();
    for (var i = 0; i < transformations.length; i++) {
        SglMat4.mul(transformations[i], res);
    }
    return res;
}
