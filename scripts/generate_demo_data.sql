-- Demo Data for MealSync

-- 1. Weekly Schedules for residents 3 and 5
DELETE FROM weekly_schedules WHERE resident_id IN (3, 5);

INSERT INTO weekly_schedules (resident_id, weekday, lunch, dinner) VALUES
(3, 'monday', true, true),
(3, 'tuesday', true, true),
(3, 'wednesday', false, true),
(3, 'thursday', true, true),
(3, 'friday', true, false),
(3, 'saturday', false, true),
(3, 'sunday', true, true),
(5, 'monday', true, true),
(5, 'tuesday', true, true),
(5, 'wednesday', true, true),
(5, 'thursday', true, true),
(5, 'friday', true, true),
(5, 'saturday', true, true),
(5, 'sunday', true, true);

-- 2. Meals (Last 3 days + Today)
-- Today is 2026-05-04
-- Owner 1 (Manikanta PG), Owner 4 (Sunrise PG)

INSERT INTO meals (owner_id, menu, expected_people, predicted_meals, actual_served, leftover_meals, ngo_notified, status, date) VALUES
-- Today (May 4)
(1, 'Aloo Paratha & Curd', 100, 95, NULL, 15, true, 'served', '2026-05-04 12:00:00'),
(4, 'Aloo Paratha & Curd', 100, 95, NULL, 15, true, 'served', '2026-05-04 12:00:00'),
-- Yesterday (May 3) - Normal
(1, 'Dal Tadka & Rice', 100, 95, 95, 5, false, 'completed', '2026-05-03 12:00:00'),
(4, 'Dal Tadka & Rice', 100, 95, 95, 5, false, 'completed', '2026-05-03 12:00:00'),
-- Day before (May 2) - High Waste
(1, 'Paneer Butter Masala & Roti', 100, 95, 60, 40, true, 'completed', '2026-05-02 12:00:00'),
(4, 'Paneer Butter Masala & Roti', 100, 95, 60, 40, true, 'completed', '2026-05-02 12:00:00'),
-- Day before (May 1) - Normal
(1, 'Veg Biryani & Raita', 100, 95, 95, 5, false, 'completed', '2026-05-01 12:00:00'),
(4, 'Veg Biryani & Raita', 100, 95, 95, 5, false, 'completed', '2026-05-01 12:00:00');

-- 3. Meal Confirmations (Today)
INSERT INTO meal_confirmations (resident_id, will_eat, meal_date) VALUES
(3, true, '2026-05-04'),
(5, true, '2026-05-04');

-- 4. NGO Requests
-- Link to High Waste meals (May 2)
-- We need the IDs of the meals we just inserted. 
-- For simplicity in SQL, I'll use a subquery or just hope the IDs are predictable if it's a fresh DB, 
-- but better to use the meals table.
-- I'll use the date and owner_id to find them.

INSERT INTO ngo_requests (meal_id, ngo_id, pg_name, pg_location, available_meals, pickup_time, meal_menu, status, created_at)
SELECT id, 2, 'Manikanta PG', 'HSR Layout, Bangalore', 40, '21:30', menu, 'completed', '2026-05-02 21:00:00'
FROM meals WHERE date = '2026-05-02 12:00:00' AND owner_id = 1;

INSERT INTO ngo_requests (meal_id, ngo_id, pg_name, pg_location, available_meals, pickup_time, meal_menu, status, created_at)
SELECT id, 2, 'Sunrise PG', 'Electronic City, Bangalore', 40, '21:30', menu, 'completed', '2026-05-02 21:00:00'
FROM meals WHERE date = '2026-05-02 12:00:00' AND owner_id = 4;

-- Link to Today's meals (May 4) - Pending
INSERT INTO ngo_requests (meal_id, ngo_id, pg_name, pg_location, available_meals, pickup_time, meal_menu, status, created_at)
SELECT id, NULL, 'Manikanta PG', 'HSR Layout, Bangalore', 15, '22:00', menu, 'pending', '2026-05-04 18:00:00'
FROM meals WHERE date = '2026-05-04 12:00:00' AND owner_id = 1;

INSERT INTO ngo_requests (meal_id, ngo_id, pg_name, pg_location, available_meals, pickup_time, meal_menu, status, created_at)
SELECT id, NULL, 'Sunrise PG', 'Electronic City, Bangalore', 15, '22:00', menu, 'pending', '2026-05-04 18:00:00'
FROM meals WHERE date = '2026-05-04 12:00:00' AND owner_id = 4;

-- 5. Polls
INSERT INTO polls (question, options, created_by, created_at, expires_at) VALUES
('Sunday Special Request', '["Butter Chicken", "Paneer Tikka"]', 1, '2026-05-04 10:00:00', '2026-05-10 23:59:59');

-- Poll Votes
INSERT INTO poll_votes (poll_id, user_id, option, voted_at)
SELECT id, 3, 'Butter Chicken', '2026-05-04 11:00:00' FROM polls WHERE question = 'Sunday Special Request';

INSERT INTO poll_votes (poll_id, user_id, option, voted_at)
SELECT id, 5, 'Paneer Tikka', '2026-05-04 11:05:00' FROM polls WHERE question = 'Sunday Special Request';

-- 6. Feedback
INSERT INTO feedback (resident_id, rating, comment, meal_date) VALUES
(3, 5, 'Food was great today!', '2026-05-04'),
(5, 3, 'Salt was a bit high in the dal', '2026-05-04'),
(3, 4, 'Very nutritious and fresh.', '2026-05-03');
