import { Component } from '@angular/core';

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

    showCurrentPassword: boolean = false;
    showNewPassword: boolean = false;
    showConfirmPassword: boolean = false;

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
        if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
            alert('New password and confirm password do not match!');
            return;
        }

        console.log('Password change data:', this.passwordData);
        // Handle password change logic here
    }
}
