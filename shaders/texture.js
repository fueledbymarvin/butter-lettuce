texturePCFShadowShader = function (gl) {
    var vertex_shader = "\
		uniform   mat4 uModelViewMatrix;                            \n\
		uniform   mat4 uModelMatrix;                            \n\
		uniform   mat4 uProjectionMatrix;                            \n\
                uniform mat3 uViewSpaceNormalMatrix;                                 \n\
		uniform   mat4 uShadowMatrix;\n\
		attribute vec3 aPosition;                                       \n\
                attribute vec3 aNormal;                                              \n\
		attribute vec2 aTextureCoords;				\n\
		varying vec2 vTextureCoords;			\n\
		varying   vec4 vShadowPosition;\n\
                varying vec3 vpos;                                                   \n\
                varying vec3 vnormal;                                                \n\
		void main(void)                                                 \n\
		{                                                               \n\
                        // vertex normal (in view space)                                   \n\
                        vnormal = normalize(uViewSpaceNormalMatrix * aNormal);             \n\
			vTextureCoords = aTextureCoords; \n\
			vec4 position   = vec4(aPosition, 1.0);\n\
                        vpos = vec3(uModelViewMatrix * position);                          \n\
			// transform vertex to shadow map clip space\n\
			vShadowPosition = uShadowMatrix * uModelMatrix * position;\n\
			gl_Position = uProjectionMatrix * uModelViewMatrix * uModelMatrix * position;  \n\
		}                                                               \n\
	";
    
    var fragment_shader = "\
		precision highp float;                                          \n\
		uniform sampler2D uTexture;\n\
		uniform sampler2D uShadowMap;\n\
		varying vec2 vTextureCoords;			\n\
		varying vec4 vShadowPosition;\n\
                varying vec3 vnormal;                                                \n\
                varying vec3 vpos;                                                   \n\
                uniform vec4 uLightDirection;                                                \n\
                uniform vec3 uLightColor;                                                \n\
                // shininess exponent                                                \n\
                uniform float uShininess;                                            \n\
                // amount of ambient component                                       \n\
                uniform float uKa;                                                   \n\
                // amount of diffuse component                                       \n\
                uniform float uKd;                                                   \n\
                // amount of specular component                                      \n\
                uniform float uKs;                                                   \n\
                                                                \n\
		float Unpack(vec4 v){\n\
			return v.x   + v.y / (256.0) + v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);\n\
		}\n\
                                                                 \n\
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
                    if ( Sz +0.001< Fz) n_shadow+=1.0;\n\
                    Sz = Unpack(texture2D(uShadowMap,  shadowPos.xy+vec2( dx/2.0,-dy/2.0)));\n\
                    if ( Sz +0.001< Fz) n_shadow+=1.0;\n\
                    Sz = Unpack(texture2D(uShadowMap, shadowPos.xy +vec2( dx/2.0,dy/2.0) ));\n\
                    if ( Sz +0.001< Fz) n_shadow+=1.0;\n\
                    Sz = Unpack(texture2D(uShadowMap, shadowPos.xy+vec2(-dx/2.0, dy/2.0)));\n\
                    if ( Sz +0.001< Fz) n_shadow+=1.0;\n\
                    \n\
                    return n_shadow/4.0;\n\
                }\n\
                 \n\
        void main(void)                                                 \n\
	{  \n\
                // normalize interpolated normal                                   \n\
                vec3 N = normalize(vnormal);	                                     \n\
                                                                     \n\
                // light vector (positional light)                                 \n\
                vec3 L =	normalize(-uLightDirection.xyz);                         \n\
                                                                     \n\
                // vertex-to-eye (view vector)                                     \n\
                vec3 V = normalize(-vpos);                                         \n\
                                                                     \n\
		vec4 color = texture2D(uTexture,vTextureCoords);\n\
                // material propertise                                             \n\
                vec3 mat_ambient = color.xyz;                            \n\
                vec3 mat_diffuse = color.xyz;                            \n\
                vec3 mat_specular= color.xyz;                            \n\
                                                                     \n\
                // ambient component (ambient light is assumed white)              \n\
                vec3 ambient = mat_ambient;                                        \n\
                                                                                   \n\
                // diffuse component                                               \n\
                float NdotL = max(0.0, dot(N, L));                                 \n\
                vec3 diffuse = (mat_diffuse * uLightColor) * NdotL;                \n\
                                                                                   \n\
                // specular component                                              \n\
                vec3 R = (2.0 * NdotL * N) - L;                                    \n\
                float RdotV = max(0.0, dot(R, V));                                 \n\
                float spec = max(0.0, pow(RdotV, uShininess));                     \n\
                vec3 specular = (mat_specular * uLightColor) * spec;               \n\
              	                                                                 \n\
                vec3 finalcolor = uKa*ambient + uKd*diffuse + uKs*specular;  \n\
              	                                                                 \n\
		float shadow = 0.6 + 0.4*(1.0-IsInShadow());\n\
		finalcolor.x*=shadow;\n\
		finalcolor.y*=shadow;\n\
		finalcolor.z*=shadow;\n\
		gl_FragColor = vec4(finalcolor, 1.0);\n\
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

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    
    shaderProgram.aPositionIndex = 0;
    shaderProgram.aNormalIndex = 1;  
    shaderProgram.aTextureCoordIndex = 2;
    
    shaderProgram.vertex_shader = vertex_shader;
    shaderProgram.fragment_shader = fragment_shader;
    
    gl.bindAttribLocation(shaderProgram, shaderProgram.aPositionIndex, "aPosition");
    gl.bindAttribLocation(shaderProgram, shaderProgram.aNormalIndex, "aNormal");
    gl.bindAttribLocation(shaderProgram, shaderProgram.aTextureCoordIndex, "aTextureCoords");
    gl.linkProgram(shaderProgram);
    
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	var str = "Unable to initialize the shader program.\n\n";
	str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
	str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
	str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
	alert(str);
    }
    
    shaderProgram.uModelViewMatrixLocation  = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    shaderProgram.uModelMatrixLocation      = gl.getUniformLocation(shaderProgram, "uModelMatrix");
    shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    shaderProgram.uShadowMatrixLocation     = gl.getUniformLocation(shaderProgram, "uShadowMatrix");
    shaderProgram.uTextureLocation          = gl.getUniformLocation(shaderProgram, "uTexture");
    shaderProgram.uShadowMapLocation        = gl.getUniformLocation(shaderProgram, "uShadowMap");
    shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
    shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram,"uLightDirection");
    shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram,"uLightColor");
    shaderProgram.uKaLocation = gl.getUniformLocation(shaderProgram,"uKa");
    shaderProgram.uKdLocation = gl.getUniformLocation(shaderProgram,"uKd");
    shaderProgram.uKsLocation = gl.getUniformLocation(shaderProgram,"uKs");
    shaderProgram.uShininessLocation = gl.getUniformLocation(shaderProgram,"uShininess");
    
    
    return shaderProgram;
};

textureNormalMapShadowShader = function (gl) {
    var vertexShaderSource = "\
		uniform   mat4 uModelViewMatrix;                            \n\
		uniform   mat4 uProjectionMatrix;                            \n\
		uniform   mat4 uShadowMatrix;\n\
		attribute vec3 aPosition;                                       \n\
		attribute vec2 aTextureCoords;				\n\
		varying vec2 vTextureCoords;			\n\
		varying   vec4 vShadowPosition;\n\
		void main(void)                                                 \n\
		{                                                               \n\
			vTextureCoords = aTextureCoords; \n\
			vec4 position   = vec4(aPosition, 1.0);\n\
			vShadowPosition = uShadowMatrix    * position;\n\
			gl_Position = uProjectionMatrix * uModelViewMatrix * position;  \n\
		}                                                               \n\
	";
    
    var fragmentShaderSource = "\
		precision highp float;                                          \n\
		uniform sampler2D texture; 				\n\
		uniform sampler2D normalMap; 				\n\
		uniform sampler2D uShadowMap;\n\
		uniform vec4	uLightDirection; \n\
		uniform vec4 uColor;                                            \n\
		varying vec2 vTextureCoords;			\n\
		varying vec4 vShadowPosition;\n\
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
			bool  inShadow = (Sz+0.007 < Fz);\n\
			return inShadow;\n\
			}\n\
		void main(void)                                                 \n\
		{                                                               \n\
			vec4 n=texture2D(normalMap, vTextureCoords);          \n\
			n.x =n.x*2.0 -1.0; \n\
			n.y =n.y*2.0 -1.0; \n\
			n.z =n.z*2.0 -1.0; \n\
			vec3 N=normalize(vec3(n.x,n.z,n.y));\n\
			float shade =  dot(-uLightDirection.xyz , N);         \n\
			vec4 color=texture2D(texture, vTextureCoords);          \n\
			color.x = color.x+(1.0-color.x)* color.x ;\n\
			color.y = color.y+(1.0-color.y)* color.y ;\n\
			color.z = color.z+(1.0-color.z)* color.z ;\n\
			if(IsInShadow()){\n\
				\n\
					color.x*=0.6;\n\
					color.y*=0.6;\n\
					color.z*=0.6;\n\
				}\n\
			gl_FragColor = vec4(color.xyz*shade,1.0);          \n\
		}                                                               \n\
	";




    // create the vertex shader
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    // create the fragment shader
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create the shader program

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    
    shaderProgram.aPositionIndex = 0;
    shaderProgram.aTextureCoordIndex = 3;
    
    gl.bindAttribLocation(shaderProgram,shaderProgram. aPositionIndex, "aPosition");
    gl.bindAttribLocation(shaderProgram, shaderProgram.aTextureCoordIndex, "aTextureCoords");
    gl.linkProgram(shaderProgram);
    
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	var str = "Unable to initialize the shader program.\n\n";
	str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
	str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
	str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
	alert(str);
    }
    
    shaderProgram.uModelViewMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    shaderProgram.uProjectionMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    shaderProgram.uShadowMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uShadowMatrix");
    shaderProgram.uColorLocation               		= gl.getUniformLocation(shaderProgram, "uColor");
    shaderProgram.uNormalMapLocation		= gl.getUniformLocation(shaderProgram, "normalMap");
    shaderProgram.uShadowMapLocation		= gl.getUniformLocation(shaderProgram, "uShadowMap");
    shaderProgram.uLightDirectionLocation		= gl.getUniformLocation(shaderProgram, "uLightDirection");
    
    
    
    return shaderProgram;
};
