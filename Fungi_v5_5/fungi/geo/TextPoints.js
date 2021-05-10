import App, { Draw, Colour } from "../App.js";
import InterleavedFloatArray from "../lib/InterleavedFloatArray.js";

const	INITAL_CNT	= 5;
const	AUTO_EXTEND = 10;
let 	INITIAL		= true;

//###################################################################################
function TextPointsSys( ecs ){
	let c, ary = ecs.query_comp( "TextPoints" );
	if( !ary ) return;
	for( c of ary ) if( c.updated ) c.update();
}

class TextPoints{
	// #region STATIC
	static new_entity( name="TxtPntEntity" ){
		let e = App.mesh_entity( name );
		e.points = new TextPoints();
		e.draw.items.push( e.points.get_draw_item() );
		App.ecs.add_com( e.id, e.points );
		return e;
	}
	// #endregion /////////////////////////////////////////////////////////////

	// #region MAIN
	constructor( ini_cnt=INITAL_CNT, auto_ext=AUTO_EXTEND ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( INITIAL ){
			App.ecs.systems.reg( TextPointsSys, 801 );
			App.shader
				.new( "TextPoints", v_src, f_src, [
                    { name:"bsize", type:"float", value:0.0 },
                    { name:"invert", type:"float", value:0.0 },
                    //{ name:"specular_color", type:"rgb", value:"#ffffff" }
                ], App.ubo.get_array( "Global","Model" ) )
				.set_blend( true )
				.set_alpha_coverage( true )
				.set_cullface( false );
			INITIAL = false;
		}
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MAIN DATA
		this._color			= new Colour();
		this.updated		= true;
		this.material		= App.shader.new_material( "TextPoints" );
		this.default_color	= "red";
		this.default_size	= 0.5;

		this.data = new InterleavedFloatArray([
			{ name:"pos",	size:3 },
			{ name:"color",	size:3 },
			{ name:"size",	size:1 },
			{ name:"char",	size:1 },
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

	add( char, pos, col=this.default_color, size=this.default_size ){
		this.updated = true;
		return this.data.push( pos, this._color.set( col ).rgb, size, char.charCodeAt( 0 ) - 32 );
    }
    
    color( c ){ this.default_color = c; return this; }
    size( v ){ this.default_size = v; return this; }
    border_size( v ){ this.material.set( "bsize", v );  return this; }
    invert( b ){ this.material.set( "invert", ((b)? 1.0 : 0.0) );  return this; }
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
	layout(location=9) in float i_char;

	uniform Global{ 
		mat4 proj_view; 
		mat4 camera_matrix;
		vec3 camera_pos;
		float delta_time;
		vec2 screen_size;
		float clock;
	} global;
	uniform Model{ mat4 view_matrix; } model;

	out vec2 frag_uv;
	flat out vec3 v_color;
	flat out int v_char;

	void main(void){
		vec4 w_pos	= vec4( a_pos, 1.0 ); 

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Spherical billboarding
		vec3 right 	= vec3( global.camera_matrix[0][0], global.camera_matrix[1][0], global.camera_matrix[2][0] ),
			 up		= vec3( global.camera_matrix[0][1], global.camera_matrix[1][1], global.camera_matrix[2][1] ); 
		// up = vec3(0.0, 1.0, 0.0); // Cylindrical

        w_pos.xyz *= i_size;								 // Scale Quad Down
        //w_pos.xyz = vec3( w_pos.x, w_pos.z, -w_pos.y );      // Rotate Up
        w_pos.xyz = ( right * w_pos.x ) + ( up * w_pos.y );  // Rotate vertex toward camera
        w_pos.xyz += i_pos; 
 
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		w_pos		= model.view_matrix * w_pos;
		v_color		= i_color;
		v_char		= int( i_char );
		frag_uv		= a_uv;
		gl_Position	= global.proj_view * w_pos;
	}`;

//-----------------------------------------------
let f_src = `#version 300 es
    precision mediump float;
    
	in      vec2 frag_uv;
	flat in vec3 v_color;
	flat in int  v_char;
    
    uniform float bsize;
    uniform float invert;

    out     vec4 out_color;

    vec4 chars[] = vec4[](
        vec4(0x000000,0x000000,0x000000,0x000000),  // Space 32
        vec4(0x003078,0x787830,0x300030,0x300000),  // Exclamation mark 33
        vec4(0x006666,0x662400,0x000000,0x000000),  // Double quotes 34
        vec4(0x006C6C,0xFE6C6C,0x6CFE6C,0x6C0000),  // HashTag 35
        vec4(0x30307C,0xC0C078,0x0C0CF8,0x303000),  // Dollar 36
        vec4(0x000000,0xC4CC18,0x3060CC,0x8C0000),  // Percent 37
        vec4(0x0070D8,0xD870FA,0xDECCDC,0x760000),  // Ampersand 38
        vec4(0x003030,0x306000,0x000000,0x000000),  // Single quote 39
        vec4(0x000C18,0x306060,0x603018,0x0C0000),  // Open parenthesis 40
        vec4(0x006030,0x180C0C,0x0C1830,0x600000),  // Closing parenthesis 41
        vec4(0x000000,0x663CFF,0x3C6600,0x000000),  // Asterisk 42
        vec4(0x000000,0x18187E,0x181800,0x000000),  // Plus 43
        vec4(0x000000,0x000000,0x000038,0x386000),  // Comma 44
        vec4(0x000000,0x0000FE,0x000000,0x000000),  // Hyphen 45
        vec4(0x000000,0x000000,0x000038,0x380000),  // Period 46
        vec4(0x000002,0x060C18,0x3060C0,0x800000),  // Forward Slash 47
        vec4(0x007CC6,0xD6D6D6,0xD6D6C6,0x7C0000),  // 0 48
        vec4(0x001030,0xF03030,0x303030,0xFC0000),  // 1 49
        vec4(0x0078CC,0xCC0C18,0x3060CC,0xFC0000),  // 2 50
        vec4(0x0078CC,0x0C0C38,0x0C0CCC,0x780000),  // 3 51
        vec4(0x000C1C,0x3C6CCC,0xFE0C0C,0x1E0000),  // 4 52
        vec4(0x00FCC0,0xC0C0F8,0x0C0CCC,0x780000),  // 5 53
        vec4(0x003860,0xC0C0F8,0xCCCCCC,0x780000),  // 6 54
        vec4(0x00FEC6,0xC6060C,0x183030,0x300000),  // 7 55
        vec4(0x0078CC,0xCCEC78,0xDCCCCC,0x780000),  // 8 56
        vec4(0x0078CC,0xCCCC7C,0x181830,0x700000),  // 9 57
        vec4(0x000000,0x383800,0x003838,0x000000),  // Colon 58
        vec4(0x000000,0x383800,0x003838,0x183000),  // Semicolon 59
        vec4(0x000C18,0x3060C0,0x603018,0x0C0000),  // Less than 60
        vec4(0x000000,0x007E00,0x7E0000,0x000000),  // Equals 61
        vec4(0x006030,0x180C06,0x0C1830,0x600000),  // Greater then 62
        vec4(0x0078CC,0x0C1830,0x300030,0x300000),  // Question mark 63
        vec4(0x007CC6,0xC6DEDE,0xDEC0C0,0x7C0000),  // At 64
        vec4(0x003078,0xCCCCCC,0xFCCCCC,0xCC0000),  // A 65
        vec4(0x00FC66,0x66667C,0x666666,0xFC0000),  // B
        vec4(0x003C66,0xC6C0C0,0xC0C666,0x3C0000),  // C
        vec4(0x00F86C,0x666666,0x66666C,0xF80000),  // D
        vec4(0x00FE62,0x60647C,0x646062,0xFE0000),  // E
        vec4(0x00FE66,0x62647C,0x646060,0xF00000),  // F
        vec4(0x003C66,0xC6C0C0,0xCEC666,0x3E0000),  // G
        vec4(0x00CCCC,0xCCCCFC,0xCCCCCC,0xCC0000),  // H
        vec4(0x007830,0x303030,0x303030,0x780000),  // I
        vec4(0x001E0C,0x0C0C0C,0xCCCCCC,0x780000),  // J
        vec4(0x00E666,0x6C6C78,0x6C6C66,0xE60000),  // K
        vec4(0x00F060,0x606060,0x626666,0xFE0000),  // L
        vec4(0x00C6EE,0xFEFED6,0xC6C6C6,0xC60000),  // M
        vec4(0x00C6C6,0xE6F6FE,0xDECEC6,0xC60000),  // N
        vec4(0x00386C,0xC6C6C6,0xC6C66C,0x380000),  // O
        vec4(0x00FC66,0x66667C,0x606060,0xF00000),  // P
        vec4(0x00386C,0xC6C6C6,0xCEDE7C,0x0C1E00),  // Q
        vec4(0x00FC66,0x66667C,0x6C6666,0xE60000),  // R
        vec4(0x0078CC,0xCCC070,0x18CCCC,0x780000),  // S
        vec4(0x00FCB4,0x303030,0x303030,0x780000),  // T
        vec4(0x00CCCC,0xCCCCCC,0xCCCCCC,0x780000),  // U
        vec4(0x00CCCC,0xCCCCCC,0xCCCC78,0x300000),  // V
        vec4(0x00C6C6,0xC6C6D6,0xD66C6C,0x6C0000),  // W
        vec4(0x00CCCC,0xCC7830,0x78CCCC,0xCC0000),  // X
        vec4(0x00CCCC,0xCCCC78,0x303030,0x780000),  // Y
        vec4(0x00FECE,0x981830,0x6062C6,0xFE0000),  // Z 90
        vec4(0x003C30,0x303030,0x303030,0x3C0000),  // Left Bracket 91
        vec4(0x000080,0xC06030,0x180C06,0x020000),  // Back Slash 92
        vec4(0x003C0C,0x0C0C0C,0x0C0C0C,0x3C0000),  // Closing Bracket 93
        vec4(0x10386C,0xC60000,0x000000,0x000000),  // Caret 94
        vec4(0x000000,0x000000,0x000000,0x00FF00),  // Underscore 95
        vec4(0x000000,0x10386C,0xC6C6FE,0x000000),  // Lar ??
        vec4(0x000000,0x00780C,0x7CCCCC,0x760000),  // a 97
        vec4(0x00E060,0x607C66,0x666666,0xDC0000),  // b
        vec4(0x000000,0x0078CC,0xC0C0CC,0x780000),  // c
        vec4(0x001C0C,0x0C7CCC,0xCCCCCC,0x760000),  // d
        vec4(0x000000,0x0078CC,0xFCC0CC,0x780000),  // e
        vec4(0x00386C,0x6060F8,0x606060,0xF00000),  // f
        vec4(0x000000,0x0076CC,0xCCCC7C,0x0CCC78),  // g
        vec4(0x00E060,0x606C76,0x666666,0xE60000),  // h
        vec4(0x001818,0x007818,0x181818,0x7E0000),  // i
        vec4(0x000C0C,0x003C0C,0x0C0C0C,0xCCCC78),  // j
        vec4(0x00E060,0x60666C,0x786C66,0xE60000),  // k
        vec4(0x007818,0x181818,0x181818,0x7E0000),  // l
        vec4(0x000000,0x00FCD6,0xD6D6D6,0xC60000),  // m
        vec4(0x000000,0x00F8CC,0xCCCCCC,0xCC0000),  // n
        vec4(0x000000,0x0078CC,0xCCCCCC,0x780000),  // o
        vec4(0x000000,0x00DC66,0x666666,0x7C60F0),  // p
        vec4(0x000000,0x0076CC,0xCCCCCC,0x7C0C1E),  // q
        vec4(0x000000,0x00EC6E,0x766060,0xF00000),  // r
        vec4(0x000000,0x0078CC,0x6018CC,0x780000),  // s
        vec4(0x000020,0x60FC60,0x60606C,0x380000),  // t
        vec4(0x000000,0x00CCCC,0xCCCCCC,0x760000),  // u
        vec4(0x000000,0x00CCCC,0xCCCC78,0x300000),  // v
        vec4(0x000000,0x00C6C6,0xD6D66C,0x6C0000),  // w
        vec4(0x000000,0x00C66C,0x38386C,0xC60000),  // x
        vec4(0x000000,0x006666,0x66663C,0x0C18F0),  // y
        vec4(0x000000,0x00FC8C,0x1860C4,0xFC0000),  // z 122
        vec4(0x001C30,0x3060C0,0x603030,0x1C0000),  // Opening brace 123
        vec4(0x001818,0x181800,0x181818,0x180000),  // Vertical bar 124
        vec4(0x00E030,0x30180C,0x183030,0xE00000),  // Closing brace 125
        vec4(0x0073DA,0xCE0000,0x000000,0x000000)   // Tilde 126
    );
    
    // Extracts bit b from the given number. Shifts bits right (num / 2^bit) then ANDs the result with 1 (mod(result,2.0)).
    float extract_bit( float n, float b ){
        b = clamp( b, -1.0, 24.0 );
        return floor( mod( floor( n / pow( 2.0, floor(b) ) ), 2.0 ) );   
    }
    
    // Returns the pixel at uv in the given bit-packed sprite.
    float sprite(vec4 spr, vec2 uv){
        uv = 1.0 - uv; // Invert UV else will render mirrored & upside down.

        // Calculate the bit to extract ( x + y * width ) ( flipped on x-axis )
        float bit = 16.0 +                                      // Skip the first 2 bit rows
                    7.0 * uv.x + 1.0 +                          // Skip the first 1 bit of each row, its just space
                    floor( uv.y / (1.0 / 9.0) ) * 8.0;          // How many rows but skip the top row

        return  extract_bit( spr.x, bit - 72.0 ) +
                extract_bit( spr.y, bit - 48.0 ) +
                extract_bit( spr.z, bit - 24.0 ) +
                extract_bit( spr.w, bit - 00.0 );
    }
    
    vec2 map01( float xMin , float xMax, vec2 v ){
        return vec2( (v.x - xMin) / (xMax - xMin),
                     (v.y - xMin) / (xMax - xMin) );
    }

	void main(void){
        //float bsize = 0.15;
        //float invert = 1.0;

        float bmin = bsize;
        float bmax = 1.0 - bsize;
        vec4  ch   = chars[ v_char ];
        
        float alpha = invert;
        
        if( !( frag_uv.x <= bmin || frag_uv.x >= bmax || frag_uv.y <= bmin || frag_uv.y >= bmax ) ){
            vec2 uv = map01( bmin, bmax, frag_uv );
            alpha   = sprite( ch, uv );
            if( invert >= 0.9 ) alpha = 1.0 - alpha;
        }

        out_color   = vec4( v_color, alpha );
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
export default TextPoints;