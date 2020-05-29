import App, { Vao, Buf, Mesh } from "../../App.js";

/*	
	let verts	= new Float32Array( [ 1,0,1, 1,0,0, 0,0,0 ] );
	let idx		= new Uint16Array( [ 0,1,2 ] );
	let e		= DynamicMesh.$( "dm", App.new_mat("LowPoly"), 3, 3 );
	e.DynamicMesh
		.update_verts( verts )
		.update_index( idx );
*/

class DynamicMesh{
	static $( name, mat, vert_cnt, elm_cnt=null, draw_mode=4 ){
		let e = App.$Draw( name );
		let c = e.add_com( "DynamicMesh" ).init( vert_cnt, elm_cnt );

		e.Draw.add( c.mesh, mat, draw_mode );
		return e;
	}

	constructor(){
		this.mesh = null;
	}

	init( vert_cnt=0, elm_cnt=null ){
		let v	= new Vao().bind();
		let m	= new Mesh(); 
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let blen = vert_cnt * 3 * 4; // Vert Count * 3 Comp(xyz) * 4 Bytes Per Component;
		m.buf.vert = Buf.empty_array( blen, 3, false, false );
		v.add_buf( m.buf.vert, App.Shader.POS_LOC );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( elm_cnt != null ){
			blen		= elm_cnt * 2; // If Uint16, just 2 bytes per index.
			m.buf.idx	= Buf.empty_element( blen, false, false );
			v.add_indices( m.buf.idx );
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Vao.unbind_all();
		this.mesh = m.set( v );
		return this;
	}

	update_verts( tary ){
		this.mesh.buf.vert.update( tary );
		if( !this.mesh.buf.idx ) this.mesh.elm_cnt = tary.length / 3;
		return this;
	}

	update_index( tary ){
		if( !this.mesh.buf.idx ){ console.error( "Dynamic Mesh does not have an index buffer" ); return this; }
		this.mesh.buf.idx.update( tary );
		this.mesh.elm_cnt = tary.length;
		return this;
	}
} App.Components.reg( DynamicMesh );

/*
as_pnt(){ this.mesh.draw }
Mesh.PNT		= 0;
Mesh.LINE		= 1;
Mesh.LINE_LOOP	= 2;
Mesh.LINE_STRIP	= 3;
Mesh.TRI		= 4;
Mesh.TRI_STRIP	= 5;
*/

export default DynamicMesh;