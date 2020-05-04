import App		from "../fungi/App.js";
import Ray      from "./Ray.js";
//import Events   from "../fungi/lib/Events.js";

let ray			= new Ray();
let debug		= false;
let initialized = false;

function init( size=null, init_func=null ){
	if( initialized ){ console.log( "RaySystem has already been initialized" ); return this; }
	
	App.gl.canvas.addEventListener( "mousedown", on_click );
	if( size != null) App.events.reg( "mouse_ray", size, true, init_func );

	initialized = true;
	return this;
}

function on_click( e ){
	if( e.button != 2 ) return;	//if Not right click exit
	e.preventDefault(); e.stopPropagation();

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Compute the ray from the screen space mouse position into 3d space
	let pos = App.input.toCoord( e );
	ray.set_screen_mouse( pos[0], pos[1] ).prepare_aabb();

	if( debug ) App.Debug.reset().ln( this.ray.origin, this.ray.end, "red" );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	App.events.emit( "mouse_ray", ray );
}

/*
class RaySystem{
	constructor(){
		this.ray 		= new Ray();
		this.evts 		= new Events();
        this.click_bind	= this.on_click.bind( this );
        this.debug_ray  = false;

		App.gl.canvas.addEventListener( "mousedown", this.click_bind );
	}

	on( func ){ this.evts.on( "ray", func ); return this; }

	on_click( e ){
		if( e.button != 2 ) return;	//if Not right click exit
		e.preventDefault(); e.stopPropagation();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Compute the ray from the screen space mouse position into 3d space
		let pos = App.input.toCoord( e );
        this.ray.set_screen_mouse( pos[0], pos[1] ).prepare_aabb();

		if( this.debug_ray ) App.Debug.reset().ln( this.ray.origin, this.ray.end, "red" );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.evts.emit( "ray", this.ray );
	}
}

export default RaySystem;
*/

export default { 
	init,  ray,
	debug_mode : b=>{ debug = b; return this; },
};