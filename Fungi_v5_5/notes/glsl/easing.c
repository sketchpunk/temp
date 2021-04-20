float easeInOutExpo( float x ){
    return ( x <= 0.0 )? 0.0 :
           ( x >= 1.0 )? 1.0 :
           ( x < 0.5 )?
                pow( 2.0, 20.0 * x - 10.0) / 2.0:
                (2.0 - pow( 2.0, -20.0 * x + 10.0) ) / 2.0;
}

float parapola_pow( float t, float p ){
    float x = 4.0 * t * ( 1.0 - t );
    return pow( x, p * x );
}

float easeOutExpo( float t ){
    return (t == 1.0)? 1.0 : 1.0 - pow( 2.0, -10.0 * t );
}

float easeInOutSine( float x){
    return -(cos(PI * x) - 1.0) / 2.0;
}