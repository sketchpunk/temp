import Svg			from "./Svg.js";
import Fitcurve		from "../lib/fitcurve.js";

class App{
	// #region MAIN
	sel_color			= "#ff0000";	// Current Color for drawing a line.
	sel_stroke_size 	= 2;

	draw_len_min		= 10**2;		// Min distance points need to be to register as a new point for drawing a line
	curve_smoothness	= 50;			// How sensitive is the curve fitting

	pos_offset_x		= 0;
	pos_offset_y		= 0;
	preview_poly		= null;
	preview_pnts		= new Array();

	mouse_move_bind		= this.svg_mouse_move.bind( this );
	mouse_up_bind		= this.svg_mouse_up.bind( this );
	
	constructor(){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Setup SVG Canvas
		this.svg = new Svg( "pg_canvas" );
		this.svg
			.on( "mousedown", this.svg_mouse_down.bind( this ) )
			.on( "touchstart", this.svg_touch_start.bind( this ) );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	}
	// #endregion ///////////////////////////////////////////////////////

	// #region DRAWING
	clear(){ this.svg.clear(); }

	drawing_start( cx, cy ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Get Starting Position
		let box	= this.svg.svg.getBoundingClientRect(),
			x	= cx - box.left,
			y	= cy - box.top;

		this.pos_offset_x	= box.left;
		this.pos_offset_y	= box.top;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Start Point Saving
		this.preview_pnts.length = 0;
		this.preview_pnts.push( [x, y] );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Preview Line
		this.preview_poly = this.svg.new( "polyline", "fill:none;" );
		this.preview_poly.setAttributeNS( null, "points", x + "," + y );
		this.preview_poly.setAttributeNS( null, "class", "Conn_Dash" );

		//this.svg.circle( x, y, 3 );
	}

	drawing_move( cx, cy ){
		let len 	= this.preview_pnts.length,
			x		= cx - this.pos_offset_x,
			y		= cy - this.pos_offset_y,
			xx		= this.preview_pnts[ len-1 ],
			yy		= this.preview_pnts[ len-2 ];
			
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Limit Point by only drawing the next point X Pixels away
		len = (x-xx)**2 + (y-yy)**2;
		if( len < this.draw_len_min ) return;  
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let pnts = this.preview_poly.getAttributeNS( null, "points" );
		this.preview_poly.setAttributeNS( null, "points", pnts + " " + x + "," + y );
		this.preview_pnts.push( [x, y] );
	}

	drawing_end(){
		if( this.preview_pnts.length > 2 ){
			this.create_smooth_spline( this.preview_pnts );
		}
	}

	create_smooth_spline( pnts, smoothness = this.curve_smoothness ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Use Lib to create a smooth bezier spline out of the array of points
		let ary		= Fitcurve( pnts, smoothness );

		if( ary.length == 0 ) return false;

		let path 	= this.svg.new( "path", `fill:none; stroke:${this.sel_color}; stroke-width:${this.sel_stroke_size};` );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Starting Curve of SVG Spline
		let a = ary[ 0 ];
		let d = `M${a[0][0]},${a[0][1]}C${a[1][0]},${a[1][1]},${a[2][0]},${a[2][1]},${a[3][0]},${a[3][1]}`;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Append the rest of the curves to the spine
		let i=0;
		for( i=1; i < ary.length; i++ ){
			a = ary[ i ];
			d += `C${a[1][0]},${a[1][1]},${a[2][0]},${a[2][1]},${a[3][0]},${a[3][1]}`;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Save it to svg
		path.setAttributeNS( null, "d", d );
		return true;
	}
	// #endregion ///////////////////////////////////////////////////////

	// #region EVENTS
	svg_mouse_down( e ){
		if( e.button == 2 ) return; // Right Click
		if( e.button == 1 ) return; // Middle Click

		this.drawing_start( e.clientX, e.clientY );
		
		this.svg
			.on( "mousemove", this.mouse_move_bind )
			.on( "mouseup", this.mouse_up_bind );
	}

	svg_mouse_move( e ){ this.drawing_move( e.clientX, e.clientY ); }

	svg_mouse_up( e ){
		this.drawing_move( e.clientX, e.clientY  );
		this.drawing_end();
		this.svg
			.off( "mousemove", this.mouse_move_bind )
			.off( "mouseup", this.mouse_up_bind );
	}

	svg_touch_start( e ){
		e.preventDefault();
		let touch = e.changedTouches[ 0 ]; 

		this.drawing_start( touch.clientX, touch.clientY );
		this.svg
			.on( "touchmove", this.touch_move_bind )
			.on( "touchend", this.touch_up_bind );
	}
	
	svg_touch_move( e ){
		e.preventDefault();
		let touch = e.changedTouches[ 0 ]; 
		this.drawing_move( touch.clientX, touch.clientY );
	}

	svg_touch_end( e ){
		this.drawing_move( touch.clientX, touch.clientY );
		this.drawing_end();
		this.svg
			.off( "touchmove", this.touch_move_bind )
			.off( "touchend", this.touch_up_bind );
	}
	// #endregion ///////////////////////////////////////////////////////
}

export default App;