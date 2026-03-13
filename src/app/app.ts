import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackToastsComponent } from './shared/feedback-toasts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FeedbackToastsComponent],
  template: '<app-feedback-toasts /><router-outlet />',
  styleUrl: './app.css'
})
export class App {}
