import { 
  AppError, 
  handleError, 
  createValidationError, 
  createDataError, 
  createNetworkError, 
  createChatError 
} from '../errors'

describe('AppError', () => {
  it('should create an AppError with default values', () => {
    const error = new AppError('Test message')
    
    expect(error.message).toBe('Test message')
    expect(error.code).toBe('UNKNOWN_ERROR')
    expect(error.severity).toBe('medium')
    expect(error.name).toBe('AppError')
    expect(error instanceof Error).toBe(true)
    expect(error instanceof AppError).toBe(true)
  })

  it('should create an AppError with custom code and severity', () => {
    const error = new AppError('Test message', 'CUSTOM_CODE', 'high')
    
    expect(error.message).toBe('Test message')
    expect(error.code).toBe('CUSTOM_CODE')
    expect(error.severity).toBe('high')
    expect(error.name).toBe('AppError')
  })

  it('should accept all severity levels', () => {
    const lowError = new AppError('Low', 'CODE', 'low')
    const mediumError = new AppError('Medium', 'CODE', 'medium')
    const highError = new AppError('High', 'CODE', 'high')
    
    expect(lowError.severity).toBe('low')
    expect(mediumError.severity).toBe('medium')
    expect(highError.severity).toBe('high')
  })
})

describe('handleError', () => {
  it('should return the same AppError when passed an AppError', () => {
    const originalError = new AppError('Original message', 'ORIGINAL_CODE', 'high')
    const result = handleError(originalError)
    
    expect(result).toBe(originalError)
    expect(result.message).toBe('Original message')
    expect(result.code).toBe('ORIGINAL_CODE')
    expect(result.severity).toBe('high')
  })

  it('should convert Error to AppError', () => {
    const originalError = new Error('Standard error message')
    const result = handleError(originalError)
    
    expect(result instanceof AppError).toBe(true)
    expect(result.message).toBe('Standard error message')
    expect(result.code).toBe('GENERIC_ERROR')
    expect(result.severity).toBe('medium')
  })

  it('should convert string to AppError', () => {
    const result = handleError('String error message')
    
    expect(result instanceof AppError).toBe(true)
    expect(result.message).toBe('String error message')
    expect(result.code).toBe('STRING_ERROR')
    expect(result.severity).toBe('low')
  })

  it('should handle unknown error types', () => {
    const result = handleError({ unknown: 'object' })
    
    expect(result instanceof AppError).toBe(true)
    expect(result.message).toBe('An unexpected error occurred')
    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.severity).toBe('high')
  })

  it('should handle null and undefined', () => {
    const nullResult = handleError(null)
    const undefinedResult = handleError(undefined)
    
    expect(nullResult instanceof AppError).toBe(true)
    expect(nullResult.message).toBe('An unexpected error occurred')
    expect(nullResult.severity).toBe('high')
    
    expect(undefinedResult instanceof AppError).toBe(true)
    expect(undefinedResult.message).toBe('An unexpected error occurred')
    expect(undefinedResult.severity).toBe('high')
  })
})

describe('Error factory functions', () => {
  describe('createValidationError', () => {
    it('should create a validation error with correct properties', () => {
      const error = createValidationError('Invalid input')
      
      expect(error instanceof AppError).toBe(true)
      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.severity).toBe('low')
    })
  })

  describe('createDataError', () => {
    it('should create a data error with correct properties', () => {
      const error = createDataError('Data not found')
      
      expect(error instanceof AppError).toBe(true)
      expect(error.message).toBe('Data not found')
      expect(error.code).toBe('DATA_ERROR')
      expect(error.severity).toBe('medium')
    })
  })

  describe('createNetworkError', () => {
    it('should create a network error with correct properties', () => {
      const error = createNetworkError('Network timeout')
      
      expect(error instanceof AppError).toBe(true)
      expect(error.message).toBe('Network timeout')
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.severity).toBe('high')
    })
  })

  describe('createChatError', () => {
    it('should create a chat error with correct properties', () => {
      const error = createChatError('Chat service unavailable')
      
      expect(error instanceof AppError).toBe(true)
      expect(error.message).toBe('Chat service unavailable')
      expect(error.code).toBe('CHAT_ERROR')
      expect(error.severity).toBe('medium')
    })
  })
})

describe('Error inheritance and serialization', () => {
  it('should maintain Error prototype chain', () => {
    const error = new AppError('Test')
    
    expect(error instanceof Error).toBe(true)
    expect(error instanceof AppError).toBe(true)
    expect(Object.prototype.toString.call(error)).toBe('[object Error]')
  })

  it('should have a proper stack trace', () => {
    const error = new AppError('Test error')
    
    expect(error.stack).toBeDefined()
    expect(typeof error.stack).toBe('string')
    expect(error.stack).toContain('Test error')
  })

  it('should be JSON serializable with custom properties', () => {
    const error = new AppError('Test message', 'TEST_CODE', 'high')
    const serialized = JSON.parse(JSON.stringify(error))
    
    // Note: Error objects don't serialize message by default, but our custom properties should
    expect(serialized.code).toBe('TEST_CODE')
    expect(serialized.severity).toBe('high')
  })
})