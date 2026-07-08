-- Enable RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Owner policy (CRUD for their own)
-- Since the application uses custom auth (users table) and connects via a backend API, 
-- we use a custom session variable 'app.current_user_id' which the backend would set.
CREATE POLICY "Owners can manage their own meals" 
ON meals 
FOR ALL 
USING (owner_id = current_setting('app.current_user_id', true)::integer)
WITH CHECK (owner_id = current_setting('app.current_user_id', true)::integer);

-- Residents policy (read-only for published meals)
CREATE POLICY "Residents can view published meals" 
ON meals 
FOR SELECT 
USING (status = 'published');

-- NGOs policy (read-only for published meals)
CREATE POLICY "NGOs can view published meals" 
ON meals 
FOR SELECT 
USING (status = 'published');
