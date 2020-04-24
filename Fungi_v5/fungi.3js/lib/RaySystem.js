import App, {THREE, Vec3} from "../../fungi.3js/App.js";

let caster 		    = new THREE.Raycaster();
let canvas_size	    = new THREE.Vector2();
let nds 	    	= { x:0, y:0 };
let info 			= {
	ray_origin	: new Vec3(),
	ray_end 	: new Vec3(),
	ray_len		: new Vec3(),
	len 		: 0,
	len_sqr 	: 0,
};

function init(){
	App.canvas.addEventListener( "mouseup", on_click );
	App.events.reg( "mouse_ray", 0, true );
}

function on_click( e ){
	if( e.button != 2 ) return;	//if Not right click exit
	e.preventDefault(); e.stopPropagation();

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Figure out where the mouse in in 2D Space
	let mouse = App.input.toCoord( e );	// Mouse Coord in Relation to Canvas
	App.renderer.getSize( canvas_size );
	
	// Convert to Normalized Device Space
	nds.x =  ( mouse[0] / canvas_size.x ) * 2 - 1;
	nds.y = -( mouse[1] / canvas_size.y ) * 2 + 1;
	
	caster.setFromCamera( nds, App.camera );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	info.ray_origin.from_struct( caster.ray.origin );
	
	info.ray_len.from_struct( caster.ray.direction ).scale( 100 );
	info.ray_end.from_add( info.ray_origin, info.ray_len );

	info.len_sqr	= info.ray_len.len_sqr();
	info.len		= Math.sqrt( info.len_sqr );

	//App.Debug.reset().ln( this.info.ray_origin, this.info.ray_end, 0xff0000 );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	App.events.emit( "mouse_ray", info ); 
}

export default { init, info, };