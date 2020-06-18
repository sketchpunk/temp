
import Colour from "./Colour.js";

const ARRAY 	= 34962;
const ELEMENT	= 34963;
const UNIFORM	= 35345;

class Context{
	// #region MAIN
	canvas	= null;
	ctx		= null;
	width	= 0;
	height	= 0;

	constructor( canvas ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Html Element
		if( typeof canvas == "string" ){
			canvas = document.getElementById( canvas );
			if( !canvas ){ console.error("Canvas element not found."); return false; }
			this.canvas = canvas;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// WebGL Context
		this.ctx = canvas.getContext( "webgl2", { alpha: false } ); //getContext( 'webgl2', { antialias: false, xrCompatible:true } ); //premultipliedAlpha: true
		if( !this.ctx ){ console.error("WebGL context is not available."); return false; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		//Load Extension
		//gl.ctx.getExtension("EXT_color_buffer_float");	//Needed for Deferred Lighting
		//gl.ctx.getExtension("OES_texture_float_linear");

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		//Setup some defaults
		let c = this.ctx;
		c.cullFace(		c.BACK );			// Back is also default
		c.frontFace(	c.CCW );			// Dont really need to set it, its ccw by default.
		c.enable( 		c.DEPTH_TEST );		// Shouldn't use this, use something else to add depth detection
		c.enable( 		c.CULL_FACE );		// Cull back face, so only show triangles that are created clockwise
		c.depthFunc( 	c.LEQUAL );			// Near things obscure far things
		c.blendFunc( 	c.SRC_ALPHA,		// Setup default alpha blending
						c.ONE_MINUS_SRC_ALPHA);

		/*
		c.blendFunc( c.ONE, c.ONE ); //BLEND_ADDITIVE
		c.blendFunc( c.SRC_ALPHA, c.ONE ); // BLEND_ALPHA_ADDITIVE
		c.blendFunc( c.ONE, c.ZERO ); // BLEND_OVERRIDE
		c.blendFunc( c.SRC_ALPHA, c.ONE_MINUS_SRC_ALPHA ); //BLEND_ALPHA
		*/
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 

	// #region METHODS

	clear(){ this.ctx.clear( this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT ); return this; }

	fit_screen( wp = 1, hp = 1 ){ this.set_size( window.innerWidth * wp, window.innerHeight * hp ); return this; }

	set_size( w=500, h=500 ){
		// set the size of the canvas, on chrome we need to set it 3 ways to make it work perfectly.
		this.ctx.canvas.style.width		= w + "px";
		this.ctx.canvas.style.height	= h + "px";
		this.ctx.canvas.width			= w;
		this.ctx.canvas.height			= h;

		// when updating the canvas size, must reset the viewport of the canvas 
		// else the resolution webgl renders at will not change
		this.ctx.viewport( 0, 0, w, h );
		this.width	= w;	// Need to save Width and Height to resize viewport back if we need to.
		this.height	= h;
		return this;
	}

	set_color( hex ){
		let c = new Colour( hex ).rgba;
		this.ctx.clearColor( c[ 0 ], c[ 1 ], c[ 2 ], c[ 3 ] );
		return this;
	}	
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
}

export default Context;