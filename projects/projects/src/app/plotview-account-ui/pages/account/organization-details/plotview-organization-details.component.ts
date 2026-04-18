import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'projects/projects/src/app/login/services/auth.service';
import { environment } from 'projects/projects/src/environments/environment';

@Component({
  selector: 'app-plotview-organization-details',
  templateUrl: './plotview-organization-details.component.html',
  styleUrls: ['./plotview-organization-details.component.css'],
})
export class PlotviewOrganizationDetailsComponent implements OnInit {
  companyName = '';
  billingContactName = '';
  email = '';
  gstDetails = '';
  corporateAddress = '';
  billingAddress = '';

  isBillingContactEditable = false;
  isBillingAddressEditable = false;

  private originalBillingContactName = '';
  private originalBillingAddress = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrganizationDetails();
  }

  loadOrganizationDetails() {
    const user = this.authService.getCurrentUser();
    const clientId = user?.clientId;

    if (!clientId) {
      console.error('Client ID not found');
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/clients/${clientId}`).subscribe({
      next: (res) => {
        console.log('Organization API response:', res);

        this.companyName = res.companyName ?? '';
        this.billingContactName = res.billingContactName ?? '';
        this.email = user?.email ?? '';
        this.gstDetails = res.gstDetails ?? '';
        this.corporateAddress = res.corporateAddress ?? '';
        this.billingAddress = res.billingAddress ?? '';
      },
      error: (err) => {
        console.error('Failed to load organization details', err);
      }
    });
  }

  toggleBillingContactEdit() {
    if (!this.isBillingContactEditable) {
      this.originalBillingContactName = this.billingContactName;
      this.isBillingContactEditable = true;

      setTimeout(() => {
        const input = document.querySelector('input[readonly="false"]') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    } else {
      this.isBillingContactEditable = false;
      console.log('Billing Contact Name updated:', this.billingContactName);
    }
  }

  toggleBillingAddressEdit() {
    if (!this.isBillingAddressEditable) {
      this.originalBillingAddress = this.billingAddress;
      this.isBillingAddressEditable = true;

      setTimeout(() => {
        const textarea = document.querySelector('.address-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      }, 0);
    } else {
      this.isBillingAddressEditable = false;
      console.log('Billing Address updated:', this.billingAddress);
    }
  }

  saveBillingAddress() {
    this.isBillingAddressEditable = false;
    console.log('Billing Address saved:', this.billingAddress);
  }

  cancelBillingContactEdit() {
    this.billingContactName = this.originalBillingContactName;
    this.isBillingContactEditable = false;
  }

  cancelBillingAddressEdit() {
    this.billingAddress = this.originalBillingAddress;
    this.isBillingAddressEditable = false;
  }

 onSaveChanges() {
  const user = this.authService.getCurrentUser();
  const clientId = user?.clientId || user?.clientid;

  if (!clientId) {
    console.error('Client ID not found');
    return;
  }

  const payload = {
    companyName: this.companyName,
    billingContactName: this.billingContactName,
    corporateAddress: this.corporateAddress,
    gstDetails: this.gstDetails,
    billingAddress: this.billingAddress
  };

  console.log('Sending payload:', payload);

  this.http.put(`${environment.apiUrl}/clients/${clientId}`, payload)
    .subscribe({
      next: (res) => {
        console.log('Saved successfully', res);
        alert('Saved to DB successfully');
      },
      error: (err) => {
        console.error('Save failed', err);
      }
    });
}
}