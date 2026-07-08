import pg from "pg";
import path from "path";

try {
  process.loadEnvFile(path.join(import.meta.dirname, "../../../.env"));
} catch {
  try {
    process.loadEnvFile();
  } catch {}
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const sql = `
    ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Owners can manage their own meals" ON meals;
    CREATE POLICY "Owners can manage their own meals" 
    ON meals 
    FOR ALL 
    USING (owner_id = current_setting('app.current_user_id', true)::integer)
    WITH CHECK (owner_id = current_setting('app.current_user_id', true)::integer);
    
    DROP POLICY IF EXISTS "Residents can view published meals" ON meals;
    CREATE POLICY "Residents can view published meals" 
    ON meals 
    FOR SELECT 
    USING (status = 'published');
    
    DROP POLICY IF EXISTS "NGOs can view published meals" ON meals;
    CREATE POLICY "NGOs can view published meals" 
    ON meals 
    FOR SELECT 
    USING (status = 'published');
  `;
  try {
    await pool.query(sql);
    console.log("RLS applied successfully");
  } catch (err) {
    console.error("Error applying RLS", err);
  } finally {
    await pool.end();
  }
}

run();
