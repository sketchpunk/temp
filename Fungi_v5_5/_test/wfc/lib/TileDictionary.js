import App, { Maths, Vec3, Quat } from "../../../fungi/App.js";
import GltfUtil                   from "../../../fungi/lib/GltfUtil.js";
import { VRot90 }	              from "../../../fungi/maths/Vec3.js"
import MarchingCubes	          from "./MarchingCubes.js";

// #######################################################################

class Tile{
    // #region STATIC
    static Q90  = Quat.axis_angle( Vec3.UP, -Maths.PI_H );
    static Q180 = Quat.axis_angle( Vec3.UP, -Math.PI );
    static Q270 = Quat.axis_angle( Vec3.UP, -Maths.PI_270 );
    // #endregion //////////////////////////////////////////////////

	constructor( m, bit, weight ){
        this.idx        = 0;                                // Index in Tile Dictionary Array
		this.mesh_name	= m;                                // Name of Tile
        this.bits		= bit;                              // Marching Cubes Value
        this.rot        = new Quat();                       // Rotation to Apply to Mesh
        this.clone_of   = null;                             // Index Of original Tile if cloned
        this.weight     = weight;                           // How often to use tile in relation to others.
        this.face_bits  = MarchingCubes.bit_faces( bit );   // Know the Bit Value of Every Face of voxel
    }
    
    rot_clone( r ){
        if( r == 0 ) return null;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let bits, q;
        switch( r ){
            case 1: q = Tile.Q90;   bits = MarchingCubes.shift_bits( 1, this.bits ); break;
            case 2: q = Tile.Q180;  bits = MarchingCubes.shift_bits( 2, this.bits ); break;
            case 4: q = Tile.Q270;  bits = MarchingCubes.shift_bits( 3, this.bits ); break;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let t       = new Tile( this.mesh_name, bits, this.weight );
        t.clone_of  = this.idx;
        t.rot.copy( q );

        return t;
    }
}

// #######################################################################

class TileDictionary{
    // #region MAIN
	meshes	    = new Map();                        // All Meshes loaded linked to tiles
    tiles 	    = new Array();                      // List of all Available Tiles
    bit_map     = new Array( 255 ).fill( null );    // Tiles sorted by Byte Values
    weight_log  = 0;                                // Total Weight Log of all the tiles
    weight 	    = 0;                                // Total Weight of all the tiles
    
    // https://en.wiktionary.org/wiki/Shannon_entropy
    // Entropy is a measurement of uncertainty and disorder. Help determine
    // which cell will cause the least problem for collapsing.
    entropy     = 0;                                // Total Entropy of all the tiles
    
	constructor(){}
    // #endregion /////////////////////////////////////////////////

    // #region LOADING TILES

    // This reads a tile dictionary and parses out the mesh
    // that represents that tile. It will also duplicate tiles
    // at different rotating if the configuration has that set.
	load_json( tAry, json, bin ){
        let i, t, m, tile, bit;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( t of tAry ){
            //------------------------------
            // Setup Tile and Mesh
			m = GltfUtil.get_mesh( json, bin, t.name );
			this.meshes.set( t.name, m[0] );

            tile = new Tile( t.name, t.bits, t.weight );
            this.add_tile( tile );

            //------------------------------
            // Duplicate Tiles if they are usable in different rotations
            if( t.rot == 0 ) continue;

            for( i=0; i < 3; i++ ){
                bit = 1 << i;
                if( t.rot & bit ) this.add_tile( tile.rot_clone( bit ) );
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Filter tiles out by Marching Cube Values
        this.bit_sort_tiles();

        // Compute the total entropy of all the tiles
        this.entropy = Math.log( this.weight ) - ( this.weight_log / this.weight );
    }

    add_tile( t ){
        t.idx = this.tiles.length;
        this.tiles.push( t );

        this.weight     += t.weight;
        this.weight_log += t.weight * Math.log( t.weight );
    }
    
    // Sort the tiles by the Bits they represent.
    // This way it'll be easier to reference which tiles
    // will fit a specific voxel configuration
    bit_sort_tiles(){
        let t, i, b;
        for( i=0; i < this.tiles.length; i++ ){
            t = this.tiles[ i ];
            b = t.bits;

            if( !this.bit_map[ b ] ) this.bit_map[ b ] = [ i ];
            else                     this.bit_map[ b ].push( i );
        }
    }
    // #endregion /////////////////////////////////////////////////

    // #region MISC
	new_tile_entity( idx, ename, pos=null ){
        let tile	= this.tiles[ idx ];
        if( !tile ) return null;

		let mesh    = this.meshes.get( tile.mesh_name );
		let mat 	= App.shader.new_material( "KennyUnlit", null, {cullFace:false} );
		let e 		= App.mesh_entity( ename );

		e.draw.add( mesh, mat, 4 );
        e.tile_idx = idx;
        e.node.set_rot( tile.rot );
        if( pos ) e.node.set_pos( pos );

		return e;
	}

	debug_entity( e ){
		let tile = this.tiles[ e.tile_idx ];
		let origin = e.node.local.pos;
		let start  = new Vec3(-1, 0, -1);
		let v      = new Vec3();
        let b      = tile.bits;
        let isOn   = false;

        let rot_fn = [
            (v,o)=>{ return o.copy(v); },
            VRot90.yp,
            VRot90.y2,
            VRot90.yn,
        ];

		for( let i=0; i < 8; i++ ){
            if( i == 4 ) start.y = 2;
            isOn = (b >> i) & 1;
            rot_fn[ i%4 ]( start, v ).add( origin );

            App.Debug.pnt( v, ((isOn)? "green":"red"), 0.2 );
		}
    }
    // #endregion /////////////////////////////////////////////////

    // #region GETTERS
    get_bit_tiles( b ){ return this.bit_map[ b ]; }
    
    total_count(){ return this.tiles.length; }
    unique_count(){
        let t, cnt = 0;
        for( t of this.tiles ) if( t.clone_of == null ) cnt++;
        return cnt;
    }

    get_empty_bits(){
        let i, ary = new Array();
        for( i=0; i < this.bit_map.length; i++ ){
            if( !this.bit_map[ i ] ) ary.push( i );
        }
        return ary;
    }
    // #endregion /////////////////////////////////////////////////
}

// #######################################################################

export default TileDictionary;