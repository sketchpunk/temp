import App, { Maths, Vec3, Quat } from "../../fungi/App.js";
import GltfUtil                   from "../../fungi/lib/GltfUtil.js";
import { VRot90 }	              from "../../fungi/maths/Vec3.js"

// #######################################################################

//function rot_4bit_right( shift, v ){ v |= ( v & ( 15 >> (4-shift) ) ) << 4; return v >> shift; }
function rot_4bit_left( shift, v ){ return ((v << shift) & 15) | (v & 15) >> (4-shift); }

// #######################################################################

class Tile{
    // #region STATIC
    static Q90  = Quat.axis_angle( Vec3.UP, -Maths.PI_H );
    static Q180 = Quat.axis_angle( Vec3.UP, -Math.PI );
    static Q270 = Quat.axis_angle( Vec3.UP, -Maths.PI_270 );

    static shift_bits( shift, b ){
        let bot = rot_4bit_left( shift, b & 15 );
        let top = rot_4bit_left( shift, (b >> 4) & 15 );
        return bot | ( top << 4 );
    }
    // #endregion //////////////////////////////////////////////////

	constructor( m, bit ){
		this.mesh_name	= m;
        this.bits		= bit;
        this.rot        = new Quat();
    }
    
    rot_clone( r, tile ){
        if( r == 0 ) return null;

        let t = new Tile( this.mesh_name, this.bits );
        switch( r ){
            case 1:
                t.rot.copy( Tile.Q90 );
                t.bits = Tile.shift_bits( 1, t.bits );
            break;
            case 2:
                t.rot.copy( Tile.Q180 );
                t.bits = Tile.shift_bits( 2, t.bits );
            break;
            case 4:
                t.rot.copy( Tile.Q270 );
                t.bits = Tile.shift_bits( 3, t.bits );
            break;
        }

        return t;
    }
}

// #######################################################################

class TileDictionary{
    // #region MAIN
	meshes	= new Map();
    tiles 	= new Array();
    bit_map = new Array( 255 );
	constructor(){}
    // #endregion /////////////////////////////////////////////////

    // #region LOADING TILES

    // This reads a tile dictionary and parses out the mesh
    // that represents that tile. It will also duplicate tiles
    // at different rotating if the configuration has that set.
	load_json( tAry, json, bin ){
		let i, t, m, tile, bit;
		for( t of tAry ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Setup Tile and Mesh
			m = GltfUtil.get_mesh( json, bin, t.name );
			this.meshes.set( t.name, m[0] );

			tile = new Tile( t.name, t.bits );
            this.tiles.push( tile );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Duplicate Tiles if they are usable in different rotations
            if( t.rot == 0 ) continue;
            for( i=0; i < 3; i++ ){
                bit = 1 << i;
                if( t.rot & bit ) this.tiles.push( tile.rot_clone( bit ) );
            }
        }

        this.bit_sort_tiles();
    }
    
    // Sort the tiles by the Bits they represent.
    // This way it'll be easier to reference which tiles
    // will fit a specific voxel configuration
    bit_sort_tiles(){
        let t, i, b;
        for( i=0; i < this.tiles.length; i++ ){
            t = this.tiles[ i ];
            b = t.bits;

            if( !this.bit_map[ b ] ) this.bit_map[ b ] = [i];
            else                     this.bit_map[ b ].push( i );
        }
    }
    // #endregion /////////////////////////////////////////////////

    // #region MISC
	new_tile_entity( idx, ename, pos=null ){
		let tile	= this.tiles[ idx ];
		let mesh    = this.meshes.get( tile.mesh_name );
		let mat 	= App.shader.new_material( "LowPoly", null, {cullFace:false} );
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
}

// #######################################################################

export default TileDictionary;