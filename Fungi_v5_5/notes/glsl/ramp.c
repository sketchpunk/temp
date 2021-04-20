float step_ramp( float t, float step_val[5], float step_pos[5], float feather, int i ){
  for( i; i > 0; i-- ){
    if( (step_pos[ i ]-feather) <= t ){
      return mix( 
        step_val[ i-1 ], 
        step_val[ i ],
        smoothstep( step_pos[ i ] - feather, step_pos[ i ] + feather, t )
      );
    }
  }
  return step_val[ 0 ];
}

const float step_val[5]	= float[]( 0.08, 0.13, 0.12, .0,  .0 );
const float step_pos[5]	= float[]( 0.05, 0.7, 1.0, .0,  .0 );

float lerp_ramp( float t, float step_val[5], float step_pos[5], int i ){
    if( t >= step_pos[ i ] ) return step_val[ i ];
    if( t <= step_pos[ 0 ] ) return step_val[ 0 ];

    for( int j=i; j >= 0; j-- ){
        if( step_pos[ j ] < t ){
            //float mt = ( t - step_pos[ j ] ) / ( step_pos[ j+1 ] - step_pos[ j ] );  // Remap T between A & B
            return mix( 
                step_val[ j ], 
                step_val[ j+1 ],
                smoothstep( step_pos[ j ], step_pos[ j+1 ], t )
            );
        }
    }

    return step_val[ 0 ];
}