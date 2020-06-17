import App 		from "../App.js";
import Renderer	from "./Renderer.js";

//#########################################################################

class Draw{
	items		= new Array();
	priority	= 500;
	add( mesh, mat, mode=0 ){
		this.items.push( new DrawItem( mesh, mat, mode ) );
		return this;
	}
}

class DrawItem{
	constructor( mesh, mat, mode=0 ){
		this.mesh		= mesh;
		this.material	= mat;
		this.draw_mode	= mode;
	}
}

//#########################################################################
class DrawSys{
	constructor(){ 
		this.render = new Renderer();
	}

	run( ecs ){
		/*
		let i, e, d, ary = ecs.query_comp( "Draw", draw_priority_sort, "draw_priority" );
		
		this.render.begin_frame(); // Prepare to start rendering new frame

		for( d of ary ){
			e = ecs.entities[ d.entity_id ];

			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// If entity isn't active Or there are no VAOs in the draw component
			// then continue to the next entity for rendering.
			if( !e.info.active || e.Draw.items.length == 0 ) continue;
			//console.log( e.info.name, e.Draw.priority );
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			//d = e.Draw;
			//if( !d.onDraw ){ // No Custom Manual Control Over Rendering
				
				// Get ModelMatrix sent to GPU plus whatever else
				this.render.load_entity( e );

				// Loop threw all available VAOs to draw
				for( i of d.items ){
					if( i.elm_cnt == 0 ) continue;
					this.render.load_material( i.material );
					this.render.draw( i );
				}

			//}else d.onDraw( this.render, e ); // Run custom Rendering
		}

		this.render.end_frame(); // Prepare to start rendering new frame
		*/
	}
}

function draw_priority_sort( a, b ){
	return (a.priority == b.priority) ? 0 :
			(a.priority < b.priority) ? -1 : 1;
}


//#########################################################################
export default Draw;
export { DrawSys };