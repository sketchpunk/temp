import App, { Draw } from "../App.js";

let MESH = null;
function QuadNS( name, mat ){
	if( !MESH ){
		let buf_idx		= App.buffer.new_element( new Uint16Array( [ 0,1,2, 2,3,0 ] ) );
		let buf_vert	= App.buffer.new_array( new Float32Array(
			[ -1.0,  1.0, 0.0,
			  -1.0, -1.0, 0.0,
			   1.0, -1.0, 0.0, 
			   1.0,  1.0, 0.0, ]
		));

		MESH = App.mesh.from_buffer_config([
            { name: "indices", buffer : buf_idx },
            { name: "vertices", buffer : buf_vert, size : 3, attrib_loc : App.shader.POS_LOC, },
		], "SceneQuad", 6 );
	}

	return App.mesh_entity( name, MESH, mat, App.mesh.TRI );
}

export default QuadNS;