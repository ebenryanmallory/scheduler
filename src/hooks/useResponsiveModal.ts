import { useIsMobile } from './useMediaQuery'

export type ModalType = 'dialog' | 'drawer'

interface UseResponsiveModalReturn {
  modalType: ModalType
  isMobile: boolean
}

/**
 * Hook to determine modal type based on screen size
 * Returns 'drawer' for mobile (bottom sheet) and 'dialog' for desktop
 */
export function useResponsiveModal(): UseResponsiveModalReturn {
  const isMobile = useIsMobile()
  
  return {
    modalType: isMobile ? 'drawer' : 'dialog',
    isMobile,
  }
}

