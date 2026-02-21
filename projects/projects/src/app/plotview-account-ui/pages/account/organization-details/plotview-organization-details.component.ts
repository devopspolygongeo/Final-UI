import { Component } from '@angular/core';

@Component({
    selector: 'app-plotview-organization-details',
    templateUrl: './plotview-organization-details.component.html',
    styleUrls: ['./plotview-organization-details.component.css'],
})
export class PlotviewOrganizationDetailsComponent {
    companyName = '';
    billingContactName = '';
    email = '';
    gstDetails = '';
    corporateAddress = '3-15/10/403 Newark, Street no 5, Next To Pizza Hut, Bangalore, Karnataka, 560003, India.';
    billingAddress = '2-15A-12, Steriling Chambers, S Radhakrishnana Marg, J B Nagar, Andheri (west), Mumbai, Maharashtra';

    // Edit states
    isBillingContactEditable = false;
    isBillingAddressEditable = false;

    // Store original values for cancel functionality
    private originalBillingContactName = '';
    private originalBillingAddress = '';

    toggleBillingContactEdit() {
        if (!this.isBillingContactEditable) {
            // Start editing - store original value
            this.originalBillingContactName = this.billingContactName;
            this.isBillingContactEditable = true;

            // Focus the input after view update
            setTimeout(() => {
                const input = document.querySelector('input[readonly="false"]') as HTMLInputElement;
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 0);
        } else {
            // Stop editing - save changes
            this.isBillingContactEditable = false;
            console.log('Billing Contact Name updated:', this.billingContactName);
        }
    }

    toggleBillingAddressEdit() {
        if (!this.isBillingAddressEditable) {
            // Start editing - store original value
            this.originalBillingAddress = this.billingAddress;
            this.isBillingAddressEditable = true;

            // Focus the textarea after view update
            setTimeout(() => {
                const textarea = document.querySelector('.address-textarea') as HTMLTextAreaElement;
                if (textarea) {
                    textarea.focus();
                    textarea.select();
                }
            }, 0);
        } else {
            // Stop editing - save changes
            this.isBillingAddressEditable = false;
            console.log('Billing Address updated:', this.billingAddress);
        }
    }

    saveBillingAddress() {
        // Called when textarea loses focus
        this.isBillingAddressEditable = false;
        console.log('Billing Address saved:', this.billingAddress);
    }

    // Method to cancel editing (optional - can be called on Escape key)
    cancelBillingContactEdit() {
        this.billingContactName = this.originalBillingContactName;
        this.isBillingContactEditable = false;
    }

    cancelBillingAddressEdit() {
        this.billingAddress = this.originalBillingAddress;
        this.isBillingAddressEditable = false;
    }

    onSaveChanges() {
        console.log('Saving Organization Details', {
            companyName: this.companyName,
            billingContactName: this.billingContactName,
            email: this.email,
            gstDetails: this.gstDetails,
            corporateAddress: this.corporateAddress,
            billingAddress: this.billingAddress,
        });

        // You can add your API call here to save the data
        alert('Organization details saved successfully!');
    }
}