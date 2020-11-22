import App from "../fungi/App.js";

// #region SHADER BASE
const VERT_SRC = `#version 300 es
layout(location=0) in vec3 a_pos;

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

out vec3 frag_to_cam;
out vec3 frag_wpos;

void main(void){
    vec4 wpos       = model.view_matrix * vec4( a_pos, 1.0 );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    frag_wpos       = wpos.xyz;
    frag_to_cam     = frag_wpos- global.camera_pos;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    gl_Position = global.proj_view * wpos;

}`;

const FRAG_SRC = `#version 300 es
precision mediump float;

out vec4 out_color;

//-------------------------

uniform vec4 base_color;

in vec3 frag_to_cam;
in vec3 frag_wpos;

//-------------------------

#pragma map_fragments

#pragma map_func

//-------------------------

const int   MARCH_MAX  = 60;    // How many attempt to march ray
const float EPSILON    = 0.001; // Min Distance to SDF Surface

bool ray_march( vec3 p, vec3 dir, out vec3 hit_pos, out float ao ){
    float d;
    for( int i = 0; i < MARCH_MAX; i++ ){
        d = map_func( p );
        if( d < EPSILON ){
            hit_pos = p;
            ao      = 1.0 - float( i ) / float( MARCH_MAX - 1 );
            return true;
        }
        p += dir * d;
    }
    return false;
}

vec3 sdf_normal( vec3 p ){ // for function f(p)
    const float h   = 0.0001;      // replace by an appropriate value
    const vec2 k    = vec2(1,-1);
    return normalize(
        k.xyy * map_func( p + k.xyy*h ) + 
        k.yyx * map_func( p + k.yyx*h ) + 
        k.yxy * map_func( p + k.yxy*h ) + 
        k.xxx * map_func( p + k.xxx*h )
    );
}

//-------------------------

const vec3 light_pos        = vec3( 5.0, 15.0, 2.0 );
const float ambient_light   = 0.2; 

void main( void ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    vec3 ray = normalize( frag_to_cam );
    vec3 hit_pos;
    float ao;
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if( ray_march( frag_wpos, ray, hit_pos, ao ) ) {
        out_color       = base_color;

        vec3 norm       = sdf_normal( hit_pos );
        vec3 to_light   = normalize( light_pos - hit_pos );
        float dot       = clamp( dot( norm, to_light ), 0.0, 1.0 );
        
        out_color.rgb   *= clamp( dot * ao, ambient_light, 1.0 );
    }else
        out_color = vec4( 0.0, 0.0, 0.0, 0.0 );

}`;
// #endregion ///////////////////////////////////////////////////////////////////// 


// #region SHADER FRAGMENTS
let fragments = {
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // SHAPES
    sdf_sphere : `float sdf_sphere( vec3 p, vec3 c, float r ){ return distance( p, c ) - r; }`,

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // 
    sdf_smin : `float sdf_smin( float a, float b, float k ){
		float res = exp( -k * a) + exp( -k * b );
		return -log( max( 0.0001, res ) ) / k;
	}`,
};
// #endregion ///////////////////////////////////////////////////////////////////// 

/*
function init_shader(){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	gUbo = App.ubo.new( "Light", 10, [
		{ name:"pos",	type:"vec3" },
		{ name:"color",	type:"vec3" },
	]);

	gUbo
		.set( "pos", [2,5,1] )
		.set( "color", Colour.rgb_array( "#ffffff" ) );
	App.ubo.update( gUbo );
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	App.shader.new( "TESTER", VERT_SRC, FRAG_SRC, [
		//{ name:"base_color", type:"rgba", value:"#DB00FFFF" },
		//{ name:"other_color", type:"rgba", value:"#86F0FFFF" },
		//{ name:"specular_color", type:"rgb", value:"#ffffff" },
	], App.ubo.get_array( "Global", "Model", "Light" ) )
	.set_blend( true );
}
*/

function parse_map_src( map ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let iter = map.matchAll( /sdf_[A-Za-z0-9_]+/g ),
        list = new Set(),
        i;

    for( i of iter ) list.add( i[0] );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let src = "";
    for( i of list ){
        if( !fragments[ i ] ){ console.error( "FRAGMENT NOT FOUND - %s", i ); continue; }
        src += fragments[ i ] + "\n";
    }

    return src;
}

export default {
    new : ( name, map )=>{
        let mf      = parse_map_src( map );
        let frag    = FRAG_SRC
            .replace( "#pragma map_func", map )
            .replace( "#pragma map_fragments", mf );


        App.shader.new( name, VERT_SRC, frag, [
            { name:"base_color", type:"rgba", value:"#ff7f7fff" }
            //{ name:"base_color", type:"rgba", value:"#ff7f7fff" },
            //{ name:"other_color", type:"rgba", value:"#86F0FFFF" },
            //{ name:"specular_color", type:"rgb", value:"#ffffff" },
        ], App.ubo.get_array( "Global", "Model" ) ).set_blend( true );
    },
};