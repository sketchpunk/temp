import * as THREE			from "./three.module.js";
import { OrbitControls }	from "./OrbitControls.js";

//########################################################################
class App{
	constructor( container=null ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Setup Renderer
		let w = 0, h = 0;
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor( 0x3a3a3a, 1 );
		
		if( !container ){
			w = window.innerWidth;
			h = window.innerHeight;
			document.body.appendChild( this.renderer.domElement );
		}else{
			let elm = document.getElementById( container );
			let box = elm.getBoundingClientRect();

			w = box.width;
			h = box.height;
			elm.appendChild( this.renderer.domElement );
		}
		this.renderer.setSize( w, h );
		

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Setup Other Bits
		this.scene		= new THREE.Scene();
		this.clock		= new THREE.Clock();
		this.camera		= new THREE.PerspectiveCamera( 75, w / h, 0.1, 1000 );
		this.orbit		= new OrbitControls( this.camera, this.renderer.domElement );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Setup Lighting
		this.light		= new THREE.DirectionalLight( 0xffffff, 1.0 );
		this.light.position.set( -10, 100, 0 );
		this.scene.add( this.light );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Misc
		this.on_render		= null;
		this.render_bind	= this.render.bind( this );
	}

	///////////////////////////////////////////////////////
	//
	///////////////////////////////////////////////////////
		add( o ){ this.scene.add( o ); return this; }

		load_scene( x=0, y=5, z=5 ){
			this.scene.add( new THREE.GridHelper( 20, 20, 0x0c610c, 0x444444 ) );
			this.camera.position.set( x, y, z );
			return this;
		}

		on( cb ){ this.on_render = cb; return this; }

		set_cam( x, y, z ){ this.camera.position.set( x, y, z ); return this; }
		set_bg( color ){ this.renderer.setClearColor( color, 1 ); return this; }

	///////////////////////////////////////////////////////
	//
	///////////////////////////////////////////////////////
		render(){
			if( this.on_render ) this.on_render( 				// Execute Any Code
				this.clock.getDelta(),
				this.clock.getElapsedTime(),
			);

			this.orbit.update();								// Update Camera
			this.renderer.render( this.scene, this.camera );	// Render
			requestAnimationFrame( this.render_bind );			// Next Frame
		}
}

//########################################################################
export default App;
export { THREE };