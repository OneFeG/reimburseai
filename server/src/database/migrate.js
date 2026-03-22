import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("Missing database connection string. Set SUPABASE_DB_URL.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigrations() {
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error("Migration runner failed to connect to the database:", err);
    process.exit(1);
  }
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const { rows: appliedMigrations } = await client.query(
      "SELECT name FROM migrations",
    );
    const appliedNames = new Set(appliedMigrations.map((row) => row.name));

    const migrationsDir = path.join(__dirname, "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations folder found.");
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort(); // Ensure order (001, 002, etc.)

    for (const file of files) {
      if (!appliedNames.has(file)) {
        console.log(`Applying migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf-8");

        try {
          await client.query("BEGIN");
          await client.query(sql);
          await client.query("INSERT INTO migrations (name) VALUES ($1)", [
            file,
          ]);
          await client.query("COMMIT");
          console.log(`Successfully applied: ${file}`);
        } catch (err) {
          await client.query("ROLLBACK");
          console.error(`Error applying ${file}:`, err);
          process.exit(1);
        }
      } else {
        console.log(`Skipping applied migration: ${file}`);
      }
    }

    console.log("All migrations checked.");
  } catch (err) {
    console.error("Migration runner failed:", err);
    process.exit(1);
  } finally {
    client?.release();
    await pool.end();
  }
}

runMigrations();
