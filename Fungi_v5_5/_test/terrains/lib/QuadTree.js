
class Node{
    // #region STATIC METHODS
    static newRoot( size=512 ){
        const n = new Node();
        n.size          = size;
        n.maxBound[ 0 ] = size;
        n.maxBound[ 2 ] = size;
        return n;
    }
    // #endregion /////////////////////////////////////////////////////

    // #region MAIN
    id          = -1;       // Root Node will have Negative ID, else it will have a QuadTree ID value
    level       = -1;       //
    size        = 0;        // Box Size of Quadrant
    enabled     = true;     // Is Node enabled
    nodes       = null;     // Sub Quadrants
    minBound    = [0,0,0];  // Minimal Coordinate
    maxBound    = [0,0,0];  // Maximum Coordinate
    midPoint    = [0,0,0];  // Mid Point of Node
    userData    = null;     // Custom User Data if Needed
    parent      = null;

    constructor( parentNode=null, quad=0 ){
        if( parentNode ) this.setParent( parentNode, quad );
    }
    // #endregion /////////////////////////////////////////////////////

    // #region SETTERS / GETTERS
    setParent( pNode=null, quad=0 ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Root Node's ID is -1, So not to waste a bit level
        // So the First Expanded QuadTree level is 0 instead of 1
        const lvl   = ( pNode.id >= 0 )? QuadTree.idLevel( pNode.id ) + 1 : 0;   // Next Level, parent root treated as 0
        const pid   = ( pNode.id >= 0 )? pNode.id : 0;                           // Parent ID, parent root treated as 0
        this.id     = QuadTree.id( pid, lvl, quad );                             // Create new ID based on Parent ID, plus new Level + Quadrant
        this.size   = pNode.size / 2;                                            // Quadrant is HALF of parent size
        this.parent = pNode;
        this.level  = lvl;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the Bound size of the Quadrant,
        // This should make it easier to create a Bounding Box and Compute WorldSpace Location of Node.
        const pos = QuadTree.idPos( this.id ); // Get the Quadrant coordinates from ID
        
        for( let i=0; i < 2; i++ ){
            let ii = i * 2;
            if( pos[ i ] == 0 ){
                this.minBound[ ii ] = pNode.minBound[ ii ];
                this.maxBound[ ii ] = pNode.minBound[ ii ] + this.size;
            }else{
                this.minBound[ ii ] = pNode.maxBound[ ii ] - this.size;
                this.maxBound[ ii ] = pNode.maxBound[ ii ];
            }
        }

        this.midPoint[ 0 ] = this.minBound[ 0 ] * 0.5 + this.maxBound[ 0 ] * 0.5;
        this.midPoint[ 1 ] = this.minBound[ 1 ] * 0.5 + this.maxBound[ 1 ] * 0.5;
        this.midPoint[ 2 ] = this.minBound[ 2 ] * 0.5 + this.maxBound[ 2 ] * 0.5;

        //console.log( "-----Node", pid, quad, lvl );
        //QuadTree.idDebug( this.id );
        //console.log( quad, this.minBound, this.maxBound );
    }
    // #endregion /////////////////////////////////////////////////////

    // #region METHODS
    /** Expand the Node into 4 Quadrants 
    expand(){
        if( this.nodes ) return false;

        this.nodes = [
            new Node( this, QuadTreeID.A ),
            new Node( this, QuadTreeID.B ),
            new Node( this, QuadTreeID.C ),
            new Node( this, QuadTreeID.D ),
        ];

        return true;
    }*/ 
    // #endregion /////////////////////////////////////////////////////
}


class QuadTree{
    // #region MAIN
    root        = null;         // Starting Node
    size        = 0;            // Total Size of QuadTree Area ( Both Width+Height )
    nodeMap     = new Map();
    onNewNode   = null;

    constructor( size=512, onNewFn=null, expendedRoot=true ){
        this.size       = size;
        this.onNewNode  = onNewFn
        this.root       = Node.newRoot( size );

        this.nodeMap.set( this.root.id, this.root );
        if( onNewFn )       onNewFn( this.root );
        if( expendedRoot )  this.expandNode( this.root );
    }
    // #endregion /////////////////////////////////////////////////////

    // #region METHODS
    forEach( fn ){
        let k, n;
        for( [k,n] of this.nodeMap ) fn( n );

        return this;
    }

    disableAll(){
        let k, n;
        for( [k,n] of this.nodeMap ) n.enabled = false;
        return this;
    }

    getLeafNodes(){
        /*
        let n, stack = [ this.root ];

		while( stack.length > 0 ){
			n = stack.pop();
			if( n.nodes ){
				stack.push( ...n.nodes );
			}
        }
        */
       return null;
    }
    // #endregion /////////////////////////////////////////////////////

    // #region NODE MANAGEMENT
    expandNode( n ){
        // If Sub Nodes Exist, Just enable them.
        if( n.nodes ){
            let nn;
            for( nn of n.nodes ) nn.enabled = true;
            return true;
        }

        // Stop Creating Nodes at Level 12
        if( n.level >= 12 ) return false;

        // New Children Nodes
        const a = new Node( n, QuadTree.A );
        const b = new Node( n, QuadTree.B );
        const c = new Node( n, QuadTree.C );
        const d = new Node( n, QuadTree.D );
        n.nodes = [ a, b, c, d ];

        // Cache them to MAP
        this.nodeMap.set( a.id, a );
        this.nodeMap.set( b.id, b );
        this.nodeMap.set( c.id, c );
        this.nodeMap.set( d.id, d );

        // Run Code on New Nodes
        if( this.onNewNode ){
            this.onNewNode( a );
            this.onNewNode( b );
            this.onNewNode( c );
            this.onNewNode( d );
        }

        return true;
    }
    // #endregion /////////////////////////////////////////////////////

    // #region ID
    /*
    Int contains 32 Bits
    -- First 4 bits defines Level
    -- There remains 28 But the last bit defines negative since there is no Uint in Javascript
    -- Each Quadrant ID needs 2 bits
    ---- With 27 bits left minus Negative and the Level definition, only have 26 bites to use for Quad IDs per Level.
    ---- 26 bits / 2 = 13  :: Thats how many levels of LOD we can define with an Signed Int

    First for Bits,
    1, 2, 4, 8 = 15, Fits within the 13 level limit for Signed Ints.

    Quadrants - ZigZag Pattern
    A:00  C:01
    B:10  D:11

    If the First Bit is ON, its a LEFT Side, else Right Side
    if the Second Bit is ON, Its a BOTTOM Side, else a TOP Side.
    */

    static A = 0;   // 00
    static B = 2;   // 10
    static C = 1;   // 01
    static D = 3;   // 11

    static id( qid, lvl, quad ){
        const shift   = ( lvl * 2 ) + 4;            // How many bits to shift based on level
        const i       = quad << shift;              // Quad ID at Bit Level
        const mask    = ~( (3 << shift) + 15 );     // Create Mask to clear out lvl and quad of old ID : ex. 111100110000
        lvl           = Math.max( lvl, qid & 15 );  // Grab the first 4 Bits which defines the level.
        return ( qid & mask ) ^ lvl ^ i;            // Rebuild ID with new level and Quadrant ID
    }
    
    static idLevel( id ){ return id & 15; }
    
    static idPos( id, out=[0,0] ){
        const lvl   = id & 15;              // Mask out the Level
        const shift = ( lvl * 2 ) + 4;      // How much to Shift Right
        const quad  = ( id >> shift ) & 3;  // Mask out the First 2 bits after shift

        out[ 0 ]    = quad & 1;
        out[ 1 ]    = ( quad & 2 ) * 0.5;
        return out;
    }

    static idInfo( id ){
        const lvl   = id & 15;              // Mask out the Level
        const shift = ( lvl * 2 ) + 4;      // How much to Shift Right
        const quad  = ( id >> shift ) & 3;  // Mask out the First 2 bits after shift

        let qrant;
        switch( quad ){
            case this.A : qrant = "A"; break;
            case this.B : qrant = "B"; break;
            case this.C : qrant = "C"; break;
            case this.D : qrant = "D"; break;
        }

        return {
            level    : lvl,
            quad     : quad,
            pos      : [ quad & 1, ( quad & 2 ) * 0.5 ],
            quadrant : qrant,
        };
    }

    static idDebug( id ){
        let i, v, q, lvl = id & 15;
        console.log( "Max Level : ", lvl );
        
        let bits = "Bits : "; // ex output : BITS: 1000 10 11 01
        let end = (id & 15) * 2 + 6;
        for( i=0; i < end; i++ ) bits += ((id >> i) & 1) + (( (i & 1) && i > 2 )?" ":"");
        console.log( bits );

        for( i=0; i <= lvl; i++ ){
            v = ( id >> ((i * 2) + 4) ) & 3;
            switch( v ){
                case this.A : q = "A-00"; break;
                case this.B : q = "B-10"; break;
                case this.C : q = "C-01"; break;
                case this.D : q = "D-11"; break;
                default: q = "X";   // error
            }
            console.log( "LVL:", i, " : ", q);
        }
    }
    // #endregion
}


export default QuadTree;