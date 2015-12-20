shadowMapShader = function (gl){
    var shaderProgram = null;

    var vertex_shader = "\
	uniform   mat4 uModelViewMatrix;\n\
	uniform   mat4 uProjectionMatrix;\n\
	uniform   mat4 uShadowMatrix;\n\
	attribute vec3 aPosition;\n\
	varying   vec4 vShadowPosition;\n\
	// any other uniforms, attributes and varyings\n\
\n\
	void main(void)\n\
	{\n\
		vec4 position   = vec4(aPosition, 1.0);\n\
\n\
		// transform vertex to shadow map clip space\n\
		vShadowPosition = uShadowMatrix    * position;\n\
\n\
		// transform vertex as usual to viewer clip space\n\
		gl_Position     = uProjectionMatrix * uModelViewMatrix * position;\n\
	}\n\
	";
    
    var fragment_shader = "\
	precision highp float;\n\
	uniform sampler2D uShadowMap;\n\
	varying vec4      vShadowPosition;\n\
	// any other uniforms and varyings\n\
\n\
	float Unpack(vec4 v){\n\
		return v.x   + v.y / (256.0) + v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);\n\
	}\n\
	bool IsInShadow(){\n\
		// perspective division:\n\
		// from clip space to normalized space [-1..+1]^3\n\
		vec3  normShadowPos = vShadowPosition.xyz / vShadowPosition.w;\n\
\n\
		// from [-1..+1] to [0..+1] (for texture coordinates and stored depth)\n\
		vec3  shadowPos     = normShadowPos * 0.5 + vec3(0.5);\n\
		float Fz = shadowPos.z;\n\
		float Sz = Unpack(texture2D(uShadowMap, shadowPos.xy));\n\
\n\
		// shadow test\n\
		bool  inShadow = (Sz +0.007< Fz);\n\
		return inShadow;\n\
	}\n\
	void main(void)\n\
	{\n\
		if (IsInShadow())\n\
			gl_FragColor=vec4(0.3,0.3,0.3,1.0);\n\
		else\n\
			gl_FragColor=vec4(0.6,0.6,0.6,1.0);\n\
	}\n\
	";

    // create the vertex shader
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertex_shader);
    gl.compileShader(vertexShader);

    // create the fragment shader
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragment_shader);
    gl.compileShader(fragmentShader);

    // Create the shader program
    var aPositionIndex = 0;
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
    gl.linkProgram(shaderProgram);

    shaderProgram.vertex_shader = vertex_shader;
    shaderProgram.fragment_shader = fragment_shader;
    
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	var str = "Unable to initialize the shader program.\n\n";
	str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
	str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
	str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
	alert(str);
    }

    shaderProgram.aPositionIndex = aPositionIndex;
    shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    shaderProgram.uShadowMatrixLocation = gl.getUniformLocation(shaderProgram, "uShadowMatrix");
    shaderProgram.uShadowMapLocation = gl.getUniformLocation(shaderProgram, "uShadowMap");
    return shaderProgram;

};

shadowMapCreateShader = function (gl){
    var shaderProgram = null;

    var vertex_shader = "\
	uniform   mat4 uShadowMatrix;\n\
	attribute vec3 aPosition;\n\
	void main(void)\n\
	{\n\
		gl_Position = uShadowMatrix * vec4(aPosition, 1.0);\n\
	}\n\
	";
    
    var fragment_shader = "\
	precision highp float;\n\
	float Unpack(vec4 v){\n\
		return v.x  + v.y / (256.0 ) + v.z/( 256.0*256.0)+v.w/ ( 256.0*256.0*256.0);\n\
//		return v.x;	\n\
	}\n\
	vec4 pack_depth(const in float d)\n\
	{\n\
		const vec4 bit_shift = vec4( 1.0	, 256.0		,256.0*256.0	,	256.0*256.0*256.0 );\n\
		const vec4 bit_mask  = vec4( 1.0/256.0	, 1.0/256.0	, 1.0/256.0	,	0.0);\n\
		vec4 res = fract(d * bit_shift);\n\
		res -= res.yzwx  * bit_mask;\n\
		return res;\n\
	}\n\
\n\
	void main(void)\n\
	{\n\
	vec4 p = pack_depth(gl_FragCoord.z);\n\
	float d = Unpack(p);\n\
\n\
	gl_FragColor = vec4(p);\n\
	}                              \n\
	";

    // create the vertex shader
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertex_shader);
    gl.compileShader(vertexShader);

    // create the fragment shader
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragment_shader);
    gl.compileShader(fragmentShader);

    // Create the shader program
    var aPositionIndex = 0;
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
    gl.linkProgram(shaderProgram);

    shaderProgram.vertex_shader = vertex_shader;
    shaderProgram.fragment_shader = fragment_shader;
    
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	var str = "Unable to initialize the shader program.\n\n";
	str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
	str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
	str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
	alert(str);
    }

    shaderProgram.aPositionIndex = aPositionIndex;
    shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    shaderProgram.uShadowMatrixLocation = gl.getUniformLocation(shaderProgram, "uShadowMatrix");
    
    return shaderProgram;
};
