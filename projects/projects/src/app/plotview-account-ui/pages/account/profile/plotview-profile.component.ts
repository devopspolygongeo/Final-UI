import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
    selector: 'app-plotview-profile',
    templateUrl: './plotview-profile.component.html',
    styleUrls: ['./plotview-profile.component.css']
})
export class PlotviewProfileComponent implements OnInit {
    ngOnInit(): void {
        //throw new Error('Method not implemented.');
    }
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
