import App, {Vec3} 	from "../../fungi.3js/App.js";
import Gizmo		from "../../fungi.3js/ecs/Gizmo.js";
import MovePoints	from "../../fungi.3js/ecs/MovePoints.js";
import RaySystem	from "../../fungi.3js/lib/RaySystem.js";
import Spline		from "../../fungi/maths/Spline.js";

import Notify		from "../../sage.ui/Notify.js";

// #region MAIN
let $PntEntity,
	$PntMove,
	$Spline,
	$GizEntity,
	$Gizmo;

let $line_color = 0xbbbb00;

function init(){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Activate Systems
	RaySystem.init();	// Simple System that handles Computes a ray on mouse Click then dispatches event
	MovePoints.init();	// Create Entities that manages & renders groups of points
	Gizmo.init();		// System that handles the Translation Gizmo.

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Event Handlers
	App.events
		.on( "mouse_ray", on_mouse_ray )
		.on( "movepoint_selection", on_movepoint_selection )
		.on( "gizmo_drag_state", on_gizmo_drag_state )
		.on( "gizmo_drag_move", on_gizmo_drag_move );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Setup Global Variables of Entities + Objects
	$GizEntity		= Gizmo.$();					// Gizmo Entity
	$Gizmo			= $GizEntity.Gizmo;				// Ref to Gizmo Component
	$PntEntity		= MovePoints.$( "Drag" );		// Move Point Entity
	$PntMove	 	= $PntEntity.MovePoints;		// Ref to MovePoint Component
	$Spline			= Spline.from_hermite( true );	// Hermite Spline

	$PntMove.ray_range = 0.1; // Increase Range.

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Setup Starting Point
	// $PntMove.serialize();
	// Visualize the Spline
	reset();
}
// #endregion ///////////////////////////////////////////////////////////////////////

// #region EVENTS

// Check if any of the points have been selected.
function on_mouse_ray( info ){ $PntMove.ray_hit( info ); }

// Event when a Point is selected or when all have been deselected.
function on_movepoint_selection( info ){
	//console.log( "onsel", info );
	if( info.state == null || info.state == MovePoints.DESELECTED ) $Gizmo.hide();
	else $Gizmo.show( info.pos );
}

// When the Gizmo starts dragging, it uses the "LEFT MOUSE" events, because of this
// We need to tell the camera controller to stop listening to mouse events
function on_gizmo_drag_state( is_drag ){ App.cam_ctrl.active = !is_drag; }

// When the gizmo moves, Copy the location to the point that currently selected.
function on_gizmo_drag_move( pos ){
	if( $PntMove.sel_idx != null ){
		$PntMove.move( pos );
		update();
	}
}
// #endregion ///////////////////////////////////////////////////////////////////////

// #region SPLINE
function spline_load(){
	// Reset the spline and feed it new point positions.
	$Spline.clear();
	//$Spline.is_loop = false;
	let p;
	for( p of $PntMove.points ) $Spline.add( p.pos, p.data );
}

// Splines are a set of curves, so we are going to loop
// through each curve of the spline, then draw that. We do
// this instead of drawing the whole spline so that we can
// get a better looking rendered line with less edges.
function spline_draw(){
	App.Debug.reset();
	if( $Spline.point_count() == 0 ) return;

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	const STEPS = 5;
	let i, t, v0 = new Vec3(), v1 = new Vec3();
	$Spline.at_curve( 0, 0, v0 );	// Get the first point of the spline
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Loop through each curve.
	for( let c = 0; c < $Spline.curve_count(); c++ ){
		// For Each curve, divide it up by segments.
		for( i=1; i <= STEPS; i++ ){
			t = i / STEPS;							// Normalize Step
			$Spline.at_curve( c, t, v1 );			// At the Curve, Get position at T
			App.Debug.ln( v0, v1, $line_color );	// Draw line between This + Prev Point
			v0.copy( v1 );							// Save pos as Prev Position for next iteration
		}
	}
}
// #endregion ///////////////////////////////////////////////////////////////////////

// #region MISC
function update( msg=null ){
	spline_load();
	spline_draw();
	if( msg ) Notify.msg( msg );
}

function reset(){
	$PntMove
		.clear()
		.add( [0,0,-1] )
		.add( [1,0,0] )
		.add( [0,0,1] )
		.add( [-1,0,0] );

	update();
	App.request_frame();
}
// #endregion ///////////////////////////////////////////////////////////////////////


export default {
	init, reset, update,

	add_point : ()=>{
		// $Spline.is_loop;
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( $PntMove.sel_idx != null ){
			// Create a point between selected and the next one.
			// If its the last point, then between last and prev one.
			let pos,
				sel_idx		= $PntMove.sel_idx,
				last_idx	= $PntMove.last_index;

			if( $Spline.is_loop ){
				pos = $Spline.at_curve( sel_idx, 0.5 );
				$PntMove.set_index( null ).add( pos, sel_idx + 1 );
			}else{
				//-------------------------------------
				// First point, Just lerp between that and the next point
				if( sel_idx == 0 ){
					let a = $Spline.points[ 0 ].pos,
						b = $Spline.points[ 1 ].pos;

					pos = Vec3.lerp( a, b, 0.5 );
					$PntMove.set_index( null ).add( pos, 1 );

				//-------------------------------------
				// If last point, lerp between last and previous point
				}else if( sel_idx == last_idx ){
					let a = $Spline.points[ last_idx ].pos,
						b = $Spline.points[ last_idx-1 ].pos;

					pos = Vec3.lerp( a, b, 0.5 );
					$PntMove.set_index( null ).add( pos, last_idx );
				
				//-------------------------------------
				// Actual Curve
				}else{
					pos	= $Spline.at_curve( sel_idx-1, 0.5 );
					$PntMove.set_index( null ).add( pos, sel_idx + 1 );
				}
			}
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		}else{
			// Nothing selected, Grab the last two points to determine
			// the direction, then create a point moving away from
			// the last point.
			let i		= $PntMove.last_index,
				posA	= $PntMove.get_pos( i ),
				posB	= $PntMove.get_pos( i-1 ),
				final 	= Vec3.sub( posA, posB ).norm().scale( 0.2 ).add( posA );

			$PntMove.add( final );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		update( "New Point Added" );
		App.request_frame();
	},

	remove_point : ()=>{
		if( $PntMove.count <= 4 ){ Notify.err( "Can not delete point, curve needs at least 4 points." ); return this; }
		if( $PntMove.sel_idx == null ){ Notify.err( "No point selected for removing." ); return this; }

		$PntMove.remove( $PntMove.sel_idx );
		update( "Point Deleted Added" );
		App.request_frame();
	},

	get_point : ( idx=null )=>{ return $PntMove.get( idx ); },

	toggle_loop : ()=>{
		$Spline.is_loop = !$Spline.is_loop;
		spline_draw();
		App.request_frame();
		return this;
	},

	save_local : ()=>{
		let txt = $PntMove.serialize();
		localStorage.setItem( "path", txt );
		Notify.msg( "Path saved to localStorage" );
	},

	load_local : ()=>{
		let txt = localStorage.getItem( "path" );
		if( txt ){
			$PntMove.deserialize( txt );
			update( "Curve has been loaded." );
			App.request_frame();
		}
	},
};