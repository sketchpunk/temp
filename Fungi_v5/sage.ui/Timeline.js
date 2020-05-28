class Canvas{
	constructor(){
		this.elm	= document.createElement( "canvas" );
		this.ctx	= this.elm.getContext( "2d" );
		this.width	= 0;
		this.height = 0;

		this._font_family	= "monospace";
		this._font_size		= 12;
		this._font_style 	= "";	// normal | italic | oblique | 
		this._font_variant 	= "";	// normal | small-caps
		this._font_weight	= ""; 	// normal | bold | bolder | lighter | 100 to 900\

		this.font_apply();
	}
	// #region METHODS
	fill_color(c){ return this.fill(c).rect( 0, 0, this.width, this.height, 1 ); }
	clear(){ this.ctx.clearRect( 0, 0, this.width, this.height); return this; }
	set_size( w, h ){
		let dpr					= window.devicePixelRatio;
		this.elm.width			= w * dpr;
		this.elm.height			= h * dpr;
		this.elm.style.width	= w + "px";
		this.elm.style.height	= h + "px";
		this.width				= w;
		this.height				= h;
		this.ctx.scale( dpr, dpr );
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////////

	// #region CONTEXT SETTERS
	fill(v){	this.ctx.fillStyle = v; return this; }
	stroke(v){	this.ctx.strokeStyle = v; return this; }
	ln_width(v){ this.ctx.lineWidth = v; return this; }
	
	font_family( v ){ this._font_family = v; return this.font_apply(); }
	font_size( v ){ this._font_size = v; return this.font_apply(); }
	font_weight( v ){ this._font_weight = v; return this.font_apply(); }
	font_apply(){
		this.ctx.font = 
			this._font_style + " " + 
			this._font_variant + " " +
			this._font_weight + " " + 
			this._font_size + "px " +
			this._font_family;
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////////

	// #region DRAWING
	draw( d ){
		if( (d & 1) != 0 ) this.ctx.fill();
		if( (d & 2) != 0 ) this.ctx.stroke();
	}

	text( txt, x=0, y=0, draw=1 ){ 
		//this.ctx.font = "Bold 30px Arial";
		if( (draw & 1) != 0 ) this.ctx.fillText( txt, x, y );
		if( (draw & 2) != 0 ) this.ctx.strokeText( txt, x, y );
		return this;
	}

	rect( x=0, y=0, w=0, h=0, draw=2 ){
		if(!w) w = this.width;
		if(!h) h = this.height;

		this.ctx.beginPath();
		this.ctx.rect( x, y, w, h );
		this.draw( draw );
		return this;
	}

	line( x0, y0, x1, y1 ){
		this.ctx.beginPath();
		this.ctx.moveTo( x0, y0 );
		this.ctx.lineTo( x1, y1 );
		this.ctx.stroke();
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////////
}

let $config = {
	bg_color		: "#424242",
	div_color		: "#323232",
	sub_div_color	: "#383838",
	txt_color		: "#c0c0c0",
	marker_color	: "#00ffff",
};

/*
time-line{ overflow:hidden; display:inline-block; box-sizing:border-box; position:relative; }
time-line canvas{ display:block; position:absolute; left:0px; top:0px; box-sizing:border-box; }
*/

class Timeline extends HTMLElement{
	constructor(){
		super();
		this.total_time		= 10;
		this.current_time	= 3.2;
		this.config			= $config;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.bg = new Canvas();
		this.fg = new Canvas();
		this.appendChild( this.bg.elm );
		this.appendChild( this.fg.elm );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.ro = new ResizeObserver( this._on_resize.bind( this ) );
		this.ro.observe( this );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this._mouse_move_bind =  this._on_mouse_move.bind( this );
		this.addEventListener( "mouseout",	(e)=>{ this.removeEventListener( "mousemove", this._mouse_move_bind ); });
		this.addEventListener( "mouseup",	(e)=>{ this.removeEventListener( "mousemove", this._mouse_move_bind ); });
		this.addEventListener( "mousedown",	(e)=>{ this.addEventListener( "mousemove", this._mouse_move_bind ); });
	}

	// #region SETTERS / GETTERS
	set_time( t ){ this.current_time = t; this.draw_fg(); return this; }
	// #endregion /////////////////////////////////////////////////////////////////

	// #region EVENTS
	_on_mouse_move( e ){
		this.current_time = this.total_time * ( e.layerX / this.fg.width );
		this._draw_fg();
	}
	_on_resize( ary ){
		let w = ary[0].contentRect.width,
			h = ary[0].contentRect.height;

		this.bg.set_size( w, h );
		this.fg.set_size( w, h );
		this._draw_all();
	}
	// #endregion /////////////////////////////////////////////////////////////////

	// #region DRAW
	_draw_all(){
		this._draw_bg();
		this._draw_fg();
	}	

	_draw_fg(){
		let t = this.current_time / this.total_time;

		this.fg.clear()
		this._draw_marker( this.fg.width * t );
	}

	_draw_marker( x ){
		const W = 7;
		const H = 10;
		const Y = 16;

		this.fg
			.stroke( this.config.marker_color )
			.fill( this.config.marker_color )
			.line( x, 0, x, this.fg.height );

		let ctx = this.fg.ctx;
		ctx.beginPath();
		ctx.moveTo( x + W, 0 );
		ctx.lineTo( x + W, H );
		ctx.lineTo( x, Y )
		ctx.lineTo( x, 0 );
		ctx.closePath();
		ctx.fill();
	}

	_draw_bg(){
		const DIV		= 4;
		const TXT_XOFF	= 5;
		const SUB_SCL	= 0.2;

		let bg		= this.bg,
			mt		= bg.ctx.measureText( "0" ),
			len 	= this.total_time * DIV,
			sec_inc	= bg.width / len,
			h		= bg.height,
			sub_y	= h * SUB_SCL,
			txt_y	= (h + mt.actualBoundingBoxAscent) * 0.5,
			x, s, sn, sf ;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		bg	.font_size( 12 )
			.fill_color( this.config.bg_color )
			.fill( "#a0a0a0" )
			.stroke( this.config.div_color );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( let i=0; i < len; i++ ){
			x = i * sec_inc;

			// Basicly a Modulus Operation
			s	= i / DIV;	// What Second are we in.
			sn	= s | 0;	// Floor Seconds
			sf	= s - sn;	// Fraction of the Second

			if( sf ){
				bg.stroke( this.config.sub_div_color )
					.line( x, 0, x, sub_y )
					.line( x, h, x, h-sub_y );
			}else{
				bg.stroke( this.config.div_color )
					.line( x, 0, x, h )
					.text( sn + "s", x + TXT_XOFF, txt_y );
			}
		}
	}
	// #endregion /////////////////////////////////////////////////////////////////
}
window.customElements.define( "time-line", Timeline );

export default Timeline;