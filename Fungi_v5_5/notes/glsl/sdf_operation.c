float sdf_smin( float a, float b, float k ){
    float h = max( k-abs(a-b), 0.0 );
    return min( a, b ) - h*h / (k*4.0);
}

float sdf_smax( float a, float b, float k ){
    float h = max( k-abs(a-b), 0.0 );
    return max( a, b ) + h*h / (k*4.0);
}