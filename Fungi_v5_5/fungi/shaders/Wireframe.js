import App from "../App.js";

let SHADER_INIT = false;

class Wireframe{
    static init(){ init_shader(); }

	static append_tri( draw, idx, vert, uniforms=null ){
        if( !SHADER_INIT ) init_shader();

		let verts	= this.from_tri( idx, vert );
		let mesh	= App.mesh.from_data( "wf_mesh", verts, 4 );
		let mat 	= App.shader.new_material( "Wireframe", uniforms );
		draw.add( mesh, mat, App.mesh.TRI );
    }
    
	static append_tri_strip( draw, idx, vert, uniforms=null ){
        if( !SHADER_INIT ) init_shader();

		let verts	= this.from_tri_strip( idx, vert );
		let mesh	= App.mesh.from_data( "wf_mesh", verts, 4 );
		let mat 	= App.shader.new_material( "Wireframe", uniforms );
		draw.add( mesh, mat, App.mesh.TRI );
	}

	static from_tri_strip( idx, vert ){
		let out		= new Array();
		let a, b, c, d;

		for( let i=0; i < idx.length; i+=2 ){  // Every Two Index shifts to the start of the next quad
			// Skip Degenerate Triangles
			if( idx[ i+1 ] == idx[ i+2 ] ) continue;

			// TriStrip is a Upside Down N Pattern, with the quad having
			// the dividing line's top pointing forward.  |/|/|/|
			a = idx[ i ]	* 3; // Mul 3 to office to flat vertex index
			b = idx[ i+1 ]	* 3;
			c = idx[ i+2 ]	* 3;
			d = idx[ i+3 ]	* 3;

			out.push(
				vert[ a ], vert[ a+1 ], vert[ a+2 ], 0,	// Left Triangle Verts
				vert[ b ], vert[ b+1 ], vert[ b+2 ], 1,
				vert[ c ], vert[ c+1 ], vert[ c+2 ], 2,

				vert[ d ], vert[ d+1 ], vert[ d+2 ], 0,	 // Right Triangle Verts
				vert[ c ], vert[ c+1 ], vert[ c+2 ], 1,
				vert[ b ], vert[ b+1 ], vert[ b+2 ], 2,
			);
		}

		return  new Float32Array( out );
	}

	static from_tri( idx, vert ){
		let out = new Array();
		let a, b, c;

		for( let i=0; i < idx.length; i+=3 ){
			a = idx[ i ]	* 3; // Mul 3 to office to flat vertex index
			b = idx[ i+1 ]	* 3;
			c = idx[ i+2 ]	* 3;

			out.push(
				vert[ a ], vert[ a+1 ], vert[ a+2 ], 0,
				vert[ b ], vert[ b+1 ], vert[ b+2 ], 1,
				vert[ c ], vert[ c+1 ], vert[ c+2 ], 2,
			);
		}

		return new Float32Array( out );
	}
}

function init_shader(){
	App.shader.new( "Wireframe", VERT_SRC, FRAG_SRC, [
		{ name:"line_scale", type:"float", value:"1.0" },
		{ name:"line_color", type:"rgba", value:"#000000ff" },
		{ name:"face_color", type:"rgba", value:"#70707099" },
	], App.ubo.get_array( "Global", "Model" ) )
    .set_blend( true ).set_alpha_coverage( true ).set_cullface( false );
    SHADER_INIT = true;
}


const VERT_SRC = `#version 300 es
	layout(location=0) in vec4 a_pos;

	uniform Global{ 
		mat4 proj_view; 
		mat4 camera_matrix;
		vec3 camera_pos;
		float delta_time;
		vec2 screen_size;
		float clock;
	} global;

	uniform Model{ 
		mat4 view_matrix;
	} model;

	out vec3 bary_coord;

	void main(void){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		int idx = int( a_pos.w );
		if( idx == 0 )		bary_coord = vec3( 1.0, 0.0, 0.0 );
		else if( idx == 1)	bary_coord = vec3( 0.0, 1.0, 0.0 );
		else 				bary_coord = vec3( 0.0, 0.0, 1.0 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		vec4 wpos	= model.view_matrix * vec4( a_pos.xyz, 1.0 );
		gl_Position = global.proj_view * wpos;
	}`;

const FRAG_SRC = `#version 300 es
precision mediump float;
	
	out vec4 out_color;
	in vec3 bary_coord;

	//------------------------

	//const float uLineWidth = 0.005;
	//const float uFeather = 0.003;
	//const vec4 line_color = vec4(0.0,0.0,0.0,1.0);
	//const vec4 face_color = vec4(0.5,0.5,0.5,0.8);

	uniform vec4 line_color;
	uniform vec4 face_color;
	uniform float line_scale;
	
	float edge_factor(){
		vec3 d	= fwidth( bary_coord );
		vec3 a3	= smoothstep( vec3( .0 ), d * line_scale, bary_coord );
		return min( min( a3.x, a3.y ), a3.z );
	}

	//-------------------------

	void main( void ){
		// simple
		if( any( lessThan( bary_coord, vec3( 0.01 )) ) ){
			out_color = line_color;
		}else{
		    out_color = face_color;
		}

		//out_color = vec4( 1.0, .0, .0, 1.0 );

		//Set line width that always stays the same no matter the zoom.
		out_color = mix( line_color, face_color, edge_factor() );

		//How to set width and feathing, gets bigger/smaller based on zoom.
		//vec3 bcMix = smoothstep(vec3(uLineWidth),vec3(uLineWidth + uFeather),vBaryCoord);
		//float cmix = min(min(bcMix.x, bcMix.y), bcMix.z);
		//outColor = mix(uLineColor, uFaceColor, cmix);
    }`;
    
export default Wireframe;