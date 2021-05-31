import App, { Vec3 }  from "../../../fungi/App.js";
import Ray            from "../../../fungi.ray/Ray.js";
import RayVoxelGrid   from "./RayVoxelGrid.js";

class VoxelRayCaster{
    constructor( grid, on_ray, grid_hittest ){
        this.ray                = new Ray();
        this.mouse_up_bind      = this.on_mouse_up.bind( this );
        this.mouse_move_bind    = this.on_mouse_move.bind( this );
        this.on_ray             = on_ray;
        this.grid_hittest       = grid_hittest;
        this.grid               = grid;

        App.gl.canvas.addEventListener( "mouseup", this.mouse_up_bind );
        App.gl.canvas.addEventListener( "mousemove", this.mouse_move_bind );
    }

    // #region EVENTS
    // Only run if its the RIGHT button doing the clicking.
    on_mouse_up( e ){ 
        e.preventDefault(); e.stopPropagation();
        if( e.button == 2 ) this.ray_test( e.x, e.y, true );
    }

    // Only run if no mouse button action, pure hover movement
    on_mouse_move( e ){ 
        e.preventDefault(); e.stopPropagation();
        if( e.buttons == 0 ) this.ray_test( e.x, e.y, false );
    }
    // #endregion /////////////////////////////////////////////////////

    ray_test( x, y, is_click ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Perform Ray Test
        this.ray.set_screen_mouse( x, y, true );
        let result = RayVoxelGrid.test( this.ray, this.grid, this.grid_hittest );
        if( !result ){ this.on_ray( null ); return; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // if its a hit, we want the next voxel over to enable
        // If no hit, its a boundary test, just get the voxel
        let coord = new Vec3();
        if( result.is_hit ) coord.from_add( result.coord, result.norm );    // Neighbor Voxel
        else                coord.copy( result.coord );                     // Boundary Voxel

        // The Neighbor voxel can be outside the boundary
        // In that case dont count it as a hit.
        if( !this.grid.is_coord_valid( coord ) ){ this.on_ray( null ); return; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.on_ray( result, coord, is_click );
    }
}

export default VoxelRayCaster;