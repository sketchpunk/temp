import App from "./App.js";

const VERT_SRC = `#version 300 es
layout(location=0) in vec3 a_pos;

//------------------------

uniform mat4 ortho;
uniform vec2 move;

//------------------------

void main(void){
	vec4 wpos = vec4( a_pos * 10.0, 1.0 ) + vec4( move, 0.0, 0.0 );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	
	gl_Position = ortho * wpos;
}`;


const FRAG_SRC = `#version 300 es
precision mediump float;

out vec4 out_color;

//-------------------------

void main( void ){
    out_color   = vec4( 1.0, 1.0, 0.0, 1.0 );	
}`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export default {
	new		: ()=>{ return App.shader.new_material( "DrawShader" ); },
	init	: ()=>{
		App.shader.new( "DrawShader", VERT_SRC, FRAG_SRC, [
			{ name:"ortho",	type:"mat4", value:null },
			{ name:"move",	type:"vec2", value:null },
		]);
		return this;
	},
};