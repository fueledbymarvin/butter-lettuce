/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

// var animation = {
//     frames: [
//         {
//             root: [translation],
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

    this.graph = options.graph;
    this.transformation = options.transformations ?
        combineTransformations(options.transformations) : SglMat4.identity();
    
    this.draw = function(gl, depthOnly) {
        var stack = this.client.stack;
        stack.push();
        if (!depthOnly) {
            stack.loadIdentity();
        }
        stack.multiply(this.transformation);

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
    this.theta = 0; // heading/yaw (around y-axis)
    this.phi = 0; // attitude/pitch (around x-axis)
    this.psi = 0; // bank/roll (around z-axis)

    this.child = options.child;

    this.draw = function(gl, depthOnly) {
        var stack = this.client.stack;
        stack.push();
        stack.multiply(this.constructTransformation());

        this.child.draw(gl, depthOnly);
        stack.pop();
    };

    this.constructTransformation = function() {
        var rotY = SglMat4.rotationAngleAxis(this.theta, [0, 1, 0]);
        var rotX = SglMat4.rotationAngleAxis(this.phi, [1, 0, 0]);
        var rotZ = SglMat4.rotationAngleAxis(this.psi, [0, 0, 1]);
        return combineTransformations([rotY, rotX, rotZ]);
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
