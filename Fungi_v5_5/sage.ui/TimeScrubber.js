// #region STARTUP
const mod_path = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const css_path = mod_path + "TimeScrubber.css";
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


class TimeScrubber extends HTMLElement{
    // #region MAIN
    constructor(){
        super();
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.grad_value  = 0;
        this.max_time    = 2.4; // In Seconds

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.appendChild( document.importNode( TimeScrubber.Template.content, true ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.inc_per_sec = 10;
        this.padding     = [ 0, 8, 14, 8 ];

        this.width     = 0; // Width of Component
        this.height    = 0; // Heigh of component
        this.max_x     = 0; // Max X thumb may scroll to
        this.min_x     = 0;
        this.range_x   = 0;

        this.svg       = this.querySelector( "svg" );
        this.track     = this.querySelector( "g[name='timetrack']" );
        this.cursor    = this.querySelector( "*[name='cursor']" );

        this.page_pos  = [0,0];      // XY of Page Postion of SVG

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Events
		this.mouse_down_bind = this.on_mouse_down.bind( this );
		this.mouse_move_bind = this.on_mouse_move.bind( this );
        this.mouse_up_bind   = this.on_mouse_up.bind( this );

        this.observer = new ResizeObserver( this.on_resize.bind(this) );
        this.observer.observe( this );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.addEventListener( "mousedown", this.mouse_down_bind, false );
    }
    // #endregion ////////////////////////////////////////

    // #region GETTER / SETTERS
    get value(){ return this.grad_value; }
    set value( v ){ return this.set_cursor_grad( v ); }

    set_max_time( s ){
        this.max_time = s;
        this.build_track();
        return this;
    }

    set_cursor_grad( t ){
        let x = this.min_x * (1.0-t) + this.max_x * t;
        this.cursor.setAttribute( "transform", `translate(${x},0)` );
        this.grad_value = t;
    }
    // #endregion ////////////////////////////////////////

    // #region WEB COM 
	connectedCallback(){
        if( this.hasAttribute( "time") ){
            this.max_time = parseFloat( this.getAttribute( "time" ) );
        }
    }
    // #endregion ////////////////////////////////////////

    // #region SVG
    new_path( x, y0, y1, cls=null ){
        let n = document.createElementNS( "http://www.w3.org/2000/svg", "path" );
        n.setAttribute( "d", `M ${x},${y0} L${x},${y1}` );
        if( cls ) n.setAttribute( "class", cls );
        return n;
    }

    new_text( x, y, txt ){
        let n = document.createElementNS( "http://www.w3.org/2000/svg", "text" );
        n.setAttribute( "x", x );
        n.setAttribute( "y", y );
        n.setAttribute( "text-anchor", "middle" );
        n.textContent = txt;
        return n;
    }

    resize_cursor(){
        const wTab = 7;     // Tab Width
        const hTab = 8;    // Tab Height before Diagnal 
        const eTab = 14;    // End of Tab Hieght
        const w    = 2;     // Tail Width
        const h    = this.height;
        const y    = this.padding[ 0 ];
        this.cursor.setAttribute( "points", `0,${y} ${wTab},${y} ${wTab},${hTab} ${w},${eTab} ${w},${h} 0,${h}` );
    }

    build_track(){
        this.track.textContent = "";

        let pmin_x   = this.padding[ 3 ];
        let pmax_x   = this.padding[ 1 ];
        let pmin_y   = this.padding[ 0 ];
        let pmax_y   = this.padding[ 2 ];
        let min_x    = pmin_x;
        let max_x    = this.width - pmax_x;
        let h        = this.height - pmax_y - pmin_y;
        let hh       = h / 2 + pmin_y;
        let txt_ypos = this.height - 3;
        let inc_cnt  = Math.ceil( this.max_time * this.inc_per_sec );
        let inc      = ( this.width - pmin_x - pmax_x ) / inc_cnt;

        let cls, x, y, num = 0;

        for( let i=0; i <= inc_cnt; i++ ){
            x = i * inc + min_x;

            if( ( i % this.inc_per_sec ) == 0  ){
                y = h;
                cls = "main";
                this.track.appendChild( this.new_text( x, txt_ypos, num++ ) );
            }else{
                y = hh;
                cls = "";
            }

            this.track.appendChild( this.new_path( x, pmin_y, y, cls ) );
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
                grad : this.grad_value,
                time : this.max_time * this.grad_value,
            }
        }));
    }

    on_resize( ary ){
        let cr       = ary[0].contentRect;
        let w        = cr.width;
        let h        = cr.height;

        this.width   = w;
        this.height  = h;

        this.max_x   = w - this.padding[ 1 ];
        this.min_x   = this.padding[ 3 ];
        this.range_x = this.max_x - this.min_x;

        this.build_track();
        this.resize_cursor();
        this.set_cursor_grad( this.grad_value );
    }
    
	on_mouse_down( e ){
        let rect           = this.svg.getBoundingClientRect();
        this.page_pos[ 0 ] = rect.left + window.scrollX;
        this.page_pos[ 1 ] = rect.top  + window.scrollY;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let x = e.layerX;

        if( x < this.min_x )      x = this.min_x;
        else if( x > this.max_x ) x = this.max_x;

        let t = ( x - this.min_x ) / this.range_x;
        this.set_cursor_grad( t );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        window.addEventListener( "mousemove", this.mouse_move_bind );
        window.addEventListener( "mouseup", this.mouse_up_bind );
    }
    
	on_mouse_move( e ){
        let x  = e.pageX - this.page_pos[ 0 ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( x < this.min_x )      x = this.min_x;
        else if( x > this.max_x ) x = this.max_x;

        let t = ( x - this.min_x ) / this.range_x;
        this.set_cursor_grad( t );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.dispatch_event( "input" );
	}

	on_mouse_up( e ){
        window.removeEventListener( "mousemove", this.mouse_move_bind );
        window.removeEventListener( "mouseup", this.mouse_up_bind );
        this.dispatch_event( "change" );
	}	
    // #endregion ////////////////////////////////////////
}

TimeScrubber.Template = document.createElement( "template" );
TimeScrubber.Template.innerHTML = `<svg>
    <g name="timetrack" class="track"></g>
    <polygon name="cursor" class="cursor" points="0,0 8,0 8,5 8,10, 2,15, 2,50, 0,50"
            fill="white" />
</svg>`;
window.customElements.define( "time-scrubber", TimeScrubber );


export default TimeScrubber;