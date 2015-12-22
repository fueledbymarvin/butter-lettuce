///// Sphere_LatLong
/////
///// Sphere of radius 1 centered at the origin
function Sphere(n) {

    this.name = "sphere_latlong";
    var m = 2*n;

    // vertices definition
    ////////////////////////////////////////////////////////////

    var vertices = [];
    var texture = [];
    for (var i = 0; i <= n; i++) {
        for (var j = 0; j <= m; j++) {
            var polar = Math.PI / n * i;
            var azimuth = 2 * Math.PI / m * j;
            vertices.push(
                Math.sin(polar) * Math.cos(azimuth),
                Math.cos(polar),
                Math.sin(polar) * Math.sin(azimuth)
            );
            texture.push(i/n, j/m);
        }
    }
    this.vertices = new Float32Array(vertices);
    this.textureCoord = new Float32Array(texture);

    // triangles definition
    ////////////////////////////////////////////////////////////
    
    var triangles = [];
    for (var j = 0; j < m; j++) {
        triangles.push(j, (m+1) + j, (m+1) + j + 1);
        triangles.push(n * (m+1) + j, (n-1) * (m+1) + j + 1, (n-1) * (m+1) + j);
    }
    for (var i = 1; i < n; i++) {
        for (var j = 0; j < m; j++) {
            var topLeft = i * (m+1) + j;
            var topRight = i * (m+1) + j + 1;
            var bottomLeft = topLeft + (m+1);
            var bottomRight = topRight + (m+1);
            triangles.push(topLeft, bottomLeft, bottomRight);
            triangles.push(bottomRight, topRight, topLeft);
        }
    }
    this.triangleIndices = new Uint16Array(triangles);
    
    this.numVertices = this.vertices.length/3;
    this.numTriangles = this.triangleIndices.length/3;
}
