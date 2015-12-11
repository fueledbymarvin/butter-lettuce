// Global NVMC Client
// ID 5.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.cabin = null;
NVMCClient.windshield = null;
NVMCClient.rearmirror = null;

function DriverCamera() {
	this.position = [];
	this.keyDown = function (keyCode) {}
	this.keyUp = function (keyCode) {}

	this.mouseMove = function (event) {};

	this.mouseButtonDown = function (event) {};

	this.mouseButtonUp = function () {}

	this.setView = function (stack, frame) {
		var driverFrame = SglMat4.dup(frame);
		var pos = SglMat4.col(driverFrame, 3);
		SglMat4.col$(driverFrame, 3, SglVec4.add(pos, [0, 1.5, 0, 0]));
		var invV = SglMat4.inverse(driverFrame);
		stack.multiply(invV);
	};
};

NVMCClient.cameras[3] = new DriverCamera();
NVMCClient.n_cameras = 4;

NVMCClient.createColoredObjectBuffers = function (gl, obj) {
	obj.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	obj.colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_color, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	obj.indexBufferTriangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

};

NVMCClient.drawColoredObject = function (gl, obj, lineColor) {
	// Draw the primitive
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.enableVertexAttribArray(this.perVertexColorShader.aPositionIndex);
	gl.vertexAttribPointer(this.perVertexColorShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
	gl.enableVertexAttribArray(this.perVertexColorShader.aColorIndex);
	gl.vertexAttribPointer(this.perVertexColorShader.aColorIndex, 4, gl.FLOAT, false, 0, 0);

	gl.enable(gl.POLYGON_OFFSET_FILL);

	gl.polygonOffset(1.0, 1.0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

