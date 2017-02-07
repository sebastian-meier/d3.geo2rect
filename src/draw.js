export default class draw {

  constructor(){
    this._data = null;
    this._svg = null;
    this._col_size = 1;
    this._row_size = 1;
    this._cols = 1;
    this._rows = 1;
    this._init = false;
    this._mode = 'geo';
    this._rPath = d3.line();
    this._path = d3.geoPath();
    this._config = {
      width:null,
      height:null,
      padding:20,
      key:null,
      projection: d3.geoMercator(),
      grid:null,
      duration:500
    };
  }

  update(){
    if(this._data !== null && this._config.width !== null && this._config.height !== null){
      let init_zoom = 200;

      this._config.projection
        .center(d3.geoCentroid(this._data))
        .scale(init_zoom)
        .translate([this._config.width/2, this._config.height/2]);

      this._path.projection(this._config.projection);

      //Calculate optimal zoom

      let bounds = this._path.bounds(this._data),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        scale = Math.max(1, 0.9 / Math.max(dx / (this._config.width-2*this._config.padding), dy / (this._config.height-2*this._config.padding)));

      this._config.projection.scale(scale*init_zoom);

      this._data.features.forEach(f=>{
        f.geometry.qcoordinates.forEach(d=>{
          let pc = this._config.projection(d.c);
          d["pc"] = pc;
        });
      });

      let _this = this;

      this._rPath.x(function(d){
          return (d.x-0.5)*_this._col_size + d.pc[0];
        })
        .y(function(d){
          return (d.y-0.5)*_this._row_size + d.pc[1];
        });
    }

    this._init = true;
  }

  draw(){
    if(this._init){
      let _this = this;
      let tPath = this._svg.selectAll("path")
        .data(this._data.features);
      tPath.exit();
      tPath.enter().append("path")
        .attr('class', function(d){
          return 'id-'+_this.config.key(d);
        });

      this._svg.selectAll("path")
        .transition()
          .duration(this._config.duration)
            .attr('transform', function(d){
              let tx = 0, ty = 0;
              if(_this.mode != 'geo'){
                let g = _this.config.grid[_this.config.key(d)];
                let pc = _this.config.projection(d.geometry.centroid);
                tx = g.ox - pc[0];
                ty = g.oy - pc[1];
              }
              return 'translate('+tx+','+ty+')';
            })
            .attr('d', function(d,i){
              if(_this._mode === 'geo'){
                return _this._path(d);
              }else{
                return _this._rPath(d.geometry.qcoordinates)+"Z";
              }
            });
    }else{
      console.error('You must run update() first.');
    }
  }

  toggle(){
    if(this._mode == 'geo'){
      this._mode = 'rect';
    }else{
      this._mode = 'geo';
    }
  }

  get data(){
    return this._data;
  }

  set data(d){
    if(d){
      this._data = d;
      this.update();
    }
  }

  get mode(){
    return this._mode;
  }

  set mode(m){
    if(m){
      this._mode = m;
    }
  }

  get svg(){
    return this._svg;
  }

  set svg(s){
    if(s){
      this._svg = s;
      this.update();
    }
  }

  get config(){
    return this._config;
  }

  set config(c){
    if(c){
      for(let key in this._config){
        if(this._config[key] === null && !(key in c)){
          console.error('The config object must provide '+key);
        }else if((key in c)){
          this._config[key] = c[key];
        }
      }

      let g = this._config.grid;
      for(let key in g){
        if(g[key].x+1>this._cols){this._cols = g[key].x+1;}
        if(g[key].y+1>this._rows){this._rows = g[key].y+1;}
      }

      this._col_size = (this._config.width-this._config.padding*2)/this._rows;
      this._row_size = (this._config.height-this._config.padding*2)/this._cols;

      if(this._col_size < this._row_size){
        this._row_size = this._col_size;
      }else{
        this._col_size = this._row_size;
      }

      for(var g in this._config.grid){
        this._config.grid[g]['ox'] = this._config.width/2 - this._cols/2*this._col_size + this._config.grid[g].x*this._col_size + this._col_size/2;
        this._config.grid[g]['oy'] = this._config.height/2 - this._rows/2*this._row_size + this._config.grid[g].y*this._row_size + this._row_size/2;
      }

      this.update();
    }
  }

};