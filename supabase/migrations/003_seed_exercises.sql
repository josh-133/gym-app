-- ============================================
-- SEED DATA: EXERCISES & ACHIEVEMENTS
-- ============================================
-- Run this AFTER 002_rls_policies.sql
-- ============================================

-- ============================================
-- CHEST EXERCISES
-- ============================================

INSERT INTO public.exercises (name, description, category, muscle_groups, equipment, difficulty, is_compound, is_system, instructions) VALUES
('Barbell Bench Press', 'The king of chest exercises. Lie on a flat bench and press the barbell from chest to lockout.', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell', 'bench'], 'intermediate', true, true, ARRAY['Lie flat on bench with feet on floor', 'Grip barbell slightly wider than shoulder width', 'Lower bar to mid-chest with control', 'Press up to lockout without bouncing']),

('Incline Barbell Press', 'Upper chest focused pressing movement on an inclined bench.', 'strength', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['barbell', 'bench'], 'intermediate', true, true, ARRAY['Set bench to 30-45 degree incline', 'Grip barbell slightly wider than shoulders', 'Lower to upper chest', 'Press to lockout']),

('Decline Barbell Press', 'Lower chest focused pressing movement on a declined bench.', 'strength', ARRAY['chest', 'triceps'], ARRAY['barbell', 'bench'], 'intermediate', true, true, ARRAY['Set bench to 15-30 degree decline', 'Secure feet under pads', 'Lower bar to lower chest', 'Press to lockout']),

('Dumbbell Bench Press', 'Chest press with dumbbells allowing greater range of motion.', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['dumbbell', 'bench'], 'beginner', true, true, ARRAY['Lie flat on bench holding dumbbells', 'Press dumbbells up and together', 'Lower with control to chest level', 'Keep wrists neutral throughout']),

('Incline Dumbbell Press', 'Upper chest development with dumbbells on an incline.', 'strength', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['dumbbell', 'bench'], 'beginner', true, true, ARRAY['Set bench to 30-45 degrees', 'Press dumbbells up and slightly together', 'Lower to outer chest', 'Maintain control throughout']),

('Dumbbell Fly', 'Isolation movement for chest with a deep stretch.', 'strength', ARRAY['chest'], ARRAY['dumbbell', 'bench'], 'beginner', false, true, ARRAY['Lie flat holding dumbbells above chest', 'Lower with slight bend in elbows', 'Feel stretch in chest at bottom', 'Squeeze chest to bring weights together']),

('Cable Crossover', 'Cable fly variation for constant tension on chest.', 'strength', ARRAY['chest'], ARRAY['cable'], 'beginner', false, true, ARRAY['Stand between cable stations', 'Set pulleys to high position', 'Bring hands together in front of chest', 'Control the return movement']),

('Push-Up', 'Classic bodyweight chest and tricep exercise.', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['bodyweight'], 'beginner', true, true, ARRAY['Start in plank position', 'Lower chest to floor', 'Push back up to start', 'Keep core tight throughout']),

('Chest Dip', 'Bodyweight pressing movement emphasizing lower chest.', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['dip_bars'], 'intermediate', true, true, ARRAY['Grip parallel bars and lean forward', 'Lower until upper arms are parallel', 'Push back up with control', 'Keep elbows slightly flared']),

('Machine Chest Press', 'Beginner-friendly pressing movement on a machine.', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['machine'], 'beginner', true, true, ARRAY['Adjust seat height appropriately', 'Grip handles at chest level', 'Press forward to extension', 'Control the return']),

-- ============================================
-- BACK EXERCISES
-- ============================================

('Conventional Deadlift', 'The ultimate full-body strength builder. Lift the barbell from floor to lockout.', 'strength', ARRAY['back', 'glutes', 'hamstrings', 'traps'], ARRAY['barbell'], 'advanced', true, true, ARRAY['Stand with feet hip-width apart', 'Grip bar just outside legs', 'Keep back flat and chest up', 'Drive through heels to stand', 'Lock out hips at top']),

('Sumo Deadlift', 'Wide stance deadlift variation emphasizing legs and hips.', 'strength', ARRAY['glutes', 'quads', 'back', 'hamstrings'], ARRAY['barbell'], 'advanced', true, true, ARRAY['Take wide stance with toes pointed out', 'Grip bar inside legs', 'Push knees out over toes', 'Drive up keeping chest tall']),

('Barbell Row', 'Fundamental horizontal pulling movement for back thickness.', 'strength', ARRAY['back', 'biceps', 'rear_delts'], ARRAY['barbell'], 'intermediate', true, true, ARRAY['Hinge forward at hips', 'Let bar hang at arms length', 'Pull bar to lower chest/upper abs', 'Squeeze shoulder blades together']),

('Pendlay Row', 'Strict rowing variation from a dead stop on floor.', 'strength', ARRAY['back', 'biceps'], ARRAY['barbell'], 'intermediate', true, true, ARRAY['Set up like deadlift position', 'Keep torso parallel to floor', 'Explosively row bar to chest', 'Return bar to floor each rep']),

('Dumbbell Row', 'Single arm rowing for balanced back development.', 'strength', ARRAY['lats', 'biceps', 'rear_delts'], ARRAY['dumbbell', 'bench'], 'beginner', true, true, ARRAY['Support one hand and knee on bench', 'Let dumbbell hang straight down', 'Row to hip keeping elbow close', 'Lower with control']),

('Pull-Up', 'Classic bodyweight vertical pulling movement.', 'strength', ARRAY['lats', 'biceps', 'rear_delts'], ARRAY['pull_up_bar'], 'intermediate', true, true, ARRAY['Grip bar slightly wider than shoulders', 'Pull chest toward bar', 'Lower with control', 'Avoid excessive swinging']),

('Chin-Up', 'Underhand grip pull-up emphasizing biceps.', 'strength', ARRAY['lats', 'biceps'], ARRAY['pull_up_bar'], 'intermediate', true, true, ARRAY['Grip bar with palms facing you', 'Pull chest toward bar', 'Lower with control', 'Keep core engaged']),

('Lat Pulldown', 'Machine alternative to pull-ups for lat development.', 'strength', ARRAY['lats', 'biceps'], ARRAY['cable'], 'beginner', true, true, ARRAY['Grip bar wider than shoulders', 'Pull bar to upper chest', 'Squeeze lats at bottom', 'Control the return']),

('Seated Cable Row', 'Horizontal pulling on cable machine.', 'strength', ARRAY['back', 'biceps', 'rear_delts'], ARRAY['cable'], 'beginner', true, true, ARRAY['Sit upright with slight knee bend', 'Pull handle to lower chest', 'Squeeze shoulder blades together', 'Extend arms with control']),

('T-Bar Row', 'Rowing variation using landmine or T-bar machine.', 'strength', ARRAY['back', 'biceps'], ARRAY['barbell'], 'intermediate', true, true, ARRAY['Straddle the bar', 'Row to chest keeping back flat', 'Squeeze at top', 'Lower with control']),

('Face Pull', 'Rear delt and upper back exercise for shoulder health.', 'strength', ARRAY['rear_delts', 'traps', 'rotator_cuff'], ARRAY['cable'], 'beginner', false, true, ARRAY['Set cable to face height', 'Pull rope to face', 'Externally rotate at end', 'Control the return']),

-- ============================================
-- SHOULDER EXERCISES
-- ============================================

('Overhead Press', 'Fundamental pressing movement for shoulder strength.', 'strength', ARRAY['shoulders', 'triceps', 'traps'], ARRAY['barbell'], 'intermediate', true, true, ARRAY['Grip bar just outside shoulders', 'Press bar overhead', 'Lock out at top', 'Lower to front of shoulders']),

('Seated Dumbbell Press', 'Dumbbell shoulder press with back support.', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['dumbbell', 'bench'], 'beginner', true, true, ARRAY['Sit with dumbbells at shoulder height', 'Press overhead', 'Touch dumbbells at top', 'Lower with control']),

('Arnold Press', 'Rotating dumbbell press for complete shoulder development.', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['dumbbell'], 'intermediate', true, true, ARRAY['Start with palms facing you', 'Rotate palms outward while pressing', 'Press to overhead lockout', 'Reverse the motion down']),

('Lateral Raise', 'Isolation movement for side deltoids.', 'strength', ARRAY['shoulders'], ARRAY['dumbbell'], 'beginner', false, true, ARRAY['Hold dumbbells at sides', 'Raise arms to shoulder height', 'Lead with elbows', 'Lower with control']),

('Front Raise', 'Isolation movement for front deltoids.', 'strength', ARRAY['shoulders'], ARRAY['dumbbell'], 'beginner', false, true, ARRAY['Hold dumbbells in front of thighs', 'Raise one or both arms forward', 'Stop at shoulder height', 'Lower with control']),

('Reverse Fly', 'Rear deltoid isolation movement.', 'strength', ARRAY['rear_delts', 'traps'], ARRAY['dumbbell'], 'beginner', false, true, ARRAY['Bend forward at hips', 'Raise arms out to sides', 'Squeeze shoulder blades', 'Lower with control']),

('Upright Row', 'Shoulder and trap builder with barbell or dumbbells.', 'strength', ARRAY['shoulders', 'traps'], ARRAY['barbell'], 'intermediate', true, true, ARRAY['Grip bar narrower than shoulders', 'Pull bar up along body', 'Lead with elbows', 'Lower with control']),

('Shrugs', 'Trapezius isolation exercise.', 'strength', ARRAY['traps'], ARRAY['barbell', 'dumbbell'], 'beginner', false, true, ARRAY['Hold weights at sides', 'Shrug shoulders toward ears', 'Hold briefly at top', 'Lower with control']),

-- ============================================
-- ARM EXERCISES
-- ============================================

('Barbell Curl', 'Classic bicep builder with barbell.', 'strength', ARRAY['biceps'], ARRAY['barbell'], 'beginner', false, true, ARRAY['Grip bar at shoulder width', 'Curl bar toward shoulders', 'Keep elbows stationary', 'Lower with control']),

('Dumbbell Curl', 'Bicep curls with dumbbells for unilateral development.', 'strength', ARRAY['biceps'], ARRAY['dumbbell'], 'beginner', false, true, ARRAY['Hold dumbbells at sides', 'Curl weights toward shoulders', 'Supinate wrists at top', 'Lower with control']),

('Hammer Curl', 'Neutral grip curl targeting brachialis.', 'strength', ARRAY['biceps', 'forearms'], ARRAY['dumbbell'], 'beginner', false, true, ARRAY['Hold dumbbells with palms facing in', 'Curl weights toward shoulders', 'Keep palms facing throughout', 'Lower with control']),

('Preacher Curl', 'Bicep curl with arm support for strict form.', 'strength', ARRAY['biceps'], ARRAY['barbell', 'dumbbell'], 'beginner', false, true, ARRAY['Rest arms on preacher pad', 'Curl weight toward shoulders', 'Dont let arms fully extend', 'Control the negative']),

('Concentration Curl', 'Isolation curl for peak bicep contraction.', 'strength', ARRAY['biceps'], ARRAY['dumbbell'], 'beginner', false, true, ARRAY['Sit and brace elbow against inner thigh', 'Curl dumbbell toward shoulder', 'Squeeze at top', 'Lower slowly']),

('Close Grip Bench Press', 'Tricep-focused pressing movement.', 'strength', ARRAY['triceps', 'chest', 'shoulders'], ARRAY['barbell', 'bench'], 'intermediate', true, true, ARRAY['Grip bar at shoulder width or narrower', 'Lower bar to lower chest', 'Keep elbows close to body', 'Press to lockout']),

('Skull Crusher', 'Lying tricep extension with barbell or EZ bar.', 'strength', ARRAY['triceps'], ARRAY['barbell', 'bench'], 'intermediate', false, true, ARRAY['Lie on bench holding bar overhead', 'Lower bar to forehead', 'Keep upper arms vertical', 'Extend back to start']),

('Tricep Pushdown', 'Cable tricep extension.', 'strength', ARRAY['triceps'], ARRAY['cable'], 'beginner', false, true, ARRAY['Grip bar or rope at chest height', 'Push down to full extension', 'Keep elbows at sides', 'Control the return']),

('Overhead Tricep Extension', 'Tricep isolation with dumbbell or cable.', 'strength', ARRAY['triceps'], ARRAY['dumbbell', 'cable'], 'beginner', false, true, ARRAY['Hold weight overhead', 'Lower behind head', 'Keep upper arms vertical', 'Extend back to start']),

('Dips', 'Bodyweight tricep and chest exercise.', 'strength', ARRAY['triceps', 'chest', 'shoulders'], ARRAY['dip_bars'], 'intermediate', true, true, ARRAY['Grip parallel bars', 'Lower until arms at 90 degrees', 'Keep body upright for triceps', 'Push back to lockout']),

-- ============================================
-- LEG EXERCISES
-- ============================================

('Back Squat', 'The king of leg exercises. Barbell squat with weight on upper back.', 'strength', ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['barbell'], 'intermediate', true, true, ARRAY['Bar on upper traps', 'Feet shoulder width apart', 'Squat to parallel or below', 'Drive up through heels']),

('Front Squat', 'Quad-dominant squat with barbell in front rack position.', 'strength', ARRAY['quads', 'glutes', 'core'], ARRAY['barbell'], 'advanced', true, true, ARRAY['Bar on front delts with clean grip', 'Keep elbows high', 'Squat deep with upright torso', 'Drive up through heels']),

('Goblet Squat', 'Beginner-friendly squat holding dumbbell or kettlebell.', 'strength', ARRAY['quads', 'glutes'], ARRAY['dumbbell', 'kettlebell'], 'beginner', true, true, ARRAY['Hold weight at chest', 'Squat between legs', 'Keep chest up', 'Drive through heels']),

('Leg Press', 'Machine-based quad and glute exercise.', 'strength', ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['machine'], 'beginner', true, true, ARRAY['Sit in machine with back flat', 'Place feet shoulder width on platform', 'Lower with control', 'Press through heels']),

('Hack Squat', 'Machine squat variation for quad development.', 'strength', ARRAY['quads', 'glutes'], ARRAY['machine'], 'beginner', true, true, ARRAY['Position shoulders under pads', 'Squat to parallel or below', 'Keep knees in line with toes', 'Drive up through heels']),

('Romanian Deadlift', 'Hip hinge movement for hamstrings and glutes.', 'strength', ARRAY['hamstrings', 'glutes', 'lower_back'], ARRAY['barbell', 'dumbbell'], 'intermediate', true, true, ARRAY['Hold bar at hips', 'Push hips back with slight knee bend', 'Lower until hamstring stretch', 'Drive hips forward to stand']),

('Leg Curl', 'Hamstring isolation exercise.', 'strength', ARRAY['hamstrings'], ARRAY['machine'], 'beginner', false, true, ARRAY['Lie face down or sit in machine', 'Curl heels toward glutes', 'Squeeze at top', 'Lower with control']),

('Leg Extension', 'Quad isolation exercise.', 'strength', ARRAY['quads'], ARRAY['machine'], 'beginner', false, true, ARRAY['Sit in machine with knees at edge', 'Extend legs fully', 'Squeeze at top', 'Lower with control']),

('Walking Lunge', 'Unilateral leg exercise for balance and strength.', 'strength', ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['bodyweight', 'dumbbell'], 'beginner', true, true, ARRAY['Step forward into lunge', 'Lower until back knee nearly touches', 'Drive through front heel', 'Alternate legs']),

('Bulgarian Split Squat', 'Single leg squat with rear foot elevated.', 'strength', ARRAY['quads', 'glutes'], ARRAY['dumbbell', 'bench'], 'intermediate', true, true, ARRAY['Rear foot on bench behind you', 'Lower into deep lunge', 'Keep front knee over ankle', 'Drive through front heel']),

('Calf Raise', 'Calf isolation exercise.', 'strength', ARRAY['calves'], ARRAY['machine', 'dumbbell'], 'beginner', false, true, ARRAY['Stand on edge of platform', 'Lower heels below platform level', 'Rise up onto toes', 'Squeeze at top']),

('Hip Thrust', 'Glute-focused hip extension exercise.', 'strength', ARRAY['glutes', 'hamstrings'], ARRAY['barbell', 'bench'], 'intermediate', true, true, ARRAY['Upper back on bench', 'Bar across hips', 'Drive hips up to lockout', 'Squeeze glutes at top']),

-- ============================================
-- CORE EXERCISES
-- ============================================

('Plank', 'Isometric core stabilization exercise.', 'strength', ARRAY['abs', 'obliques', 'lower_back'], ARRAY['bodyweight', 'mat'], 'beginner', false, true, ARRAY['Forearms on floor', 'Body in straight line', 'Engage core', 'Hold position']),

('Hanging Leg Raise', 'Advanced ab exercise hanging from bar.', 'strength', ARRAY['abs', 'hip_flexors'], ARRAY['pull_up_bar'], 'intermediate', false, true, ARRAY['Hang from bar', 'Raise legs to horizontal', 'Control the lowering', 'Minimize swinging']),

('Cable Crunch', 'Weighted ab crunch using cable machine.', 'strength', ARRAY['abs'], ARRAY['cable'], 'beginner', false, true, ARRAY['Kneel facing cable', 'Hold rope behind head', 'Crunch down toward floor', 'Control the return']),

('Russian Twist', 'Rotational core exercise for obliques.', 'strength', ARRAY['obliques', 'abs'], ARRAY['bodyweight', 'medicine_ball'], 'beginner', false, true, ARRAY['Sit with knees bent', 'Lean back slightly', 'Rotate side to side', 'Keep core engaged']),

('Ab Wheel Rollout', 'Advanced core exercise using ab wheel.', 'strength', ARRAY['abs', 'obliques', 'shoulders'], ARRAY['bodyweight'], 'advanced', false, true, ARRAY['Start on knees holding wheel', 'Roll forward with straight arms', 'Go as far as you can control', 'Roll back to start']),

-- ============================================
-- CARDIO EXERCISES
-- ============================================

('Running (Treadmill)', 'Indoor running on treadmill.', 'cardio', ARRAY['quads', 'hamstrings', 'calves', 'glutes'], ARRAY['treadmill'], 'beginner', false, true, ARRAY['Set desired speed', 'Maintain good posture', 'Land midfoot', 'Keep consistent pace']),

('Running (Outdoor)', 'Outdoor running or jogging.', 'cardio', ARRAY['quads', 'hamstrings', 'calves', 'glutes'], ARRAY['bodyweight'], 'beginner', false, true, ARRAY['Warm up with light jog', 'Maintain steady pace', 'Stay hydrated', 'Cool down after']),

('Cycling (Stationary)', 'Indoor cycling on stationary bike.', 'cardio', ARRAY['quads', 'hamstrings', 'calves'], ARRAY['bike'], 'beginner', false, true, ARRAY['Adjust seat height', 'Set resistance level', 'Maintain steady cadence', 'Keep core engaged']),

('Rowing Machine', 'Full body cardio on rowing ergometer.', 'cardio', ARRAY['back', 'legs', 'core', 'arms'], ARRAY['rower'], 'beginner', false, true, ARRAY['Push with legs first', 'Pull handle to chest', 'Return with control', 'Maintain rhythm']),

('Elliptical', 'Low impact cardio on elliptical machine.', 'cardio', ARRAY['quads', 'hamstrings', 'glutes'], ARRAY['elliptical'], 'beginner', false, true, ARRAY['Stand upright', 'Push and pull with arms', 'Maintain steady pace', 'Adjust resistance as needed']),

('Stair Climber', 'Cardio machine simulating stair climbing.', 'cardio', ARRAY['quads', 'glutes', 'calves'], ARRAY['machine'], 'beginner', false, true, ARRAY['Hold rails lightly', 'Take full steps', 'Maintain upright posture', 'Control your pace']),

('Jump Rope', 'High intensity cardio with jump rope.', 'cardio', ARRAY['calves', 'shoulders', 'core'], ARRAY['jump_rope'], 'beginner', false, true, ARRAY['Jump on balls of feet', 'Keep jumps low', 'Rotate rope with wrists', 'Land softly']),

('Battle Ropes', 'High intensity conditioning with heavy ropes.', 'cardio', ARRAY['shoulders', 'core', 'arms'], ARRAY['resistance_band'], 'intermediate', false, true, ARRAY['Grip rope ends firmly', 'Create waves with alternating arms', 'Keep core braced', 'Maintain intensity']),

('Box Jumps', 'Plyometric exercise jumping onto box.', 'cardio', ARRAY['quads', 'glutes', 'calves'], ARRAY['bodyweight'], 'intermediate', true, true, ARRAY['Stand facing box', 'Jump and land softly on box', 'Stand fully at top', 'Step down and repeat']),

('Burpees', 'Full body conditioning exercise.', 'cardio', ARRAY['chest', 'quads', 'core', 'shoulders'], ARRAY['bodyweight'], 'intermediate', true, true, ARRAY['Drop to push-up position', 'Perform push-up', 'Jump feet to hands', 'Jump up with arms overhead']);

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================

INSERT INTO public.achievements (name, description, icon, category, criteria, points) VALUES
-- Consistency achievements
('First Workout', 'Complete your first workout', 'trophy', 'milestone', '{"workouts": 1}', 10),
('Week Warrior', 'Complete 5 workouts in a week', 'fire', 'consistency', '{"weekly_workouts": 5}', 25),
('Monthly Master', 'Complete 20 workouts in a month', 'calendar', 'consistency', '{"monthly_workouts": 20}', 50),
('Streak Starter', 'Maintain a 7-day workout streak', 'zap', 'consistency', '{"streak": 7}', 30),
('Streak Master', 'Maintain a 30-day workout streak', 'flame', 'consistency', '{"streak": 30}', 100),
('Century Club', 'Complete 100 workouts', 'award', 'milestone', '{"total_workouts": 100}', 100),
('Iron Dedication', 'Complete 365 workouts', 'medal', 'milestone', '{"total_workouts": 365}', 500),

-- Strength achievements
('First PR', 'Set your first personal record', 'star', 'strength', '{"prs": 1}', 15),
('PR Hunter', 'Set 10 personal records', 'target', 'strength', '{"prs": 10}', 50),
('PR Machine', 'Set 50 personal records', 'zap', 'strength', '{"prs": 50}', 150),
('100kg Bench', 'Bench press 100kg (220lbs)', 'dumbbell', 'strength', '{"exercise": "bench_press", "weight": 100}', 100),
('140kg Squat', 'Squat 140kg (308lbs)', 'dumbbell', 'strength', '{"exercise": "squat", "weight": 140}', 100),
('180kg Deadlift', 'Deadlift 180kg (396lbs)', 'dumbbell', 'strength', '{"exercise": "deadlift", "weight": 180}', 100),
('1000lb Club', 'Total 1000lbs across squat, bench, deadlift', 'crown', 'strength', '{"powerlifting_total": 453.6}', 250),

-- Volume achievements
('Volume Rookie', 'Lift 10,000kg total volume', 'trending-up', 'endurance', '{"total_volume": 10000}', 25),
('Volume Pro', 'Lift 100,000kg total volume', 'trending-up', 'endurance', '{"total_volume": 100000}', 75),
('Volume Legend', 'Lift 1,000,000kg total volume', 'trending-up', 'endurance', '{"total_volume": 1000000}', 200),

-- Cardio achievements
('First Mile', 'Run your first mile', 'activity', 'endurance', '{"distance_km": 1.6}', 15),
('5K Complete', 'Complete a 5K run', 'map-pin', 'endurance', '{"distance_km": 5}', 30),
('10K Complete', 'Complete a 10K run', 'map-pin', 'endurance', '{"distance_km": 10}', 50),
('Half Marathon', 'Complete a half marathon distance', 'award', 'endurance', '{"distance_km": 21.1}', 100),
('Marathon', 'Complete a marathon distance', 'crown', 'endurance', '{"distance_km": 42.2}', 250),

-- Variety achievements
('Exercise Explorer', 'Try 20 different exercises', 'compass', 'milestone', '{"unique_exercises": 20}', 40),
('Exercise Master', 'Try 50 different exercises', 'compass', 'milestone', '{"unique_exercises": 50}', 100),
('Full Body', 'Train all major muscle groups in one week', 'user', 'milestone', '{"muscle_groups_weekly": 6}', 35);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Seeded % exercises and % achievements!',
    (SELECT COUNT(*) FROM public.exercises),
    (SELECT COUNT(*) FROM public.achievements);
END $$;
