import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '~/server/utils/auth'
import { getSubscriptionStatus, requirePremium } from '~/server/utils/subscription'

interface WorkoutData {
  id: string
  name: string
  date: string
  duration: number
  exercises: {
    name: string
    sets: {
      weight: number | null
      reps: number | null
      completed: boolean
    }[]
  }[]
  volume: number
}

interface Insight {
  id: string
  type: 'recommendation' | 'analysis' | 'warning' | 'celebration'
  title: string
  content: string
  createdAt: string
  isRead: boolean
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

  const body = await readBody<{ workouts: WorkoutData[] }>(event)

  if (!body.workouts || body.workouts.length === 0) {
    return { insights: [] }
  }

  const client = new Anthropic({
    apiKey: config.anthropicApiKey,
  })

  // Prepare workout summary for Claude
  const workoutSummary = prepareWorkoutSummary(body.workouts)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a knowledgeable fitness coach analyzing a user's workout history. Based on the following workout data, provide 3-5 personalized insights.

Each insight should be one of these types:
- "celebration": Celebrating achievements, PRs, or milestones
- "recommendation": Suggesting improvements or new approaches
- "analysis": Observing patterns or trends in the data
- "warning": Alerting about potential issues like overtraining or imbalances

Respond with a JSON array of insights. Each insight should have:
- type: one of the types above
- title: a short, engaging title (max 50 chars)
- content: detailed explanation (2-3 sentences)

Here is the workout data:

${workoutSummary}

Respond ONLY with a valid JSON array, no other text. Example format:
[
  {
    "type": "celebration",
    "title": "Great consistency!",
    "content": "You've worked out 4 times this week. Consistency is key to progress."
  }
]`,
        },
      ],
    })

    // Extract the text content from the response
    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse the JSON response
    const rawInsights = JSON.parse(textContent.text)

    // Transform to our insight format
    const insights: Insight[] = rawInsights.map((insight: { type: string; title: string; content: string }, index: number) => ({
      id: `ai-${Date.now()}-${index}`,
      type: insight.type as Insight['type'],
      title: insight.title,
      content: insight.content,
      createdAt: new Date().toISOString(),
      isRead: false,
    }))

    return { insights }
  } catch (error) {
    console.error('Error generating insights:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to generate insights',
    })
  }
})

function prepareWorkoutSummary(workouts: WorkoutData[]): string {
  // Sort workouts by date (most recent first)
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Take last 30 days of workouts
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentWorkouts = sortedWorkouts.filter(
    w => new Date(w.date) >= thirtyDaysAgo
  )

  // Calculate statistics
  const totalWorkouts = recentWorkouts.length
  const totalVolume = recentWorkouts.reduce((sum, w) => sum + w.volume, 0)
  const avgDuration = totalWorkouts > 0
    ? Math.round(recentWorkouts.reduce((sum, w) => sum + w.duration, 0) / totalWorkouts / 60)
    : 0

  // Count exercises and find PRs
  const exerciseData: Record<string, { count: number; maxWeight: number; totalVolume: number }> = {}

  recentWorkouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (!exerciseData[ex.name]) {
        exerciseData[ex.name] = { count: 0, maxWeight: 0, totalVolume: 0 }
      }
      exerciseData[ex.name].count++

      ex.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          exerciseData[ex.name].maxWeight = Math.max(exerciseData[ex.name].maxWeight, set.weight)
          exerciseData[ex.name].totalVolume += set.weight * set.reps
        }
      })
    })
  })

  // Calculate workout frequency by day of week
  const dayFrequency: Record<string, number> = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
    Thursday: 0, Friday: 0, Saturday: 0,
  }
  recentWorkouts.forEach(w => {
    const day = new Date(w.date).toLocaleDateString('en-US', { weekday: 'long' })
    dayFrequency[day]++
  })

  // Build summary
  let summary = `WORKOUT SUMMARY (Last 30 Days):
- Total workouts: ${totalWorkouts}
- Total volume: ${(totalVolume / 1000).toFixed(1)}k kg
- Average duration: ${avgDuration} minutes

EXERCISE BREAKDOWN:`

  Object.entries(exerciseData)
    .sort((a, b) => b[1].totalVolume - a[1].totalVolume)
    .slice(0, 10)
    .forEach(([name, data]) => {
      summary += `\n- ${name}: ${data.count} sessions, max weight ${data.maxWeight}kg, volume ${(data.totalVolume / 1000).toFixed(1)}k kg`
    })

  summary += `\n\nWORKOUT FREQUENCY BY DAY:`
  Object.entries(dayFrequency).forEach(([day, count]) => {
    summary += `\n- ${day}: ${count} workouts`
  })

  // Add recent workout details
  summary += `\n\nRECENT WORKOUTS:`
  recentWorkouts.slice(0, 5).forEach(w => {
    const exercises = w.exercises.map(e => e.name).join(', ')
    summary += `\n- ${new Date(w.date).toLocaleDateString()}: ${w.name} (${Math.round(w.duration / 60)}min) - ${exercises}`
  })

  return summary
}
