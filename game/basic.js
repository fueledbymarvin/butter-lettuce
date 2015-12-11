// Global NVMC Client
// ID 4.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.myPos = function () {
    return this.game.state.players.me.dynamicState.position;
}
NVMCClient.myOri = function () {
    return this.game.state.players.me.dynamicState.orientation;
}

NVMCClient.myFrame = function () {
    return this.game.state.players.me.dynamicState.frame;
}

/***********************************************************************/

NVMCClient.initMotionKeyHandlers = function () {
    var game = this.game;

    var carMotionKey = {};
    carMotionKey["W"] = function (on) {
	game.playerAccelerate = on;
    };
    carMotionKey["S"] = function (on) {
	game.playerBrake = on;
    };
    carMotionKey["A"] = function (on) {
	game.playerSteerLeft = on;
    };
    carMotionKey["D"] = function (on) {
	game.playerSteerRight = on;
    };
    this.carMotionKey = carMotionKey;
};

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
    this.cameras[this.currentCamera].mouseMove(x,y);
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
