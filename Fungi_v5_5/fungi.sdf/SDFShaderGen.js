import ShaderGen from "../fungi/lib/ShaderGen.js";

class SDFShaderGen{
    static build( o ){
        if( !o.vert ) o.vert = VERT_TMPL;
        if( !o.frag ) o.frag = FRAG_TMPL;
        if( !o.ubos ) o.ubos = [ "Global", "Model" ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( !o.placeHolder ) o.placeHolder = {};
        if( !o.sdf_options ) o.sdf_options = {};

        o.placeHolder.sdf_lighting  = "";
        o.placeHolder.sdf_shapes    = "";
        o.placeHolder.map_func      = o.sdf_options.map_func;
        o.placeHolder.sdf_header    = o.sdf_options.header;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // LIGHTING MODEL
        switch( o.sdf_options.lighting ){
            case "phong"       : o.placeHolder.sdf_lighting = "#define SDF_LITE_PHONG\n" + ShaderGen.find_by_key( "lite_phong" ); break;
            case "norm_phong"  : o.placeHolder.sdf_lighting = "#define SDF_LITE_NORMPHONG\n" + ShaderGen.find_by_key( "lite_norm_phong" ); break;
            case "norm_color"  : o.placeHolder.sdf_lighting = "#define SDF_LITE_NORMCOLOR\n" + ShaderGen.find_by_key( "lite_norm_color" ); break;
            case "multi_light" : o.placeHolder.sdf_lighting = "#define SDF_LITE_MULTILIGHT\n" + ShaderGen.find_by_key( "lite_multi_light" ); break;
            default            : o.placeHolder.sdf_lighting = "#define SDF_LITE_DIFFUSE\n" + ShaderGen.find_by_key( "lite_diffuse" ); break;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SHAPES
        if( o.sdf_options.shapes ){
            let i, txt
            for( i of o.sdf_options.shapes ){
                txt = ShaderGen.find_by_key( "sdf_shape_" + i );
                if( txt ) o.placeHolder.sdf_shapes += txt + "\n\n";
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return ShaderGen.build( o );
    }
}

//#####################################################################
const VERT_TMPL = `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=1) in vec3 a_norm;
layout(location=2) in vec2 a_uv;

#include ubo_global

#include ubo_model

out vec3 frag_wpos;
void main(void){
    vec4 wpos   = model.view_matrix * vec4( a_pos, 1.0 );
    frag_wpos   = wpos.xyz;
    gl_Position = global.proj_view * wpos;
}`;

const FRAG_TMPL = `#version 300 es
precision mediump float;

in  vec3 frag_wpos;
out vec4 out_color;

uniform vec4 base_color;

#include const_pi
#include ubo_global

#placeholder sdf_header

//-------------------------
// STATIC FUNCTIONS
float map_func( vec3 p );  // Forward Decoration

#include sdf_config_med

#include sdf_ray_march

#include normal_sdf

#include math_quaternion

#include sdf_op

//-------------------------

#placeholder sdf_shapes

#placeholder map_func

#placeholder sdf_lighting

//-------------------------
// MAIN

void main( void ){
    vec3 ray    = normalize( frag_wpos - global.camera_pos );
    out_color   = vec4( 0.0, 0.0, 0.0, 0.0 );

    if( ray_march( global.camera_pos, ray ) ){
        vec3 norm = normal_sdf( SR.hit );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Different Color Handling
        #ifdef SDF_LITE_DIFFUSE 
        out_color.rgb = diffuse_lighting( SR.hit, norm, SR.ao );
        #endif

        #ifdef SDF_LITE_PHONG 
        out_color.rgb = phong( base_color.rgb, SR.hit, norm, SR.ao );
        #endif

        #ifdef SDF_LITE_NORMPHONG 
        out_color.rgb = norm_phong( SR.hit, norm, SR.ao );
        #endif

        #ifdef SDF_LITE_NORMCOLOR 
        out_color.rgb = norm_color( norm );
        #endif

        #ifdef SDF_LITE_MULTILIGHT 
        out_color.rgb   = multi_light( norm );
        #endif

        out_color.a     = 1.0;
        gl_FragDepth    = -100.0;

    } else gl_FragDepth = -100.0;
}`;

//#####################################################################
// SDF Snippets
ShaderGen.append_lib({
    // #region SDF RENDERING HELPER FUNCTIONS
    "normal_sdf" : 
`// OTHER VERSION, COMPILER'S OPTIMIZATION MIGHT CAUSE ISSUES WITH LARGE SETS OF SDF OBJECTS
uniform int iFrame;
vec3 normal_sdf( vec3 pos ){
    #define ZERO min(iFrame,0)
    vec3 n = vec3( 0.0 );
    for( int i = ZERO; i < 4; i++ ){
        vec3 e = 0.5773 * (2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e * map_func( pos + 0.0005 * e );
    }
    return normalize( n );
}`,

    "sdf_ray_march" :
`struct SDFResult{
    vec3   hit;
    float  ao;
    int    id;
} SR;

bool ray_march( vec3 ro, vec3 rd ){
    float d     = MARCH_START;  // How much distance on the ray traveled
    float rng   = 0.0;          // Distance Range to next closets object

    for( int i = 0; i < MARCH_TRIES && d < MARCH_MAX_DIST; i++ ){
        rng = map_func( ro + rd * d );  // distance to the closets object
        
        //if( rng <= MARCH_EPSILON ){
        //if( abs( rng ) <= MARCH_EPSILON ){ // Help Fix some artifacts

        if( abs( rng ) <= ( MARCH_EPSILON * d ) ){ // spend less time trying to detail long distance pixels. 
            SR.hit = ro + rd * d;
            //SR.ao      = 1.0 - float( i ) / float( MARCH_TRIES - 1 );
            SR.ao      = 1.0 - d / MARCH_MAX_DIST;
            return true;
        }
        d += rng;   // Add save distance for the next check.
    }
    return false;
}`,

    // #endregion ///////////////////////////////////////////////////////

    // #region SDF OPERATIONS
    "sdf_op" :
`float sdf_smin( float a, float b, float k ){
    float h = max( k-abs(a-b), 0.0 );
    return min( a, b ) - h*h / (k*4.0);
}
float sdf_smax( float a, float b, float k ){
    float h = max( k-abs(a-b), 0.0 );
    return max( a, b ) + h*h / (k*4.0);
}`,
    // #endregion ///////////////////////////////////////////////////////

    // #region SDF CONFIGS
    "sdf_config_med" : 
`// GOOD QUALITY, BAD PERFORMANCE WHEN VERY CLOSE : TRIES 60, MIN 0.001
// MEDIUM QUALITY, BETTER PERFORMANCE CLOSE BY   : TRIES 30, MIN 0.005
const int   MARCH_TRIES     = 30;       // How many attempt to march ray
const float MARCH_EPSILON   = 0.005;    // Min Distance to SDF Surface
const float MARCH_MAX_DIST  = 20.0;     // Max Distance to Travel on March
const float MARCH_START     = 0.0;      // Starting Distance for Ro Marching`,
    // #endregion ///////////////////////////////////////////////////////

    // #region SDF LIGHTING
    "lite_diffuse" : 
`const vec3  light_pos = vec3( 10.0, 15.0, 2.0 );
vec3 diffuse_lighting( vec3 pos, vec3 norm, float ao ){
    const float ambient_min = 0.2;

    vec3 to_light   = normalize( light_pos - pos );
    float dot       = clamp( dot( norm, to_light ), 0.0, 1.0 ) * ao;
    return base_color.rgb * clamp( dot, ambient_min, 1.0 );
}`,
    //---------------------------------------------------
    "lite_phong" :
`const vec3  light_pos = vec3( 10.0, 15.0, 2.0 );
vec3 phong( vec3 color, vec3 pos, vec3 norm, float ao ){
    vec3 L = normalize( light_pos - pos );      // TO LIGHT
    vec3 V = normalize( global.camera_pos - pos );        // TO CAM ( VIEW )
    vec3 R = normalize( reflect( -L, norm ) );  // REFLECT DIR OF LIGHT TO FRAG

    const float ambient = 0.25;

    float dot_LN = max( dot( L, norm ), ambient );  // How simular is to light dir is to norm dir
    float dot_RV = max( dot( R, V ), 0.0 );         // How similar is reflection dir is to cam dir

    const vec3 spec_color   = vec3( 0.8 );
    const float shininess   = 10.0;
    vec3 spec = spec_color * pow( dot_RV, shininess );

    return color * dot_LN * ao + spec;
    //return color * dot_LN + spec;
}`,
    //---------------------------------------------------
    "lite_norm_phong":
`const vec3  light_pos = vec3( 10.0, 15.0, 2.0 );
vec3 phong( vec3 color, vec3 pos, vec3 norm, float ao ){
    vec3 L = normalize( light_pos - pos );      // TO LIGHT
    vec3 V = normalize( global.camera_pos - pos );        // TO CAM ( VIEW )
    vec3 R = normalize( reflect( -L, norm ) );  // REFLECT DIR OF LIGHT TO FRAG

    const float ambient = 0.25;

    float dot_LN = max( dot( L, norm ), ambient );  // How simular is to light dir is to norm dir
    float dot_RV = max( dot( R, V ), 0.0 );         // How similar is reflection dir is to cam dir

    const vec3 spec_color   = vec3( 0.8 );
    const float shininess   = 10.0;
    vec3 spec = spec_color * pow( dot_RV, shininess );

    return color * dot_LN * ao + spec;
    //return color * dot_LN + spec;
}
vec3 norm_phong( vec3 pos, vec3 norm, float ao ){
    vec3 color_norm = ( norm + vec3( 1.0 ) ) * 0.5; // Shift to slighter brighter but duller look
    return ( color_norm * 0.5 ) + 0.5 * phong( color_norm, pos, norm, ao );
}`,
    //---------------------------------------------------
    "lite_norm_color":
`vec3 norm_color( vec3 norm ){
    vec3 color = vec3( 0.0 );
    color += pow( 0.5 + 0.5 * norm, vec3(0.45) ); // gamma
    color += sin( gl_FragCoord.x * 114.0 ) * sin( gl_FragCoord.y * 211.1) / 512.0; // cheap dithering
    return color;
}`,
    //---------------------------------------------------
    "lite_multi_light":
`vec3 multi_light( vec3 norm ){
    vec3 mate       = vec3( 0.18 ); // Default Color, All Lights will be mul by this as colors lights gets added up.

    if( SR.id == 1 ) mate = vec3( 0.7 );
    else if( SR.id == 2 ) mate = vec3( 0.001 );

    vec3 sun_dir    = normalize( vec3( 0.8, 0.4, 0.2 ) );        // To Sun Direction
    float sun_dif   = clamp( dot( norm, sun_dir ), 0.0, 1.0 );   // Sub Diffuse Strength
    float sky_dif   = clamp( 0.5 + 0.5 * dot( norm, vec3( 0.0, 1.0, 0.0 ) ), 0.0, 1.0 );    // sky diffuse, Shift range of -1,1 to 0,1, so light the bottom too.
    float bon_dif   = clamp( 0.5 + 0.5 * dot( norm, vec3( 0.0, -1.0, 0.0 ) ), 0.0, 1.0 );   // Bounce light, reflecting light from the ground back up.

    // Shadows of point toward the sun.
    //float sun_sha   = ( ray_march( hit_pos + norm * 0.001, sun_dir, hit_pos, grp ) )? 0.0 : 1.0;

    vec3 color =  mate * vec3( 7.0, 4.5, 3.0 ) * sun_dif; // * sun_sha;  // Sun Lighting, Yellow
    color += mate * vec3( 0.5, 0.8, 0.9 ) * sky_dif;            // Light of the sky, Blue
    color += mate * vec3( 0.7, 0.3, 0.2 ) * bon_dif;            // Bounce light from the ground.

    return color;
}`,

    // #endregion ///////////////////////////////////////////////////////

    // #region SDF SHAPES
    "sdf_shape_spline_cone" :
`float cubic_spline_f3( float v0, float v1, float v2, float t ){
    float a, b, c, d;
    const float tang_offset = 0.035; // Works well for v <= 0.6

    // Split t in half, a spline made of two curves
    if( t < 0.5 ){
        t = t * 2.0;           // Remap to 0-1
        a = v0 - tang_offset;
        b = v0;
        c = v1;
        d = v2;
    }else{
        t = ( t - 0.5 ) * 2.0; // Remap to 0-1
        a = v0;
        b = v1;
        c = v2;
        d = v2 - tang_offset;
    }

    // Cublic Interpolation
    float t2 = t*t;
	float a0 = d - c - a + b;
	float a1 = a - b - a0;
	float a2 = c - a;
    float a3 = b;
    
    return a0*t*t2 + a1*t2 + a2*t + a3;
}

float sdf_roundcone3( vec3 p, float r0, float r1, float r2, float h ){
    vec2 q  = vec2( length( p.xz ), p.y );
    float b = ( r0 - r2 ) / h;
    float a = sqrt( 1.0 - b * b );          
    float k = dot( q, vec2( -b, a) );

    if( k < 0.0 ) return length( q ) - r0;
    if( k > a*h ) return length( q - vec2( 0.0, h ) ) - r2;

    float t = clamp( p.y / h, 0.0, 1.0 );
    float r = cubic_spline_f3( r0, r1, r2, t );

    return length( q - vec2( 0.0, h*t ) ) - r;
}`,
    // #endregion ///////////////////////////////////////////////////////
});

//#####################################################################
export default SDFShaderGen;