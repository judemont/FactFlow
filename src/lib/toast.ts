import { writable } from 'svelte/store';

export interface Toast {
  id: number;
  text: string;
}

export const toasts = writable<Toast[]>([]);

let nextId = 1;

export function showToast(text: string): void {
  const id = nextId++;
  toasts.update((list) => [...list, { id, text }]);
  setTimeout(() => {
    toasts.update((list) => list.filter((t) => t.id !== id));
  }, 2600);
}
