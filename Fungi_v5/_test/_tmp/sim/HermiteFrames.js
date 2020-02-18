class HermiteFrames{
	constructor( is_loop=false ){
		this.spline 	= new HermiteSpline();	
		this.config		= new Array();			// Raw data entered by user
		this.frames 	= new Array();			// Key Frame Animation Data, Generated

		this.time_max	= 0;					// Total Time of Animation
		this.clock		= 0;					// Current Animation Clock
	}

	//////////////////////////////////////////////////////////
	// public methods
	//////////////////////////////////////////////////////////
		
		add_pos( pos, sec=null, interp="lerp"){ this.config.push({ sec, interp, pos }); return this; }
		add_pause( sec ){ this.config.push({ sec, interp:"pause", pos:null }); return this; }

		build(){
			let i, itm;

			// Reset the Data if not the first time running build
			if( this.frames.length ){
				this.time_max		= 0;
				this.frames.length	= 0;
				this.points.length	= 0;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Calculate the First Tangent if not a Loop
			this.new_point( new Vec2()
				.from_sub( this.config[0].pos, this.config[1].pos )	// Get Direction from Point B to Point A
				.norm()												// Normalize & Scale & Add to Point A
				.scale( 30 )										
				.add( this.config[0].pos )
			);

			this.new_frame( 0, this.spline.point_cnt );				// Save as First point of spline

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Create Frames and Points
			for( i=0; i < this.config.length; i++ ){
				itm = this.config[ i ];

				//-----------------------------------------
				// Is the point set with a time stamp?
				if( itm.sec ){
					this.time_max += itm.sec;	// Add to total animation time

					if( itm.interp != "pause" ){
						this.new_frame( this.time_max, this.spline.point_cnt, itm.interp );
					}else{
						// Pause Frame, Point to the most recent point created as the
						// position to pause movement for the time allotted.
						this.new_frame( this.time_max, this.spline.point_cnt-1, itm.interp );
						continue;
					}
				}

				//-----------------------------------------
				// Point Found, Add it to the master spline
				if( itm.pos ) this.new_point( new Vec2( itm.pos ) );
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Calculate the Final Tangent
			let l = this.spline.points.length - 1;
			this.new_point( new Vec2()
				.from_sub( this.spline.points[ l ].pos, this.spline.points[ l-1 ].pos )
				.norm()
				.scale( 30 )
				.add( this.spline.points[ l ].pos )
			 );

			console.log( "Frames", this.frames );
			console.log( "Points", this.spline.points );
		}


	//////////////////////////////////////////////////////////
	// Private Methods
	//////////////////////////////////////////////////////////

		new_frame( t, start_idx, interp="lerp" ){ this.frames.push( { t, start_idx, interp } ); return this; }
		new_point( pos ){ this.spline.add( pos ); return this; }


	//////////////////////////////////////////////////////////
	// Process
	//////////////////////////////////////////////////////////

		update( dt, out=null, dir=null ){
			if( dt == null || dt == undefined ) return out;

			let f	= this.next( dt ),		// Get Frame Index Range and Normalized Time between frames
				fa	= this.frames[ f[0] ],	// Frame A Info
				fb	= this.frames[ f[1] ],	// Frame B Info
				t;							// Interpolation Time

			out = out || new Vec2();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Frame has no interpolation, freeze at specific point for x amount of time
			if( fb.interp == "pause" ) return out.copy( this.spline.points[ fb.start_idx ].pos );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Interpolation
			switch( fb.interp ){				
				case "lerp":
					//t = cubic_InOut( f[2] );
					//t = quad_InOut( f[2] );
					//t = sine_InOut( f[2] );
					//t = elastic_InOut( f[2] );
					//t = bounce_Out( f[2] );
					//t = sine_Out( f[2] );
					t = f[2];
					break;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			this.spline.at_idx( t, fa.start_idx, fb.start_idx, out, dir );
			return out;
		}

		next( dt ){
			// Step the Clock forward, Cycle to start if over the time limit.
			this.clock = (this.clock + dt) % this.time_max;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Finw which frame currently in for animation.
			let i 	= this.frames.length - 2,
				t, ia, ib, fa, fb;

			for( i; i > 0; i-- ) if( this.frames[ i ].t < this.clock ) break;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			ia	= i;										// Frame A Index
			ib	= i + 1;									// Frame B Index
			fa	= this.frames[ ia ];						// Frame A Info
			fb	= this.frames[ ib ];						// Frame B Info
			t	= ( this.clock - fa.t ) / ( fb.t - fa.t );	// Normalize Current time between KeyFrames.

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			return [ ia, ib, t ];
		}
}
