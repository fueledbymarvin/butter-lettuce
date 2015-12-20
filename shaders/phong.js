phongSingleColorPCFShadowShader = function (gl) {

    var shaderProgram = gl.createProgram();
    
    shaderProgram.vertex_shader = "\
precision highp float;     \n\
   \n\
uniform mat4 uProjectionMatrix;     \n\
uniform mat4 uModelMatrix;   \n\
uniform mat4 uModelViewMatrix;\n\
uniform mat4 uShadowMatrix;\n\
uniform mat3 uViewSpaceNormalMatrix;   \n\
uniform vec4    uLightDirection; \n\
attribute vec3 aPosition;  \n\
attribute vec3 aNormal;    \n\
varying vec3 vpos;                                                   \n\
varying vec3 vnormal;\n\
varying vec3 vcolor;\n\
varying vec4 vShadowPosition;\n\
   \n\
void main()    \n\
{  \n\
  // vertex normal (in view space)     \n\
  vnormal = normalize(uViewSpaceNormalMatrix * aNormal); \n\
   \n\
	vec4 position   = vec4(aPosition, 1.0);\n\
        vpos = vec3(uModelViewMatrix * position);                          \n\
	vShadowPosition =  uShadowMatrix    * uModelMatrix *	position;\n\
   \n\
   \n\
   \n\
  // output    \n\
  gl_Position = uProjectionMatrix * uModelViewMatrix *uModelMatrix *position;   \n\
}  \n\
"; 

    shaderProgram.fragment_shader = "\
precision highp float;     \n\
   \n\
varying vec3 vpos;                                                   \n\
varying vec3 vnormal;\n\
varying vec3 vcolor;   \n\
uniform vec4 uLightDirection;\n\
uniform sampler2D uShadowMap;\n\
   \n\
// positional light: position and color\n\
uniform vec3 uLightColor;  \n\
uniform vec4 uColor;    \n\
varying vec4 vShadowPosition;\n\
// shininess exponent                                                \n\
uniform float uShininess;                                            \n\
// amount of ambient component                                       \n\
uniform float uKa;                                                   \n\
// amount of diffuse component                                       \n\
uniform float uKd;                                                   \n\
// amount of specular component                                      \n\
uniform float uKs;                                                   \n\
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
void main()    \n\
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
                // material propertise                                             \n\
                vec3 mat_ambient = uColor.xyz;                            \n\
                vec3 mat_diffuse = uColor.xyz;                            \n\
                vec3 mat_specular= uColor.xyz;                            \n\
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
                vec3 color = uKa*ambient + uKd*diffuse + uKs*specular;  \n\
	float shadow = 0.6 + 0.4*(1.0-IsInShadow());\n\
	color.x*=shadow;\n\
	color.y*=shadow;\n\
	color.z*=shadow;\n\
   gl_FragColor  = vec4(color, 1.0);     \n\
  }  \n\
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
    shaderProgram.aNormalIndex = 2;  
    gl.bindAttribLocation(shaderProgram, shaderProgram.aPositionIndex, "aPosition");
    gl.bindAttribLocation(shaderProgram, shaderProgram.aNormalIndex, "aNormal");
    gl.linkProgram(shaderProgram);
    
    shaderProgram.vertexShader = vertexShader;
    shaderProgram.fragmentShader = fragmentShader;
    
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
        var str = "";
        str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
        str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
        str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
        alert(str);
    }
    

    shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
    shaderProgram.uShadowMatrixLocation = gl.getUniformLocation(shaderProgram,"uShadowMatrix");
    shaderProgram.uModelMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelMatrix");
    shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
    shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
    shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram,"uLightDirection");
    shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram,"uLightColor");
    shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram,"uColor");
    shaderProgram.uShadowMapLocation = gl.getUniformLocation(shaderProgram,"uShadowMap");
    shaderProgram.uKaLocation = gl.getUniformLocation(shaderProgram,"uKa");
    shaderProgram.uKdLocation = gl.getUniformLocation(shaderProgram,"uKd");
    shaderProgram.uKsLocation = gl.getUniformLocation(shaderProgram,"uKs");
    shaderProgram.uShininessLocation = gl.getUniformLocation(shaderProgram,"uShininess");
    
    return shaderProgram;
};
