const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(
    process.env.COGNODB_USERNAME,
    process.env.COGNODB_PASSWORD
  )
);

async function testConnection() {
  const session = driver.session();

  try {
    const result = await session.run("RETURN 1 AS result");
    console.log("✅ CognoDB connected:", result.records[0].get("result"));
  } finally {
    await session.close();
  }
}

module.exports = { driver, testConnection };