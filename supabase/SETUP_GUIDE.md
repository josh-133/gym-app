# Supabase Setup Guide

## Step 1: Run Database Migrations

Go to your Supabase dashboard > **SQL Editor** and run these files in order:

1. **001_initial_schema.sql** - Creates all tables
2. **002_rls_policies.sql** - Sets up Row Level Security
3. **003_seed_exercises.sql** - Seeds 60+ exercises and achievements

## Step 2: Set Up Google OAuth

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add these authorized redirect URIs:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
7. Copy the **Client ID** and **Client Secret**

### 2.2 Configure Supabase

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Google** and enable it
3. Paste your **Client ID** and **Client Secret**
4. Save

### 2.3 Configure Redirect URLs

1. Go to **Authentication** > **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://your-production-domain.com/**`

## Step 3: Environment Variables

Create a `.env` file in your project root:

```bash
# Supabase (from Project Settings > API)
NUXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...

# Optional: For AI insights
ANTHROPIC_API_KEY=sk-ant-...
```

## Step 4: Verify Setup

1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Get Started" to sign up
4. Try signing up with email or Google
5. Check Supabase **Table Editor** to see your profile was created

## Troubleshooting

### "User not found" after signup
The profile trigger should auto-create profiles. Check:
- SQL Editor > run: `SELECT * FROM public.profiles;`
- If empty, the trigger may not have run

### Google OAuth not working
1. Verify redirect URIs match exactly
2. Check Supabase Auth logs for errors
3. Ensure Google provider is enabled

### RLS blocking queries
All queries should work for authenticated users. If not:
- Check you're passing the auth token
- Verify RLS policies are created
- Test with service role key to bypass RLS

## Database Schema Overview

```
profiles          - User profiles (extends auth.users)
exercises         - Exercise library (system + custom)
workout_templates - Reusable workout plans
template_exercises - Exercises in templates
workout_sessions  - Completed/in-progress workouts
exercise_logs     - Exercises performed in session
sets              - Individual sets (strength)
cardio_logs       - Cardio session data
personal_records  - PRs by exercise
achievements      - Badge definitions
user_achievements - Unlocked badges
body_measurements - Weight/composition tracking
ai_insights       - AI-generated recommendations
```
