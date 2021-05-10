import App      from "../../../fungi/App.js";
import { Mesh } from "../../../fungi/core/Mesh.js";

/*
    let dmesh = new DynamicMesh( "DMesh" ).init_empty( 3, 3, 3 );
    let mat   = App.shader.new_material( "LowPoly", null, { cullFace:false } );
    let e     = App.mesh_entity( "DynMesh", dmesh.mesh, mat, 4 );
    
    let idx_data  = new Uint16Array( [0,1,2] );
    let vert_data = new Float32Array([
        -1,0,0,
        1,0,0,
        0.5,1,0
    ]);

    dmesh.update( idx_data, vert_data );
*/

class DynamicMesh{
    constructor( name ){
        this.mesh = new Mesh( name );
    }

    // #region INITIALIZERS
    init_empty( idx_cnt, vert_cnt, vert_comp_len=3 ){
        let buf, config = [];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // BUFFERS
        buf = App.buffer.new_empty_array( vert_cnt * vert_comp_len * 4, false ); //byte_size, is_static=true, unbind=true 
        config.push( { buffer: buf, attrib_loc: App.shader.POS_LOC } );
        this.mesh.buffers.set( "vertices", buf );

        if( idx_cnt != null ){
            buf = App.buffer.new_empty_element( idx_cnt*2, false ); // Uint16
            config.push( { buffer: buf } );

            this.mesh.buffers.set( "indices", buf );
            this.mesh.element_type = 5123; //USHORT;
        }
        //{ buffer: norm_buf, attrib_loc: App.shader.NORM_LOC },

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.mesh.vao          = App.vao.new( config );
        this.mesh.element_cnt  = 0;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return this;
    }

    init_data( idx, verts, vert_comp_len=3 ){
        let buf, config = [];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // BUFFERS
        buf = App.buffer.new_array( verts, vert_comp_len, false );
        config.push( { buffer: buf, attrib_loc: App.shader.POS_LOC } );
        this.mesh.buffers.set( "vertices", buf );

        this.mesh.element_cnt = verts.length / vert_comp_len;

        if( idx ){
            buf = App.buffer.new_element( idx, false );
            config.push( { buffer: buf } );
            this.mesh.buffers.set( "indices", buf );
            this.mesh.element_cnt = idx.length;

            if( idx instanceof Uint16Array ) 		this.mesh.element_type = 5123; //USHORT;
            else if( idx instanceof Uint32Array ) 	this.mesh.element_type = 5125; //UINT;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.mesh.vao         = App.vao.new( config );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return this;
    }
    // #endregion ////////////////////////////////////////////////////

    // #region MESH UPDATING
    update( idx=null, vert=null ){
        if( vert )  this.update_vertices( vert );
        if( idx )   this.update_indices( idx );   // Indices must bind last to update element_cnt correctly
        return this;
    }

    update_vertices( data ){
        let buf = this.mesh.buffers.get( "vertices" );
        App.buffer.update_data( buf, data );
        this.mesh.element_cnt = data.length / buf.component_len;
        return this;
    }

    update_indices( data ){
        let buf = this.mesh.buffers.get( "indices" );
        App.buffer.update_data( buf, data );
        this.mesh.element_cnt = data.length;

        if( this instanceof Uint16Array ) 		this.mesh.element_type = 5123; //USHORT;
        else if( this instanceof Uint32Array ) 	this.mesh.element_type = 5125; //UINT;

        return this;
    }
    // #endregion ////////////////////////////////////////////////////
}

export default DynamicMesh;