//####################################################################################
// Can not use anything less then Uint32, the way bit shifting is done by
// looping back around when going over the int limit, 
// so bit shift if 32 will only set the first bit
// The first 5 shifts equal the value of 31, so when setting bit 32, shifted down will equal value of 1, meaning 
// that is over the first uint32 and needs a second one to fill it in.
// Using Shift 5, means the INDEX will increment by every 32.
// Using Shift 6, which is the 64 bit value, we can increase the index for every value of 64.
// Technically we index by the factor of the bit, so 4 is the third bit, but if we shift by 2, 
// every 4 will increment.

const IDX_BIT	= 5; // 5 bit shift, value of 32.
const UINT_MAX	= 4294967295;

class Bitset{
	bits = null;

	constructor( bit_cnt=1 ){
		if( bit_cnt != null ){
			this.bits = new Uint32Array( ( bit_cnt >>> IDX_BIT ) + 1 );
		}
	}

	//////////////////////////////////////////////////////////
	// 
	//////////////////////////////////////////////////////////

		//get bit_count(){ return this.bits.length * 32; }
		get count(){
			let i, cnt = 0;
			
			for( i of this.bits ){
				i = i - ((i >> 1) & 0x55555555);
				i = (i & 0x33333333) + ((i >> 2) & 0x33333333);
				cnt += (((i + (i >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
			}
        	return cnt;
		}

		reset(){
			for( let i=0; i < this.bits.length; i++ ) this.bits[ i ] = 0;
			return this;
		}
	
		copy( bs ){
			let a_len = this.bits.length,
				b_len = this.bits.length,
				max_len = Math.max( a_len, b_len );
	
			for( let i=0; i < max_len; i++ ){
				if( i < a_len && i < b_len )	this.bits[ i ] = bs.bits[ i ];
				else if( i < a_len )			this.bits[ i ] = 0;
			}
	
			return this;
		}

		clone(){
			let bs	= new Bitset( null );
			bs.bits	= this.bits.slice( 0 );
			return bs;
		}

		hash(){
			// Simple String hash algorithm rewritten to break down
			// each int as 4 bytes to treat each byte as a char.
			//    let hash = 5381, i = str.length;
			//    while(i) hash = (hash * 33) ^ str.charCodeAt(--i)
			//    return hash >>> 0; 

			let b, hash = 5381;
			for( b of this.bits ){
				hash = (hash * 33) ^ ( b & 255 );
				hash = (hash * 33) ^ ( (b >>> 8) & 255 );
				hash = (hash * 33) ^ ( (b >>> 16) & 255 );
				hash = (hash * 33) ^ ( (b >>> 24) & 255 );
			}
			return hash >>> 0; // Force Negative bit to Positive;
		}

		/*
		let x, iter = bs.get_iter();
		while( (x = iter()) != null ) console.log( x );
		*/
		get_iter(){
			let i=0, len = this.bits.length * 32;
			return ()=>{
				let rtn = null;
				while( i < len && rtn == null ){
					if( (this.bits[ i >>> IDX_BIT ] & (1 << i) ) != 0 ) rtn = i;
					i++;
				}
				return rtn;
			};
		}

		get_bit_array(){
			let i, ii, 
				len = this.bits.length * 32,
				ary = new Array();

			for( i=0; i < len; i++ ){
				ii = i >>> IDX_BIT;
				if( (this.bits[ ii ] & ( 1 << i )) != 0 ) ary.push( i );
			}
			return ary;
		}

		// for( let i of this.#bit_set ) console.log( i );
		[Symbol.iterator](){
			let i=0, len = this.bits.length * 32;
			return {
				//return 	: ()=>{ console.log("cleanup"); return { value:undefined, done:true }; },
				next	: ()=>{
					let rtn = { value:null, done:true };
					while( i < len && rtn.value == null ){
						if( (this.bits[ i >>> IDX_BIT ] & (1 << i) ) != 0 ){
							rtn.value	= i;
							rtn.done	= false;
						}
						i++;
					}
					return rtn;
				},
			};
		}

	//////////////////////////////////////////////////////////
	// Bit Operations
	//////////////////////////////////////////////////////////
		has( bi ){
			let i = bi >>> IDX_BIT;
			if( i >= this.bits.length ) return false;
			return ( this.bits[i] & (1 << bi) ) != 0;
		}

		on( bi ){
			let i = this._resize_idx( bi );
			this.bits[ i ] |= 1 << bi;
			return this;
		}

		off( bi ){
			let i = this._resize_idx( bi );
			this.bits[ i ] &= ~(1 << bi); //Bit Shift 1, Flip all bits to create a mask, then bitAnd to set only 1s as 1.
			return this;
		}

		flip( bi ){
			let i = this._resize_idx( bi );
			this.bits[ i ] ^= 1 << bi;
			return this;
		}

		test_mask( mask ){
			if( this.bits.length < mask.bits.length ) return false;	
			for( let i=0; i < mask.bits.length; i++ ){
				if( (this.bits[i] & mask.bits[i]) != mask.bits[i] ) return false;
			}
			return true;
		}

		and( bs ){
			let min		= Math.min( this.bits.length, bs.bits.length ),
				is_mod	= false,
				test;

			for( let i=0; i < min; i++ ){
				test = this.bits[i] & bs.bits[i];
				if( test != this.bits[i] ){
					is_mod = true;
					this.bits[i] = test;
				}
			}
			return is_mod;
		}

		or( bs ){
			let a_len	= this.bits.length,
				b_len	= bs.bits.length,
				len 	= Math.max( a_len, b_len );

			// if bs is larger, resize this bitset
			if( b_len > a_len ) this._resize_idx( b_len * 32 - 1 );

			for( let i=0; i < len; i++ ) this.bits[i] |= bs.bits[i];
			return this;
		}

		on_range( ai, bi ){
			// TODO, This only works for a single UINT Range Set, Fix to handle more then 32
			let zi, uint = new Uint32Array( 3 );		// Uint shifting only works if using array.

			//ai = 0; bi = 19;
			//console.log( "range", ai, bi );
			
			zi			= 32 - bi - 1; 					// Get Second Shifting
			uint[ 0 ]	= ( UINT_MAX >>> ai) << ai;		// Clear out all bits before a
			uint[ 1 ]	= ( UINT_MAX << zi) >>> zi;		// clear out all bits before b
			uint[ 2 ]	= uint[ 0 ] & uint[ 1 ];		// Get only when both bits are 1
			//console.log( UINT_MAX, "a", uint[ 0 ], "b", uint[ 1 ], "c", uint[ 2 ] );

			this.bits[ 0 ] = uint[ 2 ];
			return this;
		}

		on_ary( ary ){
			let i, bi;
			for( bi of ary ){
				i = this._resize_idx( bi );
				this.bits[ i ] |= 1 << bi;
			}			
			return this;
		}

	//////////////////////////////////////////////////////////
	// Private Helpers
	//////////////////////////////////////////////////////////

		// Calc Index by shifting away an integer value of 32
		// then resize the bit array if index is over the current capacity.
		_resize_idx( bi ){
			let i = bi >>> IDX_BIT;
			if( i >= this.bits.length ){
				let j, ary = new Uint32Array( i+1 );
				for( j=0; j < i; j++ ) ary[ j ] = this.bits[ j ];
				this.bits = ary;
			}
			return i;
		}
}

export default Bitset;