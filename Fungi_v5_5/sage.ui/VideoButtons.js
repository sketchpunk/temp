// #region STARTUP
const mod_path = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const css_path = mod_path + "VideoButtons.css";
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

const STOP  = 0;
const PLAY  = 1;
const PAUSE = 2;

class VideoButtons extends HTMLElement{
    // #region MAIN
    constructor(){
        super();
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.state = STOP;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.appendChild( document.importNode( VideoButtons.Template.content, true ) );

        this.click_bind = this.on_click.bind( this );
        for( let b of this.querySelectorAll( "button" ) ){
            b.addEventListener( "click", this.click_bind );
        }

        this.svg_play  = this.querySelector( "#svg_play" );
        this.svg_pause = this.querySelector( "#svg_pause" );
    }
    // #endregion ////////////////////////////////////////

    // #region WEB COM 
	connectedCallback(){
        if( this.hasAttribute( "show" ) ){
            let ary = this.getAttribute( "show" ).split( "," );
            for( let b of this.querySelectorAll( "button" ) ){
                b.style.display = ( ary.indexOf( b.name ) >= 0 )? "inline-block" : "none";
            }
        }

        if( this.hasAttribute( "state" ) ){
            switch( this.getAttribute( "state") ){
                case "play" : this.state = PLAY; break;
                case "pause" : this.state = PAUSE; break;
                case "stop" : this.state = STOP; break;
            }

            this.handle_state();
        }
    }
    // #endregion ////////////////////////////////////////

    // #region EVENTS 
    dispatch_event( btn_name ){
        this.dispatchEvent( new CustomEvent( "tap", { 
            bubbles    : true, 
            cancelable : true, 
            composed   : false,
            detail     : { 
                state  : this.state,
                button : btn_name,
            }
        }));
    }

    handle_state(){
        switch( this.state ){
            case PLAY  :
                this.svg_play.style.display  = "none";
                this.svg_pause.style.display = "inline-block";
                break;
            case STOP  :
            case PAUSE :
                this.svg_play.style.display  = "inline-block";
                this.svg_pause.style.display = "none";
                break;
        }
    }

    on_click( e ){
        let btn = e.srcElement;
        if( btn.tagName != "BUTTON" ) btn = btn.closest( "button" );

        switch( btn.name ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case "play_pause":
                switch( this.state ){
                    case PLAY  : this.state = PAUSE; break;
                    case STOP  :
                    case PAUSE : this.state = PLAY;  break;
                }
                this.handle_state();
            break;
            
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case "stop":
                if( this.state != STOP ){
                    this.state = STOP;
                    this.handle_state();
                }
            break;
        }

        this.dispatch_event( btn.name );
    }
}

VideoButtons.Template = document.createElement( "template" );
VideoButtons.Template.innerHTML = `
<button name="fast_rewind"><svg viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg></button>
<button name="play_pause">
    <svg id="svg_play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    <svg id="svg_pause" style="display:none;" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
</button>
<button name="stop"><svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg></button>
<button name="fast_forward"><svg viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg></button>`;
window.customElements.define( "video-buttons", VideoButtons );

/*
<button name="skip_back"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
<button name="skip_forward"><svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
*/

export default VideoButtons;