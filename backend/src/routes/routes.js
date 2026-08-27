const express = require("express");
const { driver } = require("../config/database");

const router = express.Router();

router.get("/roles", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (r:Role)
      OPTIONAL MATCH (r)-[:REQUIRES]->(s:Skill)
      RETURN r.name AS name,
             r.description AS description,
             collect(s.name) AS skills
      ORDER BY r.name
    `);

    res.json(
      result.records.map((record) => ({
        name: record.get("name"),
        description: record.get("description"),
        skills: record.get("skills"),
      })),
    );
  } catch (error) {
    res.status(503).json({
      error: "Unable to connect to the graph database.",
    });
  } finally {
    await session.close();
  }
});

router.get("/skills", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (s:Skill)
      OPTIONAL MATCH (s)-[:USED_WITH]->(t:Technology)
      RETURN s.name AS name,
             collect(t.name) AS technologies
      ORDER BY s.name
    `);

    res.json(
      result.records.map((record) => ({
        name: record.get("name"),
        technologies: record.get("technologies"),
      })),
    );
  } catch (error) {
    res.status(503).json({
      error: "Unable to connect to the graph database.",
    });
  } finally {
    await session.close();
  }
});

router.get("/roles/:roleName", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (r:Role {name: $roleName})
      OPTIONAL MATCH (r)-[:REQUIRES]->(s:Skill)
      RETURN r.name AS name,
             r.description AS description,
             collect(s.name) AS skills
      `,
      { roleName: req.params.roleName },
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        error: "Role not found",
      });
    }

    const record = result.records[0];

    res.json({
      name: record.get("name"),
      description: record.get("description"),
      skills: record.get("skills"),
    });
  } catch (error) {
    res.status(503).json({
      error: "Unable to connect to the graph database.",
    });
  } finally {
    await session.close();
  }
});

router.get("/graph/explore/:skillName", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (s:Skill {name: $skillName})
      OPTIONAL MATCH path = (s)-[:RELATED_TO|USED_WITH*1..2]->(connected)
      RETURN s.name AS skill,
             collect(DISTINCT {
               name: connected.name,
               labels: labels(connected),
               hops: length(path)
             }) AS connections
      `,
      { skillName: req.params.skillName },
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        error: "Skill not found",
      });
    }

    const record = result.records[0];

    res.json({
      skill: record.get("skill"),
      connections: record.get("connections"),
    });
  } catch (error) {
    res.status(503).json({
      error: "Unable to connect to the graph database.",
    });
  } finally {
    await session.close();
  }
});


router.get("/career-path", async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      error: "Both 'from' and 'to' role names are required.",
    });
  }

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (start:Role {name: $from})
      MATCH (target:Role {name: $to})

      MATCH (start)-[r1:REQUIRES]->(shared:Skill)<-[r2:REQUIRES]-(target)

      RETURN
        start.name AS fromRole,
        shared.name AS sharedSkill,
        target.name AS toRole,
        type(r1) AS firstRelationship,
        type(r2) AS secondRelationship
      LIMIT 1
      `,
      { from, to }
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        error: "No career connection found between these roles.",
      });
    }

    const record = result.records[0];

    res.json({
      from: record.get("fromRole"),
      to: record.get("toRole"),

      nodes: [
        {
          name: record.get("fromRole"),
          labels: ["Role"],
        },
        {
          name: record.get("sharedSkill"),
          labels: ["Skill"],
        },
        {
          name: record.get("toRole"),
          labels: ["Role"],
        },
      ],

      relationships: [
        {
          type: record.get("firstRelationship"),
          from: record.get("fromRole"),
          to: record.get("sharedSkill"),
        },
        {
          type: record.get("secondRelationship"),
          from: record.get("toRole"),
          to: record.get("sharedSkill"),
        },
      ],
    });
  } catch (error) {
    console.error("Career path error:", error.message);

    res.status(503).json({
      error: "Unable to query the graph database.",
    });
  } finally {
    await session.close();
  }
});

router.get("/graph", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN
        collect(DISTINCT {
          id: elementId(n),
          name: n.name,
          labels: labels(n)
        }) AS nodes,
        collect(DISTINCT CASE
          WHEN r IS NOT NULL THEN {
            source: elementId(startNode(r)),
            target: elementId(endNode(r)),
            type: type(r)
          }
        END) AS relationships
    `);

    const record = result.records[0];

    res.json({
      nodes: record.get("nodes"),
      links: record
        .get("relationships")
        .filter(Boolean),
    });
  } catch (error) {
    console.error("Graph query error:", error.message);

    res.status(503).json({
      error: "Unable to load graph data.",
    });
  } finally {
    await session.close();
  }
});

module.exports = router;
