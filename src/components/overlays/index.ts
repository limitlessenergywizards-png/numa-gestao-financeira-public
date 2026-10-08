/**
 * Overlays - Premium modal, sheet, and toast components
 * 
 * Features:
 * - Spring physics animations via Framer Motion
 * - Progressive backdrop blur effects
 * - Drag gestures for mobile bottom sheets
 * - Accessible (focus trap, keyboard nav, ARIA)
 * - Respects prefers-reduced-motion
 */

// FluidModal - Modal with spring animations and backdrop blur
export { 
  FluidModal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useFluidModal,
} from './FluidModal';

// BottomSheet - Mobile-first sheet with drag gestures
export { 
  BottomSheet, 
  SheetHeader, 
  SheetAction,
  useBottomSheet,
} from './BottomSheet';

// FluidToast - Toast notification system with layout animations
export { 
  FluidToastProvider, 
  useFluidToast,
  fluidToast,
  registerGlobalToast,
} from './FluidToast';

// FluidToastRegistrar - Enables global toast usage outside React components
export { FluidToastRegistrar } from './FluidToastRegistrar';
