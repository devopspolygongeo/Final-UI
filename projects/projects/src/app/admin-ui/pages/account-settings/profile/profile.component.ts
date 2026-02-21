import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  profileData = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    designation: '',
    profilePhoto: null
  };

  selectedFile: File | null = null;
  fileName: string = 'No file chosen';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
    } else {
      this.selectedFile = null;
      this.fileName = 'No file chosen';
    }
  }

  onSaveChanges() {
    console.log('Profile data:', this.profileData);
    console.log('Selected file:', this.selectedFile);
    // Handle save logic here
  }
}