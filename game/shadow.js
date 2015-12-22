// Global NVMC Client
// ID 8.0

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.shadowMapTextureTarget = null;
NVMCClient.shadowMatrix = null;
NVMCClient.viewMatrix = null;

updateBBox = function ( bbox, newpoint){
    if(newpoint[0] < bbox[0]) bbox[0] = newpoint[0]; 
    else
	if(newpoint[0] > bbox[3]) bbox[3] = newpoint[0];

    if(newpoint[1] < bbox[1]) bbox[1] = newpoint[1]; 
    else
	if(newpoint[1] > bbox[4]) bbox[4] = newpoint[1];

    if(newpoint[2] < bbox[2]) bbox[2] = newpoint[2]; 
    else
	if(newpoint[2] > bbox[5]) bbox[5] = newpoint[2];

    return bbox;

};

enlargeBBox = function (bbox,perc){
    var center =[];
    center[0] =  (bbox[0]+bbox[3])*0.5;
    center[1] =  (bbox[1]+bbox[4])*0.5;
    center[2] =  (bbox[2]+bbox[5])*0.5;
    
    bbox[0] += (bbox[0] - center[0]) * perc;
    bbox[1] += (bbox[1] - center[1]) * perc;
    bbox[2] += (bbox[2] - center[2]) * perc;
    bbox[3] += (bbox[3] - center[0]) * perc;
    bbox[4] += (bbox[4] - center[1]) * perc;
    bbox[5] += (bbox[5] - center[2]) * perc;
    return bbox;
};

NVMCClient.findMinimumViewWindow = function (bbox, projMatrix){
    var bbox_vs = [];
    
    // corner 0,0,0
    var p = SglMat4.mul4(projMatrix,[bbox[0],bbox[1],bbox[2],1.0]) ;  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = [p[0],p[1],p[2],p[0],p[1],p[2]];

    // corner 1,0,0
    p = SglMat4.mul4(projMatrix,[bbox[3],bbox[1],bbox[2],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

    // corner 1,1,0
    p = SglMat4.mul4(projMatrix,[bbox[3],bbox[4],bbox[2],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


    // corner 0,1,0
    p = SglMat4.mul4(projMatrix,[bbox[0],bbox[4],bbox[2],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


    // corner 0,0,1
    var p = SglMat4.mul4(projMatrix,[bbox[0],bbox[1],bbox[5],1.0]) ;  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

    // corner 1,0,1
    p = SglMat4.mul4(projMatrix,[bbox[3],bbox[1],bbox[5],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

    // corner 1,1,1
    p = SglMat4.mul4(projMatrix,[bbox[3],bbox[4],bbox[5],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


    // corner 0,1,1
    p = SglMat4.mul4(projMatrix,[bbox[0],bbox[4],bbox[5],1]);  
    p = SglVec4.divs(p,p[3]); 
    bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

    return bbox_vs;
};

