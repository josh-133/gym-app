interface WorkoutTemplate {
  id: string
  name: string
  exercises: {
    name: string
    sets: number
    defaultWeight?: number
    defaultReps?: number
    group_id?: string | null
    group_type?: 'superset' | 'circuit' | null
    default_rest_sec?: number | null
  }[]
  createdAt: string
  lastUsed: string | null
  folder?: string | null
}

const STORAGE_KEY = 'gym-app-workout-templates'

// Default templates - these are starter templates, no fake usage dates
function getDefaultTemplates(): WorkoutTemplate[] {
  return [
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
      createdAt: new Date().toISOString(),
      lastUsed: null,
      folder: null,
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
      createdAt: new Date().toISOString(),
      lastUsed: null,
      folder: null,
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
      createdAt: new Date().toISOString(),
      lastUsed: null,
      folder: null,
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
      createdAt: new Date().toISOString(),
      lastUsed: null,
      folder: null,
    },
  ]
}

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
          templates.value = getDefaultTemplates()
          saveTemplates()
        }
      } else {
        templates.value = getDefaultTemplates()
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
      templates.value.splice(index, 1, { ...templates.value[index], ...updates })
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

  // Folder management
  const folders = computed(() => {
    const folderSet = new Set<string>()
    templates.value.forEach(t => {
      if (t.folder) folderSet.add(t.folder)
    })
    return Array.from(folderSet).sort()
  })

  function createFolder(name: string) {
    // Folders are implicit - just assign a template to one
    return name
  }

  function moveToFolder(templateId: string, folder: string | null) {
    const template = templates.value.find(t => t.id === templateId)
    if (template) {
      template.folder = folder
      saveTemplates()
    }
  }

  function deleteFolder(folderName: string) {
    templates.value.forEach(t => {
      if (t.folder === folderName) {
        t.folder = null
      }
    })
    saveTemplates()
  }

  function renameFolder(oldName: string, newName: string) {
    templates.value.forEach(t => {
      if (t.folder === oldName) {
        t.folder = newName
      }
    })
    saveTemplates()
  }

  // Templates grouped by folder
  const templatesByFolder = computed(() => {
    const grouped: Record<string, WorkoutTemplate[]> = { '': [] }

    templates.value.forEach(t => {
      const folder = t.folder || ''
      if (!grouped[folder]) grouped[folder] = []
      grouped[folder].push(t)
    })

    return grouped
  })

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
    // Folder management
    folders,
    createFolder,
    moveToFolder,
    deleteFolder,
    renameFolder,
    templatesByFolder,
  }
}
