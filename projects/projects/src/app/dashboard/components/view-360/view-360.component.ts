import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Asset } from '../../../core/models';
import { Viewer } from '@photo-sphere-viewer/core';

@Component({
  selector: 'app-view-360',
  templateUrl: './view-360.component.html',
  styleUrls: ['./view-360.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class View360Component {

  @Input() assets!: Asset[];
  @Output() closeBtnEv: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('PanoViewer') $el!: ElementRef<HTMLElement>;
  viewer!: Viewer;
  panoramas: Asset[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assets'] && changes['assets'].currentValue != changes['assets'].previousValue) {
      this.panoramas = this.assets.filter(asset => asset.type === 'panorama');
      this.setPanaroma();
    }
  }

  ngAfterViewInit() {
    this.viewer = new Viewer({
      container: this.$el.nativeElement,
      touchmoveTwoFingers: true,
      mousewheelCtrlKey: true
    });
    this.setPanaroma()
  }

  setPanaroma(panorama?: Asset) {
    panorama = panorama ? panorama : this.panoramas.find(panaroma => panaroma);
    if (this.viewer && panorama) {
      this.viewer.setPanorama(panorama.url);
    }
  }

}
