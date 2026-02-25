import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AppConstants } from '../../../core/constants/app.constants';
import {
  Group,
  Layer,
  PaintProperty,
  Source,
  Toggle,
} from '../../../core/models/';
import { MapService } from '../../../shared/services/map.service';
import { Subscription } from 'rxjs';

type GroupToggle = { toggles: Toggle[]; visibility: boolean; expand: boolean };

@Component({
  selector: 'app-layers',
  templateUrl: './layers.component.html',
  styleUrls: ['./layers.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersComponent implements OnInit, OnDestroy {
  @Input() sources: Source[] = [];
  @Input() groups: Group[] = [];

  @Output() layerToggleEv: EventEmitter<Toggle[]> = new EventEmitter<
    Toggle[]
  >();
  @Output() layerPaintChangeEv: EventEmitter<PaintProperty[]> =
    new EventEmitter<PaintProperty[]>();

  globalLayerToggles: Toggle[] = [];
  classicLayersToggleMap: Map<string, GroupToggle> = new Map();
  categoryLayersToggleMap: Map<string, GroupToggle> = new Map();
  filterLayersToggleMap: Map<string, GroupToggle> = new Map();
  selectedGroupToggle!: string;

  readonly GLOBAL = AppConstants.GLOBAL;
  readonly CLASSIC = AppConstants.CLASSIC;
  readonly CLASSIFY_BY_FILTER = AppConstants.CLASSIFY_BY_FILTER;
  readonly CLASSIFY_BY_CATEGORY = AppConstants.CLASSIFY_BY_CATEGORY;

  selectedGroupType: string = this.CLASSIFY_BY_CATEGORY;

  subscriptions: Subscription[] = [];
  constructor(readonly mapService: MapService) {}

  // ✅ Normalize DB values like 0/1, "0"/"1", "true"/"false" into boolean
  private toBool(v: any): boolean {
    if (v === true || v === false) return v;
    if (v === 1 || v === 0) return v === 1;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'true' || s === '1') return true;
      if (s === 'false' || s === '0' || s === '') return false;
    }
    return Boolean(v);
  }

  ngOnInit() {
    this.subscriptions.push(
      this.mapService.isMapLoaded().subscribe((isMapLoaded) => {
        if (isMapLoaded) {
          this.resetTogglesVisibility(this.GLOBAL);
          this.resetTogglesVisibility(this.CLASSIC);
          this.resetTogglesVisibility(this.CLASSIFY_BY_CATEGORY);

          // ✅ FALLBACK 1: If map is loaded but no group is selected, pick the first available category
          if (
            !this.selectedGroupToggle &&
            this.categoryLayersToggleMap.size > 0
          ) {
            this.selectedGroupToggle = this.categoryLayersToggleMap
              .keys()
              .next().value;
          }
        }
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['sources'] &&
      changes['sources'].currentValue != changes['sources'].previousValue
    ) {
      this.loadLayers();
      this.selectedGroupType = this.CLASSIFY_BY_CATEGORY;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  addToToggleMap(
    map: Map<string, GroupToggle>,
    groupName: string,
    toggleItem: Toggle,
    visibility: boolean,
  ) {
    if (map.has(groupName)) {
      map.get(groupName)?.toggles.push(toggleItem);
    } else {
      map.set(groupName, {
        toggles: [toggleItem],
        visibility: visibility,
        expand: visibility,
      } as GroupToggle);
    }
  }

  loadLayers() {
    this.globalLayerToggles = [];
    this.classicLayersToggleMap = new Map();
    this.categoryLayersToggleMap = new Map();
    this.filterLayersToggleMap = new Map();

    // Reset selection to allow fresh logic for each project load
    let fallbackGroupName: string | null = null;

    for (let source of this.sources) {
      if (source.dataType == 'raster') {
        this.globalLayerToggles.push({
          id: source.name,
          checked: this.toBool(source.visibility),
          metaData: { source: source },
        });
      } else if (source.layers) {
        for (let layer of source.layers) {
          if (layer.group) {
            const toggleItem: Toggle = {
              id: this.getLayerName(layer),
              name: layer.displayName,
              checked: this.toBool((layer as any).visibility),
              metaData: { layer: layer },
            };

            if (layer.group.type === AppConstants.GLOBAL_GROUP_ID) {
              toggleItem.metaData.groupType = this.GLOBAL;
              this.globalLayerToggles.push(toggleItem);
            } else if (layer.group.type === AppConstants.CLASSIC_GROUP_ID) {
              toggleItem.metaData.groupType = this.CLASSIC;
              this.addToToggleMap(
                this.classicLayersToggleMap,
                layer.group.name,
                toggleItem,
                this.toBool(layer.group.visibility),
              );
            } else if (
              layer.group.type === AppConstants.VIEW_BY_CLASSIFICATION
            ) {
              // ✅ Store the first group name encountered as a fallback
              if (!fallbackGroupName) {
                fallbackGroupName = layer.group.name;
              }

              if (this.toBool(layer.group.visibility)) {
                this.selectedGroupToggle = layer.group.name;
              }

              toggleItem.metaData.groupType = this.CLASSIFY_BY_CATEGORY;
              this.addToToggleMap(
                this.categoryLayersToggleMap,
                layer.group.name,
                toggleItem,
                false,
              );

              const filterToggle = JSON.parse(JSON.stringify(toggleItem));
              filterToggle.metaData.groupType = this.CLASSIFY_BY_FILTER;
              this.addToToggleMap(
                this.filterLayersToggleMap,
                layer.group.name,
                filterToggle,
                this.toBool(layer.group.visibility),
              );
            }
          }
        }
      }
    }

    // ✅ FALLBACK 2: If after processing all sources no active group was set by visibility flag
    if (!this.selectedGroupToggle && fallbackGroupName) {
      this.selectedGroupToggle = fallbackGroupName;
    }
  }

  getLayerName(layer: Layer) {
    if (layer.name === 'waypoints') return layer.sourceId + '-' + layer.name;
    else return layer.name;
  }

  onLayerToggle(event: MatSlideToggleChange, toggle: Toggle) {
    toggle.checked = event.checked;
    this.layerToggleEv.emit([toggle]);

    if (toggle.metaData?.groupType === this.CLASSIFY_BY_FILTER) {
      const paintProps = {
        layer: toggle.metaData.layer,
        color: event.checked ? '#3f51b5' : 'transparent',
      } as PaintProperty;
      this.layerPaintChangeEv.emit([paintProps]);
    }
  }

  resetTogglesVisibility(groupType: string) {
    if (groupType === this.GLOBAL) {
      this.globalLayerToggles.forEach((toggle) => {
        if (toggle.metaData?.source)
          toggle.checked = this.toBool(toggle.metaData.source.visibility);
        else if (toggle.metaData?.layer)
          toggle.checked = this.toBool(toggle.metaData.layer.visibility);
      });
      this.layerToggleEv.emit(this.globalLayerToggles);
    } else if (groupType === this.CLASSIC) {
      if (this.classicLayersToggleMap.size) {
        const allToggles = Array.from(
          this.classicLayersToggleMap.values(),
        ).flatMap((item) => item.toggles);

        allToggles.forEach(
          (toggle) =>
            (toggle.checked = this.toBool(toggle.metaData?.layer.visibility)),
        );
        this.layerToggleEv.emit(allToggles);

        const paintProperties = allToggles.map((toggle) => {
          return {
            layer: toggle.metaData.layer,
            color: toggle.metaData.layer.topography?.fillColor,
          } as PaintProperty;
        });
        this.layerPaintChangeEv.emit(paintProperties);
      }
    } else if (groupType === this.CLASSIFY_BY_CATEGORY) {
      if (this.categoryLayersToggleMap.size) {
        const allToggles = Array.from(
          this.categoryLayersToggleMap.values(),
        ).flatMap((item) => item.toggles);

        allToggles.forEach(
          (toggle) =>
            (toggle.checked = this.toBool(toggle.metaData?.layer.visibility)),
        );
        this.layerToggleEv.emit(allToggles);

        this.selectedGroupToggle =
          allToggles.find((toggle) =>
            this.toBool(toggle.metaData.layer.group.visibility),
          )?.metaData.layer.group.name || this.selectedGroupToggle;

        const paintProperties = allToggles.map((toggle) => {
          return {
            layer: toggle.metaData.layer,
            color: toggle.metaData.layer.topography?.fillColor,
          } as PaintProperty;
        });
        this.layerPaintChangeEv.emit(paintProperties);
      }
    } else if (groupType === this.CLASSIFY_BY_FILTER) {
      if (this.filterLayersToggleMap.size) {
        const allToggles = Array.from(
          this.filterLayersToggleMap.values(),
        ).flatMap((item) => item.toggles);

        allToggles.forEach(
          (toggle) =>
            (toggle.checked = this.toBool(toggle.metaData?.layer.visibility)),
        );
        this.layerToggleEv.emit(allToggles);

        const paintProps = allToggles.map((toggle) => {
          return {
            layer: toggle.metaData?.layer as Layer,
            color: toggle.checked ? '#3f51b5' : 'transparent',
          };
        });
        this.layerPaintChangeEv.emit(paintProps);
      }
    }
  }

  onGroupToggle(event: MatSlideToggleChange, groupType: string) {
    const map = this.getToggleMap(groupType);
    if (map && map.has(event.source.id)) {
      const groupToggle = map.get(event.source.id);
      if (groupToggle) {
        groupToggle.toggles.forEach(
          (toggleItem) => (toggleItem.checked = event.checked),
        );
        this.layerToggleEv.emit(Object.assign([], groupToggle.toggles));

        if (groupType === this.CLASSIFY_BY_FILTER) {
          const paintProps = groupToggle.toggles
            .map((toggle) => toggle.metaData?.layer as Layer)
            .map((layer) => {
              return {
                layer: layer,
                color: event.checked ? '#3f51b5' : 'transparent',
              } as PaintProperty;
            });
          this.layerPaintChangeEv.emit(paintProps);
        }
      }
    }
  }

  private getToggleMap(groupType: string) {
    let map;
    if (groupType === this.CLASSIC) {
      map = this.classicLayersToggleMap;
    } else if (groupType === this.CLASSIFY_BY_CATEGORY) {
      map = this.categoryLayersToggleMap;
    } else if (groupType === this.CLASSIFY_BY_FILTER) {
      map = this.filterLayersToggleMap;
    }
    return map;
  }

  onGroupNameClick(groupToggle: GroupToggle) {
    groupToggle.expand = !groupToggle.expand;
  }

  onLayerColorChange(event: any, toggle: Toggle) {
    if (toggle.metaData && toggle.metaData['layer']) {
      this.layerPaintChangeEv.emit([
        {
          layer: toggle.metaData.layer,
          color: event?.target?.value,
        } as PaintProperty,
      ]);
    }
  }

  onCategoryChange(categoryName: string) {
    let emitToggles: Toggle[] = [];
    for (let [key, value] of this.categoryLayersToggleMap) {
      value.toggles.forEach(
        (toggleItem) => (toggleItem.checked = key === categoryName),
      );
      emitToggles.push(...value.toggles);
    }
    this.selectedGroupToggle = categoryName;
    this.layerToggleEv.emit(emitToggles);
  }

  changeLayoutGroupType(groupType: string) {
    this.selectedGroupType = groupType;
    this.resetTogglesVisibility(groupType);
  }

  sortGroupsByPriority(a: any, b: any) {
    return a.priority - b.priority;
  }

  sortLayersByPriority(a: any, b: any) {
    return a.metaData?.layer?.priority - b.metaData?.layer?.priority;
  }
}
