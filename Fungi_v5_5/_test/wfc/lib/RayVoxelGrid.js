import App, { Vec3 }    from "../../../fungi/App.js";

// #####################################################################

// Hit Handler - Only Visualizes all the voxels hit by the ray
class RayDebugHandler{
    static cell_bound = [ new Vec3(), new Vec3() ];
    static pos        = new Vec3();
    static norm       = new Vec3();

    static visual_debug( grid, coord, hAxis, ray, step_dir, is_end=false ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Draw Cube Cell
        // Final no hit, will have a bad coord
        if( coord.x >= 0 && coord.y >= 0 && coord.z >= 0 ){
            grid.get_cell_bound( coord.x, coord.y, coord.z, this.cell_bound );
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Normal Direction of Face hit
        this.norm.reset();
        this.norm[ hAxis ] = -step_dir[ hAxis ];

        let n_coord = coord[ hAxis ]; 
        if( !is_end ) n_coord -= step_dir[ hAxis ]; // If not the end, take a step back to get the previous coord.
        
        // Get the position of the axis bounding edge
        let bound_pos  = 
            (( step_dir[ hAxis ] > 0)? n_coord+1 : n_coord )            // Position of boundary intersection
                * grid.cell_size 
                + grid.offset_pos[ hAxis ];                             // To World Space
    
        let t = ( bound_pos - ray.origin[hAxis] ) / ray.vec_len[hAxis]; // Use Axis position to get T of the ray
        
        ray.get_pos( t, this.pos ); // get the full position on the ray of the boundary intersection
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        App.Debug.ln( ray.origin, ray.end, "cyan" );
        App.Debug
            .box( this.cell_bound[0], this.cell_bound[1], "red" )	// Display Voxel
            .pnt( this.pos, "green", 0.3 )					        // Display Intersection Point for Voxel
            .ln( this.pos, this.norm.add( this.pos ), "green" );    // Diplay Normal Direction
    }

    static on_hit_test( grid, coord, hAxis, ray, step_dir ){
        this.visual_debug( grid, coord, hAxis, ray, step_dir, false );
        return false;
    }

    static on_complete( grid, coord, hAxis, ray, step_dir ){
        this.visual_debug( grid, coord, hAxis, ray, step_dir, true );
    }
}

// #####################################################################

class RayVoxelGrid{
    static test( ray, grid, handler=null, tries=30 ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Before we traverse the grid for which voxels the ray intersects
        // we need to know if the ray is within the grid boundary. Plus
        // we need the entry point of the ray to determine which voxel
        // to start with, plus the exit point as a possible selected voxel if
        // none is hit.
        let init_hit = {};
        if( !ray.in_bound( grid.get_bounds(), init_hit ) ) return null;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // The hit position of the ray when it hit the grid boundary.
        // Need to move point to local space for math to work.
        let in_pos   = ray.get_pos( Math.max( init_hit.min, 0) ).near_zero().sub( grid.offset_pos ),	
            step_dir = new Vec3(-1,-1,-1),        // Direction to Traverse Down the Ray but in Voxel Coordinates ( -1 or 1 )
            exit     = new Vec3( -1, -1, -1 ),    // Voxel Coordinate that marks the exit out of the voxel grid per axis. By default set as all negative
            
            // Use the inital position to compute which outer voxel was hit first.
            // clamp( floor( posX / cellSize ), 0, xCellCnt-1 )
            coord    = new Vec3( in_pos ).div_scale( grid.cell_size )  
                .floor().clamp( [0,0,0], [ grid.cell_cnt.x-1, grid.cell_cnt.y-1,grid.cell_cnt.z-1 ] ),
            
            // Next Boundary when going in the negative direction by default
            bound    = new Vec3().from_scale( coord, grid.cell_size ); 

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Which Direction are we moving down the Ray. By default movement is stepping 
        // in the negative DIR but if the ray is positive, then we need to update things
        for( let i=0; i < 3; i++ ){
            if( ray.dir[i] >= 0 ){                                  // If Direction is going in the positive direction
                step_dir[i]	= ( ray.dir[i] == 0 )? 0 : 1;           // Moving in a positive direction OR no movement at all.  
                bound[i]	= ( coord[i] + 1 ) * grid.cell_size;    // In Positive, Next cell is at this Local Space Position
                if( ray.dir[i] > 0 ) exit[i] = grid.cell_cnt[i];    // Which voxel coord on this axis will be considered an exist out of chunk.
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let	hAxis 		= init_hit.nAxis,	    // Inital Axis Hit from outer boundary
            is_hit		= false,				// Using Check Data, did we hit a voxel that exists.
            axis_coord;

        // Get Ray Voxel T steps to reach the next voxel of each axis ( dir_x / rayDirX * VoxelSize )
        let t_inc = new Vec3().from_div( step_dir, ray.dir ).scale( grid.cell_size );  
        
        // Current T value for each axis on the ray for the starting voxel.
        let t_ray = new Vec3().from_sub( bound, in_pos ).div( ray.dir );          

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        while( tries > 0 ){
            //-------------------------
            // Hit test is external, can also inject visual debugging at this point.
            if( handler && handler.on_hit_test ){
                is_hit = handler.on_hit_test( grid, coord, hAxis, ray, step_dir );
                if( is_hit ) break;
            }

            //-------------------------
            // Traverse down the ray one Dimension at a time by which axis is closest to a boundary
            // Whichever axis T value is smallest, becomes the direction of the closest voxel.
            hAxis      = t_ray.get_min_axis();               // Which axis has the smallest value
            axis_coord = coord[ hAxis ] + step_dir[ hAxis ]; // Move voxel on increment on N axis at N step
            if( axis_coord == exit[ hAxis ] ) break; // Reached Exist Voxel Coordinate

            //-------------------------
            // Move things to test the next possible voxel on the path of the ray.
            coord[ hAxis ]  = axis_coord;   // Move to next voxel on the hit axis
            t_ray[ hAxis ] += t_inc[ hAxis ];   // Move T to the starting place of the next voxel.
            tries--;              
                    
        }

        if( handler && handler.on_complete ){
            handler.on_complete( grid, coord, hAxis, ray, step_dir );
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let norm = new Vec3();
        norm[ hAxis ] = -step_dir[ hAxis ]; // 0:x, 1:y, 2:z

        //console.log( "FINAL COORD", coord );
        //console.log( "final norm", norm );
        return { norm, coord, is_hit, axis:hAxis, dir:-step_dir[ hAxis ] };
    }
}

// #####################################################################

export default RayVoxelGrid;
export { RayDebugHandler };