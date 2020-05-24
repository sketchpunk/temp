import Vec3 			from "../../fungi/maths/Vec3.js";

//https://github.com/eliemichel/BMeshUnity/blob/master/Library/BMesh.cs
//https://wiki.blender.org/wiki/Source/Modeling/BMesh/Design
class BMesh{
	vertices	= new Array();
	edges		= new Array();
	loops		= new Array();
	faces		= new Array();

    // Attribute definitions. The content of attributes is stored in the
    // topological objects (Vertex, Edge, etc.) in the 'attribute' field.
    // These lists are here to ensure consistency.
    //vertexAttributes	= null; //public List<AttributeDefinition> 
    //edgeAttributes		= null;
    //loopAttributes		= null;
    //faceAttributes		= null;


    /**
     * Add a new vertex to the mesh.
     */
	AddVertex( x,y,z ){
		let vert = new Vertex();
		
		if( arguments.length == 3 )		vert.point.set( x, y, z );
		else if( x instanceof Vec3 )	vert.point.copy( x );
		
		this.vertices.push( vert );
		return vert;
    }

 	/**
     * Add a new edge between two vertices. If there is already such edge,
     * return it without adding a new one.
     * If the vertices are not part of the mesh, the behavior is undefined.
     */
	AddEdge( vert1, vert2 ){
		/*
        Debug.Assert(vert1 != vert2);

        var edge = FindEdge(vert1, vert2);
        if (edge != null) return edge;

        edge = new Edge
        {
            vert1 = vert1,
            vert2 = vert2
        };
        EnsureEdgeAttributes(edge);
        edges.Add(edge);

        // Insert in vert1's edge list
        if (vert1.edge == null)
        {
            vert1.edge = edge;
            edge.next1 = edge.prev1 = edge;
        }
        else
        {
            edge.next1 = vert1.edge.Next(vert1);
            edge.prev1 = vert1.edge;
            edge.next1.SetPrev(vert1, edge);
            edge.prev1.SetNext(vert1, edge);
        }

        // Same for vert2 -- TODO avoid code duplication
        if (vert2.edge == null)
        {
            vert2.edge = edge;
            edge.next2 = edge.prev2 = edge;
        }
        else
        {
            edge.next2 = vert2.edge.Next(vert2);
            edge.prev2 = vert2.edge;
            edge.next2.SetPrev(vert2, edge);
            edge.prev2.SetNext(vert2, edge);
        }

		return edge;
		*/
    }


/**
     * Add a new face that connects the array of vertices provided.
     * The vertices must be part of the mesh, otherwise the behavior is
     * undefined.
     * NB: There is no AddLoop, because a loop is an element of a face
     */
	AddFace(  ){ //Vertex[] fVerts
		if( attributes.length == 0 ) return null;

		let edges = new Array[ attributes.length ];

		/*	
		if (fVerts.Length == 0) return null;
		foreach (var v in fVerts) Debug.Assert(v != null);

		var fEdges = new Edge[fVerts.Length];

		int i, i_prev = fVerts.Length - 1;
		for (i = 0; i < fVerts.Length; ++i)
		{
			fEdges[i_prev] = AddEdge(fVerts[i_prev], fVerts[i]);
			i_prev = i;
		}

		var f = new Face();
		EnsureFaceAttributes(f);
		faces.Add(f);

		for (i = 0; i < fVerts.Length; ++i)
		{
			Loop loop = new Loop(fVerts[i], fEdges[i], f);
			EnsureLoopAttributes(loop);
			loops.Add(loop);
		}

		f.vertcount = fVerts.Length;
		return f; */
	}

    /**
     * Return an edge that links vert1 to vert2 in the mesh (an arbitrary one
     * if there are several such edges, which is possible with this structure).
     * Return null if there is no edge between vert1 and vert2 in the mesh.
     */
	FindEdge( vert1, vert2 ){
		/*
        Debug.Assert(vert1 != vert2);
        if (vert1.edge == null || vert2.edge == null) return null;

        Edge e1 = vert1.edge;
        Edge e2 = vert2.edge;
        do
        {
            if (e1.ContainsVertex(vert2)) return e1;
            if (e2.ContainsVertex(vert1)) return e2;
            e1 = e1.Next(vert1);
            e2 = e2.Next(vert2);
        } while (e1 != vert1.edge && e2 != vert2.edge);
		return null;
		*/
	}
	
    /**
     * Remove the provided vertex from the mesh.
     * Removing a vertex also removes all the edges/loops/faces that use it.
     * If the vertex was not part of this mesh, the behavior is undefined.
     */
	RemoveVertex( v ){
		/*
		while (v.edge != null){ RemoveEdge(v.edge); }
		vertices.Remove(v);
		*/
	}
	
    /**
     * Remove the provided edge from the mesh.
     * Removing an edge also removes all associated loops/faces.
     * If the edge was not part of this mesh, the behavior is undefined.
     */
	RemoveEdge( e ){
		/*
		while (e.loop != null)
		{
			RemoveLoop(e.loop);
		}

		// Remove reference in vertices
		if (e == e.vert1.edge) e.vert1.edge = e.next1 != e ? e.next1 : null;
		if (e == e.vert2.edge) e.vert2.edge = e.next2 != e ? e.next2 : null;

		// Remove from linked lists
		e.prev1.SetNext(e.vert1, e.next1);
		e.next1.SetPrev(e.vert1, e.prev1);

		e.prev2.SetNext(e.vert2, e.next2);
		e.next2.SetPrev(e.vert2, e.prev2);

		edges.Remove(e);
		*/
    }

	/**
     * Removing a loop also removes associated face.
     * used internally only, just RemoveFace(loop.face) outside of here.
     */
	RemoveLoop( l ){
		/*
        if (l.face != null) // null iff loop is called from RemoveFace
        {
            // Trigger removing other loops, and this one again with l.face == null
            RemoveFace(l.face);
            return;
        }

        // remove from radial linked list
        if (l.radial_next == l)
        {
            l.edge.loop = null;
        }
        else
        {
            l.radial_prev.radial_next = l.radial_next;
            l.radial_next.radial_prev = l.radial_prev;
            if (l.edge.loop == l)
            {
                l.edge.loop = l.radial_next;
            }
        }

        // forget other loops of the same face so thet they get released from memory
        l.next = null;
        l.prev = null;

		loops.Remove(l);
		*/
    }

    /**
     * Remove the provided face from the mesh.
     * If the face was not part of this mesh, the behavior is undefined.
     * (actually almost ensured to be a true mess, but do as it pleases you :D)
     */
    RemoveFace( f ){
		/*
        Loop l = f.loop;
        Loop nextL = null;
        while (nextL != f.loop)
        {
            nextL = l.next;
            l.face = null; // prevent infinite recursion, because otherwise RemoveLoop calls RemoveFace
            RemoveLoop(l);
            l = nextL;
        }
		faces.Remove(f);
		*/
    }

}

class Vertex{
	id			= null;
	point		= new Vec3();
	attributes	= new Map();	// attrib_name:String, extra_attributes:Object?
	edge		= null;			// Edge which this vertex is its origin, navigate 

	constructor( pnt=null ){
		if( pnt ) this.point.copy( pnt );
	}

	NeighborEdges(){
		/*
			var edges = new List<Edge>();
            if (this.edge != null)
            {
                Edge it = this.edge;
                do
                {
                    edges.Add(it);
                    it = it.Next(this);
                } while (it != edge);
            }
            return edges;
		*/
	}
	NeighborFaces(){
		/*
		var faces = new List<Face>();
		if (edge != null)
		{
			Edge it = edge;
			do
			{
				faces.AddRange(it.NeighborFaces());
				it = it.Next(this);
			} while (it != edge);
		}
		return faces;
		*/
	}
}

class Edge{
	id			= null;
	attributes	= new Map();
	vert1		= null;
	vert2		= null;
	next1 		= null;	// Next Edge around vert1
	next2		= null;	// Next Edge around vert2
	prev1		= null;
	prev2 		= null;
	loops		= null; // First Node of the faces that use this edge. Navigate list using radial_next

	// Is the vert part of the edge
	ContainsVertex( v ){ return ( this.vert1 === v || this.vert2 === v ); }

	// Returns the other vert if first vert is equal
	OtherVertex( v ){ return ( v === this.vert1 )? this.vert2 : this.vert1; }

	// Compute the center of the Edge
	center( v=null ){
		return (v || new Vec3()).from_add( this.vert1.point, this.vert2.point ).scale( 0.5 ); //(vert1.point + vert2.point) * 0.5f;
	}

	// Gives the next edge that uses the vert.
	Next( v ){ return ( v === this.vert1 )? this.next1 : this.next2; }

	// Add new Edge in relation to the vert.
	SetNext( v, edge ){
		if( v === this.vert1 )	this.next1 = edge;
		else					this.next2 = edge;
	}

	// Previous edge used by a vert
	Prev( v ){ return ( v === this.vert1 )? this.prev1 : this.prev2; }

	// Set the previous edge of a vert
	SetPrev( v, edge ){
		if( v === this.vert1 )	this.prev1 = edge;
		else					this.prev2 = edge;
	}

	NeighborFaces(){
		/*
		var faces = new List<Face>();
		if (this.loop != null)
		{
			var it = this.loop;
			do
			{
				faces.Add(it.face);
				it = it.radial_next;
			} while (it != this.loop);
		}
		return faces;
		*/
	}
}

class Loop{
	attributes 	= new Map();
	vert		= null;
	edge		= null;
	face 		= null; // There is one face using a loop

	radial_prev	= null; // Around Edge Loop
	radial_next	= null;
	prev		= null; // around face loop
	next1		= null;

	constructor( v, e, f ){
		this.vert = v;
		this.SetEdge( e );
		this.SetFace( f );
	}

	// Insert the loop in the linked list of the face (Used in constructor)
	SetFace( f ){
		/*
		Debug.Assert(this.face == null);
		if (f.loop == null)
		{
			f.loop = this;
			this.next = this.prev = this;
		}
		else
		{
			this.prev = f.loop;
			this.next = f.loop.next;

			f.loop.next.prev = this;
			f.loop.next = this;

			f.loop = this;
		}
		this.face = f;
		*/
	}

	// Insert the loop in the radial linked list (Used in constructor)
	SetEdge( e ){
		/*
		Debug.Assert(this.edge == null);
		if (e.loop == null)
		{
			e.loop = this;
			this.radial_next = this.radial_prev = this;
		}
		else
		{
			this.radial_prev = e.loop;
			this.radial_next = e.loop.radial_next;

			e.loop.radial_next.radial_prev = this;
			e.loop.radial_next = this;

			e.loop = this;
		}
		this.edge = e;
		*/
	}
}

class Face{
	id			= null;
    attributes	= new Map();
    vertcount	= 0;	// stored for commodity, can be recomputed easily
	loop		= null;	// navigate list using next

    // Get the list of vertices used by the face, ordered.
	NeighborVertices(){
		/*
		var verts = new List<Vertex>();
		if (this.loop != null)
		{
			Loop it = this.loop;
			do
			{
				verts.Add(it.vert);
				it = it.next;
			} while (it != this.loop);
		}
		return verts;
		*/
	}

	// Get the list of edges around the face.
	// It is garrantied to match the order of NeighborVertices(), so that
	// edge[0] = vert[0]-->vert[1], edge[1] = vert[1]-->vert[2], etc.
	NeighborEdges(){
		/*
		var edges = new List<Edge>();
		if (this.loop != null)
		{
			Loop it = this.loop;
			do
			{
				edges.Add(it.edge);
				it = it.next;
			} while (it != this.loop);
		}
		return edges;
		*/
	}

	// Compute the barycenter of the face vertices
	Center(){
		/*
		Vector3 p = Vector3.zero;
		float sum = 0;
		foreach (var v in NeighborVertices())
		{
			p += v.point;
			sum += 1;
		}
		return p / sum;
		*/
	}
}


/*
	Turn to Mesh
   public static void SetInMeshFilter(BMesh mesh, MeshFilter mf)
    {
        // Points
        Vector2[] uvs = null;
        Vector2[] uvs2 = null;
        Vector3[] points = new Vector3[mesh.vertices.Count];
        if (mesh.HasVertexAttribute("uv"))
        {
            uvs = new Vector2[mesh.vertices.Count];
        }
        if (mesh.HasVertexAttribute("uv2"))
        {
            uvs2 = new Vector2[mesh.vertices.Count];
        }
        int i = 0;
        foreach (var vert in mesh.vertices)
        {
            vert.id = i;
            points[i] = vert.point;
            if (uvs != null)
            {
                var uv = vert.attributes["uv"] as FloatAttributeValue;
                uvs[i] = new Vector2(uv.data[0], uv.data[1]);
            }
            if (uvs2 != null)
            {
                var uv2 = vert.attributes["uv2"] as FloatAttributeValue;
                uvs2[i] = new Vector2(uv2.data[0], uv2.data[1]);
            }
            ++i;
        }

        // Triangles
        int maxMaterialId = 0;
        bool hasMaterialAttr = mesh.HasFaceAttribute("materialId");
        if (hasMaterialAttr)
        {
            foreach (var f in mesh.faces)
            {
                maxMaterialId = Mathf.Max(maxMaterialId, f.attributes["materialId"].asInt().data[0]);
            }
        }

        int[] tricounts = new int[maxMaterialId + 1];
        foreach (var f in mesh.faces)
        {
            Debug.Assert(f.vertcount == 3 || f.vertcount == 4, "Only meshes with triangles/quads can be converted to a unity mesh");
            int mat = hasMaterialAttr ? f.attributes["materialId"].asInt().data[0] : 0;
            tricounts[mat] += f.vertcount - 2;
        }
        int[][] triangles = new int[maxMaterialId + 1][];
        for (int mat = 0; mat < triangles.Length; ++mat)
        {
            triangles[mat] = new int[3 * tricounts[mat]];
            tricounts[mat] = 0;
        }
        // from now on tricounts[i] is the index of the next triangle to fill in the i-th triangle list
        foreach (var f in mesh.faces)
        {
            int mat = hasMaterialAttr ? f.attributes["materialId"].asInt().data[0] : 0;
            Debug.Assert(f.vertcount == 3 || f.vertcount == 4);
            {
                var l = f.loop;
                triangles[mat][3 * tricounts[mat] + 0] = l.vert.id; l = l.next;
                triangles[mat][3 * tricounts[mat] + 2] = l.vert.id; l = l.next;
                triangles[mat][3 * tricounts[mat] + 1] = l.vert.id; l = l.next;
                ++tricounts[mat];
            }
            if (f.vertcount == 4)
            {
                var l = f.loop.next.next;
                triangles[mat][3 * tricounts[mat] + 0] = l.vert.id; l = l.next;
                triangles[mat][3 * tricounts[mat] + 2] = l.vert.id; l = l.next;
                triangles[mat][3 * tricounts[mat] + 1] = l.vert.id; l = l.next;
                ++tricounts[mat];
            }
        }

        // Apply mesh
        Mesh unityMesh = new Mesh();
        mf.mesh = unityMesh;
        unityMesh.vertices = points;
        if (uvs != null) unityMesh.uv = uvs;
        if (uvs2 != null) unityMesh.uv2 = uvs2;
        unityMesh.subMeshCount = triangles.Length;

        // Fix an issue when renderer has more materials than there are submeshes
        var renderer = mf.GetComponent<MeshRenderer>();
        if (renderer)
        {
            unityMesh.subMeshCount = Mathf.Max(unityMesh.subMeshCount, renderer.materials.Length);
        }

        for (int mat = 0; mat  < triangles.Length; ++mat)
        {
            unityMesh.SetTriangles(triangles[mat], mat);
        }
        unityMesh.RecalculateNormals();
    }
*/
