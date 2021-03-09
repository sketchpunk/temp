import Context		from "../../fungi/core/Context.js";
import Buffer		from "../../fungi/core/Buffer.js";
import Shader 		from "../../fungi/core/Shader.js";
import Vao			from "../../fungi/core/Vao.js";
import Mesh			from "../../fungi/core/Mesh.js";
import Fbo			from "../../fungi/core/Fbo.js";
//import Colour		from "../../fungi/core/Colour.js";
import Texture		from "../../fungi/core/Texture.js";

import Mat4         from "../../fungi/maths/mat4.js";

class App{
    //#################################################
    static gl           = null;
    static buffer       = null;
    static shader       = null;
    static vao          = null;
	static mesh         = null;
    static texture      = null;
    
    //#################################################

    static ortho_proj   = new Mat4();
    static main_fbo     = null;
    static offset_x     = 0;
    static offset_y     = 0;

    static on_mouse     = null;

    //#################################################

    static init(){
        console.log("[ Sketch.App 0.1 ]");

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// GL CONTEXT
        App.gl = new Context( "pg_canvas" );
        if( !App.gl.ctx ) return false;
    
        App.gl.set_color( "#363636" ).fit_screen().clear();
        //window.addEventListener( "resize", (e)=>{ App.gl.fit_screen(); });
    
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// CORE
        App.buffer		= new Buffer( App.gl );
        App.texture		= new Texture( App.gl );
		App.vao			= new Vao( App.gl );
		App.shader		= new Shader( App.gl, App.texture );
        App.mesh		= new Mesh( App.gl, App.vao, App.buffer, App.shader );
        App.fbo         = new Fbo( App.gl );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        App.ortho_proj.from_ortho( 0, App.gl.width, App.gl.height, 0, -100, 100 );

        App.main_fbo = App.fbo.new( {
            width   : App.gl.width,
            height  : App.gl.height,
            buffers : [
                { attach:0, name:"color", type:"color", mode:"tex", pixel:"byte" },
            ]
        } );

        let box			= App.gl.canvas.getBoundingClientRect();
		App.offset_X	= box.left;	// Help get X,Y in relation to the canvas position.
        App.offset_y	= box.top;
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let c = App.gl.canvas;
        c.addEventListener( "mousedown", (e)=>{
            if( App.on_mouse ){
                let x = e.pageX - App.offset_x,
                    y = e.pageY - App.offset_y;

                App.on_mouse( 1, x, y );
                c.addEventListener( "mousemove", App.on_mouse_move );
            }
        });

        c.addEventListener( "mouseup", (e)=>{
            if( App.on_mouse ){
                c.removeEventListener( "mousemove", App.on_mouse_move );

                let x = e.pageX - App.offset_x,
                    y = e.pageY - App.offset_y;

                App.on_mouse( 0, x, y );
            }
        });

        return true;
    }

    static on_mouse_move( e ){
        let x = e.pageX - App.offset_x,
            y = e.pageY - App.offset_y;
        App.on_mouse( 2, x, y );
    }

}

export default App;