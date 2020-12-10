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

flat out float time;
flat out vec3 cam_pos;
out vec3 frag_to_cam;
out vec3 frag_wpos;

void main(void){
    vec4 wpos       = model.view_matrix * vec4( a_pos, 1.0 );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    time            = global.clock;
    cam_pos         = global.camera_pos;
    frag_wpos       = wpos.xyz;
    frag_to_cam     = frag_wpos - global.camera_pos;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    gl_Position = global.proj_view * wpos;

}`;

const FRAG_SRC = `#version 300 es
precision mediump float;

// GOOD QUALITY, BAD PERFORMANCE WHEN VERY CLOSE : TRIES 60, MIN 0.001
// MEDIUM QUALITY, BETTER PERFORMANCE CLOSE BY   : TRIES 30, MIN 0.005

const int   MARCH_TRIES     = 30;    // How many attempt to march ray
const float MARCH_MIN_DIST  = 0.005; // Min Distance to SDF Surface

const float PI          = 3.1415926535897932;
const float PI_H		= 1.5707963267948966;
const float PI_2 		= 6.283185307179586;
const float PI_2_INV 	= 1.0 / 6.283185307179586;
const float PI_Q		= 0.7853981633974483;
const float PI_270		= PI + PI_H;
const float DEG2RAD		= 0.01745329251; // PI / 180
const float RAD2DEG		= 57.2957795131; // 180 / PI

const mat3 ROT_X_90     = mat3( 1.0, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0 );
const mat3 ROT_Y_90     = mat3( 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, -1.0, 0.0, 0.0 );

//-------------------------
// VARS

uniform vec4 base_color;

flat in float time;
flat in vec3 cam_pos;
in vec3 frag_to_cam;
in vec3 frag_wpos;

out vec4 out_color;

//-------------------------
// STATIC FUNCTIONS
float map_func( vec3 p );  // Forward Decoration
vec3 sdf_normal( vec3 p );

bool ray_march( vec3 p, vec3 dir, out vec3 hit_pos, out float ao ){
    float d;
    for( int i = 0; i < MARCH_TRIES; i++ ){
        d = map_func( p );
        if( d < MARCH_MIN_DIST ){
            hit_pos = p;
            ao      = 1.0 - float( i ) / float( MARCH_TRIES - 1 );
            return true;
        }
        p += dir * d;
    }
    return false;
}

/*
vec3 normal_sdf( vec3 p ){ // for function f(p)
    const float h   = 0.0001;      // replace by an appropriate value
    const vec2 k    = vec2(1,-1);
    return normalize(
        k.xyy * map_func( p + k.xyy*h ) + 
        k.yyx * map_func( p + k.yyx*h ) + 
        k.yxy * map_func( p + k.yxy*h ) + 
        k.xxx * map_func( p + k.xxx*h )
    );
}
*/

// OTHER VERSION, COMPILER'S OPTIMIZATION MIGHT CAUSE ISSUES WITH LARGE SETS OF SDF OBJECTS
uniform int iFrame;
vec3 normal_sdf( vec3 pos ){
    #define ZERO min(iFrame,0)
    vec3 n = vec3( 0.0 );
    for( int i = ZERO; i < 4; i++ ){
        vec3 e = 0.5773 * (2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e * map_func( pos + 0.0005 * e );
    }
    return normalize( n );
}

mat3 rot_x( float theta ){ float c = cos(theta); float s = sin(theta); return mat3( 1, 0, 0, 0, c, -s, 0, s, c ); }
mat3 rot_y( float theta ){ float c = cos(theta); float s = sin(theta); return mat3( c, 0, s, 0, 1, 0, -s, 0, c ); }
mat3 rot_z( float theta ){ float c = cos(theta); float s = sin(theta); return mat3( c, -s, 0, s, c, 0, 0, 0, 1 ); }

//-------------------------
// IMPORTED CODE

#pragma map_fragments

#pragma map_func

//-------------------------
// LIGHTING
const vec3  light_pos       = vec3( 5.0, 15.0, 2.0 );

vec3 diffuse_lighting( vec3 pos, vec3 norm, float ao ){
    const float ambient_min = 0.2;

    vec3 to_light   = normalize( light_pos - pos );
    float dot       = clamp( dot( norm, to_light ), 0.0, 1.0 ) * ao;
    return base_color.rgb * clamp( dot, ambient_min, 1.0 );
}

vec3 phong( vec3 color, vec3 pos, vec3 norm, float ao ){
    vec3 L = normalize( light_pos - pos );      // TO LIGHT
    vec3 V = normalize( cam_pos - pos );        // TO CAM ( VIEW )
    vec3 R = normalize( reflect( -L, norm ) );  // REFLECT DIR OF LIGHT TO FRAG

    float dot_LN = max( dot( L, norm ), 0.0 );  // How simular is to light dir is to norm dir
    float dot_RV = max( dot( R, V ), 0.0 );     // How similar is reflection dir is to cam dir

    const vec3 spec_color   = vec3( 0.8 );
    const float shininess   = 10.0;
    vec3 spec = spec_color * pow( dot_RV, shininess );

    return color * dot_LN * ao + spec;
    //return color * dot_LN + spec;
}

//-------------------------
// MAIN

void main( void ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    vec3 ray = normalize( frag_to_cam );
    vec3 hit_pos;   // Ray Marched Hit Position
    float ao;       // ambient occlusion
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if( ray_march( frag_wpos, ray, hit_pos, ao ) ) {
        /* out_color       = vec4( 1.0, 0.0, 0.0, 1.0 ); */
        
        vec3 norm       = normal_sdf( hit_pos );
        out_color.a     = 1.0;

        // APPLY LIGHTING
        //out_color.rgb   = diffuse_lighting( hit_pos, norm, ao );
        //out_color.rgb   = phong( base_color.rgb, hit_pos, norm, ao );

        vec3 color_norm = ( norm + vec3( 1.0 ) ) * 0.5; // Shift to slighter brighter but duller look
        //out_color.rgb   =  phong( color_norm, hit_pos, norm, ao );
        out_color.rgb   = ( color_norm * 0.5 ) + 0.5 * phong( color_norm, hit_pos, norm, ao );

        /* Pastel coloring based on Normal value
        vec3 color = vec3( 0.0 );
        color += pow( 0.5 + 0.5 * norm, vec3(0.45) ); // gamma
        color += sin( gl_FragCoord.x * 114.0 ) * sin( gl_FragCoord.y * 211.1) / 512.0; // cheap dithering
        out_color.rgb = color;
        */

       //gl_FragDepth = -hit_pos.z;

    }else{
        out_color = vec4( 0.0, 0.0, 0.0, 0.0 );
        gl_FragDepth = -100.0;
    }

}`;
// #endregion ///////////////////////////////////////////////////////////////////// 


// #region SHADER FRAGMENTS
let fragments = {
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // SHAPES
    sdf_sphere : `float sdf_sphere( vec3 p, float r ){ return length( p ) - r; }`,

    sdf_cube : `float sdf_cube( vec3 p, vec3 size ) {
        vec3 d = abs( p ) - ( size * 0.5 );
        // Assuming p is inside the cube, how far is it from the surface? Result will be negative or zero.
        float insideDistance = min( max( d.x, max( d.y, d.z ) ), 0.0 );
        // Assuming p is outside the cube, how far is it from the surface? Result will be positive or zero.
        float outsideDistance = length( max( d, 0.0 ) );
        return insideDistance + outsideDistance;
    }`,

    //Signed distance function for an XY aligned cylinder centered at the origin with height h and radius r.s
    sdf_cylinder : `float sdf_cylinder( vec3 p, float h, float r ) {
        float inOutRadius = length( p.xy ) - r; // How far inside or outside the cylinder the point is, radially
        float inOutHeight = abs( p.z ) - h / 2.0; // How far inside or outside the cylinder is, axially aligned with the cylinder        
        float insideDistance = min( max( inOutRadius, inOutHeight ), 0.0 ); // Assuming p is inside the cylinder, how far is it from the surface? Result will be negative or zero.
        float outsideDistance = length( max( vec2( inOutRadius, inOutHeight ), 0.0 ) ); // Assuming p is outside the cylinder, how far is it from the surface? Result will be positive or zero.
        return insideDistance + outsideDistance;
    }`,


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // COMBINDING
    sdf_intersect : `float sdf_intersect( float a, float b ){ return max( a, b ); }`,
    sdf_union : `float sdf_union( float a, float b ){ return min( a, b ); }`,
    sdf_union_3 : `float sdf_union_3( float a, float b, float c ){ return min( c, min( a, b ) ); }`,
    sdf_difference : `float sdf_difference( float a, float b ){ return max( a, -b ); }`,

    sdf_smin : `float sdf_smin( float a, float b, float k ){
        float h = max( k-abs(a-b), 0.0 );
        return min( a, b ) - h*h / (k*4.0);
    }`,
};

/*
//https://iquilezles.org/www/articles/smin/smin.htm
float sdf_smin( float a, float b, float k ){
    float res = exp( -k * a) + exp( -k * b );
    return -log( max( 0.0001, res ) ) / k;
}

// polynomial smooth min (k = 0.1);
float smin( float a, float b, float k ){
    float h = max( k-abs(a-b), 0.0 )/k;
    return min( a, b ) - h*h*k*(1.0/4.0);
}

// Most recent incarnation
float sdf_smin( float a, float b, float k ){
    float h = max( k-abs(a-b), 0.0 );
    return min( a, b ) - h*h / (k*4.0);
}

// polynomial smooth min (k = 0.1);
float sminCubic( float a, float b, float k ){
    float h = max( k-abs(a-b), 0.0 ) / k;
    return min( a, b ) - h * h * h * k * (1.0/6.0);
}

*/


// #endregion ///////////////////////////////////////////////////////////////////// 

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


/*


vec3 normal_sdf( vec3 p ){ // for function f(p)
    #define ZERO (min(iFrame,0)) // non-constant zero
    const float h = 0.0001;      // replace by an appropriate value
    vec3 n = vec3(0.0);
    for( int i=ZERO; i < 4; i++ ){
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e * map_func( p + e * h );
    }
    return normalize(n);
}

float calcAO( in vec3 pos, in vec3 nor, in float time )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=ZERO; i<5; i++ )
    {
        float h = 0.01 + 0.12*float(i)/4.0;
        float d = map( pos+h*nor, time ).x;
        occ += (h-d)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );
}

*/