'use client';

/**
 * useHotkeys Hook
 * 
 * Manages keyboard shortcuts with modifier key support.
 * Used in Transactions for quick actions (Ctrl+E, Ctrl+S, etc).
 */

import { useEffect, useRef } from 'react';

type HotkeyHandler = () => void;

export interface Hotkey {
  /** The key to listen for (case insensitive) */
  key: string;
  /** Require Ctrl/Cmd key */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
  /** Handler function to call when hotkey is pressed */
  handler: HotkeyHandler;
  /** Whether the hotkey is enabled (default: true) */
  enabled?: boolean;
  /** Prevent default browser behavior (default: true when ctrl/alt is used) */
  preventDefault?: boolean;
}

export interface UseHotkeysOptions {
  /** Enable/disable all hotkeys (default: true) */
  enabled?: boolean;
  /** Allow hotkeys in input/textarea elements (default: false) */
  enableInInputs?: boolean;
}

/**
 * Hook to register keyboard shortcuts.
 * 
 * @example
 * useHotkeys([
 *   { key: 'e', ctrl: true, handler: () => openNewEntry('entrada') },
 *   { key: 's', ctrl: true, handler: () => openNewEntry('saida') },
 *   { key: 'f', ctrl: true, handler: () => focusSearch() },
 *   { key: 'Escape', handler: () => closeModal(), enabled: isModalOpen },
 * ]);
 */
export function useHotkeys(hotkeys: Hotkey[], options: UseHotkeysOptions = {}) {
  const { enabled = true, enableInInputs = false } = options;
  
  // Use ref to avoid recreating effect on every hotkeys change
  const hotkeysRef = useRef(hotkeys);
  hotkeysRef.current = hotkeys;
  
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if globally disabled
      if (!enabledRef.current) return;

      // Skip if typing in input elements (unless explicitly enabled)
      if (!enableInInputs) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      for (const hotkey of hotkeysRef.current) {
        // Skip disabled hotkeys
        if (hotkey.enabled === false) continue;

        // Check modifier keys
        const ctrlMatch = hotkey.ctrl 
          ? (event.ctrlKey || event.metaKey) 
          : !(event.ctrlKey || event.metaKey) || !hotkey.ctrl;
        const shiftMatch = hotkey.shift 
          ? event.shiftKey 
          : !event.shiftKey || !hotkey.shift;
        const altMatch = hotkey.alt 
          ? event.altKey 
          : !event.altKey || !hotkey.alt;

        // Check if we require no modifiers and modifiers are pressed
        if (!hotkey.ctrl && !hotkey.shift && !hotkey.alt) {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
            continue;
          }
        }

        // Check key match (case insensitive)
        const keyMatch = event.key.toLowerCase() === hotkey.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          // Prevent default for modifier combos by default
          const shouldPrevent = hotkey.preventDefault ?? (hotkey.ctrl || hotkey.alt);
          if (shouldPrevent) {
            event.preventDefault();
          }
          
          hotkey.handler();
          break; // Only trigger first matching hotkey
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableInInputs]);
}

/**
 * Utility to format hotkey for display
 * @example formatHotkey({ key: 's', ctrl: true }) => 'Ctrl+S' or '⌘S' on Mac
 */
export function formatHotkey(hotkey: Pick<Hotkey, 'key' | 'ctrl' | 'shift' | 'alt'>): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  const parts: string[] = [];
  
  if (hotkey.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (hotkey.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (hotkey.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  
  parts.push(hotkey.key.toUpperCase());
  
  return isMac ? parts.join('') : parts.join('+');
}
