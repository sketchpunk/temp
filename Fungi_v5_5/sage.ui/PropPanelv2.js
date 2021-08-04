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

function newUUID(){
    let dt = new Date().getTime();
    if( window.performance && typeof window.performance.now === "function" ) dt += performance.now(); //use high-precision timer if available
    
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, ( c )=>{
        let r = ( dt + Math.random() * 16 ) % 16 | 0;
        dt = Math.floor( dt / 16 );
        return ( c == "x" ? r : ( r & 0x3 | 0x8 ) ).toString( 16 );
    });
}
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
        this.shadowRoot.appendChild( PropRow.Template.content.cloneNode( true ) ); //document.importNode( PropPanel.Template.content, true )
    
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
PropRow.Template = document.createElement( "template" );
PropRow.Template.innerHTML = `${css_link}
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
        this.decPlace   = 2;
        this.isInt      = false;
        this.min_value	= 0;            // Smallest Possible Value
		this.max_value	= 10;           // Greatest Possible Value
		this.range 		= 10;           // Range Between the Min and Max
        this.steps      = 0;            // How to step between min/max
        this._value     = [ 0, 10 ];    // Current Values
        
        if( this.hasAttribute( "min" ) )        this.min_value      = parseFloat( this.getAttribute( "min" ) );
        if( this.hasAttribute( "max" ) )        this.max_value      = parseFloat( this.getAttribute( "max" ) );
        if( this.hasAttribute( "minValue" ) )   this._value[ 0 ]    = parseFloat( this.getAttribute( "minValue" ) );
        if( this.hasAttribute( "maxValue" ) )   this._value[ 1 ]    = parseFloat( this.getAttribute( "maxValue" ) );
        if( this.hasAttribute( "decPlace" ) )   this.decPlace       = parseInt( this.getAttribute( "decPlace" ) );
        
        this.range = this.max_value - this.min_value;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.appendChild( document.importNode( RangeInput.Template.content, true ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.width     = 0; // Width of Component
        this.height    = 0; // Heigh of component
        this.max_x     = 0; // Max X thumb may scroll to
        
        this.svg       = this.querySelector( "svg" );
        this.track     = this.querySelector( "path.rng_track" );
        this.conn      = this.querySelector( "path.rng_connect" );
        this.thumbs    = [
            this.querySelector( '[name="minThumb"]'),
            this.querySelector( '[name="maxThumb"]'),
        ];
        this.labels    = [
            this.thumbs[ 0 ].querySelector( 'text'),
            this.thumbs[ 1 ].querySelector( 'text'),
        ];

        this.thumb_width  = 30;         // Width of Thumb
        this.thumb_height = 14;         // Height of thumb
        this.thumb_y      = 0;          // Y Position to render thumbs
        this.sel_thumb    = null;       // Index of which Thumb is selected
        this.page_pos     = [0,0];      // XY of Page Postion of SVG
        this.thumb_pos    = [0,100];    // X Position of Both Thumbs
        this.offset_x     = 0;          // Offset on mouse down to keep thumb under same spot under mouse

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Events
		this.mouse_down_bind = this.on_mouse_down.bind( this );
		this.mouse_move_bind = this.on_mouse_move.bind( this );
        this.mouse_up_bind   = this.on_mouse_up.bind( this );

        this.observer = new ResizeObserver( this.on_resize.bind(this) );
        this.observer.observe( this );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.thumbs[0].addEventListener( "mousedown", this.mouse_down_bind, false );
        this.thumbs[1].addEventListener( "mousedown", this.mouse_down_bind, false );
    }
    // #endregion ////////////////////////////////////////

    // #region GETTER / SETTERS
    get value(){ 
        return { 
            min : this._value[ 0 ], 
            max : this._value[ 1 ]
        };
    }

    set_thumb_value( idx, v ){
        let t = (v - this.min_value) / this.range;
        this.set_thumb_pos( idx, t * this.max_x );
    }

    set_thumb_pos( idx, x ){
        let thumb = this.thumbs[ idx ]; // Which Thumb Object to Move
        let h     = this.thumb_y;       // Shortcut to Height
        let t     = x / this.max_x;     // T of x
        let val   = this.min_value * (1.0-t) + this.max_value * t;

        if( this.isInt ) val = Math.round( val );
        else             val = parseFloat( val.toFixed( this.decPlace ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.thumb_pos[ idx ]          = x;     // Update X Position
        this._value[ idx ]             = val;   // Save Value
        this.labels[ idx ].textContent = val;   // Display Value

        thumb.setAttribute( "transform", `translate(${x},${h})` ); // Move Thumb
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Update line that connects the two thumbs
        let a = this.thumb_pos[ 0 ] + 5;
        let b = this.thumb_pos[ 1 ];
        h     = this.height / 2;
        this.conn.setAttribute( "d", `M ${a},${h} L ${b},${h}` );
    }
    // #endregion ////////////////////////////////////////

    // #region WEB COM 
	connectedCallback(){
    }
    // #endregion ////////////////////////////////////////

    // #region EVENTS 
    dispatch_event( evt_name ){
        this.dispatchEvent( new CustomEvent( evt_name, { 
            bubbles    : true, 
            cancelable : true, 
            composed   : false,
            detail     : { 
                min : this._value[ 0 ],
                max : this._value[ 1 ],
            }
        }));
    }

    on_resize( ary ){
        let cr       = ary[0].contentRect;
        let w        = cr.width;
        let h        = cr.height;
        let hh       = h / 2;       // Half Height
        let o        = 4;           // With offset, so round caps can be seen.

        this.width   = w;
        this.height  = h;
        this.max_x   = w - this.thumb_width;
        this.thumb_y = hh - this.thumb_height / 2;

        // Resize Track
        this.track.setAttribute( "d", `M ${o},${hh} L ${w-o},${hh}` );

        // Reposition Thumbs
        this.set_thumb_value( 0, this._value[ 0 ] );
        this.set_thumb_value( 1, this._value[ 1 ] );
	}

	on_mouse_down( e ){
        let g              = e.target.closest( "g" );
        let i              = this.sel_thumb = ( g.getAttribute( "name" ) == 'minThumb' )? 0 : 1;

        let rect           = this.svg.getBoundingClientRect();
        this.page_pos[ 0 ] = rect.left + window.scrollX;
        this.page_pos[ 1 ] = rect.top  + window.scrollY;

        this.offset_x      = e.pageX - this.page_pos[ 0 ] - this.thumb_pos[ i ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        window.addEventListener( "mousemove", this.mouse_move_bind );
        window.addEventListener( "mouseup", this.mouse_up_bind );
    }
    
	on_mouse_move( e ){
        let x  = e.pageX - this.page_pos[ 0 ] - this.offset_x;
        let i  = this.sel_thumb;
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Overlap Check
        if( i == 0 ){
            if( x + this.thumb_width > this.thumb_pos[ 1 ] ) x = this.thumb_pos[ 1 ] - this.thumb_width;
        }else{
            if( x < this.thumb_pos[ 0 ] + this.thumb_width ) x = this.thumb_pos[ 0 ] + this.thumb_width;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Border Check
        if( x < 0 )                   x = 0;
        else if( x > this.max_x ) x = this.max_x;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.set_thumb_pos( i, x );
        this.dispatch_event( "input" );
	}

	on_mouse_up( e ){
        window.removeEventListener( "mousemove", this.mouse_move_bind );
        window.removeEventListener( "mouseup", this.mouse_up_bind );
        this.dispatch_event( "change" );
	}	
    // #endregion ////////////////////////////////////////
}

RangeInput.Template = document.createElement( "template" );
RangeInput.Template.innerHTML = `<svg>
    <path class="rng_track" d="M 0,1 L50,10"></path>
    <path class="rng_connect" d="M 0,10 L 100,10"></path>
    <g class="rng_thumb" name="minThumb">
        <rect width="30" height="14"/>
        <text x="15" y="12" text-anchor="middle">000</text>
    </g>
    <g class="rng_thumb" name="maxThumb" transform="translate(50,0)">
        <rect width="30" height="14"/>
        <text x="15" y="12" text-anchor="middle">999</text>
    </g>
</svg>`;
window.customElements.define( "range-input", RangeInput );


class SlideInput extends HTMLElement{
    // #region MAIN
    constructor(){
        super();
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.decPlace   = 2;
        this.isInt      = false;
        this.min_value	= 0;            // Smallest Possible Value
		this.max_value	= 10;           // Greatest Possible Value
		this.range 		= 10;           // Range Between the Min and Max
        //this.steps      = 0;            // How to step between min/max
        this._value     = 0;            // Current Values

        if( this.hasAttribute( "min" ) )        this.min_value  = parseFloat( this.getAttribute( "min" ) );
        if( this.hasAttribute( "max" ) )        this.max_value  = parseFloat( this.getAttribute( "max" ) );
        if( this.hasAttribute( "value" ) )      this._value     = parseFloat( this.getAttribute( "value" ) );
        if( this.hasAttribute( "decPlace" ) )   this.decPlace   = parseInt( this.getAttribute( "decPlace" ) );
        
        this.range = this.max_value - this.min_value;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.appendChild( document.importNode( SlideInput.Template.content, true ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.width     = 0; // Width of Component
        this.height    = 0; // Heigh of component
        this.max_x     = 0; // Max X thumb may scroll to
        
        this.svg       = this.querySelector( "svg" );
        this.track     = this.querySelector( "path.rng_track" );
        this.conn      = this.querySelector( "path.rng_connect" );
        this.thumbs    = this.querySelector( '[name="minThumb"]' );

        this.labels    = this.thumbs.querySelector( 'text' );

        this.thumb_width  = 35;         // Width of Thumb
        this.thumb_height = 14;         // Height of thumb
        this.thumb_y      = 0;          // Y Position to render thumbs
        this.sel_thumb    = null;       // Index of which Thumb is selected
        this.page_pos     = [0,0];      // XY of Page Postion of SVG
        this.thumb_pos    = 0;          // X Position of Both Thumbs
        this.offset_x     = 0;          // Offset on mouse down to keep thumb under same spot under mouse

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Events
		this.mouse_down_bind = this.on_mouse_down.bind( this );
		this.mouse_move_bind = this.on_mouse_move.bind( this );
        this.mouse_up_bind   = this.on_mouse_up.bind( this );

        this.observer = new ResizeObserver( this.on_resize.bind(this) );
        this.observer.observe( this );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.thumbs.addEventListener( "mousedown", this.mouse_down_bind, false );
    }
    // #endregion ////////////////////////////////////////

    // #region GETTER / SETTERS
    get value(){ return this._value; }
    set value( v ){ this.set_thumb_value( v ); }

    set_thumb_value( v ){
        let t = (v - this.min_value) / this.range;
        this.set_thumb_pos( t * this.max_x );
    }

    set_thumb_pos( x ){
        let thumb = this.thumbs;        // Which Thumb Object to Move
        let h     = this.thumb_y;       // Shortcut to Height
        let t     = x / this.max_x;     // T of x
        let val   = this.min_value * (1.0-t) + this.max_value * t;

        if( this.isInt ) val = Math.round( val );
        else             val = parseFloat( val.toFixed( this.decPlace ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.thumb_pos          = x;     // Update X Position
        this._value             = val;   // Save Value
        this.labels.textContent = val;   // Display Value

        thumb.setAttribute( "transform", `translate(${x},${h})` ); // Move Thumb
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Update line that connects the two thumbs
        let a = this.min_x;
        h     = this.height / 2;
        this.conn.setAttribute( "d", `M 5,${h} L ${x},${h}` );
    }
    // #endregion ////////////////////////////////////////

    // #region WEB COM 
	connectedCallback(){
    }
    // #endregion ////////////////////////////////////////

    // #region EVENTS 
    dispatch_event( evt_name ){
        this.dispatchEvent( new CustomEvent( evt_name, { 
            bubbles    : true, 
            cancelable : true, 
            composed   : false,
            detail     : { 
                value : this._value,
            }
        }));
    }

    on_resize( ary ){
        let cr       = ary[0].contentRect;
        let w        = cr.width;
        let h        = cr.height;
        let hh       = h / 2;       // Half Height
        let o        = 4;           // With offset, so round caps can be seen.

        this.width   = w;
        this.height  = h;
        this.max_x   = w - this.thumb_width;
        this.thumb_y = hh - this.thumb_height / 2;

        // Resize Track
        this.track.setAttribute( "d", `M ${o},${hh} L ${w-o},${hh}` );

        // Reposition Thumbs
        this.set_thumb_value( this._value );
	}

	on_mouse_down( e ){
        let g              = e.target.closest( "g" );
        let rect           = this.svg.getBoundingClientRect();
        this.page_pos[ 0 ] = rect.left + window.scrollX;
        this.page_pos[ 1 ] = rect.top  + window.scrollY;

        this.offset_x      = e.pageX - this.page_pos[ 0 ] - this.thumb_pos;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        window.addEventListener( "mousemove", this.mouse_move_bind );
        window.addEventListener( "mouseup", this.mouse_up_bind );
    }
    
	on_mouse_move( e ){
        let x  = e.pageX - this.page_pos[ 0 ] - this.offset_x;
        let i  = this.sel_thumb;
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Overlap Check
        if( i == 0 ){
            if( x + this.thumb_width > this.thumb_pos[ 1 ] ) x = this.thumb_pos[ 1 ] - this.thumb_width;
        }else{
            if( x < this.thumb_pos[ 0 ] + this.thumb_width ) x = this.thumb_pos[ 0 ] + this.thumb_width;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Border Check
        if( x < 0 )               x = 0;
        else if( x > this.max_x ) x = this.max_x;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.set_thumb_pos( x );
        this.dispatch_event( "input" );
	}

	on_mouse_up( e ){
        window.removeEventListener( "mousemove", this.mouse_move_bind );
        window.removeEventListener( "mouseup", this.mouse_up_bind );
        this.dispatch_event( "change" );
	}	
    // #endregion ////////////////////////////////////////
}

SlideInput.Template = document.createElement( "template" );
SlideInput.Template.innerHTML = `<svg>
    <path class="rng_track" d="M 0,1 L50,10"></path>
    <path class="rng_connect" d="M 0,10 L 100,10"></path>
    <g class="rng_thumb" name="minThumb">
        <rect width="35" height="14"/>
        <text x="17" y="8" dominant-baseline="middle" text-anchor="middle" >000</text>
    </g>
</svg>`;
window.customElements.define( "slide-input", SlideInput );


class SlideInputXX extends HTMLElement{
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
//window.customElements.define( "slide-input", SlideInput );


// #endregion /////////////////////////////////////////////////////////////////////////

// #region DRAG NUMBER INPUT
class DragNumberInput extends HTMLElement{
    // #region MAIN
    constructor(){
        super();

        this.isInt = false;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.min_value = 0;
        this.max_value = 0;
        this.step      = 1;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //this.attachShadow( {mode: 'open'} );
        //this.shadowRoot.appendChild( DragNumberInput.Template.content.cloneNode( true ) );
        this.appendChild( document.importNode( DragNumberInput.Template.content, true ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.init_x         = 0;
        this.inc_step       = 10;
        this.start_value    = 0;

        if( this.hasAttribute( "value" ) )  this.start_value    = parseFloat( this.getAttribute( "value" ) );
        if( this.hasAttribute( "step" ) )   this.step           = parseFloat( this.getAttribute( "step" ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Events
		this.mouse_down_bind = this.on_mouse_down.bind( this );
		this.mouse_move_bind = this.on_mouse_move.bind( this );
        this.mouse_up_bind   = this.on_mouse_up.bind( this );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.svg            = this.querySelector( "svg" );
        this.svg_line       = this.svg.querySelector( "path:nth-of-type(1)" );
        this.svg_line_end   = this.svg.querySelector( "path:nth-of-type(2)" );

        this.input          = this.querySelector( "input" );
        this.input.value    = this.start_value;

        let div = this.querySelector( "div" );
        div.addEventListener( "mousedown", this.mouse_down_bind, false );

        this.input.addEventListener( "input", (e)=>{
            e.stopPropagation(); e.preventDefault();
            this.dispatch_event( "input" );
        });
    }
    
    // #endregion ////////////////////////////////////////

    // #region GETTER / SETTERS
    get value(){ return this.input.value; }
    // #endregion ////////////////////////////////////////

    // #region WEB COM 
	connectedCallback(){}
    // #endregion ////////////////////////////////////////

    // #region EVENTS 
    dispatch_event( evt_name ){
        this.dispatchEvent( new CustomEvent( evt_name, { 
            bubbles    : true, 
            cancelable : true, 
            composed   : false,
            detail     : { value : this.input.value }
        }));
    }

	on_mouse_down( e ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.init_x         = this.svg.getBoundingClientRect().left;
        this.start_value    = parseFloat( this.input.value );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.svg_line.setAttribute( "d", "M 0,0 L 0,0" );
        this.svg_line_end.setAttribute( "d", `M 0,-4 L 0,4` );
        this.classList.add( "show" );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        window.addEventListener( "mousemove", this.mouse_move_bind );
        window.addEventListener( "mouseup", this.mouse_up_bind );
    }
    
	on_mouse_move( e ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let x   = e.clientX - this.init_x; 
        let inc = Math.floor( x / this.inc_step );

        this.svg_line.setAttribute( "d", "M 0,0 L" + x +",0" );
        this.svg_line_end.setAttribute( "d", `M ${x},-4 L${x},4` );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let val = this.start_value + inc * this.step;
        
        if( this.max_value != this.min_value ){
            if( val > this.max_value )      val = this.max_value;
            else if( val < this.min_value ) val = this.min_value;
        }

        if( this.isInt ) val = Math.round( val );
        else             val = parseFloat( val.toFixed( 2 ) );

        this.input.value = val;
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.dispatch_event( "input" );
	}

	on_mouse_up( e ){
        window.removeEventListener( "mousemove", this.mouse_move_bind );
        window.removeEventListener( "mouseup", this.mouse_up_bind );
        this.classList.remove( "show" );
        this.dispatch_event( "change" );
	}	
    // #endregion ////////////////////////////////////////
}

DragNumberInput.Template = document.createElement( "template" );
DragNumberInput.Template.innerHTML = `<div><svg>
    <path d="M 0,0 L15,0"></path>
    <path d="M 15,-4 L15,4"></path>
    <circle cx="0" cy="0" r="4"></circle>
</svg></div>
<input type="number" value="0">`;

window.customElements.define( "drag-number-input", DragNumberInput );
// #endregion /////////////////////////////////////////////////////////////////////////

// #region CheckButton

class CheckButton extends HTMLElement{
    constructor(){
        super();
        let id = newUUID()
        this.appendChild( document.importNode( CheckButton.Template.content, true ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.chkbox	= this.querySelector( "input" );
        this.label	= this.querySelector( "label" );
        
        this.chkbox.setAttribute( "id", id );
        this.label.setAttribute( "for", id );

        if( this.hasAttribute( "on" ) ) this.chkbox.checked = ( this.getAttribute( "on" ) == "true" );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.chkbox.addEventListener( "input", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            this.dispatchEvent( new CustomEvent( "input", { 
                bubbles    : true, 
                cancelable : true, 
                composed   : false,
                detail     : { 
                    value : this.chkbox.checked,
                }
            }));
        });
    }
    connectedCallback(){}
}
CheckButton.Template = document.createElement( "template" );
CheckButton.Template.innerHTML = `<input type="checkbox" id="rcc" checked/><label for="rcc"></label>`;

window.customElements.define( "check-button", CheckButton );
// #endregion

//<main class="chkbox_btn onoff"></main>

export default {};
