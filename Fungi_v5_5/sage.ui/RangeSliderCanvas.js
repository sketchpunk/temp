class RangeInput extends HTMLElement{
    // #region MAIN
    constructor(){
		super();
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.min_value	= 0;
		this.max_value	= 10;
		this.range 		= 10;
		this.min		= 0;
        this.max		= 10;
        this.steps      = 0;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.width	= 0;
		this.height	= 0;
		this.canvas	= document.createElement( "canvas" );
		this.ctx	= this.canvas.getContext( "2d" );
		this.appendChild( this.canvas );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.pos      = [ 0, Infinity ];    // Position of each Thumb
        this.sel      = 0;                  // Which Thumb is Selected
        this.padding  = 7;                  // Pad the X Min and Max Positions
        this.x_min    = 0;                  // Min X for Drawing
        this.x_max    = 0;                  // Max X for Drawing
        this.x_rng    = 0;                  // Pixel Range for Drawing
        this.page_pos = [0,0];

        this.hit_limit     = 15;            // Range for Hit detection of Thumb
        this.collide_limit = 13;            // Min Distance each thumb can be from eachother.

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Events
		this.observer = new ResizeObserver( this.on_resize.bind(this) );
		this.observer.observe( this );

		this.mouse_down_bind = this.on_mouse_down.bind( this );
		this.mouse_move_bind = this.on_mouse_move.bind( this );
        this.mouse_up_bind   = this.on_mouse_up.bind( this );
		this.canvas.addEventListener( "mousedown", this.mouse_down_bind );
        this.canvas.addEventListener( "mouseup", this.mouse_up_bind );
	}
    // #endregion ////////////////////////////////////////

    // #region GETTER / SETTERS
    get value(){ return [ this.min_value, this.max_value ]; }
    // #endregion ////////////////////////////////////////

    // #region WEB COM 
	connectedCallback(){
        //this.draw();
        //this.style.border = "1px solid red";
    }
    // #endregion ////////////////////////////////////////

    // #region EVENTS 
    dispatch_event( evt_name ){
        this.dispatchEvent( new CustomEvent( evt_name, { 
            bubbles    : true, 
            cancelable : true, 
            composed   : false,
            detail     : { 
                min_value : this.min_value,
                max_value : this.max_value,
                sel_thumb : this.sel,
            } 
        }));
    }

	on_resize( ary ){
		let cr						= ary[0].contentRect;
		this.width					= cr.width;
		this.height					= cr.height;
		this.canvas.width			= this.width;
		this.canvas.height			= this.height;
		this.canvas.style.width		= this.width + "px";
        this.canvas.style.height	= this.height + "px";

        this.x_min                  = this.padding;
        this.x_max                  = this.width - this.padding;
        this.x_rng                  = this.x_max - this.x_min;
        
        if( this.pos[1] == Infinity ){
            this.pos[0] = this.x_min;
            this.pos[1] = this.x_max;
        }else{
            console.log( "ON_RESIZE UPDATE POSITION NOT IMPLEMENTED" ); //TODO
        }

		this.draw();
	}

	on_mouse_down( e ){ console.log( this.height, this.width );
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Which slider did the user select
        if( Math.abs( this.pos[0] - e.layerX ) < this.hit_limit )       this.sel = 0;
        else if( Math.abs( this.pos[1] - e.layerX ) < this.hit_limit )  this.sel = 1; 
        else                                                            this.sel = -1;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the current position on page
        let rect = this.getBoundingClientRect();
        this.page_pos[ 0 ] = rect.left + window.scrollX;
        this.page_pos[ 1 ] = rect.top + window.scrollY;
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // If selected, Enable Animation
        if( this.sel != -1 ){
            window.addEventListener( "mousemove", this.mouse_move_bind );
            window.addEventListener( "mouseup", this.mouse_up_bind );
        }
    }
    
	on_mouse_move( e ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Clamp and Limit X Position
        let x = e.pageX - this.page_pos[ 0 ];

        // Dont let point go pass the other
        if( this.sel == 0 && x >= this.pos[1] - this.collide_limit ) x = this.pos[1] - this.collide_limit;
        if( this.sel == 1 && x <= this.pos[0] + this.collide_limit ) x = this.pos[0] + this.collide_limit;

        // Clamp to boundary
        if( x < this.x_min )        x = this.x_min;
        else if( x > this.x_max )   x = this.x_max;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Normalize Position
        let t = ( x - this.x_min ) / this.x_rng;
        if( t <= 0.001 )        t = 0;
        else if( t >= 0.999 )   t = 1;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute Range Value of position
        let v = this.min * (1-t) + this.max * t;
        this.pos[ this.sel ] = x;

        if( this.sel == 0 ) this.min_value = v;
        else                this.max_value = v;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.dispatch_event( "input" );
        this.draw();
	}

	on_mouse_up( e ){
        window.removeEventListener( "mousemove", this.mouse_move_bind );
        window.removeEventListener( "mouseup", this.mouse_up_bind );
        this.dispatch_event( "change" );
	}	
    // #endregion ////////////////////////////////////////

    // #region DRAWING 
	draw(){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute Position
        const thumb_h  = 8;
        const thumb_w  = 3;
        const track_h  = 10;
        const track_p  = 3;
        const on_color = "#c8cad0";

		let a  = this.pos[0];
		let b  = this.pos[1];
        let h  = this.height * 0.5;
        let h0 = h - thumb_h;
        let h1 = h + thumb_h;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Drawing
        this.ctx.clearRect( 0, 0, this.width, this.height );
        
        // Draw Track
        this.draw_line( this.x_min+track_p, h, this.x_max-track_p, h, track_h, "gray", "round" );
        this.draw_line( a, h, b, h, track_h, on_color, "butt" );

        // Draw Thumbs
        this.draw_line( a, h0, a, h1, thumb_w, on_color );
        this.draw_line( b, h0, b, h1, thumb_w, on_color );
	}

    draw_circle( x, y, r, color ){
        const p2 = Math.PI * 2;
		this.ctx.beginPath();
		this.ctx.arc( x, y, r, 0, p2, false );
		this.ctx.closePath();
		this.ctx.fillStyle = color;
		this.ctx.fill();
    }

    draw_line( x0, y0, x1, y1, w, color, lineCap ){
        this.ctx.beginPath();
        this.ctx.lineCap = lineCap;
		this.ctx.moveTo( x0, y0 );
		this.ctx.lineTo( x1, y1 );
		//this.ctx.closePath();

		this.ctx.lineWidth		= w;
		this.ctx.strokeStyle	= color;
		this.ctx.stroke();
    }
    // #endregion ////////////////////////////////////////
}
window.customElements.define( "range-input", RangeInput );