import { useCallback } from "react"
import { toast } from "sonner"
import { AppError } from "@/lib/errors"

export function useToast() {
  const showSuccess = useCallback((message: string, description?: string) => {
    toast.success(message, {
      description,
    })
  }, [])

  const showError = useCallback((error: AppError | string, description?: string) => {
    const message = typeof error === 'string' ? error : error.message
    toast.error(message, {
      description,
    })
  }, [])

  const showWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, {
      description,
    })
  }, [])

  const showInfo = useCallback((message: string, description?: string) => {
    toast.info(message, {
      description,
    })
  }, [])

  const showLoading = useCallback((message: string, description?: string) => {
    return toast.loading(message, {
      description,
    })
  }, [])

  const dismiss = useCallback((toastId?: string | number) => {
    toast.dismiss(toastId)
  }, [])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
  }
}