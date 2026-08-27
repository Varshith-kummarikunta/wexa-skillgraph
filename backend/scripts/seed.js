require("dotenv").config();

const { driver } = require("../src/config/database");

const roles = [
  {
    name: "Frontend Developer",
    description: "Builds user interfaces and client-side web applications.",
  },
  {
    name: "Backend Developer",
    description: "Builds APIs, services, and server-side applications.",
  },
  {
    name: "Full Stack Developer",
    description: "Works across frontend and backend application layers.",
  },
  {
    name: "AI Engineer",
    description: "Builds applications powered by artificial intelligence and machine learning.",
  },
  {
    name: "Data Engineer",
    description: "Builds systems for collecting, processing, and transforming data.",
  },
];

const skills = [
  "JavaScript",
  "React",
  "HTML",
  "CSS",
  "Node.js",
  "Express.js",
  "Python",
  "FastAPI",
  "SQL",
  "REST APIs",
  "Git",
  "Docker",
  "Machine Learning",
  "Data Structures",
  "Algorithms",
];

const technologies = [
  "React",
  "Node.js",
  "Express",
  "FastAPI",
  "PostgreSQL",
  "Docker",
  "GitHub",
  "TensorFlow",
];

const roleSkills = {
  "Frontend Developer": [
    "JavaScript",
    "React",
    "HTML",
    "CSS",
    "Git",
    "Data Structures",
  ],
  "Backend Developer": [
    "JavaScript",
    "Node.js",
    "Express.js",
    "REST APIs",
    "SQL",
    "Git",
    "Docker",
    "Data Structures",
  ],
  "Full Stack Developer": [
    "JavaScript",
    "React",
    "Node.js",
    "Express.js",
    "REST APIs",
    "SQL",
    "Git",
    "Docker",
  ],
  "AI Engineer": [
    "Python",
    "Machine Learning",
    "Data Structures",
    "Algorithms",
    "SQL",
    "Git",
    "Docker",
  ],
  "Data Engineer": [
    "Python",
    "SQL",
    "Git",
    "Docker",
    "Data Structures",
    "Algorithms",
  ],
};

const skillRelationships = [
  ["HTML", "CSS"],
  ["JavaScript", "React"],
  ["JavaScript", "Node.js"],
  ["Node.js", "Express.js"],
  ["Python", "FastAPI"],
  ["Python", "Machine Learning"],
  ["SQL", "Data Structures"],
  ["Data Structures", "Algorithms"],
  ["Docker", "Git"],
];

const skillTechnologies = [
  ["React", "React"],
  ["Node.js", "Node.js"],
  ["Express.js", "Express"],
  ["FastAPI", "FastAPI"],
  ["SQL", "PostgreSQL"],
  ["Docker", "Docker"],
  ["Git", "GitHub"],
  ["Machine Learning", "TensorFlow"],
];

async function seedDatabase() {
  const session = driver.session();

  try {
    console.log("🌱 Starting database seed...");

    await session.run(`
      MATCH (n)
      DETACH DELETE n
    `);

    console.log("🧹 Existing graph cleared.");

    for (const role of roles) {
      await session.run(
        `
        CREATE (:Role {
          name: $name,
          description: $description
        })
        `,
        role
      );
    }

    for (const skill of skills) {
      await session.run(
        `
        CREATE (:Skill {name: $name})
        `,
        { name: skill }
      );
    }

    for (const technology of technologies) {
      await session.run(
        `
        CREATE (:Technology {name: $name})
        `,
        { name: technology }
      );
    }

    for (const [roleName, roleSkillList] of Object.entries(roleSkills)) {
      for (const skillName of roleSkillList) {
        await session.run(
          `
          MATCH (r:Role {name: $roleName})
          MATCH (s:Skill {name: $skillName})
          CREATE (r)-[:REQUIRES]->(s)
          `,
          { roleName, skillName }
        );
      }
    }

    for (const [skillA, skillB] of skillRelationships) {
      await session.run(
        `
        MATCH (a:Skill {name: $skillA})
        MATCH (b:Skill {name: $skillB})
        CREATE (a)-[:RELATED_TO]->(b)
        `,
        { skillA, skillB }
      );
    }

    for (const [skillName, technologyName] of skillTechnologies) {
      await session.run(
        `
        MATCH (s:Skill {name: $skillName})
        MATCH (t:Technology {name: $technologyName})
        CREATE (s)-[:USED_WITH]->(t)
        `,
        { skillName, technologyName }
      );
    }

    console.log("✅ Graph seeded successfully.");

    const result = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] AS type, count(n) AS count
      ORDER BY type
    `);

    console.log("\n📊 Nodes created:");

    for (const record of result.records) {
      console.log(
        `${record.get("type")}: ${record.get("count").toString()}`
      );
    }
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();