import Context		from "./Context.js";
import Buffer		from "./Buffer.js";
import Ubo  		from "./Ubo.js";
import Shader 		from "./Shader.js";
import Vao			from "./Vao.js";
import Mesh			from "./Mesh.js";

export default {
	init: ( canvas, obj )=>{
		obj = obj || { };

		obj.gl = new Context( canvas );
		if( !obj.gl.ctx ) return null;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		obj.Buffer	= new Buffer( obj.gl );
		obj.Ubo 	= new Ubo( obj.gl );
		obj.Shader	= new Shader( obj.gl );
		obj.Vao		= new Vao( obj.gl );
		obj.Mesh	= new Mesh( obj.gl, obj.Vao, obj.Buffer, obj.Shader );

		return obj;
	},
};