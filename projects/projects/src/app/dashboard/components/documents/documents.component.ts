import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { AppDialogComponent } from '../../../shared/components/app-dialog/app-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Asset } from '../../../core/models';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsComponent {
  @Output() closeBtnEv: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() assets!: Asset[];
  documents: Asset[] = [];

  constructor(public dialog: MatDialog) {

  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['assets'] && changes['assets'].currentValue != changes['assets'].previousValue) {
      this.documents = this.assets.filter(asset => asset.type === 'document');
    }
  }

  onClickDocument(document: Asset) {
    this.dialog.open(AppDialogComponent, { data: { asset: document }, height: '80%', width: '80%' });
  }
  closeButton(event: any) {
    this.closeBtnEv.emit(true);
  }

}
