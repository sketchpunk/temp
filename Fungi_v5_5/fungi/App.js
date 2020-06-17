import TaskStack    from "./lib/TaskStack.js";
import Ecs			from "./lib/Ecs.js";
import InputTracker	from "./lib/InputTracker.js";
import Context		from "./core/Context.js";
import Buffer		from "./core/Buffer.js";
import Ubo  		from "./core/Ubo.js";
import Shader 		from "./core/Shader.js";
import Vao			from "./core/Vao.js";
import Mesh			from "./core/Mesh.js";

import Node			from "./ecs/Node.js";
import Draw			from "./ecs/Draw.js";
import Camera		from "./ecs/Camera.js";

import Maths, { Quat, Vec3, Transform, Mat4 } from "./maths/Maths.js";

let App = {
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SYSTEM
    gl			: null,
    buffer		: null,
    ubo			: null,
    shader		: null,
    vao			: null,
	mesh		: null,
	ecs 		: new Ecs(),
	input		: null,
	cam_com		: null,
	cam_node	: null,
	cam_ctrl	: null,		// Reference to the Camera Controller

	delta_time	: 0,		// Time between frames
	since_start	: 1,		// Time since the render loop started.

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    init : ()=>{ return new Launcher(); },
};

class Launcher{
    constructor(){
        this.tasks = new TaskStack()
            .add( new Promise( (r, e)=>window.addEventListener("load", _=>r(true)) ) )
            .add( this.init );
    }

	// #region MAIN
    add( fn ){ this.tasks.add( fn ); return this; }
	then( fn=null ){ this.tasks.then( fn ); }
    init(){
		console.log("--Fungi.App");
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        App.gl = new Context( "pg_canvas" );
        if( !App.gl.ctx ) return false;
    
        App.gl.fit_screen();
        //window.addEventListener( "resize", (e)=>{ App.gl.fit_screen(); });
    
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        App.buffer	= new Buffer( App.gl );
        App.ubo 	= new Ubo( App.gl );
        App.shader	= new Shader( App.gl );
        App.vao		= new Vao( App.gl );
		App.mesh	= new Mesh( App.gl, App.vao, App.buffer, App.shader );
		App.input	= new InputTracker( App.gl.canvas );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		App.ubo.new( "Global", 0, [
			{ name:"proj_view",		type:"mat4" },
			{ name:"camera_matrix",	type:"mat4" },
			{ name:"camera_pos",	type:"vec3" },
			{ name:"delta_time",	type:"float" },
			{ name:"screen_size",	type:"vec2" },
			{ name:"clock",			type:"float" },
		]);
		//.set_var( "screen_size", [ gl.width, gl.height ] );
		
		App.ubo.new( "Model", 1, [
			{ name:"view_matrix", type:"mat4" },
		]);

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		App.ecs.components
			.reg( Node )
			.reg( Camera )
			.reg( Draw );

		App.cam_com		= new Camera().set_perspective();
		App.cam_node	= new Node();
		App.ecs.new_entity( "Camera", App.cam_node, App.cam_com );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		return true;
	}
	// #endregion ///////////////////////////////////////////////////////////////

	// #region Loaders
	load_shaders(){
		let args = arguments;
		this.add( async()=>{
			let i, url, ary = new Array( args.length );

			for( i=0; i < args.length; i++ ){
				url = args[ i ];
				if( url.indexOf( "/") == -1 ) url = "./shaders/" + url;

				ary[ i ] = import( url );
			}

			await Promise.all( ary );
			return true;
		})
		return this;
	}
	// #endregion ///////////////////////////////////////////////////////////////

}

export default App;