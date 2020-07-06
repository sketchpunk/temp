/*
<nav-panel class="Btns bot">
	<button slot="left">&#10010;</button>
	<button slot="left">&#9866;</button>
	<button slot="left" class="on">&#10004;</button>
	<label slot="center" name="p1">xxx</label>
</nav-panel>
*/
class NavPanel extends HTMLElement{
	constructor(){
		super();
		this.loaded = false;
		this.labels = new Map();
		this.left	= document.createElement( "header" );
		this.center	= document.createElement( "main" );
		this.right	= document.createElement( "footer" );

		this.appendChild( this.left );
		this.appendChild( this.center );
		this.appendChild( this.right );
	}

	set_text( lbl_name, txt ){
		let lbl = this.label.get( lbl_name );
		if( lbl )	lbl.innerHTML = txt;
		else 		console.error( "NO LABEL BY NAME :", txt );
		return this;
	}

	// #region WebComponent
	connectedCallback(){
		if( this.loaded ) return;
		this.loaded = true;

		let n, ns = this.querySelectorAll( "*[slot]" );
		for( n of ns ){
			switch( n.getAttribute("slot") ){
				case "left": this.left.appendChild( n ); break;
				case "center": this.center.appendChild( n ); break;
				case "right": this.right.appendChild( n ); break;
			}

			if( n.tagName == "LABEL" && n.name ) this.labels.set( n.name, n );
		}
	}
	// #endregion //////////////////////////////////////////////////////////////
}

window.customElements.define( "nav-panel", NavPanel );

(function(){
	let mod_path	= import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 ),
		link		= document.createElement( "link" );

	link.rel	= "stylesheet";
	link.type	= "text/css";
	link.media	= "all";
	link.href	= mod_path + "NavPanel.css";
	document.getElementsByTagName( "head" )[0].appendChild( link );
})();

export default NavPanel;