import TaskStack    from "./lib/TaskStack.js";
import Ecs			from "./lib/Ecs.js";
import InputTracker	from "./lib/InputTracker.js";
import RenderLoop	from "./lib/RenderLoop.js";
import Context		from "./core/Context.js";
import Buffer		from "./core/Buffer.js";
import Ubo  		from "./core/Ubo.js";
import Shader 		from "./core/Shader.js";
import Vao			from "./core/Vao.js";
import Mesh			from "./core/Mesh.js";
import Colour		from "./core/Colour.js";
import Texture		from "./core/Texture.js";

import Node,{ NodeSys, NodeCleanupSys } from "./ecs/Node.js";
import Camera,{ CameraSys }				from "./ecs/Camera.js";
import Draw, { DrawSys }				from "./ecs/Draw.js";
import OrbitCameraSystem				from "./ecs/OrbitCameraSystem.js";
import Renderer							from "./ecs/Renderer.js";

import Maths, { Quat, Vec3, Transform, Mat4 } from "./maths/Maths.js";

//################################################################################################

let App = {
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SYSTEM
    gl			: null,
    buffer		: null,
    ubo			: null,
    shader		: null,
    vao			: null,
	mesh		: null,
	texture		: null,
	ecs 		: new Ecs(),
	input		: null,
	cam_com		: null,
	cam_node	: null,
	cam_ctrl	: null,		// Reference to the Camera Controller

	delta_time	: 0,		// Time between frames
	since_start	: 1,		// Time since the render loop started.

	renderer	: null,
	render_loop	: null,
	on_render	: null,

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// METHODS
	init	: ( use_scene=true )=>{ return new Launcher( use_scene ); },
	render	: ( dt=null, ss=null )=>{
		if( dt != null ) App.delta_time		= dt;
		if( ss != null ) App.since_start	= ss;

		if( App.on_render ) App.on_render( App.delta_time, App.since_start );
		App.ecs.run();
	},

	mesh_entity : ( name, mesh=null, mat=null, draw_mode=4 )=>{
		let id		= App.ecs.new_entity( name );
		let node	= App.ecs.add_com( id, "Node" ); // This way uses recycled objects. 
		let draw	= App.ecs.add_com( id, "Draw" );

		if( mesh && mat ){
			if( typeof mat == "string" ) mat = App.shader.new_material( mat );
			draw.add( mesh, mat, draw_mode );
		}

		return { id, node, draw };
	},

	render_by : ( m, fn=null )=>{
		if( fn ) App.on_render = fn;

		if( m == 0 ){
			App.render_loop.stop()
			App.input.on_input = ()=>{ App.render(); };
		}else{
			App.input.on_input = null;
			App.render_loop.start();
		}
	},
};

//################################################################################################

class Launcher{
    constructor( use_scene=true ){
        this.tasks = new TaskStack()
            .add( new Promise( (r, e)=>window.addEventListener("load", _=>r(true)) ) )
			.add( this.init );
			
		if( use_scene ) this.tasks.add( this.init_scene );
    }

	// #region MAIN
    task( fn ){ this.tasks.add( fn ); return this; }
	then( fn=null ){ this.tasks.then( fn ).then( _=>App.render() ); }
	
	init(){
		console.log("[ Fungi.App 5.5 ]");
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// GL CONTEXT
        App.gl = new Context( "pg_canvas" );
        if( !App.gl.ctx ) return false;
    
        App.gl.set_color( "#363636" ).fit_screen();
        //window.addEventListener( "resize", (e)=>{ App.gl.fit_screen(); });
    
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// CORE
        App.buffer		= new Buffer( App.gl );
        App.ubo 		= new Ubo( App.gl );
		App.texture		= new Texture( App.gl );
		App.vao			= new Vao( App.gl );
		App.shader		= new Shader( App.gl, App.texture );
		App.mesh		= new Mesh( App.gl, App.vao, App.buffer, App.shader );
		App.input		= new InputTracker( App.gl.canvas );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// RENDERING UBOs
		App.ubo.new( "Global", 0, [
			{ name:"proj_view",		type:"mat4" },
			{ name:"camera_matrix",	type:"mat4" },
			{ name:"camera_pos",	type:"vec3" },
			{ name:"delta_time",	type:"float" },
			{ name:"screen_size",	type:"vec2" },
			{ name:"clock",			type:"float" },
		]);
		
		App.ubo.new( "Model", 1, [
			{ name:"view_matrix", type:"mat4" },
		]);

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		App.renderer	= new Renderer();
		App.render_loop = new RenderLoop( App.render );
		App.render_by( 0 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// ECS SETUP
		App.cam_ctrl = new OrbitCameraSystem();

		App.ecs.components
			.reg( Node )
			.reg( Camera )
			.reg( Draw );

		App.ecs.systems
			.reg( App.cam_ctrl, 1 )
			.reg( NodeSys, 800 )
			.reg( CameraSys, 801 )
			.reg( new DrawSys(), 950 )
			.reg( NodeCleanupSys, 1000 );

		App.cam_com		= new Camera().set_perspective( 45, 0.01, 1000.0 );
		App.cam_node	= new Node();
		App.ecs.new_entity( "Camera", App.cam_node, App.cam_com );

		return true;
	}

	async init_scene(){
		let mods = await Promise.all([
			import( "./shaders/GridFloor.js" ),
			import( "./geo/Quad.js" ),
		]);

		let mat = App.shader.new_material( "GridFloor" );
		let e	= mods[1].default( "GridFloor", mat );

		e.node.rot_by( -90, "x" ).set_scl( 40 );
		e.draw.priority = 900;
		return true;
	}
	// #endregion ///////////////////////////////////////////////////////////////

	// #region Loaders
	load_shaders(){
		let args = arguments;
		this.task( async()=>{
			let i, url, ary = new Array( args.length );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			for( i=0; i < args.length; i++ ){
				url = args[ i ];
				if( url.indexOf( "/") == -1 ) url = "./shaders/" + url;

				ary[ i ] = import( url );
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			await Promise.all( ary ).then(( ary )=>{
				let i;
				for( i of ary ) console.log( "[ Load Shader : %s ]", i.default.name );
			});
			return true;
		})
		return this;
	}

	load_pkg( config=null ){
		this.task(async()=>{
			let pkg = await import( "../" + config.name + "/pkg.js" );
			await pkg.default( App, config );
			return true;
		});
		return this
	}

	set_camera( ox=-15, oy=15, od=2.5, tx=0, ty=0.75, tz=0 ){
		this.task( ()=>{
			App.cam_ctrl
				.set_target( tx, ty, tz )
				.set_orbit( ox, oy, od );
			return true;
		});
		return this;
	}

	use_debug(){
		this.task( async()=>{ 
			let mod = await import("./Debug.js");
			App.Debug = mod.default;
			App.Debug.init();
			return true; 
		});
		return this;
	}
	// #endregion ///////////////////////////////////////////////////////////////
}

//################################################################################################

export default App;
export {
	Node, Draw, Colour,
	Maths, Quat, Vec3, Transform, Mat4,
};