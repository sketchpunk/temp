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
	data = new Float32Array( [0,0,0,0] );

	constructor( c ){ this.set( c ); }

	alpha( v ){ this.data[3] = v; return this; }
	set( c ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle Numeric Form
		if( ! isNaN( c ) ){
			c = parseInt( c );
			this.data[ 0 ] = ( c >> 16 & 255 )	* NORMALIZE_RGB;
			this.data[ 1 ] = ( c >> 8 & 255 )	* NORMALIZE_RGB;
			this.data[ 2 ] = ( c & 255 )		* NORMALIZE_RGB;
			return this;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle String Form
		if( typeof c == "string" ){
			let cc = c;
			if( cc.charAt(0) != "#" ) cc = COLORS[ c ];
			if( !cc || cc.charAt(0) != "#" ){ console.error( "Color Unknown: ", c ); return; }

			this.data[ 0 ] = parseInt( cc[1] + cc[2], 16 ) * NORMALIZE_RGB;
			this.data[ 1 ] = parseInt( cc[3] + cc[4], 16 ) * NORMALIZE_RGB;
			this.data[ 2 ] = parseInt( cc[5] + cc[6], 16 ) * NORMALIZE_RGB;
			if( cc.length == 9 ) this.data[ 3 ] = parseInt( cc[7] + cc[8], 16 ) * NORMALIZE_RGB;
		}

		return this;
	}
}

export default Colour;