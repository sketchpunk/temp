import App 		from "../App.js";


//#########################################################################

class Draw{
	items		= new Array();
	priority	= 500;

	constructor( mesh=null, mat=null, mode=4 ){
		if( mesh instanceof DrawItem) this.items.push( mesh );
		else if( mesh && mat ) this.add( mesh, mat, mode );
	}

	add( mesh, mat, mode=0 ){
		if( mesh instanceof DrawItem)	this.items.push( mesh );
		else 							this.items.push( new DrawItem( mesh, mat, mode ) );
		return this;
	}

	static new_draw_item( mesh, mat, mode=0 ){ return new DrawItem( mesh, mat, mode ); }
}

class DrawItem{
	constructor( mesh, mat, mode=0 ){
		this.mesh		= mesh;
		this.material	= mat;
		this.draw_mode	= mode;
	}
}

//#########################################################################
function draw_priority_sort( a, b ){
	return (a.priority == b.priority) ? 0 :
			(a.priority < b.priority) ? -1 : 1;
}

class DrawSys{
	constructor(){ this.render = App.renderer; }

	run( ecs ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let ary = ecs.query_comp( "Draw", draw_priority_sort );
		if( !ary ) return;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let e, d, di, r = this.render;

		r.begin_frame();

		for( d of ary ){
			//--------------------------------------
			if( !d._active ) continue;

			e = ecs.get_entity( d._entity_id );
			if( !e.active ) continue;

			//console.log( "-- DRAWING", e.name, d.priority );
			//--------------------------------------
			r.load_node( ecs.get_com( e.id, "Node" ) ); // Push Model Matrix to UBO

			r.run_loaders( e );

			for( di of d.items ){
				if( di.mesh.element_cnt == 0 ) continue;
				r.load_material( di.material ).draw( di );
				//console.log( "----- DRAWING", di );
			}
		}

		r.end_frame();
	}
}

//#########################################################################
export default Draw;
export { DrawSys };