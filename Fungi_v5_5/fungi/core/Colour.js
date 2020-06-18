const NORMALIZE_RGB	= 1 / 255.0;
const COLORS		= {
	"black"		: "#000000",
	"white"		: "#ffffff",
	"red"		: "#ff0000",
	"green"		: "#00ff00",
	"blue"		: "#0000ff",
	"fuchsia"	: "#ff00ff",
	"cyan"		: "#00ffff",
	"yellow"	: "#ffff00",
	"orange"	: "#ff8000",
	"gray"		: "#808080",
	"darkgray"	: "#303030",
};

class Colour{
	constructor( c=null ){
		this.rgba	= new Float32Array( [0,0,0,1] );
		this.rgb	= new Float32Array( this.rgba.buffer, 0, 3 );
		if( c ) this.set( c );
	}

	alpha( v ){ this.rgba[ 3 ] = v; return this; }
	set( c ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle Numeric Form
		if( ! isNaN( c ) ){
			c = parseInt( c );
			this.rgba[ 0 ] = ( c >> 16 & 255 )	* NORMALIZE_RGB;
			this.rgba[ 1 ] = ( c >> 8 & 255 )	* NORMALIZE_RGB;
			this.rgba[ 2 ] = ( c & 255 )		* NORMALIZE_RGB;
			return this;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle String Form
		if( typeof c == "string" ){
			let cc = c;
			if( cc.charAt(0) != "#" ) cc = COLORS[ c ];
			if( !cc || cc.charAt(0) != "#" ){ console.error( "Color Unknown: ", c ); return; }

			this.rgba[ 0 ] = parseInt( cc[1] + cc[2], 16 ) * NORMALIZE_RGB;
			this.rgba[ 1 ] = parseInt( cc[3] + cc[4], 16 ) * NORMALIZE_RGB;
			this.rgba[ 2 ] = parseInt( cc[5] + cc[6], 16 ) * NORMALIZE_RGB;
			if( cc.length == 9 ) this.rgba[ 3 ] = parseInt( cc[7] + cc[8], 16 ) * NORMALIZE_RGB;
		}

		return this;
	}

	static rgb_array(){
		if( arguments.length == 0 ) return null;

		let ary	= ( Array.isArray( arguments[0] ) )? arguments[ 0 ] : arguments,
			rtn	= new Float32Array( ary.length * 3 ),
			ii	= 0,
			c;
	
		for( let i=0; i < ary.length; i++ ){
			c = ary[ i ];
			rtn[ ii++ ] = parseInt( c[1] + c[2], 16 ) * NORMALIZE_RGB;
			rtn[ ii++ ] = parseInt( c[3] + c[4], 16 ) * NORMALIZE_RGB;
			rtn[ ii++ ] = parseInt( c[5] + c[6], 16 ) * NORMALIZE_RGB;
		}

		return rtn;
	}
}

export default Colour;