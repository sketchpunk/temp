import App from "./App.js";

export default {
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    unit_corner : ()=>{
        let buf_idx		= App.buffer.new_element( new Uint16Array( [ 0,1,2, 2,3,0 ] ) );
        let buf_vert	= App.buffer.new_array( new Float32Array(
            [ 0, 0, 0,	0,0,
              0, 1, 0,	0,1,
              1, 1, 0,	1,1, 
              1, 0, 0,	1,0 ]
        ));
    
        return App.mesh.from_buffer_config([
            { name: "indices", buffer: buf_idx },
            { name: "quad", buffer: buf_vert, interleaved: [
                { attrib_loc:0, size:3, stride_len:5 * 4, offset:0 * 4 },
                { attrib_loc:2, size:2, stride_len:5 * 4, offset:3 * 4 },
            ]}
        ], "BrushQuad", 6 );
    },
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    ndc : () => {
        let buf_idx     = App.buffer.new_element( new Uint16Array( [ 0,1,2, 2,3,0 ] ) );
        let buf_vert    = App.buffer.new_array( new Float32Array(
            [ -1,  1, 0,	0,0,
              -1, -1, 0,	0,1,
               1, -1, 0,	1,1, 
               1,  1, 0,	1,0 ]
        ));
    
        let mesh = App.mesh.from_buffer_config([
            { name: "indices", buffer: buf_idx },
            { name: "quad", buffer: buf_vert, interleaved: [
                { attrib_loc:0, size:3, stride_len:5 * 4, offset:0 * 4 },
                { attrib_loc:2, size:2, stride_len:5 * 4, offset:3 * 4 },
            ]}
        ], "PostQuad", 6 );
        
        return mesh;
    },
}