import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
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
export class LayersComponent {
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
    // console.log('LayersComponent initialized');
    this.subscriptions.push(
      this.mapService.isMapLoaded().subscribe((isMapLoaded) => {
        if (isMapLoaded) {
          this.resetTogglesVisibility(this.GLOBAL);
          this.resetTogglesVisibility(this.CLASSIC);
          this.resetTogglesVisibility(this.CLASSIFY_BY_CATEGORY);
        }
      }),
    );
    //console.log('LayersComponent initialized',this.mapService);
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

    for (let source of this.sources) {
      //console.log('📦 Source received:', source.name, source);

      if (source.dataType == 'raster') {
        this.globalLayerToggles.push({
          id: source.name,
          checked: this.toBool(source.visibility),
          metaData: { source: source },
        });
      } else if (source.layers) {
        //console.log(`📄 Layers under source "${source.name}":`, source.layers);

        for (let layer of source.layers) {
          // console.log('entire layer:', layer);
          // console.log(
          //   '🔍 Processing layer:',
          //   layer.name,
          //   'with group:',
          //   layer.group?.name,
          //   'type:',
          //   layer.group?.type,
          // );

          if (layer.group) {
            //setting the group visibility for all the layers under it
            // console.log('SOURCE', source.name, source);
            // if (source.layers) {
            //   for (let layer of source.layers) {
            //     console.log('🔍 Final Layer Object:', layer);
            //     console.log(
            //       'LAYER:',
            //       layer.name,
            //       'GROUP TYPE:',
            //       layer.group?.type,
            //     );
            //   }
            // }

            // ✅ IMPORTANT FIX:
            // checked MUST come from layer.visibility (DB layer-level),
            // NOT from layer.group.visibility (group-level).
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
              // selectedGroupToggle is about which category tab is selected,
              // it can remain group-based if your UX expects "default active category"
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
  }

  getLayerName(layer: Layer) {
    if (layer.name === 'waypoints') return layer.sourceId + '-' + layer.name;
    else return layer.name;
  }

  onLayerToggle(event: MatSlideToggleChange, toggle: Toggle) {
    toggle.checked = event.checked;
    // console.log(
    //   'TOGGLE EMIT:',
    //   toggle.id,
    //   toggle.metaData?.layer?.name,
    //   toggle.metaData?.layer?.sourceId,
    // );
    this.layerToggleEv.emit([toggle]);
    // console.log('APPLY VISIBILITY TO:', toggle.id);

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
      //console.log("Resetting global layer toggles visibility", this.globalLayerToggles);
      this.globalLayerToggles.forEach((toggle) => {
        if (toggle.metaData?.source)
          toggle.checked = this.toBool(toggle.metaData.source.visibility);
        else if (toggle.metaData?.layer)
          toggle.checked = this.toBool(toggle.metaData.layer.visibility);
      });
      this.layerToggleEv.emit(this.globalLayerToggles);
    } else if (groupType === this.CLASSIC) {
      //console.log("Resetting classic layer toggles visibility", this.classicLayersToggleMap);
      if (this.classicLayersToggleMap.size) {
        const allToggles = Array.from(
          this.classicLayersToggleMap.values(),
        ).flatMap((item) => item.toggles);

        // ✅ IMPORTANT FIX: reset based on layer.visibility (not group.visibility)
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
      //  console.log("Resetting category layer toggles visibility-categorywise", this.categoryLayersToggleMap);
      if (this.categoryLayersToggleMap.size) {
        const allToggles = Array.from(
          this.categoryLayersToggleMap.values(),
        ).flatMap((item) => item.toggles);

        // ✅ IMPORTANT FIX: reset based on layer.visibility (not group.visibility)
        allToggles.forEach(
          (toggle) =>
            (toggle.checked = this.toBool(toggle.metaData?.layer.visibility)),
        );
        this.layerToggleEv.emit(allToggles);

        // keep selected group based on group.visibility (existing UX)
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
      console.log(
        'Resetting filter layer toggles visibility-filterwise',
        this.filterLayersToggleMap,
      );
      if (this.filterLayersToggleMap.size) {
        const allToggles = Array.from(
          this.filterLayersToggleMap.values(),
        ).flatMap((item) => item.toggles);

        // ✅ IMPORTANT FIX: reset based on layer.visibility (not group.visibility)
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
