import { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  Briefcase,
  Code2,
  Network,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import "./App.css";
import GraphView from "./GraphView";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function App() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);
  const [error, setError] = useState("");
  const [healthStatus, setHealthStatus] = useState("checking");
  const [fromRole, setFromRole] = useState("");
const [toRole, setToRole] = useState("");
const [careerPath, setCareerPath] = useState(null);
const [careerLoading, setCareerLoading] = useState(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        await axios.get(`${import.meta.env.VITE_API_URL}/health`);
        setHealthStatus("connected");
      } catch {
        setHealthStatus("unavailable");
      }
    }

    async function loadRoles() {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/roles`);
        setRoles(response.data);
        setError("");
      } catch {
        setError("Unable to connect to SkillGraph API.");
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
    loadRoles();
  }, []);

  async function exploreSkill(skill) {
    try {
      setSelectedSkill(skill);
      setGraphLoading(true);

      const response = await axios.get(
        `${API_URL}/graph/explore/${encodeURIComponent(skill)}`
      );

      setConnections(response.data.connections);
    } catch {
      setConnections([]);
    } finally {
      setGraphLoading(false);
    }
  }

async function findCareerPath() {
  if (!fromRole || !toRole) {
    return;
  }

  try {
    setCareerLoading(true);
    setCareerPath(null);

    const response = await axios.get(
      `${API_URL}/career-path`,
      {
        params: {
          from: fromRole,
          to: toRole,
        },
      }
    );

    setCareerPath(response.data);
  } catch (err) {
    setCareerPath({
      error: err.response?.data?.error || "No connection found.",
    });
  } finally {
    setCareerLoading(false);
  }
}

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Network size={22} />
          </div>
          <div>
            <h1>SkillGraph</h1>
            <span>Career Knowledge Graph</span>
          </div>
        </div>

        <div className={`status ${healthStatus}`}>
          <span className="status-dot"></span>
          {healthStatus === "checking"
            ? "Checking graph database..."
            : healthStatus === "connected"
              ? "Graph database connected"
              : "Graph database unavailable"}
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">EXPLORE CAREER CONNECTIONS</p>
            <h2>
              Discover the skills behind
              <span> modern tech roles.</span>
            </h2>
            <p className="hero-text">
              Explore relationships between roles, skills and technologies
              powered by a graph database.
            </p>
          </div>
        </section>

        {error && (
          <div className="error-box">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <section className="content">
          <div className="section-header">
            <div>
              <h3>Technology Roles</h3>
              <p>Select a role to explore its required skills.</p>
            </div>

            <div className="search">
              <Search size={18} />
              <input
                placeholder="Search roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading">
              <Loader2 className="spin" />
              Loading roles...
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="empty">
              No roles found.
            </div>
          ) : (
            <div className="role-grid">
              {filteredRoles.map((role) => (
                <button
                  className={`role-card ${
                    selectedRole?.name === role.name ? "active" : ""
                  }`}
                  key={role.name}
                  onClick={() => {
                    setSelectedRole(role);
                    setSelectedSkill(null);
                    setConnections([]);
                  }}
                >
                  <div className="role-icon">
                    <Briefcase size={20} />
                  </div>

                  <div className="role-info">
                    <h4>{role.name}</h4>
                    <p>{role.description}</p>
                    <div className="skill-count">
                      {role.skills.length} skills
                    </div>
                  </div>

                  <ChevronRight size={20} />
                </button>
              ))}
            </div>
          )}

          <section className="career-panel">
  <div className="detail-header">
    <div>
      <p className="eyebrow">CAREER PATH FINDER</p>
      <h3>Find a connection between roles</h3>
      <p>
        Discover shared skills connecting two technology careers.
      </p>
    </div>

    <Network size={38} />
  </div>

  <div className="career-controls">
    <select
      value={fromRole}
      onChange={(e) => setFromRole(e.target.value)}
    >
      <option value="">Starting role</option>
      {roles.map((role) => (
        <option key={role.name} value={role.name}>
          {role.name}
        </option>
      ))}
    </select>

    <span>→</span>

    <select
      value={toRole}
      onChange={(e) => setToRole(e.target.value)}
    >
      <option value="">Target role</option>
      {roles.map((role) => (
        <option key={role.name} value={role.name}>
          {role.name}
        </option>
      ))}
    </select>

    <button
      className="find-button"
      onClick={findCareerPath}
      disabled={!fromRole || !toRole || careerLoading}
    >
      {careerLoading ? "Finding..." : "Find Path"}
    </button>
  </div>

  {careerPath && !careerPath.error && (
    <div className="career-result">
      {careerPath.nodes.map((node, index) => (
        <div className="path-node" key={`${node.name}-${index}`}>
          <div className="node-circle">
            {node.labels[0] === "Role" ? "R" : "S"}
          </div>

          <strong>{node.name}</strong>

          {index < careerPath.nodes.length - 1 && (
            <div className="path-arrow">→</div>
          )}
        </div>
      ))}
    </div>
  )}

  {careerPath?.error && (
    <div className="empty">
      {careerPath.error}
    </div>
  )}
</section>
<GraphView />
          {selectedRole && (
            <section className="detail-panel">
              <div className="detail-header">
                <div>
                  <p className="eyebrow">SELECTED ROLE</p>
                  <h3>{selectedRole.name}</h3>
                  <p>{selectedRole.description}</p>
                </div>
                <Code2 size={38} />
              </div>

              <div className="skills">
                {selectedRole.skills.map((skill) => (
                  <button
                    key={skill}
                    className={`skill ${
                      selectedSkill === skill ? "selected" : ""
                    }`}
                    onClick={() => exploreSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </section>
          )}

          {selectedSkill && (
            <section className="graph-panel">
              <div className="detail-header">
                <div>
                  <p className="eyebrow">GRAPH EXPLORATION</p>
                  <h3>{selectedSkill}</h3>
                  <p>
                    Connected nodes discovered through graph traversal.
                  </p>
                </div>
                <Network size={38} />
              </div>

              {graphLoading ? (
                <div className="loading">
                  <Loader2 className="spin" />
                  Exploring graph...
                </div>
              ) : connections.length === 0 ? (
                <div className="empty">
                  No connected nodes found.
                </div>
              ) : (
                <div className="connection-grid">
                  {connections.map((connection, index) => (
                    <div className="connection" key={`${connection.name}-${index}`}>
                      <div>
                        <strong>{connection.name}</strong>
                        <span>{connection.labels.join(", ")}</span>
                      </div>

                      <div className="hops">
                        {connection.hops.low} hop
                        {connection.hops.low !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;