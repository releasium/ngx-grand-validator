import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'example';

  onActivate(e: any) {
    console.log(11);
    console.log(e);
  }
}
