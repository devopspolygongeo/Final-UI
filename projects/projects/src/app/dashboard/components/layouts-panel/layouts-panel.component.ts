import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Layout, LayoutAttribute, PlotDetails } from '../../../core/models';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-layouts-panel',
  templateUrl: './layouts-panel.component.html',
  styleUrls: ['./layouts-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutsPanelComponent {

  @Input() layouts: Layout[] = [];
  @Input() layoutAttributes: LayoutAttribute[] = [];
  @Input() plot!: PlotDetails | undefined;
  @Input() showLayoutPanel!: boolean;
  @Output() showLayoutPanelChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  layoutDetails!: { name: string, value: string, attribute: string, iconStyle: string, priority: number }[];

  requestPlotForm!: FormGroup
  showInfoBox: boolean = true;
  showInterestForm = false;
  selectedTabIndex = 0;
  constructor(readonly fb: FormBuilder) {

  }

  ngOnInit() {
    console.log('LayoutsPanelComponent initialized');
    this.requestPlotForm = this.fb.group({
      userName: ['', Validators.required],
      email: ['', Validators.required, Validators.email],
      phoneNo: ['', Validators.required]
    })
  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes['layouts'] && changes['layouts'].currentValue != changes['layouts'].previousValue) {
      this.populateLayoutDetails();
      this.selectedTabIndex = 0;
    }
    if (changes['plot'] && changes['plot'].currentValue != changes['plot'].previousValue) {
      this.selectedTabIndex = 1
    }
  }

  closeLayoutPanelDisplay() {
    this.showLayoutPanel = false;
    this.showLayoutPanelChange.emit(false);
  }

  closeInfoBox() {
    this.showInfoBox = false;
  }

  populateLayoutDetails() {
    if (this.layouts && this.layouts.length) {
      this.layoutDetails = [];
      this.layoutAttributes.forEach(attr => {
        this.layoutDetails.push({ name: attr.displayName, value: this.layouts[0][attr.name as keyof Layout] + '', attribute: attr.name, iconStyle: attr.iconStyle, priority: attr.priority });
      });
      this.layoutDetails.sort((a, b) => a.priority - b.priority);
    }
  }

  requestPlotDetails() {
    this.showInfoBox = true;
    this.showInterestForm = true;
  }

  onInterestSubmission() {
    console.log('interest form submitted');
  }
}
