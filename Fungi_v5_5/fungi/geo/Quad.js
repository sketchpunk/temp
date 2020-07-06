import App, { Draw } from "../App.js";

let MESH = null;
function Quad( name, mat ){
	if( !MESH ){
		let buf_idx		= App.buffer.new_element( new Uint16Array( [ 0,1,2, 2,3,0 ] ) );
		let buf_vert	= App.buffer.new_array( new Float32Array(
			[ -0.5,  0.5, 0.0,	0,0,1,	0,0,
			  -0.5, -0.5, 0.0,	0,0,1,	0,1,
			   0.5, -0.5, 0.0,	0,0,1,	1,1, 
			   0.5,  0.5, 0.0,	0,0,1,	1,0 ]
		));

		MESH = App.mesh.from_buffer_config([
			{ name: "indices", buffer: buf_idx },
			{ name: "quad", buffer: buf_vert, interleaved: [
				{ attrib_loc:0, size:3, stride_len:8 * 4, offset:0 * 4 },
				{ attrib_loc:1, size:3, stride_len:8 * 4, offset:3 * 4 },
				{ attrib_loc:2, size:2, stride_len:8 * 4, offset:6 * 4 },
			]}
		], "FungiQuad", 6 );
		
		//let geo = Quad.geo();
		//MESH = App.mesh.from_data( "FungiQuad", new Float32Array(geo.vert), 3, new Uint16Array(geo.idx), new Float32Array(geo.norm), new Float32Array(geo.uv) );
	}

	return App.mesh_entity( name, MESH, mat, App.mesh.TRI );
	//return App.ecs.new_entity( name, "Node", new Draw( MESH, mat, App.mesh.TRI ) );
}

Quad.geo = function(){
	return {
		uv			: [ 0.0,0.0,   0.0,1.0,   1.0,1.0,   1.0,0.0 ],
		idx 		: [ 0,1,2, 2,3,0 ],
		vert		: [ -0.5, 0.5, 0.0,
						-0.5, -0.5, 0.0,
						0.5, -0.5, 0.0,
						0.5, 0.5, 0.0, ],
		norm		: [ 0,0,1,	0,0,1,	0,0,1,	0,0,1 ],
	};
	/*
	bx0=-0.5, by0=-0.5, bz0=0, bx1=0.5, by1=0.5, bz1=0, stand=true
	return {
		uv			: [ 0.0,0.0,   1.0,0.0,   1.0,1.0,   0.0,1.0 ],
		idx 		: [ 0,1,2, 2,3,0 ],
		vert		: (stand)?
				[ bx0,by0,bz0,   bx1,by0,bz1,   bx1,by1,bz0,   bx0,by1,bz0 ] :
				[ bx0,by0,bz0,   bx0,by0,bz1,   bx1,by1,bz1,   bx1,by1,bz0 ],
		norm		: [ 0,0,1,	0,0,1,	0,0,1,	0,0,1 ],
	};
	*/
}

export default Quad;