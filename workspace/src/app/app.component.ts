import { Component } from '@angular/core';
import { NgxBlurhashComponent } from '../../dist/ngx-blurhash-render';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    NgxBlurhashComponent
  ],
  styleUrls: ['./app.component.css'],
  standalone: true
})
export class AppComponent {
  title = 'workspace';
}
