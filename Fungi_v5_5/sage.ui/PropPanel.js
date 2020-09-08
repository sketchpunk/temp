//#############################################################################################

class PropNode extends HTMLElement{
	#label	= null;
	#main	= null;
	constructor( title ){
		super();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check if there is already elements attached
		let elm, elm_ary = new Array();
		for( let i = this.children.length-1; i >= 0; i-- ){
			elm = this.children[ i ];
			if( elm.parentNode ) elm.parentNode.removeChild( elm );
			elm_ary.push( elm );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.#label	= document.createElement( "label" );
		this.#main	= document.createElement( "main" );
		this.appendChild( this.#label );
		this.appendChild( this.#main );
		this.set_label( title || this.getAttribute( "label" ) );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Move The starting elements to main.
		for( let i=elm_ary.length-1; i >= 0; i-- ) this.append_control( elm_ary[ i ] );
	}

	set_label( txt ){ this.#label.innerHTML = txt; return this; }
	append_control( elm ){ this.#main.appendChild( elm ); return this; }
}
window.customElements.define( "prop-node", PropNode );

//#############################################################################################

class PropPanel extends HTMLElement{
	#main	= null;
	#nodes	= new Array();
	vars	= {};
	
	constructor(){ super(); }
	
	// #region WebComponent
	connectedCallback(){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let elm, elm_ary = new Array();
		for( let i = this.children.length-1; i >= 0; i-- ){
			elm = this.children[ i ];
			if( elm.parentNode ) elm.parentNode.removeChild( elm );
			elm_ary.push( elm );
		}

		this.appendChild( document.importNode( PropPanel.Template.content, true ) );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.#main = this.querySelector( "main" );
		this.style.width = this.getAttribute( "width" ) || "300px";

		if( this.hasAttribute( "top" ) ) this.style.top = this.getAttribute( "top" );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( let i=elm_ary.length-1; i >= 0; i-- ) this.append_node( elm_ary[ i ] );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let div = this.querySelector( ":scope > div" );
		div.addEventListener( "click", ()=>{ this.toggle(); } );
	}

	// Observed Attribute
	static observedAttributes = [ "side", "open" ];
	attributeChangedCallback( name, old_value, new_value ){
		switch( name ){
			case "side":
				if( new_value == "right" ){
					this.classList.remove( "left_side" );
					this.classList.add( "right_side" );
				}else{
					this.classList.remove( "right_side" );
					this.classList.add( "left_side" );
				}
			break;
			case "open":
				if( new_value == "true" )	this.open();
				else 						this.close();
			break;
		}
		// console.log( "attributeChangedCallback : name - %s : old value - %s : new value - %s", name, old_value, new_value );
	}
	// #endregion //////////////////////////////////////////////////////////////

	// #region Methods
	append_node( elm ){ this.#main.append( this.node_wrap( elm ) ); }

	toggle(){
		if( this.classList.contains("close") )	this.open();
		else									this.close();
	}

	open(){ this.classList.remove( "close" ); }
	close(){ this.classList.add( "close" ); }

	node_wrap( elm ){
		// console.log( "WrapNOde", elm.getAttribute("name"), elm )
		switch( elm.nodeName ){
			case "PROP-NODE":
			case "PROP-GROUP":
			case "BUTTON":
				return elm;
				break;
			default:
				let name	= elm.getAttribute( "name" ) || elm.getAttribute( "id" );
				let n		= new PropNode( elm.getAttribute( "label" ) || name );
				n.append_control( elm );

				if( name ) this.vars[ name ] = elm;
				return n;
		}
	}
	// #endregion //////////////////////////////////////////////////////////////
} 
PropPanel.Template = document.createElement( "template" );
PropPanel.Template.innerHTML = `<div>Prop</div><header>Property Panel</header><main></main><footer></footer>`;
window.customElements.define( "prop-panel", PropPanel );

//#############################################################################################

class PropGroup extends HTMLElement{
	#header = null;
	#main	= null;
	#icon	= null;
	#label	= null;
	#header_click_bind = this.header_click.bind( this );

	constructor(){
		super();
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check if there is already elements attached
		let elm, elm_ary = new Array();
		for( let i = this.children.length-1; i >= 0; i-- ){
			elm = this.children[ i ];
			if( elm.parentNode ) elm.parentNode.removeChild( elm );
			elm_ary.push( elm );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.#icon		= document.createElement( "i" );
		this.#label		= document.createElement( "span" );
		this.#main		= document.createElement( "main" );
		this.#header	= document.createElement( "header" );
		this.#header.appendChild( this.#icon );
		this.#header.appendChild( this.#label );
		this.appendChild( this.#header );
		this.appendChild( this.#main );

		this.#header.addEventListener( "click", this.#header_click_bind );
		this.#label.innerHTML = this.getAttribute( "label" ) || "Prop Group";

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Move The starting elements to main.
		customElements.whenDefined( "prop-node" ).then( ()=>{
			for( let i=elm_ary.length-1; i >= 0; i-- ) this.append_node( elm_ary[ i ] );
		});
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

	open(){ this.classList.remove( "close" ); return this; }
	close(){ this.classList.add( "close" ); return this; }

	header_click( e ){
		if( this.classList.contains( "close") )	this.open();
		else									this.close();
	}

	append_node( elm ){
		let panel = this.closest("prop-panel");
		this.#main.append( panel.node_wrap( elm ) );
	}
}
window.customElements.define( "prop-group", PropGroup );

//#############################################################################################

class PropRange extends HTMLElement{
	#range			= null;
	#label			= null;
	#on_input_bind	= this.on_input.bind( this );

	constructor(){
		super();
		this.#label			= document.createElement("label");
		this.#range			= document.createElement("input");
		this.#range.type	= "range";
		this.#range.addEventListener( "input", this.#on_input_bind );
		this.on_input();

		if( this.hasAttribute( "min" ) )	this.#range.setAttribute( "min", this.getAttribute( "min" ) );
		if( this.hasAttribute( "max" ) )	this.#range.setAttribute( "max", this.getAttribute( "max" ) );
		if( this.hasAttribute( "step" ) )	this.#range.setAttribute( "step", this.getAttribute( "step" ) );
		if( this.hasAttribute( "value" ) )	this.#range.setAttribute( "value", this.getAttribute( "value" ) );
		if( this.hasAttribute( "id" ) )		this.#range.setAttribute( "id", this.getAttribute( "id" ) );

		this.#label.innerHTML = this.#range.value;

		this.appendChild( this.#range );
		this.appendChild( this.#label );
	}
	get value(){ return this.#range.value; }
	set value(v){ this.#range.value = v; }
	on_input( e ){ this.#label.innerHTML = this.#range.value; }
}
window.customElements.define( "prop-range", PropRange );

//#############################################################################################

class PropCheckStack extends HTMLElement{
	constructor(){
		super();
		let elm, lbl;
		for( let i=this.children.length-1; i >= 0; i-- ){
			elm = this.children[ i ];
			if( elm.tagName != "INPUT" || elm.type != "checkbox" ) continue;
			
			lbl = document.createElement( "label" );
			lbl.innerHTML = elm.title || elm.id;
			lbl.setAttribute( "for", elm.id );

			this.insertBefore( lbl, elm.nextSibling );
		}
	}
	get value(){ return null; };
}
window.customElements.define( "prop-checkstack", PropCheckStack );

//#############################################################################################

class PropVector extends HTMLElement{
	constructor(){
		super();
		this.inputs			= new Array();
		this.input_bind		= this.on_input.bind( this );

		let elm;
		let v		= this.getAttribute( "value" ).split(",");
		let step	= this.getAttribute( "step" );
		let min		= this.getAttribute( "min" );
		let max		= this.getAttribute( "max" );

		for( let i=0; i < v.length; i++ ){
			elm			= document.createElement( "input" );
			elm.type	= "number";
			elm.value	= v[ i ];

			if( step )	elm.step	= step;
			if( min )	elm.min		= min;
			if( max )	elm.max		= max;

			this.appendChild( elm );
			this.inputs.push( elm );
			elm.addEventListener( "input", this.input_bind );
		}
	}

	on_input( e ){
		e.stopPropagation(); //e.preventDefault();
		this.dispatchEvent( new CustomEvent( "input", { detail:this.value, bubbles:true, cancelable:true, composed:false } ) ); 
	}

	get value(){
		let ary = new Array();
		for( let elm of this.inputs ) ary.push( parseFloat( elm.value ) );
		return ary;
	}

	set value( ary ){
		let min = Math.min( ary.length, this.inputs.length );
		for( let i=0; i < min; i++ ) this.inputs[ i ].value = ary[ i ];
	}
}
window.customElements.define( "prop-vector", PropVector );

//#############################################################################################

class PropSlider extends HTMLElement{
	constructor(){
		super();
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.min_value	= 0;
		this.max_value	= 10;

		this.range 		= 10;
		this.min		= 0;
		this.max		= 10;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.width	= 0;
		this.height	= 0;
		this.canvas	= document.createElement( "canvas" );
		this.ctx	= this.canvas.getContext("2d");
		this.appendChild( this.canvas );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.observer = new ResizeObserver( this.on_resize.bind(this) );
		this.observer.observe( this );
	}

	on_resize( ary ){
		let cr						= ary[0].contentRect;
		this.width					= cr.width;
		this.height					= cr.height;
		this.canvas.width			= this.width;
		this.canvas.height			= this.height;
		this.canvas.style.width		= this.width + "px";
		this.canvas.style.height	= this.height + "px";
		this.draw();
	}

	connectedCallback(){
		this.draw();
	}

	draw(){
		this.ctx.clearRect( 0, 0, this.width, this.height );
		this.line();

		let a = (this.min_value - this.min) / this.range;
		let b = (this.max_value - this.min) / this.range;
		let h = this.height/2;
		let pad = 10;
		let ww = this.width - pad * 2;

		this.circle( pad + ww * a, h, 6 );
		this.circle( pad + ww * b, h, 6 );
	}

	line(){
		let h = this.height * 0.5 + 0.5;
		this.ctx.beginPath();
		this.ctx.moveTo( 0, h );
		this.ctx.lineTo( this.width, h );
		this.ctx.closePath();

		this.ctx.lineWidth		= 1;
		this.ctx.strokeStyle	= "green";
		this.ctx.stroke();
	}
	
	circle( x, y, r ){
		const p2 = Math.PI * 2;
		this.ctx.beginPath();
		this.ctx.arc( x, y, r, 0, p2, false );
		this.ctx.closePath();
		this.ctx.fillStyle = "green";
		this.ctx.fill();
	}

	//on_input( e ){
		//e.stopPropagation(); //e.preventDefault();
		//this.dispatchEvent( new CustomEvent( "input", { detail:this.value, bubbles:true, cancelable:true, composed:false } ) ); 
	//}

	//get value(){
		//let ary = new Array();
		//for( let elm of this.inputs ) ary.push( parseFloat( elm.value ) );
		//return ary;
	//}

	//set value( ary ){
		//let min = Math.min( ary.length, this.inputs.length );
		//for( let i=0; i < min; i++ ) this.inputs[ i ].value = ary[ i ];
	//}
}
window.customElements.define( "prop-slider", PropSlider );

//#############################################################################################

class PropProxy{
	constructor( data={} ){
		this.evt 	= document.createElement( "i" );
		this.data	= data;
		this.map	= new Map();

		this.model	= new Proxy( this.data, {
			set	: this._on_proxy_set.bind( this ),
		});

		this._input_bind = this._on_input.bind( this );
	}

	on( evt, fn ){ this.evt.addEventListener( evt, fn ); return this; }
	emit( eName, detail=null ){ 
		this.evt.dispatchEvent( new CustomEvent( eName, { detail, bubbles:true, cancelable:true, composed:false } ) ); 
		return this;
	}

	_on_proxy_set( obj, key, val ){
		//console.log( "proxy set", obj, key, val );
		//this.data[ key ] = val;
		//this.map.get( key ).value = val;
		this.emit( "model_input", { 
			elm : this.map.get( key ),
			key,
			new_val:val,
		});
		return true;
	}

	_on_input( e ){
		let elm				= e.srcElement;
		let key				= elm.bind_var;
		this.emit( "ui_input", { elm, key, new_val:elm.value } );
	}

	add( var_name, input_id, input_evt="input" ){
		let elm = document.getElementById( input_id );
		elm.bind_var = var_name;

		switch( input_evt ){
			case "input"	: elm.addEventListener( "input", this._input_bind ); break;
			case "change"	: elm.addEventListener( "change", this._input_bind ); break;
		}

		this.map.set( var_name, elm );
		return this;
	}
}

//#############################################################################################

(function(){
	let mod_path	= import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 ),
		link		= document.createElement( "link" );

	link.rel	= "stylesheet";
	link.type	= "text/css";
	link.media	= "all";
	link.href	= mod_path + "PropPanel.css";
	document.getElementsByTagName( "head" )[0].appendChild( link );
})();

export default PropPanel;
export { PropProxy };