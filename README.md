# d3.geo2rect
## Morphing geojson polygons into rectangles 

![DemoClip](https://raw.githubusercontent.com/sebastian-meier/d3.geo2rect/master/thumb.gif)

The package has two modules: compute (function) and draw (class).
For using this one needs to include the d3 and turf.js library.

## compute

Compute for morphing a geojson into rectangles we need to clean the geojson first. All MultiPolygons will be transformed into Polygons (largest polygon will be used). Holes will be removed. The original data is stored in .geometry.ocoordinates.
Afterwards a second set of coordinates is being generated representing a rectangle. The rectangle has the bounding box 0,0|1,1 so its easy to transform. In addition each coordinate has its centroid in the geo-space stored within. The rectangle coordinates are stored in .geometry.qcoordinates.

```
d3.json('./data/de.geojson', function(err, data){
  var geojson = geo2rect.compute(data);
});
```

## draw

Draw takes care of drawing the data received from the compute function.

Simply create a new draw instance:
```
var g2r = new geo2rect.draw();
```

Send the configs:
```
var config = {
  width : 700,
  height : 700,
  padding : 70,
  projection : d3.geoMercator(),
  duration : 1000,
  key:function(d){return d.properties.Kurz; },
  grid : {
    SH:{x:1,y:0},
    HB:{x:0,y:1},
    HH:{x:1,y:1},
    MV:{x:2,y:1},
    NI:{x:0,y:2},
    BB:{x:1,y:2},
    BE:{x:2,y:2},
    NW:{x:0,y:3},
    ST:{x:1,y:3},
    SN:{x:2,y:3},
    RP:{x:0,y:4},
    HE:{x:1,y:4},
    TH:{x:2,y:4},
    SL:{x:0,y:5},
    BW:{x:1,y:5},
    BY:{x:2,y:5}
  }
};
g2r.config = config;
```
Please note, that this script does not compute the grid layout. See [nmap](https://github.com/sebastian-meier/nmap.js) and [nmap-squared](https://github.com/sebastian-meier/nmap-squared.js) for examples of how to do this automatically.

Then send the computed data from the compute function:
```
g2r.data = geojson;
```

An d3 svg object:
```
g2r.svg = svg.append('g');
```

And then draw the whole thing:
```
g2r.draw();
```

You can simply switch the mode by calling:
```
g2r.toggle();
```

The current mode can be checked via:
```
g2r.mode
```

To update and draw again, simply call the draw function again:
```
g2r.draw();
```

## Examples

In the examples folder you find three examples for the states of Germany and the US as well as London boroughs.

Live examples can be found here:

[Germany](http://prjcts.sebastianmeier.eu/geo2rect/example/index_de.html)
[US](http://prjcts.sebastianmeier.eu/geo2rect/example/index_us.html)
[London](http://prjcts.sebastianmeier.eu/geo2rect/example/index_ldn.html)
[Italy](http://de.straba.us/geo2rect/example/index_it.html)



