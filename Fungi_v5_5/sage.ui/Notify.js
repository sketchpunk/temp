class Notify{
	/////////////////////////////////////////////////////////////////////////////////
	// SETTINGS
	
	static delay_msg 	= 3; 	// Seconds - How Much time to hide a message
	static delay_err	= 5;
	static top_offset 	= 29;	// Starting Top Position
	static edge_offset 	= 5;
	static spacing 		= 2;	// How much space to put between notifications.

	static MSG 			= 0;
	static CONFIRM 		= 1;
	
	/////////////////////////////////////////////////////////////////////////////////
	// Element Pool
	static pool = [];
	static get_item( itm_type=this.MSG ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( let i=0; i < this.pool.length; i++ ){
			if( this.pool[i].itm_type == itm_type && !this.pool[i].active ){
				this.pool[i].active = true;
				return this.pool[i];
			}
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let itm, div = document.createElement( "div" );
		document.body.appendChild( div );

		switch( itm_type ){
			case this.MSG :
				itm = { 
					active		: true, 
					elm			: div, 
					itm_type	: itm_type,
					set_text	: function( txt ){ this.elm.innerHTML = txt; return this; },
					set_cls		: function( txt ){ this.elm.className = txt; return this; },
				};
				div.addEventListener( "click", function(){ Notify.hide_item( itm ); });
				break;
			case this.CONFIRM :
				itm = { 
					active		: true, 
					elm			: div,
					itm_type	: itm_type,
					fn_ok		: null,
					lbl			: document.createElement( "div" ),
					btn_yes		: document.createElement( "button" ),
					btn_no		: document.createElement( "button" ),
					set_text	: function( txt ){ this.lbl.innerHTML = txt; return this; },
					set_cls		: function( txt ){ this.elm.className = txt; return this; },
				};

				itm.btn_yes.innerHTML	= "Yes";
				itm.btn_no.innerHTML	= "No";
				itm.btn_no.addEventListener( "click", function(){ Notify.hide_item( itm ); });
				itm.btn_yes.addEventListener( "click", function(){ itm.fn_ok(); Notify.hide_item( itm ); });
				div.appendChild( itm.lbl );
				div.appendChild( itm.btn_yes );
				div.appendChild( itm.btn_no );
				break;
		}
		
		this.pool.push( itm );
		return itm;
	}

	///////////////////////////////////////////////////////////////////////////////
	// Handle viewing
	static show_item( itm, delay_s=null ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Figure out the Top Position
		let box, p, y = this.top_offset;	
		for( p of this.pool ){
			if( !p.active || p.elm == itm.elm ) continue;
			box = p.elm.getBoundingClientRect();
			y 	= Math.max( y, box.top + box.height + document.documentElement.scrollTop + this.spacing );
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Move Item and Display
		let elm = itm.elm;
		elm.style.right		= this.edge_offset + "px";
		elm.style.top		= y + "px";

		// Auto Close
		if( delay_s != null ){
			itm.timer = setTimeout( ()=>{ Notify.hide_item( itm ); }, delay_s * 1000 );
		}
	}

	static hide_item( itm ){
		if( itm.timer ) clearTimeout( itm.timer );
		if( itm.fn_ok ) itm.fn_ok = null;

		itm.elm.style.top 		= "-500px";
		itm.timer				= null;
		itm.active				= false;

		return false;
	}
	
	///////////////////////////////////////////////////////////////////////////////
	// Messaging Methods

	static msg( txt, delay ){
		let itm = this.get_item()
			.set_cls( "NotifyItem msg" )
			.set_text( txt );
		this.show_item( itm, delay || this.delay_msg );
	}

	static err( txt, delay ){
		let itm = this.get_item()
			.set_cls( "NotifyItem err" )
			.set_text( txt );
		this.show_item( itm, delay || this.delay_err );
	}

	static confirm( txt, fn_ok ){
		let itm = this.get_item( this.CONFIRM )
			.set_cls( "NotifyItem confirm" )
			.set_text( txt );
		itm.fn_ok = fn_ok;
		this.show_item( itm );
	}
}

/////////////////////////////////////////////////////////////////////////////////////

(function(){
	let mod_path	= import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 ),
		link		= document.createElement( "link" );

	link.rel	= "stylesheet";
	link.type	= "text/css";
	link.media	= "all";
	link.href	= mod_path + "Notify.css";
	document.getElementsByTagName( "head" )[0].appendChild( link );
})();

/////////////////////////////////////////////////////////////////////////////////////
window.Notify = Notify;
export default Notify;