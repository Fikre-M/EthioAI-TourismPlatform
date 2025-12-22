// Form utilities for better form handling

/**
 * Form validation utilities
 */
export const validators = {
  required: (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required'
    }
    return null
  },

  email: (value: string) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Please enter a valid email address'
  },

  minLength: (min: number) => (value: string) => {
    if (!value) return null
    return value.length >= min ? null : `Must be at least ${min} characters`
  },

  maxLength: (max: number) => (value: string) => {
    if (!value) return null
    return value.length <= max ? null : `Must be no more than ${max} characters`
  },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (!value) return null
    return regex.test(value) ? null : message
  },

  phone: (value: string) => {
    if (!value) return null
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Please enter a valid phone number'
  },

  url: (value: string) => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Please enter a valid URL'
    }
  },

  number: (value: string) => {
    if (!value) return null
    return !isNaN(Number(value)) ? null : 'Please enter a valid number'
  },

  integer: (value: string) => {
    if (!value) return null
    return Number.isInteger(Number(value)) ? null : 'Please enter a valid integer'
  },

  min: (min: number) => (value: string) => {
    if (!value) return null
    const num = Number(value)
    return num >= min ? null : `Must be at least ${min}`
  },

  max: (max: number) => (value: string) => {
    if (!value) return null
    const num = Number(value)
    return num <= max ? null : `Must be no more than ${max}`
  },
}

/**
 * Compose multiple validators
 */
export const composeValidators = (...validators: Array<(value: any) => string | null>) => {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }
}

/**
 * Form field state management
 */
export interface FieldState {
  value: any
  error: string | null
  touched: boolean
  dirty: boolean
}

export class FormManager {
  private fields = new Map<string, FieldState>()
  private validators = new Map<string, (value: any) => string | null>()
  private subscribers = new Set<() => void>()

  constructor(initialValues: Record<string, any> = {}) {
    Object.entries(initialValues).forEach(([name, value]) => {
      this.fields.set(name, {
        value,
        error: null,
        touched: false,
        dirty: false,
      })
    })
  }

  setValidator(name: string, validator: (value: any) => string | null) {
    this.validators.set(name, validator)
  }

  setValue(name: string, value: any) {
    const field = this.fields.get(name) || {
      value: undefined,
      error: null,
      touched: false,
      dirty: false,
    }

    this.fields.set(name, {
      ...field,
      value,
      dirty: true,
    })

    this.validateField(name)
    this.notifySubscribers()
  }

  setTouched(name: string, touched = true) {
    const field = this.fields.get(name)
    if (field) {
      this.fields.set(name, { ...field, touched })
      this.notifySubscribers()
    }
  }

  validateField(name: string) {
    const field = this.fields.get(name)
    const validator = this.validators.get(name)
    
    if (field && validator) {
      const error = validator(field.value)
      this.fields.set(name, { ...field, error })
    }
  }

  validateAll() {
    this.fields.forEach((_, name) => {
      this.validateField(name)
    })
    this.notifySubscribers()
  }

  getField(name: string): FieldState | undefined {
    return this.fields.get(name)
  }

  getValues() {
    const values: Record<string, any> = {}
    this.fields.forEach((field, name) => {
      values[name] = field.value
    })
    return values
  }

  getErrors() {
    const errors: Record<string, string> = {}
    this.fields.forEach((field, name) => {
      if (field.error) {
        errors[name] = field.error
      }
    })
    return errors
  }

  isValid() {
    return Array.from(this.fields.values()).every(field => !field.error)
  }

  isDirty() {
    return Array.from(this.fields.values()).some(field => field.dirty)
  }

  reset(values?: Record<string, any>) {
    if (values) {
      this.fields.clear()
      Object.entries(values).forEach(([name, value]) => {
        this.fields.set(name, {
          value,
          error: null,
          touched: false,
          dirty: false,
        })
      })
    } else {
      this.fields.forEach((field, name) => {
        this.fields.set(name, {
          ...field,
          error: null,
          touched: false,
          dirty: false,
        })
      })
    }
    this.notifySubscribers()
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback())
  }
}

/**
 * Auto-save functionality
 */
export class AutoSave {
  private timer: NodeJS.Timeout | null = null
  private lastSavedData: string = ''

  constructor(
    private saveFunction: (data: any) => Promise<void>,
    private delay: number = 2000
  ) {}

  save(data: any) {
    const dataString = JSON.stringify(data)
    
    // Don't save if data hasn't changed
    if (dataString === this.lastSavedData) return

    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(async () => {
      try {
        await this.saveFunction(data)
        this.lastSavedData = dataString
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, this.delay)
  }

  cancel() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

/**
 * Form data serialization
 */
export const serializeForm = (form: HTMLFormElement): Record<string, any> => {
  const formData = new FormData(form)
  const data: Record<string, any> = {}

  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      // Handle multiple values (checkboxes, multi-select)
      if (Array.isArray(data[key])) {
        data[key].push(value)
      } else {
        data[key] = [data[key], value]
      }
    } else {
      data[key] = value
    }
  }

  return data
}

/**
 * Form accessibility helpers
 */
export const generateFieldId = (name: string, prefix = 'field'): string => {
  return `${prefix}-${name}-${Math.random().toString(36).substr(2, 9)}`
}

export const getAriaDescribedBy = (fieldId: string, hasError: boolean, hasHelper: boolean): string | undefined => {
  const ids: string[] = []
  
  if (hasError) ids.push(`${fieldId}-error`)
  if (hasHelper) ids.push(`${fieldId}-helper`)
  
  return ids.length > 0 ? ids.join(' ') : undefined
}