reflectionMapPCFShadowShader = function (gl) {
    
    var shaderProgram = gl.createProgram();
    
    shaderProgram.vertex_shader = "\
		uniform   mat4 uModelViewMatrix;                            \n\
		uniform   mat4 uProjectionMatrix;                            \n\
		uniform   mat3  uViewSpaceNormalMatrix; \n\
		uniform   mat4 uShadowMatrix;\n\
		attribute vec3 aPosition;                                       \n\
		attribute vec4 aDiffuse;                                       \n\
		attribute vec4 aSpecular;                                       \n\
		attribute vec4 aAmbient;                                       \n\
		attribute vec3 aNormal;                                       \n\
		varying  vec3 vPos;                                       \n\
		varying  vec3 vNormal;                                       \n\
		varying  vec4 vdiffuse;                                       \n\
		varying  vec4 vambient;                                       \n\
		varying  vec4 vspecular;                                       \n\
		varying vec4 vShadowPosition;\n\
		void main(void)                                                 \n\
		{                                                               \n\
			  // vertex normal (in view space)                                   \n\
			vec4 position   = vec4(aPosition, 1.0);\n\
			vShadowPosition = uShadowMatrix    * position;\n\
			vPos = vec3(uModelViewMatrix * position);\n\
			vspecular= aSpecular;\n\
			vdiffuse= aDiffuse;\n\
			vambient = aAmbient;\n\
			vNormal = normalize( uViewSpaceNormalMatrix *  aNormal);             \n\
			gl_Position = uProjectionMatrix*uModelViewMatrix * vec4(aPosition, 1.0)  ;                         \n\
		}";
    
    shaderProgram.fragment_shader = "\
		precision highp float;                                          \n\
		uniform vec4 uLightDirection;			\n\
		uniform vec3 uLightColor;					\n\
		uniform vec3 uAmbient;						\n\
		uniform mat4 uViewToWorldMatrix; \n\
		uniform  samplerCube uCubeMap; 				\n\
		uniform sampler2D uShadowMap;\n\
		varying  vec3 vPos;                                       \n\
		varying  vec4 vdiffuse;                                       \n\
		varying  vec4 vspecular;                                       \n\
		varying vec4 vambient;\n\
		varying vec3 vNormal;\n\
		varying vec4 vShadowPosition;\n\
		float Unpack(vec4 v){\n\
			return v.x   + v.y / (256.0) + v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);\n\
		}\n\
		float IsInShadow(){\n\
			// perspective division:\n\
			// from clip space to normalized space [-1..+1]^3\n\
			vec3  normShadowPos = vShadowPosition.xyz / vShadowPosition.w;\n\
			\n\
			// from [-1..+1] to [0..+1] (for texture coordinates and stored depth)\n\
			vec3  shadowPos     = normShadowPos * 0.5 + vec3(0.5);\n\
			float Fz = shadowPos.z;\n\
			\n\
			float dx = 1.0/4096.0;\n\
			float dy = 1.0/4096.0;\n\
			float n_shadow = 0.0;\n\
			float Sz = Unpack(texture2D(uShadowMap, shadowPos.xy+vec2(-dx/2.0,-dy/2.0)));\n\
			if ( Sz +0.007< Fz) n_shadow+=1.0;\n\
			Sz = Unpack(texture2D(uShadowMap,  shadowPos.xy+vec2( dx/2.0,-dy/2.0)));\n\
			if ( Sz +0.007< Fz) n_shadow+=1.0;\n\
			Sz = Unpack(texture2D(uShadowMap, shadowPos.xy +vec2( dx/2.0,dy/2.0) ));\n\
			if ( Sz +0.007< Fz) n_shadow+=1.0;\n\
			Sz = Unpack(texture2D(uShadowMap, shadowPos.xy+vec2(-dx/2.0, dy/2.0)));\n\
			if ( Sz +0.007< Fz) n_shadow+=1.0;\n\
			\n\
			return n_shadow/4.0;\n\
		}\n\
		void main(void)                                                 \n\
		{                                                               \n\
		// normalize interpolated normal                         \n\
		vec3 N = normalize(vNormal);                             \n\
				                                                   \n\
		// light vector (positional light)                       \n\
		vec3 L = normalize(-uLightDirection.xyz);                \n\
				                                                   \n\
		// diffuse component                                     \n\
		float NdotL = max(0.0, dot(N, L));                       \n\
		vec3 lambert = (vdiffuse.xyz * uLightColor) * NdotL+vambient.xyz*uLightColor;     \n\
		vec3 reflected_ray = vec3(uViewToWorldMatrix* vec4(reflect(vPos,vNormal),0.0));\n\
		vec4 reflected_color 	= textureCube (uCubeMap,reflected_ray);\n\
		vec4 color = reflected_color*vspecular    + vec4(lambert,1.0);\n\
\n\
 		float shadow = 0.6 + 0.4*(1.0-IsInShadow());\n\
		color.x*=shadow;\n\
		color.y*=shadow;\n\
		color.z*=shadow;\n\
		gl_FragColor = color;\n\
		}                                                               \n\
	";




    // create the vertex shader
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, shaderProgram.vertex_shader);
    gl.compileShader(vertexShader);

    // create the fragment shader
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, shaderProgram.fragment_shader);
    gl.compileShader(fragmentShader);

    // Create the shader program


    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    
    shaderProgram.aPositionIndex = 0;
    shaderProgram.aColorIndex = 1;
    shaderProgram.aNormalIndex = 2;  

    gl.bindAttribLocation(shaderProgram,shaderProgram. aPositionIndex, "aPosition");
    gl.bindAttribLocation(shaderProgram,shaderProgram. aColorIndex, "aColor");
    gl.bindAttribLocation(shaderProgram, shaderProgram.aNormalIndex, "aNormal");

    gl.linkProgram(shaderProgram);
    
    shaderProgram.vertexShader = vertexShader;
    shaderProgram.fragmentShader = fragmentShader;

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	var str = "Unable to initialize the shader program.\n\n";
	str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
	str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
	str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
	alert(str);
    }
    
    shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
    shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
    shaderProgram.uShadowMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uShadowMatrix");
    shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
    shaderProgram.uShadowMapLocation		= gl.getUniformLocation(shaderProgram, "uShadowMap");
    return shaderProgram;
};

