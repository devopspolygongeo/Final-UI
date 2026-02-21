// subscription-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-subscription-dialog',
  templateUrl: './subscription-dialog.component.html',
  styleUrls: ['./subscription-dialog.component.css']
})
export class SubscriptionDialogComponent {
  subscriptionForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.subscriptionForm = this.fb.group({
      subscriptionId: [''],
      assetAssigned: [''],
      validity: [''],
      area: [''],
      plan: [''],
      amount: [''],
      active: [false],
      date: ['']
    });

    if (data) {
      this.subscriptionForm.patchValue(data);
    }
  }

  onSubmit(): void {
    if (this.subscriptionForm.valid) {
      this.dialogRef.close(this.subscriptionForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
