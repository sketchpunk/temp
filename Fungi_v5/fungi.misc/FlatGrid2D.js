// Create a Grid out of a Flat Array.
class FlatGrid2D{
	cells		= null;	// Array of Cells
	#x_cnt		= 0;	// Width of Grid
	#y_cnt		= 0;	// Height of Grid
	#x_max		= 0;	// Max Index for X Direction
	#y_max		= 0;	// Max Index for Y Direction
	#x_cnt_inv	= 0;	// Invert of X Count, Used to replace division with mul.

	constructor( x, y ){ this.resize( x, y ); }

	// #region METHODS
	resize( x, y ){
		// if Already that size, dont bother.
		if( this.#x_cnt == x && this.#y_cnt == y ) return false;

		this.#x_cnt 	= x;					// Total Columns
		this.#y_cnt 	= y;					// Total Rows
		this.#x_max 	= x-1;					// Index of Last Column
		this.#y_max		= y-1;					// Index of last Row
		this.#x_cnt_inv	= 1 / this.#x_cnt;		// Column Count Inverted.

		// Create new Array, if exists, resize it
		if( this.cells )	this.cells			= new Array( x*y );
		else				this.cells.length	= x*y;

		return true;
	}
	// #endregion /////////////////////////////////////////////////////////////////////

	// #region GETTERS // SETTERS
	get x(){	return this.#x_cnt; }
	get y(){	return this.#y_cnt; }
	get len(){	return this.cells.length; }

	// Get cell value by XY Coord
	get( x, y ){ return this.cells[ y * this.#x_cnt + x ]; }

	// Set cell value by XY Coord
	set( x, y, v ){ return this.cells[ y * this.#x_cnt + x ] = v; return this; }

	// Is the cell an Edge Cell?
	is_edge( x, y ){ return ( x == 0 || x == this.#x_max || y == 0 || y == this.#y_max ); }

	// Compute Index from XY Coord
	index_of( x, y ){ return y * this.#x_cnt + x; }

	// Compute XY Coord from Index
	pos_of( idx ){ 
		let y = Math.floor( idx * this.#x_cnt_inv ),
			x = idx - y * this.#x_cnt;
		return [x,y];
	}

	// Get a Cell that is on either side or above/below it.
	get_neightbor_idx( idx, dir=0 ){
		let y = Math.floor( idx * this.#x_cnt_inv ),
			x = idx - y * this.#x_cnt;

		// Which Side to shift from
		switch( dir ){
			case 0 : y--; break; // UP
			case 1 : x++; break; // Right
			case 2 : y++; break; // Bottom;
			case 3 : x--; break; // Left;
		}

		// Out of Bounds Check, return nulml
		if( x < 0 || x > this.#x_max || y < 0 || y > this.#y_max ) return null;

		// Return the cell next to the requested index.
		return y * this.#x_cnt + x;
	}
	// #endregion /////////////////////////////////////////////////////////////////////

	// #region LOOP FUNCTIONS
	// Pass in a function to fill in the value of each cell
	// fn( index, x, y )
	fill( fn ){
		let i, x, y;
		for( i=0; i < this.cells.length; i++ ){
			y = Math.floor( i * this.#x_cnt_inv );
			x = i - y * this.#x_cnt; // i % this.#x_cnt;
			this.cells[ i ] = fn( i, x, y );
		}
		return this;
	}

	// Execute a function on each cell.
	// fn( index, x, y, cell_value )
	for_each( fn ){
		let i, x, y;
		for( i=0; i < this.cells.length; i++ ){
			y = Math.floor( i * this.#x_cnt_inv );
			x = i - y * this.#x_cnt; // i % this.#x_cnt;
			fn( i, x, y, this.cells[ i ] );
		}
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////////////

	// #region ITERATORS

	// Iterator to loop all the cells in the grid.
	// Returns [ index, x, y, cell_value ]
	[Symbol.iterator](){
		let i=0, len = this.cells.length;
		return {
			next : ()=>{
				let rtn = { value:null, done:true };

				if( i < len ){
					let y = Math.floor( i * this.#x_cnt_inv ),
						x = i - y * this.#x_cnt;

					rtn.value	= { i, x, y, cell:this.cells[ i ] };
					rtn.done	= false;
					i++;
				}

				return rtn;
			},
		};
	}
	// #endregion /////////////////////////////////////////////////////////////////////
}

export default FlatGrid2D;