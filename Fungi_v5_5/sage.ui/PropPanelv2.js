// #region STARTUP
const mod_path = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const css_path = mod_path + "PropPanelv2.css";
const css_link = `<link href="${css_path}" rel="stylesheet" type="text/css">`;

(function(){
	let link    = document.createElement( "link" );
	link.rel	= "stylesheet";
	link.type	= "text/css";
	link.media	= "all";
	link.href	= css_path;
	document.getElementsByTagName( "head" )[0].appendChild( link );
})();
// #endregion /////////////////////////////////////////////////////////////////////////

// #region PROP PANEL - BUTTON CONTAINER
class PropPanelBtnCont extends HTMLElement{
    constructor(){
        super();
        this.attachShadow( {mode: 'open'} );
        this.shadowRoot.appendChild( PropPanelBtnCont.Template.content.cloneNode( true ) ); //document.importNode( PropPanel.Template.content, true )
    }
    
    connectedCallback(){
        let sr          = this.shadowRoot;
        this.btn        = sr.querySelector( ":scope > div > button");
        this.section    = sr.querySelector( ":scope > div > section");
        this.click_bind = this.on_click.bind( this );

        this.btn.addEventListener( "click", this.click_bind );

        if( this.getAttribute( "open" ) == "true" ){
            this.btn.className      = "open";
            this.section.className  = "open";
        }

        let tmp = this.getAttribute( "panelWidth" );
        if( tmp ) this.section.style.width = tmp;
    }

    on_click( e ){
        this.section.classList.toggle( "open" );
        this.btn.classList.toggle( "open" );
    }
}

PropPanelBtnCont.Template = document.createElement( "template" );
PropPanelBtnCont.Template.innerHTML = `${css_link}
<div class="prop-panel-btncont">
    <section class=""><slot></slot></section>
    <button><div>
    <svg width="40px" height="40px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;">
        <path id="menu" d="M6,15h12c0.553,0,1,0.447,1,1v1c0,0.553-0.447,1-1,1H6c-0.553,0-1-0.447-1-1v-1C5,15.447,5.447,15,6,15z M5,11v1
            c0,0.553,0.447,1,1,1h12c0.553,0,1-0.447,1-1v-1c0-0.553-0.447-1-1-1H6C5.447,10,5,10.447,5,11z M5,6v1c0,0.553,0.447,1,1,1h12
            c0.553,0,1-0.447,1-1V6c0-0.553-0.447-1-1-1H6C5.447,5,5,5.447,5,6z"/>
    </svg>
    </div></button>
</div>`;
window.customElements.define( "prop-panel-btncont", PropPanelBtnCont );
// #endregion /////////////////////////////////////////////////////////////////////////

// #region PROP PANEL
class PropPanel extends HTMLElement{
	constructor(){
        super();
        this.className = "prop-panel";
        this.attachShadow( {mode: 'open'} );
        this.shadowRoot.appendChild( PropPanel.Template.content.cloneNode( true ) ); //document.importNode( PropPanel.Template.content, true )
    }
    
    connectedCallback(){
        let sr   = this.shadowRoot;
        let head = sr.querySelector( "header" );
        let foot = sr.querySelector( "footer" );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let tmp = this.getAttribute( "label" );
        if( tmp ) head.innerHTML     = tmp;
        else      head.style.display = "none";

        tmp = this.getAttribute( "foot" );
        if( tmp ) foot.innerHTML     = tmp;
        else      foot.style.display = "none";

        //console.log( sr.classList );
        /*
        this.btn        = sr.querySelector( ":scope > div > button");
        this.section    = sr.querySelector( ":scope > div > section");
        this.click_bind = this.on_click.bind( this );

        this.btn.addEventListener( "click", this.click_bind );

        if( this.getAttribute( "open" ) == "true" ){
            this.btn.className      = "open";
            this.section.className  = "open";
        }

        let tmp = this.getAttribute( "panelWidth" );
        if( tmp ) this.section.style.width = tmp;
        */
    }
}

PropPanel.Template = document.createElement( "template" );
PropPanel.Template.innerHTML = `${css_link}<div class="prop-panel"><header></header><main><slot></slot></main><footer></footer></div>`;
window.customElements.define( "prop-panel", PropPanel );
// #endregion /////////////////////////////////////////////////////////////////////////

// #region PROP ROW
class PropRow extends HTMLElement{
    constructor(){
        super();
        this.attachShadow( {mode: 'open'} );
        this.shadowRoot.appendChild( PropPanelBtnCont.Template.content.cloneNode( true ) ); //document.importNode( PropPanel.Template.content, true )
    
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.label	= this.shadowRoot.querySelector( "label" );
		this.main	= this.shadowRoot.querySelector( "main" );
    }

    connectedCallback(){
        let tmp = this.getAttribute( "label" );
        if( tmp ) this.set_label( tmp );
    }

	set_label( txt ){ this.label.innerHTML = txt; return this; }
	append_control( elm ){ this.main.appendChild( elm ); return this; }
}
PropPanelBtnCont.Template = document.createElement( "template" );
PropPanelBtnCont.Template.innerHTML = `${css_link}
<div class="prop-row">
    <label></label>
    <main><slot></slot></main>
</div>`;

window.customElements.define( "prop-row", PropRow );
// #endregion /////////////////////////////////////////////////////////////////////////

// #region PROP GROUP
class PropGroup extends HTMLElement{
	constructor(){
        super();
        this.attachShadow( {mode: 'open'} );
        this.shadowRoot.appendChild( PropGroup.Template.content.cloneNode( true ) ); //document.importNode( PropPanel.Template.content, true )
        
        let sh     = this.shadowRoot;
        this.root  = sh.querySelector( ":scope > div" );
        this.label = sh.querySelector( "header > span" );
        this.main  = sh.querySelector( "main" );
        this.icon  = sh.querySelector( "header > input" );

        this.icon.addEventListener( "click", (e)=>{ 
            if( this.root.classList.contains( "close" ) )   this.open();
            else									        this.close();
        });
	}

    connectedCallback(){
        let tmp = this.getAttribute( "label" );
        if( tmp ) this.label.innerHTML = tmp;
    }
    
	// Observed Attribute
	static observedAttributes = [ "open" ];
	attributeChangedCallback( name, old_value, new_value ){
		//console.log( "attributeChangedCallback : name - %s : old value - %s : new value - %s", name, old_value, new_value );
		switch( name ){
			case "open":
				if( new_value == "true" )	this.open();
				else 						this.close();
			break;
		}
	}

	open(){  this.root.classList.remove( "close" ); this.icon.checked = true; return this; }
    close(){ this.root.classList.add( "close" );    this.icon.checked = false; return this; }
}

PropGroup.Template = document.createElement( "template" );
PropGroup.Template.innerHTML = `${css_link}
<div class="prop-group">
    <header><span></span><input type="checkbox" class="chkCircle" checked></header>
    <main><slot></slot></main>
</div>`;

window.customElements.define( "prop-group", PropGroup );
// #endregion /////////////////////////////////////////////////////////////////////////

// #region RANGE + SLIDER
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

class SlideInput extends HTMLElement{
    // #region MAIN
    constructor(){
		super();
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.main_value  = 0;
		this.range 		 = 10;
		this.min		 = 0;
        this.max		 = 10;
        this.steps       = 0;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.width	= 0;
		this.height	= 0;
		this.canvas	= document.createElement( "canvas" );
		this.ctx	= this.canvas.getContext( "2d" );
		this.appendChild( this.canvas );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.pos       = Infinity;           // Position of Thumb
        this.padding   = 10;                 // Pad the X Min and Max Positions
        this.x_min     = 0;                  // Min X for Drawing
        this.x_max     = 0;                  // Max X for Drawing
        this.x_rng     = 0;                  // Pixel Range for Drawing
        this.page_pos  = [0,0];

        this.hit_limit = 30;                 // Range for Hit detection of Thumb

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
    get value(){ return this.main_value; }
    // #endregion ////////////////////////////////////////

    // #region WEB COM 
	connectedCallback(){
        if( this.hasAttribute( "min" ) ) this.min = parseFloat( this.getAttribute( "min" ) );
        if( this.hasAttribute( "max" ) ) this.max = parseFloat( this.getAttribute( "max" ) );
        this.range = this.max - this.min;

        if( this.hasAttribute( "value" ) ){
            this.main_value = parseFloat( this.getAttribute( "value" ) );
            //let t           = (this.main_value - this.min) / this.range;
            //this.pos        = this.x_min * (1-t) + this.x_max * t;
        }
    }
    // #endregion ////////////////////////////////////////

    // #region EVENTS 
    dispatch_event( evt_name ){
        this.dispatchEvent( new CustomEvent( evt_name, { 
            bubbles    : true, 
            cancelable : true, 
            composed   : false,
            detail     : { 
                value : this.main_value,
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
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let t    = (this.main_value - this.min) / this.range;
        this.pos = this.x_min * (1-t) + this.x_max * t;
        
		this.draw();
	}

	on_mouse_down( e ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Which slider did the user select
        if( !( Math.abs( this.pos - e.layerX ) < this.hit_limit )) return;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the current position on page
        let rect = this.getBoundingClientRect();
        this.page_pos[ 0 ] = rect.left + window.scrollX;
        this.page_pos[ 1 ] = rect.top + window.scrollY;
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Enable Animation
        window.addEventListener( "mousemove", this.mouse_move_bind );
        window.addEventListener( "mouseup", this.mouse_up_bind );
    }
    
	on_mouse_move( e ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Clamp and Limit X Position
        let x = e.pageX - this.page_pos[ 0 ];

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
        
        this.pos        = x;
        this.main_value = v;

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
        const thumb_h  = 16;
        const thumb_w  = 15;
        const track_h  = 10;
        const on_color = "#c8cad0";

		let p  = this.pos;
        let h  = this.height * 0.5;
        let h0 = h - thumb_h;
        let h1 = h + thumb_h;

        if( p < this.x_min + thumb_w ) p = this.x_min + thumb_w;
        if( p > this.x_max - thumb_w ) p = this.x_max - thumb_w;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Drawing
        this.ctx.clearRect( 0, 0, this.width, this.height );
        
        // Draw Track
        this.draw_line( this.x_min, h, this.x_max, h, track_h, "gray", "round" );
        this.draw_line( this.x_min, h, p, h, track_h, on_color, "round" );

        // Draw Thumbs
        this.draw_line( p-thumb_w, h, p+thumb_w, h, thumb_h, on_color, "round", true );
        this.draw_text( this.value.toFixed(2), p, h, -1, "black" );
    }
    
    draw_text( txt, x, y, yoffset, color ){
        //font_style    normal | italic | oblique | 
        //font_variant  normal | small-caps
        //font_weight	normal | bold | bolder | lighter | 100 to 900
		this.ctx.font = "normal normal bold 12px sans-serif";
		let tw = this.ctx.measureText( txt ).width,
			th = this.ctx.measureText( "M" ).width;
        
        this.ctx.fillStyle = color;
        this.ctx.fillText( txt, x - tw*0.5, y + th*0.5 + yoffset );
    }

    draw_circle( x, y, r, color ){
        const p2 = Math.PI * 2;
		this.ctx.beginPath();
		this.ctx.arc( x, y, r, 0, p2, false );
		this.ctx.closePath();
		this.ctx.fillStyle = color;
		this.ctx.fill();
    }

    draw_line( x0, y0, x1, y1, w, color, lineCap="butt", shadow=false ){
        this.ctx.beginPath();
        this.ctx.lineCap = lineCap;
		this.ctx.moveTo( x0, y0 );
		this.ctx.lineTo( x1, y1 );
		//this.ctx.closePath();

        if( shadow ){
            this.ctx.shadowBlur    = 3;
            this.ctx.shadowColor   = "rgba( 0, 0, 0, 0.5 )";
        }

		this.ctx.lineWidth   = w;
		this.ctx.strokeStyle = color;
        this.ctx.stroke();
        
        if( shadow ){
            //this.ctx.shadowOffsetX = 0;
            //this.ctx.shadowOffsetY = 0;
            this.ctx.shadowBlur    = 0;
        }
    }
    // #endregion ////////////////////////////////////////
}
window.customElements.define( "slide-input", SlideInput );
// #endregion /////////////////////////////////////////////////////////////////////////

export default {};