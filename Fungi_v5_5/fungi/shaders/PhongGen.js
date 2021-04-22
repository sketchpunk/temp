import App from "../App.js";
import ShaderGen from "../lib/ShaderGen.js";

/*
let sh = PhongGen.build({
    //base_color : "#00ee00ff",
    //poly_norm  : true,
    base_tex        : albedo_tex,
    normal_tex      : normal_tex,
    equ_env_tex     : env_tex,
    //metal           : 1.0,
    //roughness       : 0.0,
    metal_rough_tex : mr_tex,
    emission_tex    : emiss_tex,
    occlusion_tex   : ao_tex,
    gamma           : 0.7272, //.4545
    skinning        : true,
    matcap_tex      : tex,
});
*/

//#####################################################################

// #region OPTION CONFIGS

//const bit = [1,2,4,8,16,32,64,128,256,512,1024,2048,4096];

class COption{
    constructor( name, code, fn ){
        this.name = name;
        this.code = code;
        this.fn   = fn;
    }
}

function get_config_code( c, o ){
    let i, opt_a = 0;
    for( i of Options ) if( c[ i.name ] ) opt_a += i.code;
    return "_" + opt_a;
}

function build_config( c, o ){
    let i, opt_a = 0;
    for( i of Options ) if( c[ i.name ] != undefined ){ i.fn( c, o ); opt_a += i.code; }

    if( !(opt_a & 3) )      o.placeHolder.frag_color = "out_color = vec4( 1.0 );";
    if( !(opt_a & 12) )     o.placeHolder.frag_norm  = "frag.norm = normalize( frag_norm );";
    if( !(opt_a & 4112) )   o.placeHolder.frag_light = "out_color.rgb *= get_light_color();";
}

let Options = [
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // COLOR
    new COption( "base_color", 1, (c,o)=>{ 
        o.uniforms.push({name:"base_color", type:"rgba", value:c.base_color});
        o.placeHolder.uniforms   += "uniform vec4 base_color;\n";
        o.placeHolder.frag_color = "out_color = base_color;";
    }),

    new COption( "base_tex", 2, (c,o)=>{ 
        o.uniforms.push({name:"base_tex", type:"sampler2D", value:c.base_tex});
        o.placeHolder.uniforms   += "uniform sampler2D base_tex;\n";
        o.placeHolder.frag_color += "out_color = texture( base_tex, frag_uv );";
    }),

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // NORMAL
    new COption( "poly_norm", 4, (c,o)=>{ 
        o.placeHolder.frag_norm = `frag.norm = normalize( cross( dFdx(frag_pos), dFdy(frag_pos) ) );`;
    }),

    new COption( "normal_tex", 8, (c,o)=>{
        o.uniforms.push({name:"normal_tex", type:"sampler2D", value:c.normal_tex});
        o.placeHolder.uniforms  += "uniform sampler2D normal_tex;\n";
        o.placeHolder.frag_def  += "#define PERTURB_NORMAL\n";
        o.placeHolder.frag_norm = `frag.norm = perturb_normal( normalize(frag_norm), -frag.cam_dir, frag_uv, normal_tex );`
    }),

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // METAL - GLOSS - REFLECTION
    new COption( "equ_env_tex", 16, (c,o)=>{
        o.uniforms.push({name:"equ_env_tex", type:"sampler2D", value:c.equ_env_tex});
        o.placeHolder.uniforms += "uniform sampler2D equ_env_tex;\n";
        o.placeHolder.frag_def += "#define EQUIRECTANGULAR\n";
        o.placeHolder.frag_env =
        `get_env_equ_color( equ_env_tex );
        float reflec  = (frag.metal + (1.0-frag.rough)) * 0.5;
        out_color.rgb = mix( out_color.rgb, out_color.rgb * frag.env_color.rgb, reflec * reflec );`;
    }),

    new COption( "roughness", 32, (c,o)=>{
        o.uniforms.push({name:"roughness", type:"float", value:c.roughness});
        o.placeHolder.uniforms  += "uniform float roughness;\n";
        o.placeHolder.frag_init += `frag.rough = roughness;\n`;
    }),

    new COption( "metal", 64, (c,o)=>{
        o.uniforms.push({name:"metal", type:"float", value:c.metal});
        o.placeHolder.uniforms  += "uniform float metal;\n";
        o.placeHolder.frag_init += `frag.metal = metal;\n`;
    }),
    
    new COption( "metal_rough_tex", 128, (c,o)=>{
        o.uniforms.push({name:"metal_rough_tex", type:"sampler2D", value:c.metal_rough_tex});
        o.placeHolder.uniforms += "uniform sampler2D metal_rough_tex;\n";
        o.placeHolder.frag_metal = 
            `vec4 met_rou = texture( metal_rough_tex, frag_uv );
            frag.metal = met_rou.b;
            frag.rough = met_rou.g;`;
    }),

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // OTHER
    new COption( "emission_tex", 256, (c,o)=>{
        o.uniforms.push({name:"emission_tex", type:"sampler2D", value:c.emission_tex});
        o.placeHolder.uniforms   += "uniform sampler2D emission_tex;\n";
        o.placeHolder.frag_final += `out_color.rgb += texture( emission_tex, frag_uv ).rgb;\n`;
    }),

    new COption( "occlusion_tex", 512, (c,o)=>{
        o.uniforms.push({name:"occlusion_tex", type:"sampler2D", value:c.occlusion_tex});
        o.placeHolder.uniforms   += "uniform sampler2D occlusion_tex;\n";
        o.placeHolder.frag_final +=
            `vec3 occlusion = texture( occlusion_tex, frag_uv ).rgb;
            out_color.rgb *= occlusion * occlusion;\n`;
    }),

    new COption( "gamma", 1024, (c,o)=>{
        o.uniforms.push({name:"gamma", type:"float", value:c.gamma});
        o.placeHolder.uniforms   += "uniform float gamma;\n";
        o.placeHolder.frag_final += `out_color.rgb = pow( out_color.rgb, vec3( gamma ) );\n`;
    }),

    new COption( "skinning", 2048, (c,o)=>{ 
        o.placeHolder.vert_def += "#define SKINNING\n";
        o.ubos.push( "Armature" ); 
    }),

    new COption( "matcap_tex", 4096, (c,o)=>{ 
        o.uniforms.push({name:"matcap_tex", type:"sampler2D", value:c.matcap_tex});
        o.placeHolder.uniforms   += "uniform sampler2D matcap_tex;\n";
        o.placeHolder.frag_light = 
        `vec3 ref_dir = reflect( -frag.cam_dir, frag.norm );
        vec2 uv		 = ref_dir.xy / ( 2.8284271247461903 * sqrt( ref_dir.z + 1.0 ) ) + 0.5;
        out_color	 = texture( matcap_tex, uv ) * out_color;`;
    }),
];

// #endregion

class PhongGen{
    static build( config ){
        let sh_code = get_config_code( config );
        let name    = "Phong" + sh_code;

        if( App.shader.get( name ) ) console.error( "PhongGen - Shader Config already exists, TODO-FIX", name );

        let o = {
            name        : name,
            vert        : VERT_TMPL,
            frag        : FRAG_TMPL,
            ubos        : [ "Global", "Model", "Lights" ],
            placeHolder : { 
                frag_color   :"", 
                frag_norm    :"",
                frag_reflect :"",
                frag_def     :"",
                frag_env     :"",
                frag_metal   :"",
                frag_init    :"",
                frag_final   :"",
                frag_light   :"",
                vert_def     :"",
                uniforms     :""},
            uniforms    : [],
        };

        build_config( config, o );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return ShaderGen.build( o, 0 );
    }
}

//#####################################################################

const VERT_TMPL = `#version 300 es
#placeholder vert_def

layout(location=0) in vec3 a_pos;
layout(location=1) in vec3 a_norm;
layout(location=2) in vec2 a_uv;

//-------------------------

#ifdef SKINNING
layout(location=8) in vec4 a_skin_idx;
layout(location=9) in vec4 a_skin_wgt;

uniform Armature{
    mat4x4[90] bones;
} arm;

mat4x4 mtx_bone_transform( vec4 b_idx, vec4 b_wgt  ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // NORMALIZE BONE WEIGHT VECTOR 
    int a = int( b_idx.x ),
        b = int( b_idx.y ),
        c = int( b_idx.z ),
        d = int( b_idx.w );

    b_wgt *= 1.0 / (b_wgt.x + b_wgt.y + b_wgt.z + b_wgt.w);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // WEIGHT
    return arm.bones[ a ] * b_wgt.x +  
           arm.bones[ b ] * b_wgt.y +
           arm.bones[ c ] * b_wgt.z +
           arm.bones[ d ] * b_wgt.w;
}
#endif

//-------------------------

#include ubo_global
#include ubo_model

//-------------------------

out vec2 frag_uv;
out vec3 frag_norm;
out vec3 frag_pos;

//-------------------------

void main( void ){
    #ifndef SKINNING
    vec4 wpos	= model.view_matrix * vec4( a_pos, 1.0 );
    frag_norm 	= mat3( transpose( inverse( model.view_matrix ) ) ) * a_norm; // Need to Rotate and Scale Normal, do on CPU
    #else
    mat4x4 wgt_mtx = mtx_bone_transform( a_skin_idx, a_skin_wgt );      // Get Bone Transform
    mat4x4 vw_mtx  = model.view_matrix * wgt_mtx;                       // Mix Model with Bone
    vec4 wpos      = vw_mtx * vec4( a_pos, 1.0 );                       // Get World Space Vertex Position
    frag_norm      = mat3( transpose( inverse( vw_mtx ) ) ) * a_norm;   // Use Mixed Matrix to transform Normals
    #endif

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    frag_uv     = a_uv;
    frag_pos	= wpos.xyz;
    //frag_norm 	= mat3( transpose( inverse( model.view_matrix ) ) ) * a_norm; // Need to Rotate and Scale Normal, do on CPU

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    gl_Position = global.proj_view * wpos;
}`;

const FRAG_TMPL = `#version 300 es
precision mediump float;

#placeholder frag_def

out vec4 out_color;

in vec2 frag_uv;
in vec3 frag_norm;
in vec3 frag_pos;

struct Frag{
    vec3 norm;
    vec3 cam_dir;
    vec4 env_color;
    float rough;
    float metal;
} frag;

//-------------------------

#include ubo_global

#placeholder uniforms

//-------------------------

#include multilights

#include PERTURB_NORMAL

#include EQUIRECTANGULAR

//-------------------------

void main( void ){
    frag.cam_dir = normalize( global.camera_pos - frag_pos );
    #placeholder frag_init
    
    #placeholder frag_color
    #placeholder frag_norm

    #placeholder frag_light

    #placeholder frag_metal
    #placeholder frag_env

    #placeholder frag_final
}`;

//#####################################################################

ShaderGen.append_lib({
    "multilights":
`uniform Lights{ 
    vec3  ambient_color;
    float spec_strength;
    float spec_shininess;
    int   count;
    mat4  list[ 5 ];
} light;

struct DirLight{
    vec3    dir;            // 4, 8, 12
    vec3    color;          // 16, 20, 24
    float   strength;       // 28
    vec3    spec_color;     // 32
};

struct PntLight{
    vec3    pos;            // 4, 8, 12     vec4
    vec3    color;          // 16,20,24,28  vec4
    vec3    spec_color;     // 32,36,40,44  vec4
    float   constant;       // 48
    float   linear;         // 52
    float   quadratic;      // 56           
    float   attenuation;    // 60           vec4
};

DirLight parse_dir_light( mat4 d ){ return DirLight( d[0].yzw, d[1].xyz, d[1].w, d[2].xyz ); }
PntLight parse_pnt_light( mat4 d ){ return PntLight( d[0].yzw, d[1].xyz, d[2].xyz, d[3].x, d[3].y, d[3].z, d[3].w ); }

vec3 get_dir_light( vec3 pos, vec3 norm, vec3 cam_dir, mat4 LData ){
    DirLight lit = parse_dir_light( LData );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// DIFFUSE
    float diff   = max( dot( norm, lit.dir ), 0.0 );    // Angle between Frag Normal and Light Direction ( 0 to 1 )
    vec3 diffuse = diff * lit.color;                    // Use the angle to scale the amount of light to use.

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SPECULAR
	vec3 reflect_lite_n	= reflect( -lit.dir, norm );  // Light to Frag Dir (negated),
	float spec 			= pow( max( dot( cam_dir, reflect_lite_n ), 0.0 ), light.spec_shininess );
	vec3 specular_clr	= light.spec_strength * spec * lit.spec_color;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    return clamp( ( diffuse + specular_clr ) * lit.strength, 0.0, 1.0 );
}

vec3 get_pnt_light( vec3 pos, vec3 norm, vec3 cam_dir, mat4 LData ){
    PntLight lit     = parse_pnt_light( LData );
    vec3     delta   = lit.pos - pos;
    float    dist    = length( delta );
    vec3     lit_dir = normalize( delta );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// DIFFUSE
    float diff   = max( dot( norm, lit_dir ), 0.0 );    // Angle between Frag Normal and Light Direction ( 0 to 1 )
    vec3 diffuse = diff * lit.color;                    // Use the angle to scale the amount of light to use.

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SPECULAR
	vec3 reflect_lite_n	= reflect( -lit_dir, norm );  // Light to Frag Dir (negated),
	float spec 			= pow( max( dot( cam_dir, reflect_lite_n ), 0.0 ), light.spec_shininess );
	vec3 specular	    = light.spec_strength * spec * lit.spec_color;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ATTENUATION
    float attenuation = 1.0;
    if( lit.attenuation < 0.9 ) attenuation = 1.0 / ( lit.constant + lit.linear * dist + lit.quadratic * (dist * dist) );
    //attenuation = 0.2 / distance; // Simpler/Linear Attenuation : MaxDistance / Current Distance

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    return clamp( ( diffuse + specular ) * attenuation, 0.0, 1.0 );
}

vec3 get_light_color(){
    vec3 lit        = light.ambient_color;

    for( int i=0; i < light.count; i++ ){
        // DIRECTION LIGHT
        if( int( light.list[ i ][ 0 ].x ) == 0 )
            lit += get_dir_light( frag_pos, frag.norm, frag.cam_dir, light.list[ i ] );

        // POINT LIGHT
        else if( int( light.list[ i ][ 0 ].x ) == 1 )
            lit += get_pnt_light( frag_pos, frag.norm, frag.cam_dir, light.list[ i ] );
    }

    return lit;
}`,

    "PERTURB_NORMAL":
`#ifdef PERTURB_NORMAL
// Without Knowing or precomuting the Vertex Tangent, We can give up a lil
// bit of performance by computing a suitable TBN Matrix to use with Normal / Bump Maps.
vec3 perturb_normal( vec3 surf_norm, vec3 dir_eye_frag, vec2 uv, sampler2D tex ){
    vec3 tx_norm = texture( tex, uv ).xyz * 255.0/127.0 - 128.0/127.0;

    // https://www.geeks3d.com/20130122/normal-mapping-without-precomputed-tangent-space-vectors/
    // http://www.thetenthplanet.de/archives/1180
    // Get edge vectors of the pixel triangle
    vec3	dp1		= dFdx( dir_eye_frag ),
            dp2		= dFdy( dir_eye_frag );
    vec2	duv1	= dFdx( uv ),
            duv2	= dFdy( uv );

    // Solve the linear system
    vec3 	dp2perp	= cross( dp2, surf_norm ),
            dp1perp	= cross( surf_norm, dp1 ),
            T		= dp2perp * duv1.x + dp1perp * duv2.x,
            B		= dp2perp * duv1.y + dp1perp * duv2.y;

    // Construct a scale-invariant frame 
    float invmax	= inversesqrt( max( dot(T,T), dot(B,B) ) );
    mat3 tbn		= mat3( T * invmax, B * invmax, surf_norm );

    return normalize( tbn * tx_norm );
}
#endif`,

    "EQUIRECTANGULAR":
`#ifdef EQUIRECTANGULAR
vec2 norm_uv( vec3 norm ){// Equirectangular, converts Normal Direction to UV Coords
    float lon   = atan( norm.z, norm.x );
    float lat   = acos( norm.y );
    vec2 uv     = vec2( lon, lat ) * ( 1.0 / 3.1415926535897932384626433832795 );
    uv.x        = 1.0 - ( uv.x * 0.5 + 0.5 ); // Remap and reverse Lon
    return uv;
}

void get_env_equ_color( sampler2D tex ){
    ivec2 tex_size = textureSize( tex, 0 );
    float mips	   = 1.0 + floor( log2( float( max( tex_size.x, tex_size.y ) ) ) );
    vec2  uv       = norm_uv( reflect( -frag.cam_dir, frag.norm ) );      
    frag.env_color = textureLod( tex, uv, mips * frag.rough );
}
#endif`,

});

//#####################################################################

export default PhongGen;