class Notify{
	/////////////////////////////////////////////////////////////////////////////////
	// SETTINGS
	
	static delay_msg 	= 3000; // MS - How Much time to hide a message
	static top_offset 	= 52;	// Starting Top Position
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
		return itm;
	}

	///////////////////////////////////////////////////////////////////////////////
	// Handle viewing
	static show_item( itm, delay_ms ){
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
		elm.style.right		= "0px";
		elm.style.top		= y + "px";
		elm.style.display	= "inline-block";
		
		setTimeout( ()=>{
			elm.style.display = "none";
			itm.active = false;
		}, delay_ms );
	}
	
	///////////////////////////////////////////////////////////////////////////////
	// Messaging Methods

	static msg( txt, delay_ms=null ){
		let itm = this.get_item();
		itm.elm.innerHTML = txt;
		this.show_item( itm, delay_ms || this.delay_msg );
	}

}

/////////////////////////////////////////////////////////////////////////////////////
window.Notify = Notify;
export default Notify;