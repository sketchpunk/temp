import App, { Draw, Colour }	from "../App.js";
import InterleavedFloatArray	from "../lib/InterleavedFloatArray.js";

const	INITAL_CNT	= 5;
const	AUTO_EXTEND = 10;
let 	INITIAL		= true;

//###################################################################################
function PointsSys( ecs ){
	let c, ary = ecs.query_comp( "Points" );
	if( !ary ) return;
	for( c of ary ) if( c.updated ) c.update();
}

class Points{
	// #region STATIC
	static new_entity( name="PntEntity" ){
		let e = App.mesh_entity( name );
		e.points = new Points();
		e.draw.items.push( e.points.get_draw_item() );
		App.ecs.add_com( e.id, e.points );
		return e;
	}

	// #endregion /////////////////////////////////////////////////////////////

	// #region MAIN
	constructor( ini_cnt=INITAL_CNT, auto_ext=AUTO_EXTEND ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( INITIAL ){
			App.ecs.systems.reg( PointsSys, 801 );
			App.shader
				.new( "PointShapes", v_src, f_src, null, App.ubo.get_array( "Global","Model" ) )
				.set_blend( true )
				.set_alpha_coverage( true )
				.set_cullface( false );
			INITIAL = false;
		}
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MAIN DATA
		this.color			= new Colour();
		this.updated		= true;
		this.material		= App.shader.new_material( "PointShapes" );
		this.default_color	= "red";
		this.default_size	= 0.5;
		this.default_shape	= 1;

		this.data = new InterleavedFloatArray([
			{ name:"pos",	size:3 },
			{ name:"color",	size:3 },
			{ name:"size",	size:1 },
			{ name:"shape",	size:1 },
		], ini_cnt, auto_ext );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MESH
		let buf_idx		= App.buffer.new_element( new Uint16Array( [ 0,1,2, 2,3,0 ] ) );
		let buf_vert	= App.buffer.new_array( new Float32Array(
			[ -0.5,  0.5, 0.0,	0,0,1,	0,0,
			  -0.5, -0.5, 0.0,	0,0,1,	0,1,
			   0.5, -0.5, 0.0,	0,0,1,	1,1, 
			   0.5,  0.5, 0.0,	0,0,1,	1,0 ]
		));

		this.buf	= App.buffer.new_empty_array( this.data.byte_capacity, false );
		
		this.mesh 	= App.mesh.from_buffer_config([
			{ name: "indices", buffer: buf_idx },
			{ name: "quad", buffer: buf_vert, interleaved: [
				{ attrib_loc:0, size:3, stride_len:8 * 4, offset:0 * 4 },
				{ attrib_loc:1, size:3, stride_len:8 * 4, offset:3 * 4 },
				{ attrib_loc:2, size:2, stride_len:8 * 4, offset:6 * 4 },
			]},
			{ name: "inst", buffer: this.buf, instanced:true, interleaved: this.data.generate_config( 6, true ) },
		], "PointShapes", 6 );
	}
	// #endregion /////////////////////////////////////////////////////////////

	// #region METHODS
	get_draw_item(){ return Draw.new_draw_item( this.mesh, this.material, 4 ); }
	
	reset(){
		this.data.reset();
		this.mesh.instance_cnt	= 0
		this.updated			= true;
	}

	add( a, col=this.default_color, size=this.default_size, shape=this.default_shape ){
		this.updated = true;
		return this.data.push( a, this.color.set( col ).rgb, size, shape );
	}
	// #endregion /////////////////////////////////////////////////////////////

	// #region HELPERS
	update(){
		if( !this.updated ) return this;
		this.mesh.instance_cnt	= this.data.len;
		this.updated			= false;

		// Update the GPU buffers with the new data.
		if( this.mesh.instance_cnt > 0 ){
			App.buffer.update_data( this.buf, this.data.buffer );
		}
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////
}

//###################################################################################

// https://github.com/glslify/glsl-circular-arc
// http://www.opengl-tutorial.org/intermediate-tutorials/billboards-particles/billboards/
let v_src = `#version 300 es
	layout(location=0) in vec3 a_pos;
	layout(location=1) in vec3 a_norm;
	layout(location=2) in vec2 a_uv;

	layout(location=6) in vec3 i_pos;
	layout(location=7) in vec3 i_color;
	layout(location=8) in float i_size;
	layout(location=9) in float i_shape;

	uniform Global{ 
		mat4 proj_view; 
		mat4 camera_matrix;
		vec3 camera_pos;
		float delta_time;
		vec2 screen_size;
		float clock;
	} global;
	uniform Model{ mat4 view_matrix; } model;

	out vec2 v_uv;
	flat out vec3 v_color;
	flat out int v_shape;

	void main(void){
		vec4 w_pos	= vec4( a_pos, 1.0 ); 

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Spherical billboarding
		vec3 right 	= vec3( global.camera_matrix[0][0], global.camera_matrix[1][0], global.camera_matrix[2][0] ),
			 up		= vec3( global.camera_matrix[0][1], global.camera_matrix[1][1], global.camera_matrix[2][1] ); 
		// up = vec3(0.0, 1.0, 0.0); // Cylindrical

		w_pos.xyz *= i_size;										// Scale Quad Down
		w_pos.xyz  = i_pos + ( right * w_pos.x ) + ( up * w_pos.y ); // Rotate vertex toward camera
 
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		w_pos		= model.view_matrix * w_pos;
		v_color		= i_color;
		v_shape		= int( i_shape );
		v_uv		= a_uv;
		gl_Position	= global.proj_view * w_pos;
	}`;


//-----------------------------------------------
let f_src = `#version 300 es
	precision mediump float;

	#define PI	3.14159265359
	#define PI2	6.28318530718

	in vec2 v_uv;
	flat in vec3 v_color;
	flat in int v_shape;
	out vec4 out_color;

	float circle(){ 
		//return smoothstep( 0.5, 0.45, length( v_uv - vec2(0.5) ) );
		
		//float len = length( v_uv - vec2(0.5) );
		//float delta = fwidth( len );
		//return smoothstep( 0.5, 0.5-delta, len );

		vec2 coord		= v_uv * 2.0 - 1.0;
		float radius	= dot( coord, coord );
		float dxdy 		= fwidth( radius );
		return smoothstep( 0.90 + dxdy, 0.90 - dxdy, radius );
	}

	float ring(){ 
		vec2 coord		= v_uv * 2.0 - 1.0;
		float radius	= dot( coord, coord );
		float dxdy 		= fwidth( radius );
		return	smoothstep( 0.2 - dxdy, 0.2 + dxdy, radius ) - 
				smoothstep( 1.0 - dxdy, 1.0 + dxdy, radius );
	}

	float diamond(){
		// http://www.numb3r23.net/2015/08/17/using-fwidth-for-distance-based-anti-aliasing/
		const float radius = 0.5;
		//vec2 coord = v_uv - vec2(0.5);
		//float dst = dot( abs(coord), vec2(1.0) );
		//return 1.0 - step( radius, dst );

		float dst = dot( abs(v_uv-vec2(0.5)), vec2(1.0) );
		float aaf = fwidth( dst );
		return 1.0 - smoothstep( radius - aaf, radius, dst );
	}

	float poly( int sides, float offset, float scale ){
		// https://thebookofshaders.com/07/
		vec2 coord = v_uv * 2.0 - 1.0;
		
		coord.y += offset;
		coord *= scale;

		float a = atan( coord.x, coord.y ) + PI; // Angle of Pixel
		float r = PI2 / float( sides ); // Radius of Pixel
		float d = cos( floor( 0.5 + a / r ) * r-a ) * length( coord );
		float f = fwidth( d );
		return smoothstep( 0.5, 0.5 - f, d );
	}

	void main(void){
		float alpha = 1.0;

		if( v_shape == 1 ) alpha = circle();
		if( v_shape == 2 ) alpha = diamond();
		if( v_shape == 3 ) alpha = poly( 3, 0.2, 1.0 );		// Triangle
		if( v_shape == 4 ) alpha = poly( 5, 0.0, 0.65 ); 	// Pentagram
		if( v_shape == 5 ) alpha = poly( 6, 0.0, 0.65 );	// Hexagon
		if( v_shape == 6 ) alpha = ring();

		out_color = vec4( v_color, alpha );
	}`;


/*
	How to scale at the same rate

	camera_adjust( e ){
		let vEye	= Vec3.sub( App.camera.Node.local.pos, e.Node.local.pos ),
			eyeLen 	= vEye.len(),
			scl 	= e.Node.local.scl;

		vEye.norm();
		scl.set( 1, 1, 1 ).scale( eyeLen / GizmoSystem.CameraScale );

		if( Vec3.dot( vEye, Vec3.LEFT )		< GizmoSystem.MinAdjust )	scl.x *= -1;
		if( Vec3.dot( vEye, Vec3.FORWARD )	< GizmoSystem.MinAdjust )	scl.z *= -1;
		if( Vec3.dot( vEye, Vec3.UP )		< GizmoSystem.MinAdjust )	scl.y *= -1;
		
		e.Node.isModified = true;
	}
*/

//###################################################################################
export default Points;