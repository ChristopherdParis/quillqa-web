import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FeedbackService } from '../core/feedback.service';

@Component({
  selector: 'app-feedback-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (feedback.messages().length) {
      <div class="feedback-stack" role="status" aria-live="polite">
        @for (toast of feedback.messages(); track toast.id) {
          <article class="feedback-toast" [class]="toast.type">
            <p>{{ toast.message }}</p>
            <button
              type="button"
              class="feedback-close"
              aria-label="Cerrar notificación"
              (click)="feedback.dismiss(toast.id)"
            >
              ✕
            </button>
          </article>
        }
      </div>
    }
  `,
})
export class FeedbackToastsComponent {
  readonly feedback = inject(FeedbackService);
}
