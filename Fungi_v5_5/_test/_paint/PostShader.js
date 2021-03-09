import App from "./App.js";

const VERT_SRC = `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=2) in vec2 a_uv;

//out vec2 frag_uv;

void main(void){
	//frag_uv     = a_uv;
	gl_Position = vec4( a_pos, 1.0 );
}`;


const FRAG_SRC = `#version 300 es
precision mediump float;

out vec4 out_color;
in vec2 frag_uv;

//------------------------

uniform sampler2D buf_color;	

//-------------------------

void main( void ){
	ivec2 fCoord    = ivec2( gl_FragCoord.xy );     // Get the Int of the current Screen pixel X,Y
	ivec2 texSize   = textureSize( buf_color, 0 );	// Get Size of Texture
	vec4 color      = texelFetch( buf_color, fCoord , 0 );		
	out_color		= color;
}`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export default {
	new		: ()=>{ return App.shader.new_material( "PostRender" ); },
	init	: ()=>{
		App.shader.new( "PostRender", VERT_SRC, FRAG_SRC, [
			{ name:"buf_color", type:"sampler2D", value:"null" },
		]);
		return this;
	},
};