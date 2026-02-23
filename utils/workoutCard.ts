/**
 * Generates shareable workout card images using HTML Canvas
 */

interface WorkoutCardData {
  name: string
  date: string
  duration: number // seconds
  exerciseCount: number
  totalVolume: number
  totalSets: number
  prs: string[]
  exercises: { name: string; bestSet: string }[]
}

export async function generateWorkoutCard(data: WorkoutCardData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const width = 1080
  const height = 1350
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#0f172a')
  gradient.addColorStop(0.5, '#1e293b')
  gradient.addColorStop(1, '#0f172a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Decorative accent lines
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, 100)
  ctx.lineTo(width - 60, 100)
  ctx.stroke()

  // App branding
  ctx.fillStyle = '#818cf8'
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('GYM TRACKER', 60, 72)

  // Date
  const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  ctx.fillStyle = '#94a3b8'
  ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText(formattedDate, 60, 160)

  // Workout name
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText(data.name, 60, 240)

  // Stats row
  const statsY = 320
  const stats = [
    { label: 'Duration', value: formatDuration(data.duration) },
    { label: 'Exercises', value: String(data.exerciseCount) },
    { label: 'Sets', value: String(data.totalSets) },
    { label: 'Volume', value: formatVolume(data.totalVolume) },
  ]

  const statWidth = (width - 120) / stats.length
  stats.forEach((stat, i) => {
    const x = 60 + i * statWidth

    ctx.fillStyle = '#818cf8'
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(stat.value, x, statsY)

    ctx.fillStyle = '#64748b'
    ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(stat.label, x, statsY + 35)
  })

  // Divider
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(60, 400)
  ctx.lineTo(width - 60, 400)
  ctx.stroke()

  // Exercises
  let y = 460
  ctx.fillStyle = '#94a3b8'
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('EXERCISES', 60, y)
  y += 50

  const maxExercises = Math.min(data.exercises.length, 8)
  for (let i = 0; i < maxExercises; i++) {
    const ex = data.exercises[i]

    ctx.fillStyle = '#e2e8f0'
    ctx.font = '30px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(ex.name, 60, y)

    ctx.fillStyle = '#64748b'
    ctx.font = '26px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(ex.bestSet, width - 60, y)
    ctx.textAlign = 'left'

    y += 55
  }

  if (data.exercises.length > maxExercises) {
    ctx.fillStyle = '#64748b'
    ctx.font = '26px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(`+${data.exercises.length - maxExercises} more`, 60, y)
    y += 55
  }

  // PRs section
  if (data.prs.length > 0) {
    y += 20
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)'
    ctx.beginPath()
    ctx.moveTo(60, y)
    ctx.lineTo(width - 60, y)
    ctx.stroke()
    y += 40

    ctx.fillStyle = '#eab308'
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('NEW PERSONAL RECORDS', 60, y)
    y += 45

    for (const pr of data.prs.slice(0, 3)) {
      ctx.fillStyle = '#fde68a'
      ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText(`🏆 ${pr}`, 60, y)
      y += 45
    }
  }

  // Bottom branding
  ctx.fillStyle = 'rgba(99, 102, 241, 0.15)'
  ctx.fillRect(0, height - 80, width, 80)

  ctx.fillStyle = '#64748b'
  ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Built with Gym Tracker', width / 2, height - 30)
  ctx.textAlign = 'left'

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to generate card'))
      },
      'image/png',
    )
  })
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  const hrs = Math.floor(mins / 60)
  const m = mins % 60
  return hrs > 0 ? `${hrs}h${m}m` : `${m}m`
}

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`
  return String(Math.round(volume))
}

export async function shareWorkoutCard(cardBlob: Blob, workoutName: string) {
  const file = new File([cardBlob], `${workoutName.replace(/\s+/g, '-')}.png`, { type: 'image/png' })

  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: workoutName,
      text: `Check out my ${workoutName} workout!`,
    })
  } else {
    // Fallback: download
    const url = URL.createObjectURL(cardBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
  }
}
