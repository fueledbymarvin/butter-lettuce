///// Sphere_LatLong
/////
///// Sphere of radius 1 centered at the origin
function TexturedSphere(n, m) {

    this.name = "sphere_latlong";
    
    // vertices definition
    ////////////////////////////////////////////////////////////

    var texture = [];
    var vertices = [];
    for (var i = 0; i <= n; i++) {
        for (var j = 0; j < m; j++) {
            var polar = Math.PI / n * i;
            var azimuth = 2 * Math.PI / m * j;
            vertices.push(
                Math.sin(polar) * Math.cos(azimuth),
                Math.cos(polar),
                Math.sin(polar) * Math.sin(azimuth)
            );
            texture.push(i/n, i/(m-1));
        }
    }
    this.textureCoord = this.textureCoord = new Float32Array(texture);
    this.vertices = new Float32Array(vertices);

    // triangles definition
    ////////////////////////////////////////////////////////////
    
    var triangles = [];
    for (var j = 0; j < m; j++) {
        triangles.push(j, m + j, m + ((j + 1) % m));
        triangles.push(n * m + j, (n-1) * m + j, (n-1) * m + ((j + 1) % m));
    }
    for (var i = 1; i < n; i++) {
        for (var j = 0; j < m; j++) {
            var topLeft = i * m + j;
            var topRight = i * m + ((j + 1) % m);
            var bottomLeft = topLeft + m;
            var bottomRight = topRight + m;
            triangles.push(topLeft, bottomLeft, bottomRight);
            triangles.push(bottomRight, topRight, topLeft);
        }
    }
    this.triangleIndices = new Uint16Array(triangles);
    
    this.numVertices = this.vertices.length/3;
    this.numTriangles = this.triangleIndices.length/3;
}
