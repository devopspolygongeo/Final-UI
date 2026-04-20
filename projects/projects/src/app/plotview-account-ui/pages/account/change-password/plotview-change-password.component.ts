import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'projects/projects/src/app/login/services/auth.service';
import { environment } from 'projects/projects/src/environments/environment';

@Component({
  selector: 'app-plotview-change-password',
  templateUrl: './plotview-change-password.component.html',
  styleUrls: ['./plotview-change-password.component.css']
})
export class PlotviewChangePasswordComponent {
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  togglePasswordVisibility(field: string) {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  onChangePassword() {
    const loggedInUser = this.authService.getCurrentUser();
    const userId = loggedInUser?.id;

    if (!userId) {
      alert('User not found');
      return;
    }

    if (!this.passwordData.currentPassword || !this.passwordData.newPassword || !this.passwordData.confirmPassword) {
      alert('Please fill all fields');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      alert('New password and confirm password do not match!');
      return;
    }

    const payload = {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    };

    this.http.put(`${environment.apiUrl}/users/${userId}/change-password`, payload).subscribe({
      next: (res) => {
        console.log('Password changed successfully', res);
        alert('Password changed successfully');

        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: (err) => {
        console.error('Failed to change password', err);
        alert(err?.error?.message || 'Failed to change password');
      }
    });
  }
}