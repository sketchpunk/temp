import Vec3 from "../../../fungi/maths/Vec3.js";

// Inspiration https://github.com/eliemichel/BMeshUnity

// #region LINKED LIST
/* EXAMPLE
let cll = new CircularLinkedList();
cll.add( "a" ).add( "b" ).add( "c" );

for( let v of cll.iter_next() ){
    console.log( v );
}
*/
class Node{
    constructor( v ){
        this.value = v;
        this.prev  = null;
        this.next  = null;
    }
}
class CircularLinkedList{
    constructor(){
        this.head   = null;     // Starting Node
        this.tail   = null;     // Last node before repeating
        this.count  = 0;        // How Many nodes added to list
    }

    add( v ){
        let n = new Node( v );
        this.count++;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Empty Linked List, Easy to setup
        if( !this.head ){
            this.head = n;
            this.tail = n;
            n.next    = n;
            n.prev    = n;
            return this;
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        n.prev          = this.tail;        // New Node Lives between the Tail
        n.next          = this.tail.next;   // And Its Circular Next, Which should be Head
        this.tail.next  = n;                // The Previous Tail's Next should be new Node
        this.tail       = n;                // New Node becomes new tail
        this.head.prev  = n;                // Head loops backward to tail

        return this;
    }

    get_node( v ){
        let n = this.head;
        do{
            if( n.value === v ) return n;
            n = n.next;
        }while( n !== this.head );
        return null;
    }

    size(){
        let n   = this.head,
            cnt = 0;
        do{
            cnt++;
            n = n.next;
        }while( n !== this.head );
        return cnt;
    }

    iter_next( n=null ){
        let first   = n || this.head;
        let node    = first;
        let result  = { value:null, done:false };
        let next    = ()=>{
            if( !node ) result.done = true;
            else{
                result.value = node.value;
                // If next Item in Linked List, but since its circular, need to 
                // test if the next item is the first item.
                node = ( node.next !== first )? node.next : null;
            }
            return result;
        };

        return { [Symbol.iterator](){ return { next }; } };
    }

    clear(){
        if( !this.head ) return;

        let p, n = this.head;
        do{
            p       = n;
            n       = n.next;

            p.value = null;
            p.next  = null;
            p.prev  = null;
        }while( n !== this.head );

        this.head   = null;
        this.tail   = null;
        this.count  = 0;
    }
}
// #endregion


// #region BMESH TYPES
class Vertex{
    constructor(){
        this.idx    = null;                     // Index of Vertex, Gets filled in At Buffer Build time
        this.pos    = new Vec3();               // Position
        this.edge   = new CircularLinkedList(); // How many edges the vertex is part of
    }

    dispose(){
        this.pos = null;
        this.edge.clear();
        this.edge = null;
    }
}

class Edge{
    constructor( va, vb ){
        this.idx    = null;
        this.a      = va;                       // First Point that makes up the Edge
        this.b      = vb;                       // Second Point that makes up the edge
        this.loop   = new CircularLinkedList(); // All the Face Loops this edge is part of
    }

    contains_vertex( v ){ return ( v === this.a || v === this.b ); }
    other_vertex( v ){ return ( v === this.a )? this.b : this.a; }

    dispose(){
        this.a = null;
        this.b = null;
        this.loop.clear();
        this.loop = null;
    }
}

class Loop{
    constructor( v, e, f ){
        this.idx         = null;        // TODO, Not needed
        this.vert        = v;           // Starting Vert of the Edge for a Face
        this.edge        = e;           // The Edge of a face
        this.face        = f;           // Face

        // Can have multiple normals per vert depending on the face or edge.
        // If smooth shading, we average out all the normals
        // If sharp edges, we duplicate each vertex of the edge so it keeps its normal
        this.norm        = new Vec3();
    }

    dispose(){
        this.vert = null;
        this.edge = null;
        this.face = null;
        this.norm = null;
    }
}

class Face{
    constructor(){
        this.idx        = null;                     // Todo, not needed
        this.vert_count = 0;                        // How many verts was used to create this face
        this.loop       = new CircularLinkedList(); // List all the edges/vertices that make up the face
    }

    dispose(){
        this.loop.clear();
        this.loop = null;
    }
}
// #endregion ///////////////////////////////////////////////


class BMesh{
    constructor(){
        this.vert_map   = {};           // Lookup table to prevent duplicating vertices
        this.vertices   = new Array();
        this.edges      = new Array();
        this.loops      = new Array();
        this.faces      = new Array();
    }

    // #region ADDING
    add_vert( x, y, z ){
        if( x instanceof Float32Array || Array.isArray( x ) ){ y = x[1]; z = x[2]; x = x[0]; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Check if vertex position already exists
        let idx,
            key = Math.floor( x * 1000 ) + "_" +
                  Math.floor( y * 1000 ) + "_" +
                  Math.floor( z * 1000 );
        if( (idx = this.vert_map[ key ]) != undefined ) return this.vertices[ idx ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // New Vertex
        let v = new Vertex();
        v.pos.set( x, y, z );               // Set Position
        v.idx = this.vertices.length;       // Set Index in Array
        this.vertices.push( v );            // Save to Array
        this.vert_map[ key ] = v.idx;     // Key to Index Mapping
        return v;
    }


    add_edge( va, vb ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let edge = this.find_edge( va, vb );
        if( edge ) return edge;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        edge     = new Edge( va, vb );  // Edge
        edge.idx = this.edges.length;   // TODO, Can get rid of this
        this.edges.push( edge );        // Save to Global List

        va.edge.add( edge );            // Link Edge to each vertex
        vb.edge.add( edge );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return edge;

        /*
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let edge = this.find_edge( vert1, vert2 );
        if( edge ) return edge;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        edge     = new Edge( vert1, vert2 );
        edge.idx = this.edges.length;
        this.edges.push( edge );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Insert in vert1's edge list
        if ( vert1.edge == null ){
            vert1.edge = edge;
            edge.next1 = edge; 
            edge.prev1 = edge;
        }else{
            edge.next1 = vert1.edge.next( vert1 ); // Get next edge
            edge.prev1 = vert1.edge;

            edge.next1.set_prev( vert1, edge ); 
            edge.prev1.set_next( vert1, edge );
        }

        if( vert2.edge == null ){
            vert2.edge = edge;
            edge.next2 = edge;
            edge.prev2 = edge;
        }else{
            edge.next2 = vert2.edge.next(vert2);
            edge.prev2 = vert2.edge;
            edge.next2.set_prev( vert2, edge );
            edge.prev2.set_next( vert2, edge );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return edge;
        */
    }


    add_face( vert_ary, norm_ary ){
        if( vert_ary.length == 0 ) return null;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create or Find an Edge for every two points on the array
        let edge_ary = new Array( vert_ary.length ),
            i_prev   = vert_ary.length - 1,  // Start with the edge that closes the loop, Last -> First
            i;

        for( i=0; i < vert_ary.length; i++ ){
            edge_ary[ i_prev ] = this.add_edge( vert_ary[ i_prev ], vert_ary[ i ] );
            i_prev             = i;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Face Object and save it for array
        let f = new Face();
        f.idx = this.faces.length;
        this.faces.push( f );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create a Loop List that connects the Verts/Edges
        // Of the faces in the order it was passed in.
        let loop, edge;
        for( i=0; i < vert_ary.length; i++ ){
            //----------------------------------
            edge     = edge_ary[ i ];
            loop     = new Loop( vert_ary[ i ], edge, f );
            loop.idx = this.loops.length;

            //----------------------------------
            // Save normal if available
            if( norm_ary ) loop.norm.copy( norm_ary[ i ] ); 

            //----------------------------------
            edge.loop.add( loop );      // Save Loop Reference to Edge, to find all faces edge is attached too.
            f.loop.add( loop );         // Loop for face links all verts & edges of a face, plus order of verts around.
            this.loops.push( loop );    // Global Storage of loop
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        f.vert_count = vert_ary.length;
        return f;
    }
    // #endregion ///////////////////////////////////////////////

    // #region MISC
    find_edge( va, vb ){
        // If either vertex has no edges, exist
        if( !va.edge.head || !vb.edge.head ) return null;

        // Get Starting Nodes of Linked List
        let na = va.edge.head;
        let nb = vb.edge.head;

        do{
            // Any Edge that contains BOTH vertices
            if( na.value.contains_vertex( vb ) ) return na.value;
            if( nb.value.contains_vertex( va ) ) return nb.value;

            // Move onto Next Node
            na = na.next;
            nb = nb.next;
        } while( na != va.edge.head && nb != vb.edge.head ); // Circular List, If next is first, exit
        
        return null;
    }

    reset(){
        let i;
        for( i in this.vert_map ) if( this.vert_map.hasOwnProperty( i ) ) delete this.vert_map[ i ];
        for( i of this.vertices ) i.dispose();
        for( i of this.edges ) i.dispose();
        for( i of this.loops ) i.dispose();
        for( i of this.faces ) i.dispose();

        this.vertices.length = 0;
        this.edges.length    = 0;
        this.loops.length    = 0;
        this.faces.length    = 0;
    }
    // #endregion ///////////////////////////////////////////////
    
    // #region BUILDING
    build_vertices(){
        let v, ii,
            cnt = this.vertices.length,
            buf = new Float32Array( cnt * 3 );

        for( let i=0; i < cnt; i++ ){
            v           = this.vertices[ i ];
            v.idx       = i;                    // Verts can be deleted/Removed, so IDX needs to be set before doing indices to link faces correctly.

            ii          = i * 3;                // Translate 
            buf[ ii ]   = v.pos[ 0 ];
            buf[ ++ii ] = v.pos[ 1 ];
            buf[ ++ii ] = v.pos[ 2 ];
        }

        return buf;
    }

    build_indices(){
        let f, l, ary = new Array();

        for( f of this.faces ){
            switch( f.loop.count ){
                // TRI ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                case 3:
                    for( l of f.loop.iter_next() ) ary.push( l.vert.idx );
                    break;

                // QUAD ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                case 4: console.log( "TODO - Build Indices needs to handle quad faces."); break;
                
                // ERR ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                default: console.error( "Face has less then 3 or more then 4 sides", f ); break;
            }
        }

        return new Uint16Array( ary );
    }

    build_normals(){
    }
    // #endregion ///////////////////////////////////////////////
}

export default BMesh;