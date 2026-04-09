import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AppDialogComponent } from '../../../shared/components/app-dialog/app-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Asset } from '../../../core/models';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsComponent {
  @Output() closeBtnEv: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() assets!: Asset[];

  documents: Asset[] = [];
  filteredDocuments: Asset[] = [];
  searchText: string = '';

  constructor(public dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['assets'] &&
      changes['assets'].currentValue !== changes['assets'].previousValue
    ) {
      this.documents = (this.assets || []).filter(
        (asset: Asset) => asset.type === 'document',
      );
      this.applyFilter();
    }
  }

  onSearchChange() {
    this.applyFilter();
  }

  clearSearch() {
    this.searchText = '';
    this.applyFilter();
  }

  applyFilter() {
    const searchValue = (this.searchText || '').trim().toLowerCase();

    if (!searchValue) {
      this.filteredDocuments = [...this.documents];
      return;
    }

    this.filteredDocuments = this.documents.filter((document: Asset) =>
      this.getDocumentDisplayName(document).toLowerCase().includes(searchValue),
    );
  }

  onClickDocument(document: Asset) {
    this.dialog.open(AppDialogComponent, {
      data: { asset: document },
      height: '80%',
      width: '80%',
    });
  }

  getDocumentDisplayName(document: any): string {
    if (document?.name && String(document.name).trim()) {
      return String(document.name).trim();
    }

    if (document?.title && String(document.title).trim()) {
      return String(document.title).trim();
    }

    if (document?.fileName && String(document.fileName).trim()) {
      return String(document.fileName).trim();
    }

    if (document?.url) {
      const urlParts = String(document.url).split('/');
      const fileName = urlParts[urlParts.length - 1]?.split('?')[0];
      if (fileName) {
        return decodeURIComponent(fileName);
      }
    }

    return 'Untitled Document';
  }

  closeButton(event: any) {
    this.closeBtnEv.emit(true);
  }
}
