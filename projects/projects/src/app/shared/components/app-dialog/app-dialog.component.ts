import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { Asset } from '../../../core/models/geo/asset.model';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface AppDialogData {
  content?: string,
  asset?: Asset,
  title?: string,
  closeBtn?: boolean
}

@Component({
  selector: 'app-dialog',
  templateUrl: './app-dialog.component.html',
  styleUrls: ['./app-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: AppDialogData) {

  }

  ngOnInit() {
    // console.log(this.data);
  }

}
