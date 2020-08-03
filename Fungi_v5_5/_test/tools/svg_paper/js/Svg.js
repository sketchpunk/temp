class Svg{
	// #region MAIN
	constructor( elm="pg_canvas" ){
		this.svg = ( typeof elm == "string" )? document.getElementById( elm ) : elm;
	}
	// #endregion ///////////////////////////////////////////////////////////////

	// #region DATA
	new( name, style=null ){
		let elm = document.createElementNS( "http://www.w3.org/2000/svg", name );
		if( style != null ) elm.setAttributeNS( null, "style", style );

		this.svg.appendChild( elm );
		return elm;
	}
	// #endregion ///////////////////////////////////////////////////////////////

	// #region EVENTS
	on( evt_name, fn ){ this.svg.addEventListener( evt_name, fn ); return this; }
	off( evt_name, fn ){ this.svg.removeEventListener( evt_name, fn ); return this; }
	// #endregion ///////////////////////////////////////////////////////////////

	// #region SHAPES

	// https://www.w3schools.com/graphics/svg_circle.asp
	// <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
	circle( x, y, radius=3, style=null ){
		let elm = this.new( "circle", style );
		elm.setAttributeNS( null, "cx", x );
		elm.setAttributeNS( null, "cy", y );
		elm.setAttributeNS( null, "r", radius );
		return elm;
	}

	//https://www.w3schools.com/graphics/svg_line.asp
	//<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />

	// https://www.w3schools.com/graphics/svg_polyline.asp
	// <polyline points="20,20 40,25 60,40 80,120 120,140 200,180" style="fill:none;stroke:black;stroke-width:3" />

	// #endregion ///////////////////////////////////////////////////////////////

	clear(){
		for( let i=this.svg.childNodes.length-1; i >= 0;  i-- ){
			this.svg.removeChild( this.svg.childNodes[i] );
		}
	}
}


//https://svgjs.com/docs/2.7/geometry/#viewbox-as-getter
// If ViewBox size == Svg Size, then Zoom == 1

// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g  Create Groups

// https://stackoverflow.com/questions/48843894/svg-scale-group-from-his-center How to set Transform, Like Translate and Scale

export default Svg;