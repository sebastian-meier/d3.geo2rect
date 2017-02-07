export default function(data) {

  //TODO: check if data is in a valid format

  data.features.forEach((d,di) => {
    //Preserve original coordinates
    d.geometry["ocoordinates"] = d.geometry.coordinates;

    //As we can only transform one polygon into a rectangle, we need to get rid of holes and small additional polygons (islands and stuff)
    if(d.geometry.type === "MultiPolygon"){
      //choose the largest polygon
      d.geometry.coordinates = largestPoly(d.geometry);
      d.geometry.type = "Polygon";
    }

    //Getting rid of holes
    if(d.geometry.coordinates.length > 1){
      //We are too lazy to calculate if poly is clockwise or counter-clockwise, so we again just keep the largest poly
      d.geometry.coordinates = largestPoly(d.geometry);
    }

    let b = turf.bbox(d);
    d.geometry["centroid"] = [((b[2]-b[0])/2+b[0]), ((b[1]-b[3])/2+b[3])];

    //Not supported geometries (length<4) we simply duplicate the first point
    //TODO: the new points could be evenly distributed between the existing points
    //TODO: but this only for triangles anyway, anything with (length<3) is actually an error
    if(d.geometry.coordinates[0].length<4){
      while(d.geometry.coordinates[0].length<4){
        d.geometry.coordinates[0].push(d.geometry.coordinates[0][0]);
      }
    }

    let geom = d.geometry.coordinates[0],
      corners = [];

    //Moving through the four corners of the rectangle we find the closest point on the polygon line, making sure the next point is always after the last
    for(let i = 0; i<4; i++){
      
      let corner,
        dist = Number.MAX_VALUE,
        pc;

      switch(i){
        case 0:
          pc = [b[0],b[3]];
        break;
        case 1:
          pc = [b[2],b[3]];
        break;
        case 2:
          pc = [b[2],b[1]];
        break;
        case 3:
          pc = [b[0],b[1]];
        break;
      }

      geom.forEach((dd, ddi) => {
        let t_dist = Math.abs( Math.sqrt( ( Math.pow( ( pc[0] - dd[0] ), 2) + Math.pow( ( pc[1] - dd[1] ) ,2) ) ) );
        if(t_dist < dist && (ddi < corners[0] || ddi > corners[corners.length-1] || corners.length === 0)){
          dist = t_dist;
          corner = ddi;
        }
      });

      if(corners.length >= 1){
        //Counting the points already used up
        let pointCount = 0;
        if(corners.length >= 2){
          for(let j = 1; j<corners.length; j++){
            let c1 = corners[j],
              c2 = corners[j-1],
              numPoints;

            if(c2 < c1){
              numPoints = c1-c2;
            }else{
              numPoints = c1+(geom.length-c2);
            }

            pointCount += numPoints;
          }
        }

        //get numpoints for new potential point
        let c1 = corners[corners.length-1],
          c2 = corner,
          numPoints;

        if(c1 < c2){
          numPoints = c2-c1;
        }else{
          numPoints = c2+(geom.length-c1);
        }
        
        //If there are not enough points left to finish the rectangle go step back
        if(geom.length-numPoints-pointCount < 4-i){ 
          corner -= (4-i);
          if(corner<0){
            corner += geom.length;
          }
        }
      }

      corners.push(corner);
    }

    //NOTE: to myself Outer rings are counter clockwise

    //Finding the closest point to each corner

    let ngeom = {};

    for(let i = 0; i<4; i++){
      let p1, p2, ox, oy;
      switch(i){
        case 0:
          ox = 0; oy = 0;
          p1 = [b[0],b[3]];
          p2 = [b[2],b[3]];
        break;
        case 1:
          ox = 1; oy = 0;
          p1 = [b[2],b[3]];
          p2 = [b[2],b[1]];
        break;
        case 2:
          ox = 1; oy = 1;
          p1 = [b[2],b[1]];
          p2 = [b[0],b[1]];
        break;
        case 3:
          ox = 0; oy = 1;
          p1 = [b[0],b[1]];
          p2 = [b[0],b[3]];
        break;
      }

      let x = p2[0] - p1[0],
        y = p2[1] - p1[1];

      if(x!=0){x = x/Math.abs(x);}
      if(y!=0){y = y/Math.abs(y);}

      y *= -1;

      let c1 = corners[i],
        c2 = (i===corners.length-1)?corners[0]:corners[i+1],
        numPoints;

      if(c1 < c2){
        numPoints = c2-c1;
      }else{
        numPoints = c2+(geom.length-c1);
      }

      for(let j = 0; j<numPoints; j++){
        let tp = c1+j;
        if(tp>(geom.length-1)){
          tp -= geom.length;
        }
        ngeom[tp] = {
          c:d.geometry.centroid,
          x:ox+x/numPoints*j,
          y:oy+y/numPoints*j
        };
      }
    }

    d.geometry['qcoordinates'] = [];

    //Okey, i have no clue why the first point is broken (i=0 > i=1)
    for(let i = 1; i<geom.length; i++){
      if(i===geom.length-1){
        d.geometry.qcoordinates.push(ngeom[0]);
      }else{
        d.geometry.qcoordinates.push(ngeom[i]);
      }
    }

  });

  //polys: d.geometry object (GeoJSON)
  function largestPoly(geom){
    var size = -Number.MAX_VALUE, poly = null;

    //We will select the largest polygon from the multipolygon (this has worked out so far, for your project you might need to reconsider or just provide (single) polygons in the first place)
    for(var c = 0; c<geom.coordinates.length; c++){
      //we are using turf.js area function
      //if you don't want to include the full turf library, turf is build in modular fashion, npm install turf-area
      var tsize = turf.area({
        type:'Feature',
        properties:{},
        geometry:{
          type:'Polygon',
          coordinates:((geom.type === 'MultiPolygon')?[geom.coordinates[c][0]]:[geom.coordinates[c]])
        }
      });

      if(tsize > size){
        size = tsize;
        poly = c;
      }
    }

    return [((geom.type === 'MultiPolygon')?geom.coordinates[poly][0]:geom.coordinates[poly])];
  }
  
  return data;
};