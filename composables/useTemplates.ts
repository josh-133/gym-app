interface WorkoutTemplate {
  id: string
  name: string
  exercises: {
    name: string
    sets: number
    defaultWeight?: number
    defaultReps?: number
  }[]
  createdAt: string
  lastUsed: string | null
}

const STORAGE_KEY = 'gym-app-workout-templates'

// Default templates
const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'push-day',
    name: 'Push Day',
    exercises: [
      { name: 'Bench Press', sets: 4, defaultReps: 8 },
      { name: 'Incline Dumbbell Press', sets: 3, defaultReps: 10 },
      { name: 'Shoulder Press', sets: 3, defaultReps: 10 },
      { name: 'Lateral Raise', sets: 3, defaultReps: 12 },
      { name: 'Tricep Pushdown', sets: 3, defaultReps: 12 },
      { name: 'Overhead Tricep Extension', sets: 3, defaultReps: 12 },
    ],
    createdAt: '2024-01-01',
    lastUsed: null,
  },
  {
    id: 'pull-day',
    name: 'Pull Day',
    exercises: [
      { name: 'Deadlift', sets: 4, defaultReps: 6 },
      { name: 'Barbell Row', sets: 4, defaultReps: 8 },
      { name: 'Lat Pulldown', sets: 3, defaultReps: 10 },
      { name: 'Seated Cable Row', sets: 3, defaultReps: 10 },
      { name: 'Barbell Curl', sets: 3, defaultReps: 10 },
    ],
    createdAt: '2024-01-01',
    lastUsed: null,
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    exercises: [
      { name: 'Squat', sets: 4, defaultReps: 8 },
      { name: 'Romanian Deadlift', sets: 3, defaultReps: 10 },
      { name: 'Leg Press', sets: 3, defaultReps: 12 },
      { name: 'Leg Curl', sets: 3, defaultReps: 12 },
      { name: 'Leg Extension', sets: 3, defaultReps: 12 },
      { name: 'Standing Calf Raise', sets: 4, defaultReps: 15 },
      { name: 'Seated Calf Raise', sets: 3, defaultReps: 15 },
    ],
    createdAt: '2024-01-01',
    lastUsed: null,
  },
  {
    id: 'full-body',
    name: 'Full Body',
    exercises: [
      { name: 'Squat', sets: 3, defaultReps: 8 },
      { name: 'Bench Press', sets: 3, defaultReps: 8 },
      { name: 'Barbell Row', sets: 3, defaultReps: 8 },
      { name: 'Shoulder Press', sets: 3, defaultReps: 10 },
      { name: 'Romanian Deadlift', sets: 3, defaultReps: 10 },
      { name: 'Lat Pulldown', sets: 3, defaultReps: 10 },
      { name: 'Barbell Curl', sets: 2, defaultReps: 12 },
      { name: 'Tricep Pushdown', sets: 2, defaultReps: 12 },
      { name: 'Standing Calf Raise', sets: 3, defaultReps: 15 },
      { name: 'Plank', sets: 3, defaultReps: 60 },
    ],
    createdAt: '2024-01-01',
    lastUsed: null,
  },
]

export function useTemplates() {
  const templates = useState<WorkoutTemplate[]>('workoutTemplates', () => [])

  // Load templates from localStorage
  function loadTemplates() {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          templates.value = JSON.parse(stored)
        } catch (e) {
          console.error('Failed to parse templates:', e)
          templates.value = [...DEFAULT_TEMPLATES]
          saveTemplates()
        }
      } else {
        // Initialize with default templates
        templates.value = [...DEFAULT_TEMPLATES]
        saveTemplates()
      }
    }
  }

  // Save templates to localStorage
  function saveTemplates() {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates.value))
    }
  }

  // Get a template by ID
  function getTemplate(id: string): WorkoutTemplate | undefined {
    return templates.value.find(t => t.id === id)
  }

  // Add a new template
  function addTemplate(template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'lastUsed'>) {
    const newTemplate: WorkoutTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastUsed: null,
    }
    templates.value.push(newTemplate)
    saveTemplates()
    return newTemplate
  }

  // Update an existing template
  function updateTemplate(id: string, updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt'>>) {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value[index] = { ...templates.value[index], ...updates }
      saveTemplates()
      return true
    }
    return false
  }

  // Delete a template
  function deleteTemplate(id: string) {
    templates.value = templates.value.filter(t => t.id !== id)
    saveTemplates()
  }

  // Mark a template as used
  function markTemplateUsed(id: string) {
    const template = templates.value.find(t => t.id === id)
    if (template) {
      template.lastUsed = new Date().toISOString()
      saveTemplates()
    }
  }

  // Initialize on mount
  onMounted(() => {
    loadTemplates()
  })

  return {
    templates: readonly(templates),
    loadTemplates,
    getTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    markTemplateUsed,
  }
}
