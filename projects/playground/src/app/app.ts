import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WakeyWakey } from 'wakeywakey';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WakeyWakey],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('playground');
}
