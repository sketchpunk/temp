import App, { Vec3, Quat, Transform } from "../fungi/App.js";
import { IESpring_Vec3 } from "../fungi/maths/IESpring.js";

//#################################################################

class Bone{
    constructor( idx ){
        this.idx    = idx;
        this.spring = new IESpring_Vec3();
        this.spring.set_osc_ps( 1.0 ).set_damp( 0.8 );
    }

    reset_to( pos ){ this.spring.reset( pos ); return this; }
}

class Item{
    constructor( n ){
        this.name   = n;
        this.bones  = new Array();
    }

    // #region Getter / Setters
    add( idx ){ 
        let b = new Bone( idx );
        this.bones.push( b );
        return b;
    }

    set( osc, damp ){
        let b;
        for( b of this.bones ) b.spring.set_osc_ps( osc ).set_damp( damp );
        return this;
    }

    set_osc( a ){
        let b;
        for( b of this.bones ) b.spring.set_osc_ps( a );
        return this;
    }

    set_osc_range( idx, a, b ){
        let len = this.bones.length - 1,
            i, t;

        for( i=0; i <= len; i++ ){
            t = i / len;
            this.bones[ i ].spring.set_osc_ps( a * (1-t) + b * t );
        }
        return this;
    }

    set_damp( idx, a ){
        let b;
        for( b of this.bones ) b.spring.set_damp( a );
        return this;
    }

    set_damp_range( idx, a, b ){
        let len = this.bones.length - 1,
            i, t;

        for( i=0; i <= len; i++ ){
            t = i / len;
            this.bones[ i ].spring.set_damp( a * (1-t) + b * t );
        }
        return this;
    }
    // #endregion ///////////////////////////////////////////////////////
}

class RotItem extends Item{
    constructor( n ){ super( n ); }

    // Get the WS Resting Position for each bone.
    set_rest_from_nodes( arm, chain ){        
        let ib, n, b,
            pt      = new Transform(),
            tail    = new Vec3();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get Root's Parent's WS Transform;
        n = arm.nodes[ this.bones[0].idx ];
        chain.root_world_transform( n.parent, pt ); 

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the WS Position of all the Bone Tails
        // These are the end effectors for each bone.
        for( ib of this.bones ){
            b = arm.bones[ ib.idx ];   // Get Bone Reference
            //n = arm.nodes[ ib.idx ];   // Get Node Reference

            pt.add( b.local );         // Bone's World Space of Bind Pose

            tail.set( 0, b.len, 0 );   // Compute Tail Distance
            pt.transform_vec( tail );  // WS Position of Tail
            
            ib.reset_to( tail );       // Reset Spring to this Position
        }
    }

    update_nodes( dt, arm, chain ){
        let ib, n, b, itm,
            pt      = new Transform(),
            ct      = new Transform(),
            tail    = new Vec3(),
            ray_a   = new Vec3(),
            ray_b   = new Vec3(),
            rot     = new Quat();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get Root's Parent's WS Transform;
        n = arm.nodes[ this.bones[0].idx ];        
        chain.root_world_transform( n.parent, pt );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the WS Position of all the Bone Tails
        // These are the end effectors for each bone.
        for( ib of this.bones ){
            b = arm.bones[ ib.idx ];   // Get Bone Reference
            n = arm.nodes[ ib.idx ];   // Get Node Reference

            //-----------------------------------
            // Get Current Tail Position
            tail.set( 0, b.len, 0 );        // Compute Tail Distance
            ct  .from_add( pt, b.local )    // Build WS of Bind Pose
                .transform_vec( tail );     // WS Position of Tail

            
            //App.Debug.pnt( tail, "red", 0.02 );
            //-----------------------------------
            // Use new Tail position as the new Target
            // Then update the spring position
            ib.spring.set_target( tail ).update( dt );
            //if( !ib.spring.set_target( tail ).update( dt ) ){
            //    pt.copy( ct );
            //    continue;
            //}

            //App.Debug.pnt( ib.spring.val, "cyan", 0.03 );

            //-----------------------------------
            ray_a.from_sub( tail, ct.pos ).norm();			// Ray to Resting position
            ray_b.from_sub( ib.spring.val, ct.pos ).norm();	// Ray to spring pos

            //console.log( ib.spring.val );
            
            rot .from_unit_vecs( ray_a, ray_b )				// Create Swing Rotation
                .dot_negate( ct.rot )
                .mul( ct.rot )								// Apply it
                //.copy_to( q )
                .pmul_invert( pt.rot );						// To local Space
                //.norm();

            //tail.set( 0, b.len, 0 ).transform_quat( q ).add( ct.pos );
            //App.Debug.pnt( tail, "yellow", 0.01 );

            //-----------------------------------
            n.set_rot( rot );								// Save Results				
            pt.add( rot, n.local.pos, n.local.scl );        // Move Parent WS For Next Bone
        }


        return this;
    }
}

class PosItem extends Item{
    constructor( n ){ super( n ); }

    // Get the WS Resting Position for each bone.
    set_rest_from_nodes( arm, chain ){        
        let ib, n, b, pt = new Transform();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get Root's Parent's WS Transform;
        n = arm.nodes[ this.bones[0].idx ];
        chain.root_world_transform( n.parent, pt ); 

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the WS Position of all the Bones
        for( ib of this.bones ){
            b = arm.bones[ ib.idx ];   // Get Bone Reference
            pt.add( b.local );         // Bone's World Space of Bind Pose
            ib.reset_to( pt.pos );     // Reset Spring to this Position
        }
    }

    update_nodes( dt, arm, chain ){
        let ib, n, b,
            pt      = new Transform(),
            ct      = new Transform(),
            t_inv   = new Transform(),
            pos     = new Vec3();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get Root's Parent's WS Transform;
        n = arm.nodes[ this.bones[0].idx ];
        chain.root_world_transform( n.parent, pt );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the WS Position of all the Bone Tails
        // These are the end effectors for each bone.
        for( ib of this.bones ){
            b = arm.bones[ ib.idx ];   // Get Bone Reference
            n = arm.nodes[ ib.idx ];   // Get Node Reference

            //-----------------------------------
            // Get Current  Position
            ct.from_add( pt, b.local ) // Build WS of Bind Pose

            //-----------------------------------
            // Use bind position as the new target
            if( !ib.spring.set_target( ct.pos ).update( dt ) ){
                pt.copy( ct );
                continue;
            }

            //-----------------------------------
            t_inv
                .from_invert( pt )                      // Need to invert Parent Transform
                .transform_vec( ib.spring.val, pos );   // to convert position to local space

            n.set_pos( pos );						    // Save Results				
            pt.add( n.local.rot, pos, n.local.scl );    // New transform for next bone
        }


        return this;
    }
}

class BoneSpring{
    items    = new Array();
    do_reset = true;

    //Rotation Spring
    add_rot( name, nAry, osc=5.0, damp=0.5 ){
        let arm = App.ecs.get_com( this._entity_id, "Armature" );
        let itm = new RotItem( name );
        let b;

        for( let n of nAry ){
            if( arm.names[ n ] == undefined ){ console.log( "ChainSpring - Bone Not Found : ", n ); return this; }
            b = itm.add( arm.names[ n ] );

            if( osc != null )  b.spring.set_osc_ps( osc );
            if( damp != null ) b.spring.set_damp( damp );
        }

        this.items.push( itm );
        return this;
    }

    // Position Spring
    add_pos( name, nAry, osc=5.0, damp=0.5 ){
        let arm = App.ecs.get_com( this._entity_id, "Armature" );
        let itm = new PosItem( name );
        let b;

        for( let n of nAry ){
            if( arm.names[ n ] == undefined ){ console.log( "ChainSpring - Bone Not Found : ", n ); return this; }
            b = itm.add( arm.names[ n ] );

            if( osc != null )  b.spring.set_osc_ps( osc );
            if( damp != null ) b.spring.set_damp( damp );
        }

        this.items.push( itm );
        return this;
    }

    // Compute WS Transform that also includes Armature's Entity Position
    root_world_transform( n, pt ){
        // Bones Exist only in Local Space, to get World Space
        // we need to grab the WS Transform of the Skinned model.
        // TODO - Using Root local space, Need to compute its WS transform
        let root = App.ecs.get_com( this._entity_id, "Node" );
        
        if( n != null ) n.get_world_transform( pt );
        else            pt.clear();
        
        pt.add_rev( root.local );
    }

    // Set the resting position for each bone
    set_rest_from_nodes(){
        let itm, arm = App.ecs.get_com( this._entity_id, "Armature" );
        for( itm of this.items ) itm.set_rest_from_nodes( arm, this );
        return this;
    }
    
    // Update by using information in the bone nodes
    update_nodes( dt ){
        let itm, arm = App.ecs.get_com( this._entity_id, "Armature" );
        for( itm of this.items ) itm.update_nodes( dt, arm, this );
        return this;
    }
}

//#################################################################

function BoneSpringSys( ecs ){
	let n, ary = ecs.query_comp( "BoneSpring" );
	if( !ary ) return;

	for( n of ary ){
		if( !n.do_reset ){
            n.update_nodes( App.delta_time );
            App.ecs.get_com( n._entity_id, "Armature" ).updated = true;
        }else{
            n.set_rest_from_nodes();
            n.do_reset = false;
        }	
	}
}

//#################################################################
export default BoneSpring;
export { BoneSpringSys };