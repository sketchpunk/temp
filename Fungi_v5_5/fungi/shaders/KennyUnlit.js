import App from "../App.js";

const VERT_SRC = `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=1) in vec3 a_norm;

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

out vec3 frag_norm;
out vec3 frag_wpos;

void main(void){
    vec4 wpos	= model.view_matrix * vec4( a_pos, 1.0 );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    frag_wpos		= wpos.xyz;
    frag_norm 		= mat3( transpose( inverse( model.view_matrix ) ) ) * a_norm; // Need to Rotate and Scale Normal, do on CPU

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    gl_Position = global.proj_view * wpos;

}`;

const FRAG_SRC = `#version 300 es
precision mediump float;
out vec4 out_color;

//-------------------------
uniform vec4 color;     // Base Color
uniform vec4 color_y;   // Y Axis Color
uniform vec4 color_x;   // X Axis Color
uniform vec4 color_z;   // Z Axis Color

uniform int use_lowpoly;

in vec3 frag_norm;
in vec3 frag_wpos;

//-------------------------

void main( void ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Get the Normal Direction, Added a Low Poly Normal line for fun    
    vec3 norm;
    if( use_lowpoly == 1 ) norm = normalize( cross( dFdx(frag_wpos), dFdy(frag_wpos) ) );
    else                   norm = normalize( frag_norm );
;
    vec3 norm_sqr = norm * norm;    // Treating normal as Light Strength, it curves the progression from dark to light
    //vec3 norm_sqr = norm;         // if left as is, it gives the tint lighting much more strength, linear progression

    // Notes: Maybe a Strength Scale would work well or maybe playing with pow might give interesting results
    // Some curve to make dark darker, and light brighter might also give different results
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Lerp between X and Y axis, bounces between Color A and B mixed with the base color
    vec3 base_color = color.rgb;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // From what I understand of how this works is by applying a Lighting Color for Each axis direction.
    // Then using the normal direction to blend each axis color together. From kenny's image example, he
    // setup the brightest color to come from Y, Second from Z then the darkest color at X.
    // This shader might work best on voxel based meshes but works well on smooth organic meshes.
    out_color.rgb = mix( base_color, color.rgb * color_x.rgb, norm_sqr.x );
    out_color.rgb = mix( out_color.rgb, color.rgb * color_y.rgb, norm_sqr.y );
    out_color.rgb = mix( out_color.rgb, color.rgb * color_z.rgb, norm_sqr.z );
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Original Shader mixes base color witht the axis lighting with a texture pixel.
    // So just keeping this here even though not really testing it.
    //o.Emission = ( tex2D( _MainTex, uv_MainTex ) * layeredBlend13 ).rgb;
    //out_color.rgb *= tex.rgb;
}`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let sh	= App.shader.new( "KennyUnlit", VERT_SRC, FRAG_SRC, [    
    { name:"color", type:"rgba", value:"#e0e0e0ff" },
    { name:"color_y", type:"rgba", value:"#ffffffff" },
    { name:"color_x", type:"rgba", value:"#878FA3ff" },
    { name:"color_z", type:"rgba", value:"#CED4E0ff" },
    { name:"use_lowpoly", type:"int", value:1 },
	], App.ubo.get_array( "Global","Model" )
);

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export default sh;