// https://gameprogrammingpatterns.com/event-queue.html
//###########################################################################################

class EventManager{
    // #region CONSTRUCTOR / FIELDS
    #items	= new Map();
    // #endregion //////////////////////////////////////////////

    // #region REGISTER / LISTENERS
	// Register Events
	reg( evt_name, size=10, allow_listeners=true, init_listener=null ){
		if( this.#items.has( evt_name ) ){ console.error(`Event already has been registered : ${evt_name}`); return this; }

		let o = {
			queue		: null,
			listeners	: (allow_listeners)? new Array() : null,
		};

		if( size == 1 ) o.queue = new SingleBuffer();
		
		this.#items.set( evt_name, o );

		if( init_listener ) this.on( evt_name, init_listener ); // Assign a listener right off the bat, save on function calls.
		return this;
	}

	// Assign a Listener to an Event
	on( evt_name, func ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Validation
		let o = this.#items.get( evt_name );
		if( !o ){ console.error(`Event does not exist, unable to add listener: ${evt_name}`); return this; }
		if( !o.listeners ){ console.error(`Event does not allow listeners: ${evt_name}`); return this; }

		let idx = o.listeners.indexOf( func );
		if( idx != -1 ){ console.error(`Listener already exists for event: ${evt_name}`); return this; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		o.listeners.push( func );
		return this;
	}

	// Remove a Listener to an Event
	off( evt_name, func ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Validation
		let o = this.#items.get( evt_name );
		if( !o ){ console.error(`Event does not exist, unable to add listener: ${evt_name}`); return this; }
		if( !o.listeners ){ console.error(`Event does not allow listeners: ${evt_name}`); return this; }

		let idx = o.listeners.indexOf( func );
		if( idx == -1 ){ console.error(`Listener not found for event: ${evt_name}`); return this; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		o.listeners.splice( idx, 1 );
		return this
	}
    // #endregion //////////////////////////////////////////////

    // #region EMITTING / BROADCASTING 
	// Send an Event, Depending on the config, it can be sent right away
	// or its queued and will be broadcasted at a later date or consumed
	// by a System if not allowed listeners.
	emit( evt_name, data ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Validation
		let o = this.#items.get( evt_name );
		if( !o ){ console.error(`Event does not exist, unable to emit event name: ${evt_name}`); return this; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Instant Broadcast
		if( !o.queue && o.listeners ){
			let itm;
			for( itm of o.listeners ) itm( data );
			return this;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Queued
		if( o.queue ){
			o.queue.push( data );
			return this;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Unhandled
		console.error(`Event dispatched not handled from emit: ${evt_name}`);
		return this;
	}

	broadcast_all(){
		let data, listener;
		for (const [ evt_name, o ] of this.#items.entries()) {
			// Listeners Allowed, Listeners Exist, Queue Allowed and Has Data in it.
			if( o.listeners && o.listeners.length > 0 && o.queue && o.queue.length() > 0 ){
				while( (data = o.queue.next()) != null ){				// For every Queued Data for the event
					for( listener of o.listeners ) listener( data );	// pass it to all the listeners.
				}
			}
		}
		return this;
	}

	broadcast( evt_name ){
		let o = this.#items.get( evt_name );
		if( !o ){ console.error(`Event does not exist, unable to broadcast: ${evt_name}`); return this; }

		let data, listener;
		if( o.listeners && o.listeners.length > 0 && o.queue && o.queue.length() > 0 ){
			while( (data = o.queue.next()) != null ){				// For every Queued Data for the event
				for( listener of o.listeners ) listener( data );	// pass it to all the listeners.
			}
		}

		return true;
    }
    // #endregion //////////////////////////////////////////////

    // #region GETTERS / SETTERS
	// Incase a system wants to handle the event queue on its own, it
	// can get reference to it and drain it as it sees fit.
	get_queue( evt_name ){
		let o = this.#items.get( evt_name );
		return ( o )? o.queue || null : null;
    }
    // #endregion //////////////////////////////////////////////
}

//###########################################################################################

class SingleBuffer{
	#data = null;
	length(){ return ( this.#data == null)? 0:1; }
	push( v ){ this.#data = v; return true; }
	next(){
		if( this.#data == null ) return null;
		let d = this.#data;
		this.#data = null;
		return d;
	}
}

class RingBuffer{
	#buf		= null;		// Just a Plain Array
	#read_idx	= 0;		// Index to Read on "Next"
	#write_idx	= 0;		// Index to write to on "Push"
	#size		= 0;		// Size of the Buffer

	constructor( b_size=10 ){
		this.#buf	= new Array( b_size );
		this.#size	= b_size;
	}

	push( v ){
		// Using this "Next Check" method, means we can not fill the buffer to max to start with
		// But doing so keeps the index checks very simple. If thats an issues, increase size of buffer.
		let next = (this.#write_idx + 1) % this.#size;
		if( next == this.#read_idx ){
			console.error( "RingBuffer out of space to write. Write has caught up to Read.");
			return false;
		}

		this.#buf[ this.#write_idx ] = v;
		this.#write_idx = next; // Loop Around
		return true;
	}

	next(){
		// If read has caught up to write, then the buffer is empty.
		if( this.#read_idx == this.#write_idx ) return null;		

		let v = this.#buf[ this.#read_idx ];
		this.#read_idx = (this.#read_idx + 1) % this.#size; // Loop Around
		return v;
	}

	length(){
		return  ( this.#read_idx == this.#write_idx ) ? 0 :				// If Equal, Non Left
				( this.#read_idx < this.#write_idx )? 					
					this.#write_idx - this.#read_idx :					// If Read under Write
					( this.#size - this.#read_idx ) + this.#write_idx;  // If Write Under Read
	}

	for_each( func ){
		for( let i = this.#read_idx; i != this.#write_idx; i = (i+1) % this.#size ){
			func( this.#buf[ i ] );
		}
		this.#read_idx	= 0;
		this.#write_idx	= 0;
		return this;
	}
}

//###########################################################################################
export default EventManager;