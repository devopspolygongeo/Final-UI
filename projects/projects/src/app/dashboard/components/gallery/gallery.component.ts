import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Asset } from '../../../core/models';
import { AppDialogComponent } from '../../../shared/components/app-dialog/app-dialog.component';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryComponent {

  @Input() assets!: Asset[];
  @Output() closeBtnEv: EventEmitter<boolean> = new EventEmitter<boolean>();

  images: Asset[] = [];
  videos: Asset[] = [];

  constructor(public dialog: MatDialog) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assets'] && changes['assets'].currentValue != changes['assets'].previousValue) {
      this.images = this.assets.filter(asset => asset.type === 'image');
      this.videos = this.assets.filter(asset => asset.type === 'video');
    }
  }

  onClickImage(image: Asset) {
    this.dialog.open(AppDialogComponent, { data: { asset: image }, height: '80%', width: '80%' });
  }

  onClickVideo(event: Event, video: Asset) {
    event.stopImmediatePropagation();
    this.dialog.open(AppDialogComponent, { data: { asset: video }, height: '80%', width: '80%' });
  }

  closeButton(event: any) {
    this.closeBtnEv.emit(true);
  }
}
