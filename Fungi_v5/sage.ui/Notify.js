class Notify{
	/////////////////////////////////////////////////////////////////////////////////
	// SETTINGS
	
	static delay_msg 	= 3; 	// Seconds - How Much time to hide a message
	static delay_err	= 5;
	static top_offset 	= 29;	// Starting Top Position
	static edge_offset 	= 5;
	static spacing 		= 2;	// How much space to put between notifications.
	
	/////////////////////////////////////////////////////////////////////////////////
	// Element Pool
	static pool = [];
	static get_item(){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( let i=0; i < this.pool.length; i++ ){
			if( !this.pool[i].active ){
				this.pool[i].active = true;
				return this.pool[i];
			}
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let div = document.createElement( "div" );
		div.className = "NotifyItem";
		document.body.appendChild( div );
		
		let itm = { active : true, elm : div };
		this.pool.push( itm );

		div.addEventListener( "click", function(){ Notify.hide_item( itm ); });
		return itm;
	}

	///////////////////////////////////////////////////////////////////////////////
	// Handle viewing
	static show_item( itm, delay_s ){
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
		elm.style.display	= "inline-block";

		// Auto Close
		itm.timer = setTimeout( ()=>{ Notify.hide_item( itm ); }, delay_s * 1000 );
	}

	static hide_item( itm ){
		if( itm.timer ) clearTimeout( itm.timer );
		itm.elm.style.display	= "none";
		itm.timer				= null;
		itm.active				= false;
		return false;
	}
	
	///////////////////////////////////////////////////////////////////////////////
	// Messaging Methods

	static msg( txt, delay ){
		let itm = this.get_item();
		itm.elm.innerHTML = txt;
		itm.elm.className = "NotifyItem msg";
		this.show_item( itm, delay || this.delay_msg );
	}

	static err( txt, delay ){
		let itm = this.get_item();
		itm.elm.innerHTML = txt;
		itm.elm.className = "NotifyItem err";
		this.show_item( itm, delay || this.delay_err );
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