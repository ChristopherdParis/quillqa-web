import { Injectable, Signal, computed, signal } from '@angular/core';

export type FeedbackType = 'success' | 'error' | 'info';

export interface FeedbackToast {
  id: number;
  type: FeedbackType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly toasts = signal<FeedbackToast[]>([]);
  readonly messages: Signal<FeedbackToast[]> = computed(() => this.toasts());
  private nextToastId = 1;

  show(message: string, type: FeedbackType = 'info', ttlMs = 3500): void {
    const toast: FeedbackToast = {
      id: this.nextToastId++,
      type,
      message: message.trim(),
    };

    if (!toast.message) {
      return;
    }

    this.toasts.update((current) => [toast, ...current]);
    window.setTimeout(() => this.dismiss(toast.id), ttlMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}
