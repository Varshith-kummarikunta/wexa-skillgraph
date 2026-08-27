import { useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const NODE_COLORS = {
  Role: "#172033",
  Skill: "#2f6f9f",
  Technology: "#2f8f6b",
};

function getNodeId(node) {
  return typeof node === "object" ? node.id : node;
}

function GraphView() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    async function loadGraph() {
      try {
        const response = await axios.get(`${API_URL}/graph`);
        setGraph(response.data);
      } catch {
        setError("Unable to load graph data.");
      } finally {
        setLoading(false);
      }
    }

    loadGraph();
  }, []);

  if (loading) {
    return (
      <section className="graph-panel">
        <h2>Knowledge Graph</h2>
        <p>Loading graph...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="graph-panel">
        <h2>Knowledge Graph</h2>
        <p className="error-message">{error}</p>
      </section>
    );
  }

  const selectedRelationships = selectedNode
    ? graph.links.filter(
        (link) =>
          getNodeId(link.source) === selectedNode.id ||
          getNodeId(link.target) === selectedNode.id,
      )
    : [];

  return (
    <section className="graph-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">GRAPH EXPLORER</p>
          <h2>Career Knowledge Graph</h2>
          <p>
            Explore how roles, skills and technologies are connected.
          </p>
        </div>

        <div className="graph-stats">
          <span>{graph.nodes.length} nodes</span>
          <span>{graph.links.length} relationships</span>
        </div>
      </div>

      <p className="graph-instruction">Click a node to explore its connections.</p>

      <div className="graph-legend" aria-label="Graph legend">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <span className="legend-item" key={type}>
            <span className="legend-dot" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
        <span className="relationship-legend">
          Relationships: REQUIRES, RELATED_TO, USED_WITH
        </span>
      </div>

      {selectedNode && (
        <div className="graph-node-details">
          <div>
            <span className="details-label">Selected node</span>
            <strong>{selectedNode.name}</strong>
          </div>
          <div>
            <span className="details-label">Type</span>
            <span>{selectedNode.labels?.[0] || "Node"}</span>
          </div>
          <div className="details-relationships">
            <span className="details-label">Connected relationships</span>
            {selectedRelationships.length === 0 ? (
              <span>No connected relationships</span>
            ) : (
              selectedRelationships.map((link, index) => {
                const source = graph.nodes.find(
                  (node) => node.id === getNodeId(link.source),
                );
                const target = graph.nodes.find(
                  (node) => node.id === getNodeId(link.target),
                );

                return (
                  <span key={`${link.type}-${index}`}>
                    {source?.name || "Unknown"} {link.type} {target?.name || "Unknown"}
                  </span>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="graph-container">
        <ForceGraph2D
          graphData={graph}
          nodeLabel={(node) =>
            `${node.labels?.[0] || "Node"}: ${node.name}`
          }
          linkLabel={(link) => link.type}
          nodeRelSize={6}
          linkDirectionalArrowLength={5}
          linkDirectionalArrowRelPos={1}
          cooldownTicks={100}
          onNodeClick={setSelectedNode}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;

            ctx.beginPath();
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = NODE_COLORS[node.labels?.[0]] || "#657084";
            ctx.fill();

            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(label, node.x, node.y + 8);
          }}
        />
      </div>
    </section>
  );
}

export default GraphView;