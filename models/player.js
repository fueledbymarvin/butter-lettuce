/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Player() {
    this.client = NVMCClient;
    
    setupPointerLock();

    this.forward = false;
    this.back = false;
    this.left = false;
    this.right = false;
    this.last = [0, 2, 0];
    this.translation = [0, 2, 0];
    this.rotation = [0, 0, 0];
    this.lastTime = new Date().getTime();
    this.velocity = this.client.movementSpeed;

    this.draw = function(gl, depthOnly) {

        this.body.draw(gl, depthOnly);
    };
    
    this.nLettuce = 0;
    this.collisionResponse = function(slide) {

        for (var i = 0; i < this.collisionObjects.length; i++) {
            if (this.collisionObjects[i].name == "catbug"
                && this.collisionObjects[i].hasLettuce) {
                this.collisionObjects[i].removeLettuce();
                this.client.lettuces[this.nLettuce++].graph.primitives[0].texture =
                    this.client.lettuceTexture;
            }
        }
        this.translation = SglVec3.add(this.translation, slide);
        this.body.transformation = SglMat4.mul(
            SglMat4.translation(this.translation),
            SglMat4.rotationAngleAxis(this.rotation[1], [0, 1, 0])
        );
    };

    this.getFrame = function() {
        var y = [0, 1, 0];
	var z = SglMat4.mul4(SglMat4.rotationAngleAxis(this.rotation[1], y), [0, 0, 1, 0]);
	var x = SglVec3.cross(y, z);
        var p = this.translation;
        return [
            x[0], x[1], x[2], 0,
            y[0], y[1], y[2], 0,
            -z[0], -z[1], -z[2], 0,
            p[0], p[1], p[2], 1,
        ];
    };

    this.update = function() {

        var time = new Date().getTime();
        var elapsed = (time - this.lastTime)/1000;
        this.lastTime = time;
        this.last = this.translation;

        var y = [0, 1, 0];
	var z = SglMat4.mul4(SglMat4.rotationAngleAxis(this.rotation[1], y), [0, 0, 1, 0]);
	var x = SglVec3.cross(y, z);

        var direction = [0, 0, 0];
        if (this.forward) {
            direction = SglVec3.add(direction, z);
        }
        if (this.back) {
            direction = SglVec3.add(direction, SglVec3.muls(z, -1));
        }
        if (this.left) {
            direction = SglVec3.add(direction, SglVec3.muls(x, -1));
        }
        if (this.right) {
            direction = SglVec3.add(direction, x);
        }
        if (SglVec3.length(direction) > 0) {
            direction = SglVec3.normalize(direction);
        }
        this.translation = SglVec3.add(this.translation, SglVec3.muls(direction, this.velocity*elapsed));
        this.body.transformation = SglMat4.mul(
            SglMat4.translation(this.translation),
            SglMat4.rotationAngleAxis(this.rotation[1], [0, 1, 0])
        );

        this.body.update();
    };

    this.keyDown = function(k) {
        if (k == "W") {
            this.forward = true;
        }
        if (k == "A") {
            this.left = true;
        }
        if (k == "S") {
            this.back = true;
        }
        if (k == "D") {
            this.right = true;
        }
    };

    this.keyUp = function(k) {
        if (k == "W") {
            this.forward = false;
        }
        if (k == "A") {
            this.left = false;
        }
        if (k == "S") {
            this.back = false;
        }
        if (k == "D") {
            this.right = false;
        }
    };

    this.mouseMove = function(e) {
        var movementX = e.movementX ||
                e.mozMovementX          ||
                0;

        this.rotation[1] += movementX*Math.PI/720;
    };

    var options = getCatbugOptions(false);
    this.body = new Body(options);
    this.body.animate("fly", true);
};

function setupPointerLock() {
    var canvas = document.querySelector('canvas');
    canvas.requestPointerLock = canvas.requestPointerLock ||
        canvas.mozRequestPointerLock ||
        canvas.webkitRequestPointerLock;
    canvas.onclick = function() {
        canvas.requestPointerLock();
    };
}
