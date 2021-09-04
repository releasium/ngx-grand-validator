import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {

  ngOnInit() {
    console.log('home init');
  }
}
