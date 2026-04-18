import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'projects/projects/src/app/login/services/auth.service';
import { environment } from 'projects/projects/src/environments/environment';

@Component({
  selector: 'app-plotview-profile',
  templateUrl: './plotview-profile.component.html',
  styleUrls: ['./plotview-profile.component.css']
})
export class PlotviewProfileComponent implements OnInit {

  profileData = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    designation: '',
    profilePhoto: null as any
  };

  selectedFile: File | null = null;
  fileName: string = 'No file chosen';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfileDetails();
  }

loadProfileDetails() {
  const loggedInUser = this.authService.getCurrentUser();
  const userId = loggedInUser?.id;

  console.log('loggedInUser:', loggedInUser);
  console.log('userId:', userId);

  if (!userId) {
    console.error('User ID not found');
    return;
  }

  this.http.get<any>(`${environment.apiUrl}/users/${userId}`).subscribe({
    next: (res) => {
      console.log('Profile API response:', res);

      this.profileData.firstName = res.firstName ?? res.firstname ?? '';
      this.profileData.lastName = res.lastName ?? res.lastname ?? '';
      this.profileData.email = res.email ?? '';
      this.profileData.mobile = res.contact ?? '';
      this.profileData.designation = res.designation ?? '';
      this.profileData.profilePhoto = res.profilePhoto ?? null;
    },
    error: (err) => {
      console.error('Failed to load profile details', err);
    }
  });
}

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
  const loggedInUser = this.authService.getCurrentUser();
  const userId = loggedInUser?.id;

  if (!userId) {
    console.error('User ID not found');
    return;
  }

  const payload = {
    firstName: this.profileData.firstName,
    lastName: this.profileData.lastName,
    email: this.profileData.email,
    contact: this.profileData.mobile,
    designation: this.profileData.designation
  };

  console.log('Update payload:', payload);

  this.http.put(`${environment.apiUrl}/users/${userId}`, payload).subscribe({
    next: (res) => {
      console.log('Profile updated successfully', res);
      alert('Profile updated successfully');
      this.loadProfileDetails();
    },
    error: (err) => {
      console.error('Failed to update profile', err);
      alert('Failed to update profile');
    }
  });
}
}