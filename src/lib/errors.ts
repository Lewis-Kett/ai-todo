export class AppError extends Error {
  public code: string
  public severity: 'low' | 'medium' | 'high'

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.severity = severity
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'GENERIC_ERROR', 'medium')
  }

  if (typeof error === 'string') {
    return new AppError(error, 'STRING_ERROR', 'low')
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 'high')
}

// Common error types for the application
export const createValidationError = (message: string) =>
  new AppError(message, 'VALIDATION_ERROR', 'low')

export const createDataError = (message: string) =>
  new AppError(message, 'DATA_ERROR', 'medium')

export const createNetworkError = (message: string) =>
  new AppError(message, 'NETWORK_ERROR', 'high')

export const createChatError = (message: string) =>
  new AppError(message, 'CHAT_ERROR', 'medium')