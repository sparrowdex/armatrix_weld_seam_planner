/**
 * True when the focused element is something the user types into (text or number fields, text areas,
 * dropdowns, contenteditable). Global hotkeys must stay out of the way there.
 * Sliders, checkboxes and buttons are not typing targets, so hotkeys keep working after using them.
 */
export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  if (tag === 'INPUT') {
    const type = ((el as HTMLInputElement).type || 'text').toLowerCase();
    return ['text', 'number', 'search', 'email', 'password', 'url', 'tel'].includes(type);
  }
  return false;
}

/** True when a range slider has focus (arrow keys belong to it). */
export function isSliderFocused(el: Element | null): boolean {
  return !!el && el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'range';
}
