import { useMessage, type MessageApi } from 'naive-ui'

export function useNotification() {
  // Try to get the message API from Naive UI's injection
  // This works when called within a component that's inside NMessageProvider
  let message: MessageApi | null = null

  try {
    message = useMessage()
  } catch {
    // useMessage can throw if not inside NMessageProvider
    message = null
  }

  function success(content: string, duration = 3000) {
    if (message) {
      message.success(content, { duration })
    } else {
      console.log('Success:', content)
    }
  }

  function error(content: string, duration = 5000) {
    if (message) {
      message.error(content, { duration })
    } else {
      console.error('Error:', content)
    }
  }

  function warning(content: string, duration = 4000) {
    if (message) {
      message.warning(content, { duration })
    } else {
      console.warn('Warning:', content)
    }
  }

  function info(content: string, duration = 3000) {
    if (message) {
      message.info(content, { duration })
    } else {
      console.info('Info:', content)
    }
  }

  return {
    success,
    error,
    warning,
    info,
  }
}
