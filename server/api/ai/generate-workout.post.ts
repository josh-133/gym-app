import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '~/server/utils/auth'
import { getSubscriptionStatus, requirePremium } from '~/server/utils/subscription'
import {
  EXERCISE_LIBRARY,
  getExercisesForEquipment,
  getExercisesForMuscleGroups,
  WORKOUT_TYPE_MUSCLES,
  type MuscleGroup,
  type Equipment,
  type ExerciseDefinition,
} from '~/utils/exercises'

interface GenerateWorkoutRequest {
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'custom'
  customMuscleGroups?: MuscleGroup[]
  duration: 30 | 45 | 60 | 75 | 90
  equipment: Equipment[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'general'
  recentWorkouts?: { name: string; exercises: string[] }[]
}

interface GeneratedExercise {
  exerciseId: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  intensity?: string
}

interface GeneratedWorkout {
  name: string
  estimatedDuration: number
  targetMuscleGroups: MuscleGroup[]
  warmup: GeneratedExercise[]
  mainWorkout: GeneratedExercise[]
  cooldown?: GeneratedExercise[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Authenticate and check premium subscription
  const user = await getAuthenticatedUser(event)
  const subscription = await getSubscriptionStatus(event, user.id)
  requirePremium(subscription)

  if (!config.anthropicApiKey) {
    throw createError({
      statusCode: 500,
      message: 'Anthropic API key not configured',
    })
  }

  const body = await readBody<GenerateWorkoutRequest>(event)

  // Validate request
  if (!body.workoutType || !body.duration || !body.equipment || !body.experienceLevel || !body.goal) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  // Get target muscle groups based on workout type
  const targetMuscles: MuscleGroup[] = body.workoutType === 'custom' && body.customMuscleGroups
    ? body.customMuscleGroups
    : WORKOUT_TYPE_MUSCLES[body.workoutType] || []

  // Filter exercises based on equipment and target muscles
  const availableExercises = getExercisesForEquipment(body.equipment)
    .filter(ex => ex.muscleGroups.some(mg => targetMuscles.includes(mg)))
    .filter(ex => {
      // Filter by difficulty based on experience level
      if (body.experienceLevel === 'beginner') {
        return ex.difficulty === 'beginner'
      }
      if (body.experienceLevel === 'intermediate') {
        return ex.difficulty !== 'advanced'
      }
      return true // Advanced users can do all exercises
    })

  if (availableExercises.length < 3) {
    throw createError({
      statusCode: 400,
      message: 'Not enough exercises available for the selected options. Try selecting more equipment.',
    })
  }

  const client = new Anthropic({
    apiKey: config.anthropicApiKey,
  })

  // Build exercise library for prompt
  const exerciseLibraryJson = JSON.stringify(
    availableExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscleGroups: ex.muscleGroups,
      isCompound: ex.isCompound,
    })),
    null,
    2
  )

  // Build recent workouts summary
  const recentWorkoutsSummary = body.recentWorkouts && body.recentWorkouts.length > 0
    ? body.recentWorkouts.map(w => `- ${w.name}: ${w.exercises.join(', ')}`).join('\n')
    : 'No recent workouts provided'

  // Set/rep guidance based on goal
  const goalGuidance = {
    strength: '3-5 sets of 3-6 reps, 3-5 minutes rest between sets. Focus on compound movements.',
    hypertrophy: '3-4 sets of 8-12 reps, 60-90 seconds rest between sets. Mix compound and isolation.',
    endurance: '2-3 sets of 15-20 reps, 30-60 seconds rest between sets. Higher volume, lower weight.',
    general: '3 sets of 8-12 reps, 60-90 seconds rest. Balanced approach.',
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are an expert personal trainer creating a workout plan. Generate a structured workout based on the following:

USER PREFERENCES:
- Workout Type: ${body.workoutType}
- Target Muscles: ${targetMuscles.join(', ')}
- Duration: ${body.duration} minutes
- Available Equipment: ${body.equipment.join(', ')}
- Experience Level: ${body.experienceLevel}
- Goal: ${body.goal}

PROGRAMMING GUIDANCE FOR ${body.goal.toUpperCase()}:
${goalGuidance[body.goal]}

RECENT WORKOUTS (vary exercises from these):
${recentWorkoutsSummary}

AVAILABLE EXERCISES (ONLY use exercises from this list):
${exerciseLibraryJson}

REQUIREMENTS:
1. ONLY use exercises from the provided library - use the exact "id" and "name" values
2. For a ${body.duration} minute workout:
   - ${body.duration <= 30 ? '2 warmup, 4-5 main exercises' : ''}
   - ${body.duration === 45 ? '2-3 warmup, 5-6 main exercises' : ''}
   - ${body.duration === 60 ? '3 warmup, 6-7 main exercises' : ''}
   - ${body.duration >= 75 ? '3 warmup, 7-8 main exercises' : ''}
3. Start with compound movements, finish with isolation
4. Include appropriate warmup exercises
5. Vary exercises from recent workouts when possible
6. Provide intensity as RPE (Rate of Perceived Exertion) 1-10 or % of 1RM

Generate a creative but appropriate workout name based on the type and goal.

Respond ONLY with valid JSON matching this exact structure:
{
  "name": "string - creative workout name",
  "estimatedDuration": number,
  "targetMuscleGroups": ["array of muscle groups"],
  "warmup": [
    {
      "exerciseId": "from library",
      "name": "from library",
      "sets": number,
      "reps": "string like '10-12' or '30 sec'",
      "restSeconds": number,
      "notes": "optional form cues",
      "intensity": "optional like 'RPE 5' or 'Light'"
    }
  ],
  "mainWorkout": [same structure as warmup]
}`,
        },
      ],
    })

    // Extract text content
    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse JSON response
    let workout: GeneratedWorkout
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      workout = JSON.parse(jsonMatch[0])
    } catch {
      console.error('Failed to parse workout JSON:', textContent.text)
      throw new Error('Invalid workout format from AI')
    }

    // Validate that exercises exist in library
    const exerciseIds = new Set(EXERCISE_LIBRARY.map(e => e.id))
    const allExercises = [...(workout.warmup || []), ...(workout.mainWorkout || [])]

    for (const ex of allExercises) {
      if (!exerciseIds.has(ex.exerciseId)) {
        console.warn(`Exercise not in library: ${ex.exerciseId} (${ex.name})`)
        // Don't fail, just log - the AI might have minor variations
      }
    }

    return { workout }
  } catch (error) {
    console.error('Error generating workout:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to generate workout',
    })
  }
})
