import { nextTick } from 'vue';

export interface InlineSanitizeOptions {
  allowSpaces?: boolean;
}

/**
 * Utilitário puro e reutilizável para sanitização de inputs inline
 * com preservação exata da posição do cursor.
 */
export function sanitizeInlineInput(event: Event, options: InlineSanitizeOptions = {}): string {
  const target = event.target as HTMLInputElement;
  if (!target) return '';

  const rawValue = target.value;
  const cleanValue = options.allowSpaces ? rawValue : rawValue.replace(/\s+/g, '');

  if (target.value !== cleanValue) {
    const cursor = Math.max(0, (target.selectionStart || 1) - 1);
    target.value = cleanValue;
    target.setSelectionRange(cursor, cursor);
  }

  return cleanValue;
}

/**
 * Restaura a posição do cursor após re-render do Vue (nextTick).
 */
export function restoreCursorPosition(target: HTMLInputElement, position: number | null): void {
  if (position === null) return;
  nextTick(() => {
    if (document.activeElement === target) {
      target.setSelectionRange(position, position);
    }
  });
}
