import Ray      from "./Ray.js";
import Events   from "../fungi/lib/Events.js";

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