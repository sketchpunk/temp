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

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Setup Starting Point
	$PntMove
		.add( [0,0,-1] )
		.add( [1,0,0] )
		.add( [0,0,1] )
		.add( [-1,0,0] );

	// Visualize the Spline
	spline_refresh();
}
// #endregion ///////////////////////////////////////////////////////////////////////

// #region EVENTS

// Check if any of the points have been selected.
function on_mouse_ray( info ){ $PntMove.ray_hit( info ); }

// Event when a Point is selected or when all have been deselected.
function on_movepoint_selection( info ){
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
		spline_refresh();
	}
}
// #endregion ///////////////////////////////////////////////////////////////////////

// #region SPLINE
function spline_refresh(){
	spline_load();
	spline_draw();
}

function spline_load(){
	// Reset the spline and feed it new point positions.
	$Spline.clear();
	for( let i=0; i < $PntMove.points.length; i++ ){
		$Spline.add( $PntMove.points[ i ].pos );
	}
}

// Splines are a set of curves, so we are going to loop
// through each curve of the spline, then draw that. We do
// this instead of drawing the whole spline so that we can
// get a better looking rendered line with less edges.
function spline_draw(){
	const STEPS = 5;
	let i, t, v0 = new Vec3(), v1 = new Vec3();
	
	App.Debug.reset();
	$Spline.at_curve( 0, 0, v0 );	// Get the first point of the spline
	
	// Loop through each curve.
	for( let c = 0; c < $Spline.curve_count(); c++ ){
		
		// For Each curve, divide it up by segments.
		for( i=1; i <= STEPS; i++ ){
			t = i / STEPS;						// Normalize Step
			$Spline.at_curve( c, t, v1 );		// At the Curve, Get position at T
			App.Debug.ln( v0, v1, 0xbbbb00 );	// Draw line between This + Prev Point
			v0.copy( v1 );						// Save pos as Prev Position for next iteration
		}
	}
}
// #endregion ///////////////////////////////////////////////////////////////////////

export default {
	init,
	add_point : ()=>{
		// $Spline.is_loop;
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( $PntMove.sel_idx != null ){
			// Create a point between selected and the next one.
			// If its the last point, then between last and prev one.
			let i = $PntMove.sel_idx;
			if( i == $PntMove.last_index ) i--;

			let pos = $Spline.at_curve( i, 0.5 );
			$PntMove.add( pos, i+1 );

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
		$PntMove.set_index( null );
		Notify.msg( "New Point Added" );
		spline_refresh();
		App.request_frame();
	},
};