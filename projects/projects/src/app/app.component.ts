import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'projects';
  isMobile = false;

  constructor() {
    this.updateDeviceView();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateDeviceView();
  }

  private updateDeviceView() {
    // Treat anything below 1024px as mobile/tablet
    this.isMobile = window.innerWidth < 1024;
  }
}
