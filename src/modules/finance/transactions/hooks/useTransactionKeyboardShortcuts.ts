'use client';

/**
 * useTransactionKeyboardShortcuts Hook
 *
 * Keyboard shortcuts para a pagina de transacoes:
 * - Cmd+D / Ctrl+D: Nova entrada
 * - Ctrl+S: Nova saida
 */

import { useEffect } from 'react';

interface UseTransactionKeyboardShortcutsOptions {
  canEdit: boolean;
  onNewEntry: () => void;
  onNewExit: () => void;
}

export function useTransactionKeyboardShortcuts({
  canEdit,
  onNewEntry,
  onNewExit,
}: UseTransactionKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'd' || event.key === 'D') {
          event.preventDefault();
          if (canEdit) onNewEntry();
        } else if (event.key === 's' || event.key === 'S') {
          event.preventDefault();
          if (canEdit) onNewExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit, onNewEntry, onNewExit]);
}
