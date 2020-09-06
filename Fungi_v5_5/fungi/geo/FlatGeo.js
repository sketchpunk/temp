// Create Geometry with Flat Arrays
import Vec3 from "../maths/Vec3.js";

class FlatGeo{
	// #region CREATE VERTICES

	// Create Points based on two Angles
	static arc( angle_a, angle_b, div, radius=1 ){
		let inc = 1 / (div-1),
			out = new Array(),
			x, y, t, angle;

		for( let i=0; i < div; i++ ){
			t		= i * inc;
			angle 	= angle_a * (1-t) + angle_b * t;
			x		= Math.cos( angle ) * radius;
			y		= Math.sin( angle ) * radius;
			out.push( x, y, 0 );
		}

		return out;
	}

	// Repeat Points in a circular ma
	static lathe( flat_ary, steps=2, rot_axis="y", ary_offset=0 ){
		let v_len	= flat_ary.length,
			out		= new Array(), //new Vec3Buffer( v_len*steps ),
			inc 	= Math.PI * 2 / steps;

		let i, j, angle, cos, sin;
		let rx, ry, rz;

		let v = new Vec3();

		for( i=0; i < steps; i++ ){
			angle 	= i * inc;
			cos		= Math.cos( angle );
			sin 	= Math.sin( angle );

			for( j=ary_offset; j < v_len; j+=3 ){
				v.from_buf( flat_ary, j );

				switch( rot_axis ){ // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm#Y-Axis%20Rotation
					case "y": ry = v.y;		rx = v.z*sin + v.x*cos;		rz = v.z*cos - v.x*sin; break;
					case "x": rx = v.x; 	ry = v.y*cos - v.z*sin;		rz = v.y*sin + v.z*cos; break;
					case "z": rz = v.z;		rx = v.x*cos - v.y*sin;		ry = v.x*sin + v.y*cos; break;
				}

				out.push( rx, ry, rz );
			}
		}

		return out;
	}

	// Make a Mirror Copy of Points
	static mirror( flat_ary, x=1, y=-1, z=1 ){
		let out = new Array();

		for( let i=0; i < flat_ary.length; i+=3 ){
			out.push(
				flat_ary[ i ]	* x,
				flat_ary[ i+1 ]	* y,
				flat_ary[ i+2 ]	* z,
			);
		}

		return out;
    }

    // Create points between two points
	static line_lerp( a, b, steps, out=null ){
		out = out || new Array();

		let t, ti;
		for( let i=0; i <= steps; i++ ){
			t	= i / steps;
			ti	= 1 - t;
			out.push(
				a[ 0 ] * ti + b[ 0 ] * t,
				a[ 1 ] * ti + b[ 1 ] * t,
				a[ 2 ] * ti + b[ 2 ] * t,
			);
		}

		return out;
    }
    
	// #endregion /////////////////////////////////////////////////////////
    
	// #region MODIFY VERT ARRAY

	// Move Verts by sepcific amount
	static vert_offset( flat_ary, x=0, y=0, z=0 ){
		for( let i=0; i < flat_ary.length; i+=3 ){
			flat_ary[ i ]	+= x;
			flat_ary[ i+1 ]	+= y;
			flat_ary[ i+2 ]	+= z;
		}
	}

	// #endregion /////////////////////////////////////////////////////////

    // #region CREATE INDICES

	// Create Indices for a Fan Shape
	static fan_indices( c_idx, edge_ary, rev_quad=false, out=null ){
		out = out || new Array();

		let i, ii, len = edge_ary.length;
		for( i=0; i < len; i++ ){
			ii = ( i + 1 ) % len;	// Next Point on the edge

			if( !rev_quad )	out.push( c_idx, edge_ary[ i ],	edge_ary[ ii ] ); // Counter ClockWise
			else			out.push( c_idx, edge_ary[ ii ], edge_ary[ i ] ); // ClockWise
		}
		
		return out;
	}

	// Create Indices based on a Grid
	static grid_indices( row_size, row_cnt, start_idx=0, do_loop=false, rev_quad=false, out=null ){
		out = out || new Array();

		let row_stop = ( do_loop )? row_cnt : row_cnt - 1,
			col_stop = row_size - 1,
			row_a, row_b, 
			r, rr, 
			a, b, c, d;

		for( r=0; r < row_cnt; r++ ){
			// Figure out the starting Index for the Two Rows
			// 2nd row might loop back to starting row when Looping.
			row_a = start_idx + row_size * r;
			row_b = start_idx + row_size * ( (r+1) % row_cnt );

			for( rr=0; rr < col_stop; rr++ ){
				// Defined the Vertex Index of a Quad
				a 	= row_a + rr;		
				b 	= row_a + rr + 1;
				d 	= row_b + rr;
				c 	= row_b + rr + 1;

				if( !rev_quad ) out.push( a,b,c, c,d,a ); // Counter ClockWise
				else 			out.push( a,d,c, c,b,a ); // ClockWise
			}
		}

		return out;
	}

	// Indices to stitch to endges together
	static edge_stitch_indices( edge_a, edge_b, rev_quad=false, out=null ){
		out = out || new Array();
			
		let a, b, c, d, i, ii, len = edge_a.length;

		for( i=0; i < len; i++ ){
			ii = (i + 1) % len;

			a = edge_a[ i ];
			b = edge_a[ ii ];
			c = edge_b[ ii ];
			d = edge_b[ i ];

			if( !rev_quad )	out.push( a, b, c, c, d, a ); // Counter-ClockWise
			else			out.push( a, d, c, c, b, a ); // ClockWise
		}
		return out;
	}

    // #endregion /////////////////////////////////////////////////////////

	// #region CONVERSION
	
	// Convert Vec3 Flat Array into Vec4 Flat Array
	static to_vec4( flat_ary ){
		let vert_cnt	= flat_ary.length / 3,
			out			= new Float32Array( vert_cnt * 4 ),
			idx 		= 0,
			i 			= 0;

		for( i; i < flat_ary.length; i+=3 ){
			out[ idx++ ] = flat_ary[ i ];
			out[ idx++ ] = flat_ary[ i+1 ];
			out[ idx++ ] = flat_ary[ i+2 ];
			out[ idx++ ] = 0;
		}

		return out;
	}

	// Merge sets of Vert Arrays plus apply a Group ID to W component
	static vert_group_merge(){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Compute How Many Verts
		let i,
			ary_cnt		= arguments.length,
			vert_cnt	= 0;
		for( i of arguments ) vert_cnt += i.length / 3;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Merge All verts while assigning it a Vert Group ID in the W comp.
		let out = new Float32Array( vert_cnt * 4 ),
			idx = 0,
			j, ary;

		for( i=0; i < ary_cnt; i++ ){
			ary = arguments[ i ];
			for( j=0; j < ary.length; j+=3 ){
				out[ idx++ ] = ary[ j ];
				out[ idx++ ] = ary[ j+1 ];
				out[ idx++ ] = ary[ j+2 ];
				out[ idx++ ] = i;
			}
		}

		return out;
	}

	// #endregion /////////////////////////////////////////////////////////
}

export default FlatGeo;