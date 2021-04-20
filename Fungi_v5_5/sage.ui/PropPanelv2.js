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
    
    connectedCallback(){console.log( "callback" );
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
    
    connectedCallback(){console.log( "callbackx" );
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

export default {};