class PageLayout extends HTMLElement{
	//this.attachShadow( {mode:"open"} );
	//this.shadowRoot.appendChild( tmpl.content.cloneNode( true ) );
	constructor(){ super(); }

	connectedCallback(){ 
		this.appendChild( document.importNode( PageLayout.Template.content, true ) ); //this.appendChild( tmpl.cloneNode( true ) );
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Set Headers
		let elm_title		= this.querySelector("#pgtitle");
		//elm_title.innerText	= `${d.getDate()} ${d.toLocaleString('en-US',{month:'long', year:'numeric'})}`;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Slot Injection
		
		/*
		let s, ss, slots = this.querySelectorAll("*[slot]");
		for( s of slots ){
			ss = this.querySelector( "*[name="+s.slot+"]" );
			if( !ss ) continue;

			if( ss.tagName == "SLOT" )	ss.parentNode.replaceChild( s, ss );
			else 						ss.appendChild( s );
		}
		*/
	}

	disconnnectedCallback(){ console.log("disconnected"); }
} 

//######################################################################################
PageLayout.Template = document.createElement("template");
PageLayout.Template.innerHTML = `<html><head><title></title></head><body><style>
	html,body{ margin:0px; padding:0px; width:100%; height:100%; }
	body{ background-color:#404040; }
	canvas{ border:0px solid green; }
	div{ display:flex; width:100%; height:100%; align-items:center; justify-content:center; }
</style><div><canvas id="pg_canvas"></canvas></div></body></html>`;


//######################################################################################
window.customElements.define("page-layout", PageLayout );

export default PageLayout;