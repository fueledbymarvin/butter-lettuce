// Global NVMC Client
// ID 4.1
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function ChaseCamera() {//line 74, Listnig 4.5{
    this.position = [0.0,0.0,0.0];

    this.rotation = [0, 0, 0];
    this.keyDown = function (keyCode) {};
    this.keyUp = function (keyCode) {};
    this.mouseMove = function (e) {
        var movementY = e.movementY ||
                e.mozMovementY      ||
                0;

        var tilt = this.rotation[0] - movementY*Math.PI/720;
        var upper = Math.PI/9;
        var lower = -Math.PI/4;
        if (tilt > upper) {
            this.rotation[0] = upper;
        } else if (tilt < lower) {
            this.rotation[0] = lower;
        } else {
            this.rotation[0] = tilt;
        }
    };
    this.mouseButtonDown = function (event) {};
    this.mouseButtonUp = function () {};
    this.setView = function (stack, F_0) {
	var T = SglMat4.translation([0, 1, 8]);
	var Rx = eulerToRot(this.rotation);
	var Vc_0 = SglMat4.mul(Rx, T);
	var V_0 = SglMat4.mul(F_0, Vc_0);
	this.position = SglMat4.col(V_0,3);
	var invV = SglMat4.inverse(V_0);
	stack.multiply(invV);
    };
};

NVMCClient.cameras = [];
NVMCClient.cameras[0] = new ChaseCamera();
NVMCClient.n_cameras = 1;
NVMCClient.currentCamera = 0;

/***********************************************************************/

