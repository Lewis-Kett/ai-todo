import { renderHook, act } from '@testing-library/react'
import { toast } from 'sonner'
import { useToast } from '../useToast'
import { AppError } from '@/lib/errors'

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}))

const mockToast = toast as jest.Mocked<typeof toast>

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return all toast functions', () => {
    const { result } = renderHook(() => useToast())

    expect(typeof result.current.showSuccess).toBe('function')
    expect(typeof result.current.showError).toBe('function')
    expect(typeof result.current.showWarning).toBe('function')
    expect(typeof result.current.showInfo).toBe('function')
    expect(typeof result.current.showLoading).toBe('function')
    expect(typeof result.current.dismiss).toBe('function')
  })

  describe('showSuccess', () => {
    it('should call toast.success with message only', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.showSuccess('Success message')
      })

      expect(mockToast.success).toHaveBeenCalledWith('Success message', {
        description: undefined,
      })
    })

    it('should call toast.success with message and description', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.showSuccess('Success message', 'Success description')
      })

      expect(mockToast.success).toHaveBeenCalledWith('Success message', {
        description: 'Success description',
      })
    })
  })

  describe('showError', () => {
    it('should call toast.error with string error', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.showError('Error message')
      })

      expect(mockToast.error).toHaveBeenCalledWith('Error message', {
        description: undefined,
      })
    })

    it('should call toast.error with AppError', () => {
      const { result } = renderHook(() => useToast())
      const appError = new AppError('AppError message', 'TEST_CODE', 'high')

      act(() => {
        result.current.showError(appError)
      })

      expect(mockToast.error).toHaveBeenCalledWith('AppError message', {
        description: undefined,
      })
    })

    it('should call toast.error with AppError and description', () => {
      const { result } = renderHook(() => useToast())
      const appError = new AppError('AppError message', 'TEST_CODE', 'high')

      act(() => {
        result.current.showError(appError, 'Error description')
      })

      expect(mockToast.error).toHaveBeenCalledWith('AppError message', {
        description: 'Error description',
      })
    })
  })

  describe('showWarning', () => {
    it('should call toast.warning with message only', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.showWarning('Warning message')
      })

      expect(mockToast.warning).toHaveBeenCalledWith('Warning message', {
        description: undefined,
      })
    })

    it('should call toast.warning with message and description', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.showWarning('Warning message', 'Warning description')
      })

      expect(mockToast.warning).toHaveBeenCalledWith('Warning message', {
        description: 'Warning description',
      })
    })
  })

  describe('showInfo', () => {
    it('should call toast.info with message only', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.showInfo('Info message')
      })

      expect(mockToast.info).toHaveBeenCalledWith('Info message', {
        description: undefined,
      })
    })

    it('should call toast.info with message and description', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.showInfo('Info message', 'Info description')
      })

      expect(mockToast.info).toHaveBeenCalledWith('Info message', {
        description: 'Info description',
      })
    })
  })

  describe('showLoading', () => {
    it('should call toast.loading with message only', () => {
      const mockToastId = 'loading-123'
      mockToast.loading.mockReturnValue(mockToastId)
      
      const { result } = renderHook(() => useToast())

      let loadingToastId: string | number
      act(() => {
        loadingToastId = result.current.showLoading('Loading message')
      })

      expect(mockToast.loading).toHaveBeenCalledWith('Loading message', {
        description: undefined,
      })
      expect(loadingToastId!).toBe(mockToastId)
    })

    it('should call toast.loading with message and description', () => {
      const mockToastId = 'loading-456'
      mockToast.loading.mockReturnValue(mockToastId)
      
      const { result } = renderHook(() => useToast())

      let loadingToastId: string | number
      act(() => {
        loadingToastId = result.current.showLoading('Loading message', 'Loading description')
      })

      expect(mockToast.loading).toHaveBeenCalledWith('Loading message', {
        description: 'Loading description',
      })
      expect(loadingToastId!).toBe(mockToastId)
    })
  })

  describe('dismiss', () => {
    it('should call toast.dismiss with no parameters', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.dismiss()
      })

      expect(mockToast.dismiss).toHaveBeenCalledWith(undefined)
    })

    it('should call toast.dismiss with toast ID', () => {
      const { result } = renderHook(() => useToast())
      const toastId = 'toast-123'

      act(() => {
        result.current.dismiss(toastId)
      })

      expect(mockToast.dismiss).toHaveBeenCalledWith(toastId)
    })

    it('should call toast.dismiss with numeric toast ID', () => {
      const { result } = renderHook(() => useToast())
      const toastId = 123

      act(() => {
        result.current.dismiss(toastId)
      })

      expect(mockToast.dismiss).toHaveBeenCalledWith(toastId)
    })
  })

  describe('hook stability', () => {
    it('should return stable functions across re-renders', () => {
      const { result, rerender } = renderHook(() => useToast())
      
      const firstRenderFunctions = { ...result.current }
      
      rerender()
      
      const secondRenderFunctions = { ...result.current }
      
      expect(firstRenderFunctions.showSuccess).toBe(secondRenderFunctions.showSuccess)
      expect(firstRenderFunctions.showError).toBe(secondRenderFunctions.showError)
      expect(firstRenderFunctions.showWarning).toBe(secondRenderFunctions.showWarning)
      expect(firstRenderFunctions.showInfo).toBe(secondRenderFunctions.showInfo)
      expect(firstRenderFunctions.showLoading).toBe(secondRenderFunctions.showLoading)
      expect(firstRenderFunctions.dismiss).toBe(secondRenderFunctions.dismiss)
    })
  })
})