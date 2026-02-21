import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { LngLat, MapLayerMouseEvent, MapMouseEvent, Point } from 'mapbox-gl';
import { Observable, debounceTime, distinctUntilChanged, filter, of, startWith, switchMap } from 'rxjs';
import { Landmark, MapBoxDirections, MapConfig, MapboxSuggestion } from '../../../core/models';
import { MapService } from '../../../shared/services/map.service';
import { AppConstants } from '../../../core/constants/app.constants';

type LandmarkNavItem = { name: string, description: string, active: boolean, iconStyle: string, landmark?: Landmark }

@Component({
  selector: 'app-mobileView-landmarks',
  templateUrl: './landmarks.component.html',
  styleUrls: ['./landmarks.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LandmarksMobileViewComponent {

  @Input() landmarks!: Landmark[];
  @Input() mapConfig!: MapConfig;
  @Input() mapEvent!: MapMouseEvent | MapLayerMouseEvent;

  @ViewChild('landmarkSearchInput') landmarkSearchInput!: ElementRef;
  @Output() showDirectionsEv: EventEmitter<MapBoxDirections> = new EventEmitter<MapBoxDirections>();

  landmarkNavItems!: LandmarkNavItem[];
  searchLandmark = new FormControl<string>('');
  autoCompleteList: Observable<MapboxSuggestion[]> = of([]);
  addlInfo!: { distance: number, duration: string } | undefined;

  constructor(private readonly mapService: MapService) { }

  ngOnInit() {
    this.autoCompleteList = this.searchLandmark.valueChanges.pipe(
      startWith(''),
      filter(val => typeof val === 'string'),
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(value => this.getSuggestions(value || ''))
    )
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['landmarks'] && changes['landmarks'].currentValue != changes['landmarks'].previousValue) {
      this.addlInfo = undefined;
      this.autoCompleteList = of([]);
      this.searchLandmark.patchValue('');
      this.populateLandmarkNavItems();
    } else if (changes['mapEvent'] && changes['mapEvent'].currentValue != changes['mapEvent'].previousValue) {
      if (this.mapEvent.type === AppConstants.MAP_MOUSE_RIGHT_CLICK_EVENT) {
        this.getRoute(this.mapEvent.lngLat);
      }
    }
  }

  populateLandmarkNavItems() {
    this.landmarkNavItems = [{ name: 'Copter View', description: 'All landmarks', iconStyle: 'copter-view', active: true }];
    this.landmarkNavItems.push(...this.landmarks.map(landmark => {
      return { name: landmark.name, description: landmark.description, iconStyle: 'landmark-icon', active: false, landmark: landmark } as LandmarkNavItem
    }));
  }

  getSuggestions(searchText: string) {
    if (searchText && searchText.trim()) {
      return this.mapService.getSuggestions(searchText, `${this.mapConfig.longitude},${this.mapConfig.latitude}`);
    } else {
      return of([]);
    }
  }

  onAutocompleteSelection(selectedSuggestion: MapboxSuggestion) {
    this.landmarkSearchInput.nativeElement.setSelectionRange(0, 0);
    this.landmarkSearchInput.nativeElement.focus();
    this.mapService.retrieveFeature(selectedSuggestion.mapbox_id).subscribe(featureCollection => {
      const feature = featureCollection.features.find(feature => feature.geometry.type === 'Point');
      if (feature) {
        const coords = (feature.geometry as GeoJSON.Point).coordinates;
        if (coords && coords.length == 2) {
          this.getRoute(new LngLat(coords[0], coords[1]));
        }
      }
    });
  }

  displayFn(suggestion: MapboxSuggestion): string {
    return suggestion && suggestion.name ? suggestion.name + (suggestion.full_address ? '- ' + suggestion.full_address : '') : '';
  }

  onClickLandmark(event: Event, navItem: LandmarkNavItem) {
    if (navItem.landmark) {
      this.getRoute(new LngLat(navItem.landmark.longitude, navItem.landmark.latitude));
    } else {
      this.showDirectionsEv.emit({} as MapBoxDirections);
    }
    this.landmarkNavItems.forEach(item => {
      item.active = item.name === navItem.name;
    })
  }

  getRoute(end: LngLat) {
    const start = new LngLat(this.mapConfig.longitude, this.mapConfig.latitude);
    this.mapService.getRoute(start, end).subscribe(directions => {
      this.showDirectionsEv.emit(directions);
      if (directions && directions.routes && directions.routes.length > 0)

        this.addlInfo = { distance: directions.routes[0].distance, duration: this.convertDuration(directions.routes[0].duration) }
    })
  }

  convertDuration(input: number) {
    const hour = Math.floor(input / 3600);
    const minutes = input / 60 - (hour * 60);
    let duration = hour ? hour + 'hr' : '';
    duration += duration ? ': ' : '';
    duration += minutes ? minutes.toFixed(0) + 'min' : '';
    return duration;
  }
}
