class LinkedListNode{
	constructor( v ){
		this.value	= v;
		this.prev 	= null;
		this.next	= null;
	}
}

class LinkedList{
	#head	= null;
	#tail	= null;
	#size	= 0;

	// #region METHODS
	add( val ){
		let n = new LinkedListNode( val );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// No, Head make node the head.
		if( !this.#head ){
			this.#head		= n;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// No tail, Update head and new Node
		}else if( !this.#tail ){
			n.prev			= this.#head;
			this.#head.next	= n;
			this.#tail		= n;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Append Node to the End 
		}else{
			n.prev			= this.#tail;	// current Tail is its Previous
			this.#tail.next	= n;			// Current tails next is the new node
			this.#tail		= n;			// set node as new tail.
		}

		this.#size++;
		return this;
	}

	rm( idx ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( idx < 0 || idx >= this.#size ){
			console.log( "LinkedList.rm : index out of bounds: ", idx );
			return null;
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( idx == 0 ) this.rm_node( this.#head );
		else{
			let cnt = 0,
				n	= this.#head;

			while( cnt < idx && (n = n.next) ) cnt++;

			if( cnt == idx ) this.rm_node( n );
		}
	}

	rm_node( n ){
		if( n.prev ) n.prev.next = n.next;	// If not head
		if( n.next ) n.next.prev = n.prev;	// If not tail

		if( n == this.#head )	this.#head = n.next;
		if( n == this.#tail )	this.#tail = n.prev;

		this.#size--;
		return this;
	}
	// #endregion //////////////////////////////////////////////////////////////////

	// #region MISC
	[Symbol.iterator](){
		let n	= this.#head;
		return { next:()=>{
			let rtn = { value:null, done:true };
			if( n ){
				rtn.value	= n.value;
				rtn.done	= false;
				n			= n.next;
			}
			return rtn;
		}};
	}

	debug(){
		console.log( "-- Size ", this.#size );
		console.log( "-- head ", this.#head );
		console.log( "-- tail ", this.#tail );
		let n	= this.#head,
			idx	= 0;

		while( n ){
			console.log( "---- ", idx, "value: ", n.value, "PREV---", ((n.prev)? n.prev.value:null), "NEXT--", ((n.next)? n.next.value:null) );
			n = n.next;
			idx++;
		}
	}
	// #endregion //////////////////////////////////////////////////////////////////
}

export default LinkedList;