// Global NVMC Client
// ID 4.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.onTerminate = function () {};

NVMCClient.onConnectionOpen = function () {
    NVMC.log("[Connection Open]");
};

NVMCClient.onConnectionClosed = function () {
    NVMC.log("[Connection Closed]");
};

NVMCClient.onConnectionError = function (errData) {
    NVMC.log("[Connection Error] : " + errData);
};

NVMCClient.onLogIn = function () {
    NVMC.log("[Logged In]");
};

NVMCClient.onLogOut = function () {
    NVMC.log("[Logged Out]");
};

NVMCClient.onNewRace = function (race) {
    NVMC.log("[New Race]");
};

NVMCClient.onPlayerJoin = function (playerID) {
    NVMC.log("[Player Join] : " + playerID);
    this.game.opponents[playerID].color = [0.0, 1.0, 0.0, 1.0];
};

NVMCClient.onPlayerLeave = function (playerID) {
    NVMC.log("[Player Leave] : " + playerID);
};

NVMCClient.onMouseButtonDown = function (button, x, y, event) {
    this.cameras[this.currentCamera].mouseButtonDown(x,y);
};

NVMCClient.onMouseButtonUp = function (button, x, y, event) {
    this.cameras[this.currentCamera].mouseButtonUp();
};

NVMCClient.onMouseMove = function (x, y, event) {
    this.player.mouseMove(event);
    this.cameras[this.currentCamera].mouseMove(event);
};

NVMCClient.onKeyDown = function (keyCode, event) {

    this.player.keyDown(keyCode);
    
    this.cameras[this.currentCamera].keyDown(keyCode);
};

NVMCClient.onKeyUp = function (keyCode, event) {

    if (keyCode == "Z") {
        this.aabbs = !this.aabbs;
	return;
    }
    
    this.player.keyUp(keyCode);
    
    this.cameras[this.currentCamera].keyUp(keyCode);
};

NVMCClient.onKeyPress = function (keyCode, event) {};

NVMCClient.onMouseWheel = function (delta, x, y, event) {};

NVMCClient.onClick = function (button, x, y, event) {};

NVMCClient.onDoubleClick = function (button, x, y, event) {};

NVMCClient.onDragStart = function (button, x, y) {};

NVMCClient.onDragEnd = function (button, x, y) {};

NVMCClient.onDrag = function (button, x, y) {};

NVMCClient.onResize = function (width, height, event) {};

NVMCClient.onAnimate = function (dt) {
    this.ui.postDrawEvent();
};

NVMCClient.onDraw = function () {
    var gl = this.ui.gl;
    this.drawScene(gl);
};
/***********************************************************************/
