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
}

class ChainSpring{
    items    = new Array();
    do_reset = true;

    add( name, nAry, osc=5.0, damp=0.5 ){
        let arm = App.ecs.get_com( this._entity_id, "Armature" );
        let itm = new Item( name );
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

    root_world_transform( n, pt ){
        // Bones Exist only in Local Space, to get World Space
        // we need to grab the WS Transform of the Skinned model.
        // TODO - Using Root local space, Need to compute its WS transform
        let root = App.ecs.get_com( this._entity_id, "Node" );
        
        if( n != null ) n.get_world_transform( pt );
        else            pt.clear();
        
        pt.add_rev( root.local );
    }

    // Get the WS Resting Position for each bone.
    set_rest_from_nodes(){
        let arm = App.ecs.get_com( this._entity_id, "Armature" );
        let ib, n, b, itm,
            pt      = new Transform(),
            tail    = new Vec3();

        for( itm of this.items ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Get Root's Parent's WS Transform;
            n = arm.nodes[ itm.bones[0].idx ];

            this.root_world_transform( n.parent, pt ); 
            //if( n.parent ) this.root_world_transform( n.parent, pt ); //n.parent.get_world_transform( pt );
            //else           pt.clear();

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Compute the WS Position of all the Bone Tails
            // These are the end effectors for each bone.
            for( ib of itm.bones ){
                b = arm.bones[ ib.idx ];   // Get Bone Reference
                n = arm.nodes[ ib.idx ];   // Get Node Reference

                pt.add( n.local );         // Bone's World Space

                tail.set( 0, b.len, 0 );   // Compute Tail Distance
                pt.transform_vec( tail );  // WS Position of Tail
                
                ib.reset_to( tail );       // Reset Spring to this Position
            }
        }

        return this;
    }

    update_nodes( dt ){
        let arm = App.ecs.get_com( this._entity_id, "Armature" );
        //let root = App.ecs.get_com( this._entity_id, "Node" );
        let q = new Quat();
        let ib, n, b, itm,
            pt      = new Transform(),
            ct      = new Transform(),
            tail    = new Vec3(),
            ray_a   = new Vec3(),
            ray_b   = new Vec3(),
            rot     = new Quat();
        App.Debug.reset();
        for( itm of this.items ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Get Root's Parent's WS Transform;
            n = arm.nodes[ itm.bones[0].idx ];
            //b = arm.bones[ itm.bones[0].idx ];
            //console.log( b.name );
            
            this.root_world_transform( n.parent, pt );
            //if( n.parent ) this.root_world_transform( n.parent, pt ); // n.parent.get_world_transform( pt );
            //else           pt.clear();

            //App.Debug.pnt( pt.pos, "yellow", 0.08 );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Compute the WS Position of all the Bone Tails
            // These are the end effectors for each bone.
            for( ib of itm.bones ){
                b = arm.bones[ ib.idx ];   // Get Bone Reference
                n = arm.nodes[ ib.idx ];   // Get Node Reference

                //-----------------------------------
                // Get Current Tail Position
                tail.set( 0, b.len, 0 );        // Compute Tail Distance
                ct  .from_add( pt, n.local )    // Build WS
                    .transform_vec( tail );     // WS Position of Tail

                
                //App.Debug.pnt( tail, "yellow", 0.02 );
                //-----------------------------------
                // Use new Tail position as the new Target
                // Then update the spring position
                ib.spring.set_target( tail ).update( dt )
                //if( !ib.spring.set_target( tail ).update( dt ) ){
                //    pt.copy( ct );
                //    continue;
                //}

                //App.Debug.pnt( ct.pos, "cyan", 0.03 );

                //-----------------------------------
                ray_a.from_sub( tail, ct.pos ).norm();			// Ray to Resting position
                ray_b.from_sub( ib.spring.val, ct.pos ).norm();	// Ray to spring pos

                //console.log( ib.spring.val );
                
                rot .from_unit_vecs( ray_a, ray_b )				// Create Swing Rotation
                    .mul( ct.rot )								// Apply it
                    .copy_to( q )
                    .pmul_invert( pt.rot );						// To local Space

                tail.set( 0, b.len, 0 ).transform_quat( q ).add( ct.pos );
                App.Debug.pnt( tail, "yellow", 0.03 );

                rot.w *= 1.3;
                rot.norm();

                //console.log( rot );

                //-----------------------------------
                n.set_rot( rot );								// Save Results				
                pt.add( rot, n.local.pos, n.local.scl );        // Move Parent WS For Next Bone
            }
        }

        return this;
    }
}

//#################################################################

function ChainSpringSys( ecs ){
	let n, ary = ecs.query_comp( "ChainSpring" );
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
export default ChainSpring;
export { ChainSpringSys };