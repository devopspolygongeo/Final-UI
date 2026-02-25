import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import mapboxgl, {
  AnyLayer,
  Expression,
  FillLayer,
  GeoJSONSource,
  LngLat,
  MapLayerMouseEvent,
  RasterLayer,
} from 'mapbox-gl';
import { environment } from '../../../../environments/environment';
import { AppConstants } from '../../../core/constants/app.constants';
import {
  Layer,
  MapBoxDirections,
  MapConfig,
  PaintProperty,
  Toggle,
} from '../../../core/models';
import { MapService } from '../../services/map.service';
import { VolumeService } from '../../services/volume.service';
import { Feature, Polygon } from 'geojson';
import { HttpClient } from '@angular/common/http';

const DRAW_CTRL = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    line_string: true,
    polygon: true,
    trash: true,
  },
});
const NAVIGATION_CTRL = new mapboxgl.NavigationControl();
const EXTRUSION_SOURCE_ID = 'extrusion-source';
const EXTRUSION_LAYER_ID = 'extrusion-layer';

const BUILDING_LABEL_LAYER_ID = 'building-label-layer';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, OnChanges {
  @Input() mapConfig!: MapConfig;
  @Input() styleType: string = 'Street';
  @Input() layerVisibility!: Toggle[];
  @Input() layerPaintChange!: PaintProperty[];
  @Input() showLandmarks = false;
  @Input() directions!: MapBoxDirections;
  @Input() enableTerrain: boolean = false;
  @Input() terrainExaggeration: number = 1;
  @Input() enable25D: boolean = false;
  @Input() isMiningProject: boolean = false;

  @Input() buildings3DConfig: {
    tilesetId: string;
    layerName: string;
    heightField?: string;
  } | null = null;

  @Output() btnEv: EventEmitter<string> = new EventEmitter<string>();
  @Output() mapMouseEv: EventEmitter<MapLayerMouseEvent> =
    new EventEmitter<MapLayerMouseEvent>();

  map!: mapboxgl.Map;
  layersToBePreserved!: AnyLayer[];
  layerNames: string[] = [];
  interactionLayerNames: string[] = [];
  markers!: mapboxgl.Marker[];
  navigationEnabled = false;
  streetToggleActive = true;
  layoutPanelToggleActive = true;
  clickedFeatureId!: string;
  currentMeasurement: string = '';
  currentArea: string = '';
  is25DEnabled: boolean = false;

  // Flag to prevent state leakage between projects
  private isProjectSwitching: boolean = false;

  volumeBaseHeight?: number;
  volumePolygonGeoJSON?: Feature<Polygon>;
  volumeResult: any;

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

  private reapplyUiStateToMap(): void {
    // If we are switching projects, do NOT reapply old UI states
    if (this.isProjectSwitching) return;

    if (this.layerVisibility?.length) {
      this.toggleVisibility(this.layerVisibility);
    }
    if (this.layerPaintChange?.length) {
      this.changeLayerColor(this.layerPaintChange);
    }
    if (this.showLandmarks) {
      this.toggleMarkersAndNavigation();
    }
    if (this.directions) {
      this.showRoute();
    }
  }

  onBaseHeightChange(value: any) {
    this.volumeBaseHeight = value !== null ? Number(value) : undefined;
  }

  xyzFile: File | null = null;

  onXyzFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.xyzFile = input.files[0];
      console.log('📁 XYZ file selected:', this.xyzFile.name);
    }
  }

  private readonly VOLUME_SOURCE_ID = 'volume-boundary-source';
  private readonly VOLUME_LAYER_ID = 'volume-boundary-layer';

  activeTool: 'none' | 'volume' = 'none';

  private readonly BUILDING_SOURCE_ID = 'project-25d-src';
  private readonly BUILDING_LAYER_ID = 'project-25d-layer';

  onMouseEventFn = this.onMouseEvent.bind(this);

  constructor(
    private http: HttpClient,
    private readonly mapService: MapService,
    private volumeService: VolumeService,
  ) {}

  ngOnInit() {
    mapboxgl.accessToken = environment.mapBox.accessToken;

    this.map = new mapboxgl.Map({
      container: 'map',
      style:
        this.styleType == 'Street'
          ? this.mapConfig.streetUrl
          : this.mapConfig.satelliteUrl,
      zoom: this.mapConfig.zoom,
      minZoom: this.mapConfig.minZoom,
      maxZoom: this.mapConfig.maxZoom,
      center: [this.mapConfig.longitude, this.mapConfig.latitude],
      attributionControl: false,
    });

    this.map.on('draw.create', (e) => {
      if (this.activeTool !== 'volume') {
        return;
      }
      this.onVolumePolygonCreated(e);
    });

    this.listenOnLoad();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['mapConfig'] &&
      changes['mapConfig'].currentValue != changes['mapConfig'].previousValue
    ) {
      this.isProjectSwitching = true; // Set flag when project changes
      this.reloadMap();
    }
    if (
      changes['layerVisibility'] &&
      changes['layerVisibility'].currentValue !=
        changes['layerVisibility'].previousValue
    ) {
      // If parent explicitly sends new toggles, we allow application
      this.isProjectSwitching = false;
      this.toggleVisibility(this.layerVisibility);
    }
    if (
      changes['layerPaintChange'] &&
      changes['layerPaintChange'].currentValue !=
        changes['layerPaintChange'].previousValue
    ) {
      this.changeLayerColor(this.layerPaintChange);
    }
    if (
      changes['showLandmarks'] &&
      changes['showLandmarks'].currentValue !=
        changes['showLandmarks'].previousValue
    ) {
      this.toggleMarkersAndNavigation();
    }
    if (
      changes['directions'] &&
      changes['directions'].currentValue != changes['directions'].previousValue
    ) {
      this.showRoute();
    }
    if (changes['enableTerrain'] && this.map && this.map.isStyleLoaded()) {
      this.applyTerrain(this.enableTerrain);
    }
    if (changes['enable25D'] && this.map && this.map.isStyleLoaded()) {
      this.apply25D(this.enable25D);
    }

    if (
      changes['terrainExaggeration'] &&
      this.enableTerrain &&
      this.map &&
      this.map.isStyleLoaded()
    ) {
      this.applyTerrain(true);
    }
  }

  public resize(): void {
    try {
      this.map?.resize();
    } catch {}
  }

  onStyleTypeChange() {
    this.isProjectSwitching = false; // Preserving toggles for style change
    this.streetToggleActive = !this.streetToggleActive;
    if (this.styleType === 'Street') {
      this.styleType = 'Satellite';
    } else {
      this.styleType = 'Street';
    }
    this.layersToBePreserved = this.map.getStyle().layers.filter((layer) => {
      if (layer.hasOwnProperty('layout')) {
      }
    });
    this.reloadMap();
  }

  resetMapLocation() {
    if (this.map) {
      this.map.setCenter(
        new LngLat(this.mapConfig.longitude, this.mapConfig.latitude),
      );
      this.map.setZoom(this.mapConfig.zoom);
      this.map.setMinZoom(this.mapConfig.minZoom);
      this.map.setMaxZoom(this.mapConfig.maxZoom);
    }
  }

  private listenOnLoad() {
    this.map.on('load', () => {
      this.addAllMapSources();
      this.addAllMapLayers();
      this.addAllLandmarks();
      this.addControls();
      this.listenToMouseEvents();
      this.mapService.setMapLoaded(true);
      this.applyTerrain(this.enableTerrain);
      this.reapplyUiStateToMap();
      this.isProjectSwitching = false; // Reset flag after initial load
    });
  }

  private listenToMouseEvents() {
    this.layerNames = this.mapConfig.sources
      .flatMap((source) => source.layers || [])
      .map((layer) => this.getLayerName(layer));

    const allClickableLayers = [
      ...this.layerNames,
      ...this.interactionLayerNames,
    ];

    this.map.on('click', this.onMouseEventFn);
    this.map.on('mousemove', allClickableLayers, this.onMouseEventFn);
    this.map.on('mouseleave', allClickableLayers, this.onMouseEventFn);
  }

  private onMouseEvent(event: MapLayerMouseEvent) {
    if (event.type === AppConstants.MAP_MOUSE_MOVE_EVENT) {
      this.map.getCanvas().style.cursor = 'pointer';
    } else if (event.type === AppConstants.MAP_MOUSE_LEAVE_EVENT) {
      this.map.getCanvas().style.cursor = '';
    } else if (event.type === AppConstants.MAP_MOUSE_LEFT_CLICK_EVENT) {
      const features = this.map.queryRenderedFeatures(event.point, {
        layers: this.interactionLayerNames,
      });

      if (features.length > 0) {
        event.features = features;
      }

      if (this.mapConfig.enableHighlight) {
        if (event.features?.length) {
          const ftIndex = Math.max(
            event.features?.findIndex((ft) => ft.layer?.type === 'fill'),
            0,
          );
          const ft = event.features[ftIndex];
          if (this.clickedFeatureId) {
            this.map.setFeatureState(
              {
                source: ft.source,
                sourceLayer: ft.sourceLayer,
                id: this.clickedFeatureId,
              },
              { click: false },
            );
          }
          this.map.setFeatureState(
            { source: ft.source, sourceLayer: ft.sourceLayer, id: ft.id },
            { click: true },
          );
          this.clickedFeatureId = ft.id + '';
        }
      }
    }
    this.mapMouseEv.emit(event);
  }

  private listenToStyleData() {
    this.map.once('styledata', () => {
      this.addAllMapSources();
      this.addAllMapLayers();
      this.addAllLandmarks();
      this.addControls();
      this.mapService.setMapLoaded(true);
      this.reapplyUiStateToMap();
      this.isProjectSwitching = false; // Reset flag
    });
  }

  private addAllMapSources() {
    this.mapConfig.sources.forEach((source) => {
      if (source.dataType == 'vector' || source.dataType == 'raster') {
        if (!this.map.getSource(source.name)) {
          this.map.addSource(source.name, {
            url: 'mapbox://' + source.link,
            type: source.dataType,
          });
        }
      }
    });
  }

  private addAllMapLayers() {
    let rasterLayers: { priority: number; layer: AnyLayer }[] = [];
    let vectorLayers: { priority: number; layer: AnyLayer }[] = [];
    this.interactionLayerNames = [];

    this.mapConfig.sources.forEach((source) => {
      if (source.dataType === 'raster') {
        let rasterLayer: RasterLayer = {
          id: source.name,
          layout: {
            // This strictly follows the config of the NEW project
            visibility: source.visibility ? 'visible' : 'none',
          },
          source: source.name,
          type: source.dataType,
          'source-layer': source.name,
        };
        rasterLayers.push({ priority: source.priority, layer: rasterLayer });
      } else if (source.dataType === 'vector') {
        if (source.layers) {
          source.layers.forEach((layer) => {
            const layerName = this.getLayerName(layer);

            if (layer.name === 'tracks') {
              let tracksLayer: AnyLayer = {
                id: layerName,
                type: 'line',
                source: source.name,
                'source-layer': layer.name,
                layout: {
                  visibility: this.toBool(layer.visibility)
                    ? 'visible'
                    : 'none',
                },
                paint: {
                  'line-color': layer.topography?.color,
                  'line-width': parseInt(layer.topography?.width || '0'),
                },
              };
              vectorLayers.push({
                priority: layer.priority,
                layer: tracksLayer,
              });
            } else if (layer.name === 'waypoints') {
              let wayPointsLayer: AnyLayer = {
                id: layerName,
                type: 'symbol',
                source: source.name,
                'source-layer': layer.name,
                minzoom: 16,
                layout: {
                  visibility: layer.visibility ? 'visible' : 'none',
                  'text-field': ['get', layer.attribute],
                  'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    16,
                    10,
                    18,
                    14,
                    20,
                    18,
                  ],
                  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                  'text-anchor': 'center',
                  'text-allow-overlap': false,
                  'text-ignore-placement': false,
                },
                paint: {
                  'text-color': '#000000',
                },
              };
              vectorLayers.push({
                priority: layer.priority,
                layer: wayPointsLayer,
              });
            } else if (layer.topography?.vectorType === 'symbol') {
              let parcelLabelLayer: AnyLayer = {
                id: layerName,
                type: 'symbol',
                source: source.name,
                'source-layer': source.name,
                layout: {
                  visibility: this.toBool(layer.visibility)
                    ? 'visible'
                    : 'none',
                  'text-field': ['get', 'Parcel_num'],
                  'text-size': 11,
                  'text-allow-overlap': true,
                },
                paint: {
                  'text-color': '#000',
                  'text-halo-color': '#fff',
                  'text-halo-width': 1,
                },
              };
              vectorLayers.push({
                priority: layer.priority,
                layer: parcelLabelLayer,
              });
            } else {
              if (layer.topography?.vectorType == 'line') {
                const lineLayer: AnyLayer = {
                  id: layerName,
                  layout: {
                    visibility: this.toBool(layer.visibility)
                      ? 'visible'
                      : 'none',
                    'line-join': 'round',
                    'line-cap': 'round',
                  },
                  source: source.name,
                  type: 'line',
                  'source-layer': source.name,
                  paint: {
                    'line-color': this.getColor(layer),
                    'line-width': parseInt(layer.topography.width),
                  },
                };
                vectorLayers.push({
                  priority: layer.priority,
                  layer: lineLayer,
                });
              } else if (layer.topography?.vectorType == 'circle') {
                const circleLayer: AnyLayer = {
                  id: layerName,
                  layout: {
                    visibility: this.toBool(layer.visibility)
                      ? 'visible'
                      : 'none',
                  },
                  source: source.name,
                  type: 'circle',
                  'source-layer': source.name,
                  paint: {
                    'circle-radius': 2.75,
                    'circle-color': this.getColor(layer),
                  },
                };
                vectorLayers.push({
                  priority: layer.priority,
                  layer: circleLayer,
                });
              } else if (layer.topography?.vectorType == 'fill') {
                if (this.mapConfig.enableHighlight) {
                  this.addHighlightLayer(
                    AppConstants.MAP_MOUSE_LEFT_CLICK_EVENT,
                    source.name,
                    source.name,
                  );
                }

                const interactionLayerId = layerName + '-interaction';
                const interactionLayer: AnyLayer = {
                  id: interactionLayerId,
                  source: source.name,
                  type: 'fill',
                  'source-layer': source.name,
                  layout: { visibility: 'visible' },
                  paint: {
                    'fill-color': '#000',
                    'fill-opacity': 0,
                  },
                };
                vectorLayers.push({
                  priority: layer.priority,
                  layer: interactionLayer,
                });
                this.interactionLayerNames.push(interactionLayerId);

                const fillLayer: AnyLayer = {
                  id: layerName,
                  layout: {
                    visibility: this.toBool(layer.visibility)
                      ? 'visible'
                      : 'none',
                  },
                  source: source.name,
                  type: 'fill',
                  'source-layer': source.name,
                  paint: {
                    'fill-opacity': parseFloat(layer.topography?.fillOpacity),
                    'fill-color': this.getColor(layer),
                  },
                };
                vectorLayers.push({
                  priority: layer.priority,
                  layer: fillLayer,
                });
              }
            }
          });
        }
      }
    });

    rasterLayers.sort((a, b) => a.priority - b.priority);
    vectorLayers.sort((a, b) => a.priority - b.priority);

    rasterLayers.forEach((rasterLayer) => this.map.addLayer(rasterLayer.layer));
    vectorLayers.forEach((vectorLayer) => this.map.addLayer(vectorLayer.layer));
  }

  private addAllLandmarks() {
    this.markers = [];
    if (this.mapConfig && this.mapConfig.landmarks) {
      for (let landmark of this.mapConfig.landmarks) {
        const el = document.createElement('div');
        el.className = 'marker';
        this.markers.push(
          new mapboxgl.Marker(el)
            .setLngLat([landmark.longitude, landmark.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div class="text-center" ><h5 class="my-2">${landmark.name}</h5><p class="mb-1">${landmark.description}</p></div>`,
              ),
            ),
        );
      }
    }
  }

  addHighlightLayer(
    eventType: string,
    sourceName: string,
    sourceLayerName: string,
  ) {
    let layerId = eventType + 'HighlightedLayer_' + sourceLayerName;
    if (!this.map.getLayer(layerId)) {
      let clickLayer = {
        id: layerId,
        type: 'fill',
        source: sourceName,
        'source-layer': sourceLayerName,
        paint: {
          'fill-outline-color': '#484896',
          'fill-color': '#6e599f',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', eventType], false],
            1,
            0,
          ],
        },
      };
      this.map.addLayer(clickLayer as FillLayer);
    }
  }

  getLayerName(layer: Layer) {
    if (layer.name === 'waypoints') return layer.sourceId + '-' + layer.name;
    else return layer.name;
  }

  removeFilters(map: mapboxgl.Map, mapConfig: MapConfig) {
    let visibleLayers = mapConfig.sources
      .flatMap((source) => source.layers || [])
      .filter((layer) => {
        return (
          layer &&
          layer.name &&
          layer.group &&
          layer.group.type === AppConstants.VIEW_BY_CLASSIFICATION &&
          // @ts-ignore
          map.getLayer(this.getLayerName(layer))?.visibility === 'visible'
        );
      });

    visibleLayers.forEach((layer) => {
      this.map.setFilter(this.getLayerName(layer), undefined);
    });
  }

  setFilters(map: mapboxgl.Map, mapConfig: MapConfig) {
    let visibleLayers = mapConfig.sources
      .flatMap((source) => source.layers || [])
      .filter((layer) => {
        return (
          layer &&
          layer.name &&
          layer.group &&
          layer.group.type === AppConstants.VIEW_BY_CLASSIFICATION &&
          // @ts-ignore
          map.getLayer(this.getLayerName(layer))?.visibility === 'visible'
        );
      });

    if (visibleLayers && visibleLayers.length) {
      const attrMap = visibleLayers.reduce((group, layer) => {
        group.set(layer.attribute, [
          ...(group.get(layer.attribute) || []),
          this.getLayerName(layer),
        ]);
        return group;
      }, new Map());

      const filters = [
        'all',
        ...[...attrMap.entries()].map((entry) => ['in', entry[0], ...entry[1]]),
      ];

      visibleLayers.forEach((layer) => {
        this.map.setFilter(this.getLayerName(layer), filters as any);
      });
    }
  }

  private toggleMarkersAndNavigation() {
    if (this.showLandmarks) {
      if (this.markers && this.markers.length) {
        this.markers.forEach((marker) => marker.addTo(this.map));
        this.setBounds(
          this.markers.map((marker) => marker.getLngLat()),
          120,
        );
      }
      this.map.on('contextmenu', this.onMouseEventFn);
      this.navigationEnabled = true;
    } else {
      if (this.markers) {
        this.markers.forEach((marker) => marker.remove());
      }
      this.disableNavigation();
      this.resetMapLocation();
    }
  }

  private setBounds(coords: LngLat[], offset: number = 0) {
    if (coords.length) {
      var bounds = new mapboxgl.LngLatBounds();
      coords.forEach((coord) => {
        bounds.extend(coord);
      });
      this.map.fitBounds(bounds, { padding: offset });
    }
  }

  private disableNavigation() {
    if (this.map) {
      this.removeRoutesOnMap();
      if (this.navigationEnabled) {
        this.map.off('contextmenu', this.onMouseEventFn);
        this.navigationEnabled = false;
      }
    }
  }

  private removeRoutesOnMap() {
    if (this.map) {
      if (this.map.getSource('route')) {
        this.map.removeLayer('route');
        this.map.removeSource('route');
      }
      if (this.map.getSource('end')) {
        this.map.removeLayer('end');
        this.map.removeSource('end');
      }
    }
  }

  private addEndPointToMap(lngLat: LngLat) {
    const end = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [lngLat.lng, lngLat.lat],
          },
        },
      ],
    } as GeoJSON.FeatureCollection;

    if (this.map.getLayer('end')) {
      (this.map.getSource('end') as GeoJSONSource).setData(end);
    } else {
      this.map.addLayer({
        id: 'end',
        type: 'circle',
        source: {
          type: 'geojson',
          data: end,
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#f30',
        },
      });
    }
  }

  showRoute() {
    if (
      this.directions &&
      this.directions.routes &&
      this.directions.routes.length
    ) {
      const coords = this.directions.routes[0].geometry.coordinates;
      const geoJson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
      } as GeoJSON.Feature;

      const endPoint = coords[coords.length - 1];
      this.addEndPointToMap(new LngLat(endPoint[0], endPoint[1]));

      if (this.map.getSource('route')) {
        (this.map.getSource('route') as GeoJSONSource).setData(geoJson);
      } else {
        this.map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geoJson,
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75,
          },
        });
      }

      const allCoords = this.directions.routes[0].geometry.coordinates.map(
        (coordinate) => new LngLat(coordinate[0], coordinate[1]),
      );
      this.setBounds(allCoords, 120);
    } else {
      this.removeRoutesOnMap();
      this.setBounds(
        this.markers.map((marker) => marker.getLngLat()),
        120,
      );
    }
  }

  addGoogleMapSources() {
    if (!this.map.getSource('google-maps')) {
      this.map.addSource('google-maps', {
        type: 'raster',
        tiles: [
          'https://www.google.com/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
      });
    }
  }

  addGoogleMapLayers() {
    this.map.addLayer({
      id: 'google-maps',
      type: 'raster',
      source: 'google-maps',
    });
  }

  toggleLayoutVisibility() {
    this.layoutPanelToggleActive = !this.layoutPanelToggleActive;
    this.btnEv.emit(AppConstants.TOGGLE_LAYOUT_PANEL_VISIBILITY);
  }

  private toggleVisibility(toggleItems: Toggle[]) {
    toggleItems.forEach((toggleItem) => {
      const visibility = toggleItem.checked ? 'visible' : 'none';
      if (this.map.getLayer(toggleItem.id)) {
        this.map.setLayoutProperty(toggleItem.id, 'visibility', visibility);
      }
    });

    const parcelLabelLayers = this.mapConfig.sources
      .flatMap((src) => src.layers || [])
      .filter((l) => {
        if (l.topography?.vectorType !== 'symbol') return false;
        if (l.name === 'waypoints') return false;
        return true;
      })
      .map((l) => this.getLayerName(l));

    const activeVillages = toggleItems
      .filter((t) => t.checked)
      .filter((t) => {
        const lyr = this.map.getLayer(t.id) as any;
        if (!lyr) return false;
        return lyr.type === 'fill';
      })
      .map((t) => t.id);

    parcelLabelLayers.forEach((labelLayerId) => {
      if (!this.map.getLayer(labelLayerId)) return;
      if (activeVillages.length > 0) {
        this.map.setFilter(labelLayerId, [
          'in',
          ['get', 'V_Name'],
          ['literal', activeVillages],
        ] as any);
      } else {
        this.map.setFilter(labelLayerId, undefined);
      }
    });

    const isFilterToggle = toggleItems.some(
      (toggleItem) =>
        toggleItem.metaData?.groupType === AppConstants.CLASSIFY_BY_FILTER,
    );

    if (isFilterToggle) {
      this.setFilters(this.map, this.mapConfig);
    } else {
      this.removeFilters(this.map, this.mapConfig);
    }
  }

  private changeLayerColor(paintProperties: PaintProperty[]) {
    paintProperties.forEach((paint) => {
      const vectorType = paint.layer.topography?.vectorType;
      if (vectorType) {
        const colorToBeApplied = this.getColor(
          paint.layer,
          paint.color || '#000000',
        );
        if (vectorType === 'fill') {
          this.map.setPaintProperty(
            this.getLayerName(paint.layer),
            'fill-color',
            colorToBeApplied,
          );
        } else if (vectorType === 'circle') {
          this.map.setPaintProperty(
            this.getLayerName(paint.layer),
            'circle-color',
            colorToBeApplied,
          );
        } else if (vectorType === 'line') {
          this.map.setPaintProperty(
            this.getLayerName(paint.layer),
            'line-color',
            colorToBeApplied,
          );
        }
      }
    });
  }

  private getColor(layer: Layer, color?: string): Expression {
    let colorToBeApplied =
      color || layer.topography?.color || layer.topography?.fillColor;
    return [
      'match',
      ['get', layer.attribute],
      this.getLayerName(layer),
      colorToBeApplied,
      'transparent',
    ];
  }

  private reloadMap() {
    if (this.map && this.mapConfig) {
      this.mapService.setMapLoaded(false);
      this.clickedFeatureId = '';
      this.currentMeasurement = '';
      this.currentArea = '';
      this.removeControls();
      this.removeMouseEventListeners();

      this.map.setStyle(
        this.styleType === 'Street'
          ? this.mapConfig.streetUrl
          : this.mapConfig.satelliteUrl,
        { diff: false },
      );

      this.resetMapLocation();
      this.listenToStyleData();
      this.listenToMouseEvents();
    }
  }

  private addControls() {
    if (!this.map.hasControl(NAVIGATION_CTRL)) {
      this.map.addControl(NAVIGATION_CTRL);
    }
  }

  private removeControls() {
    this.map.removeControl(NAVIGATION_CTRL);
  }

  private removeMouseEventListeners() {
    const allClickableLayers = [
      ...this.layerNames,
      ...this.interactionLayerNames,
    ];
    this.map.off('click', this.onMouseEventFn);
    this.map.off('mousemove', allClickableLayers, this.onMouseEventFn);
    this.map.off('mouseleave', allClickableLayers, this.onMouseEventFn);
    if (this.navigationEnabled) {
      this.map.off('click', this.onMouseEventFn);
    }
  }

  private ensureDemSource() {
    if (!this.map.getSource('mapbox-dem')) {
      this.map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
  }

  private addSkyLayerIfMissing() {
    if (!this.map.getLayer('sky')) {
      this.map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });
    }
  }

  private applyTerrain(on: boolean) {
    if (on) {
      if (this.map.getLayer(EXTRUSION_LAYER_ID)) {
        this.map.removeLayer(EXTRUSION_LAYER_ID);
      }
      if (this.map.getSource(EXTRUSION_SOURCE_ID)) {
        this.map.removeSource(EXTRUSION_SOURCE_ID);
      }

      this.ensureDemSource();
      this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 6 });
      this.addSkyLayerIfMissing();

      const pitch = this.map.getPitch();
      if (pitch < 5) this.map.easeTo({ pitch: 70, duration: 400 });
    } else {
      if (this.map.getLayer('sky')) this.map.removeLayer('sky');
      this.map.setTerrain(null);

      const state = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        bearing: this.map.getBearing(),
        pitch: 0,
        duration: 300,
      };
      this.map.stop();
      this.map.easeTo(state);
    }
  }

  private apply25D(on: boolean) {
    if (!this.map || !this.map.isStyleLoaded()) return;

    const TILESET_ID = 'rayapati49.swarnabhoomi_heights';
    const SOURCE_LAYER = 'Swarnabhoomi_Heights';

    if (on) {
      this.map.setTerrain(null);
      this.addExtrusionSource(TILESET_ID);
      this.addExtrusionLayer(SOURCE_LAYER);
      this.addBuildingLabels(EXTRUSION_SOURCE_ID, SOURCE_LAYER, 'Name');
      this.map.easeTo({
        pitch: 60,
        bearing: 0,
        duration: 700,
      });
    } else {
      if (this.map.getLayer(BUILDING_LABEL_LAYER_ID)) {
        this.map.removeLayer(BUILDING_LABEL_LAYER_ID);
      }
      if (this.map.getLayer(EXTRUSION_LAYER_ID)) {
        this.map.removeLayer(EXTRUSION_LAYER_ID);
      }
      if (this.map.getSource(EXTRUSION_SOURCE_ID)) {
        this.map.removeSource(EXTRUSION_SOURCE_ID);
      }
      this.map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 400,
      });
    }
  }

  private updateMeasurements() {
    this.removeMeasurements();

    const features = DRAW_CTRL.getAll().features;
    let totalLength = 0;
    let totalArea = 0;
    const measurementFeatures: GeoJSON.Feature[] = [];

    features.forEach((feature: any) => {
      if (feature.geometry.type === 'LineString') {
        const length = this.calculateLineLength(feature.geometry);
        totalLength += length;

        const midpoint = this.getLineMidpoint(feature.geometry);
        measurementFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: midpoint },
          properties: { label: this.formatLength(length), type: 'length' },
        });
      } else if (feature.geometry.type === 'Polygon') {
        const area = this.calculatePolygonArea(feature.geometry);
        totalArea += area;

        const centroid = this.getPolygonCentroid(feature.geometry);
        measurementFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: centroid },
          properties: { label: this.formatArea(area), type: 'area' },
        });
      }
    });

    this.currentMeasurement =
      totalLength > 0 ? this.formatLength(totalLength) : '';
    this.currentArea = totalArea > 0 ? this.formatArea(totalArea) : '';

    if (measurementFeatures.length > 0) {
      this.map.addSource('measurements', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: measurementFeatures },
      });

      this.map.addLayer({
        id: 'measurements',
        type: 'symbol',
        source: 'measurements',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 12,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-anchor': 'center',
          'text-offset': [0, -1.5],
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 2,
        },
      });
    }
  }

  private calculateLineLength(line: GeoJSON.LineString): number {
    let length = 0;
    const coordinates = line.coordinates;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lng1, lat1] = coordinates[i];
      const [lng2, lat2] = coordinates[i + 1];
      length += this.calculateDistance(lat1, lng1, lat2, lng2);
    }
    return length;
  }

  private calculatePolygonArea(polygon: GeoJSON.Polygon): number {
    const coordinates = polygon.coordinates[0];
    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lng1, lat1] = coordinates[i];
      const [lng2, lat2] = coordinates[i + 1];
      area += (lng2 - lng1) * (lat2 + lat1);
    }
    area = Math.abs(area) / 2;
    const metersPerDegree = 111000;
    return area * metersPerDegree * metersPerDegree;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private formatLength(length: number): string {
    return length > 1000
      ? (length / 1000).toFixed(2) + ' km'
      : length.toFixed(2) + ' m';
  }

  private formatArea(area: number): string {
    return area > 1000000
      ? (area / 1000000).toFixed(2) + ' km²'
      : area.toFixed(2) + ' m²';
  }

  private getLineMidpoint(line: GeoJSON.LineString): number[] {
    const coords = line.coordinates;
    return coords[Math.floor(coords.length / 2)];
  }

  private getPolygonCentroid(polygon: GeoJSON.Polygon): number[] {
    const coordinates = polygon.coordinates[0];
    let centroidX = 0,
      centroidY = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      centroidX += coordinates[i][0];
      centroidY += coordinates[i][1];
    }
    const pointCount = coordinates.length - 1;
    return [centroidX / pointCount, centroidY / pointCount];
  }

  private removeMeasurements() {
    if (this.map.getSource('measurements')) {
      this.map.removeLayer('measurements');
      this.map.removeSource('measurements');
    }
  }

  private addExtrusionSource(tilesetId: string) {
    if (this.map.getSource(EXTRUSION_SOURCE_ID)) return;
    this.map.addSource(EXTRUSION_SOURCE_ID, {
      type: 'vector',
      url: 'mapbox://' + tilesetId,
    });
  }

  private addExtrusionLayer(sourceLayer: string) {
    if (this.map.getLayer(EXTRUSION_LAYER_ID)) return;
    this.map.addLayer({
      id: EXTRUSION_LAYER_ID,
      type: 'fill-extrusion',
      source: EXTRUSION_SOURCE_ID,
      'source-layer': sourceLayer,
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#808080',
        'fill-extrusion-height': ['coalesce', ['get', 'height'], 10],
        'fill-extrusion-height-transition': {
          duration: 800,
          delay: 0,
        },
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.9,
      },
    });
  }

  private addBuildingLabels(
    sourceId: string,
    sourceLayer: string,
    nameField: string,
  ) {
    if (this.map.getLayer(BUILDING_LABEL_LAYER_ID)) return;
    this.map.addLayer({
      id: BUILDING_LABEL_LAYER_ID,
      type: 'symbol',
      source: sourceId,
      'source-layer': sourceLayer,
      minzoom: 15,
      layout: {
        'text-field': ['get', nameField],
        'text-size': 12,
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-anchor': 'center',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'symbol-placement': 'point',
      },
      paint: {
        'text-color': '#111',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });
  }

  activateVolumeTool() {
    if (!this.isMiningProject) return;
    this.activeTool = 'volume';
    console.log('🪨 Volume Assessment tool activated');
    this.prepareVolumeLayers();
  }

  prepareVolumeLayers() {
    if (!this.map || this.map.getSource(this.VOLUME_SOURCE_ID)) return;
    this.map.addSource(this.VOLUME_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    this.map.addLayer({
      id: this.VOLUME_LAYER_ID,
      type: 'fill',
      source: this.VOLUME_SOURCE_ID,
      paint: {
        'fill-color': '#ff9800',
        'fill-opacity': 0.5,
      },
    });
  }

  onVolumePolygonCreated(e: any) {
    const feature = e.features[0];
    if (!feature || feature.geometry.type !== 'Polygon') return;
    this.volumePolygonGeoJSON = feature;
    const source = this.map.getSource(
      this.VOLUME_SOURCE_ID,
    ) as mapboxgl.GeoJSONSource;
    source.setData({
      type: 'FeatureCollection',
      features: [feature],
    });
  }

  calculateVolume() {
    if (!this.xyzFile || this.volumeBaseHeight == null) {
      console.error('❌ Missing inputs');
      return;
    }
    const formData = new FormData();
    formData.append('xyz', this.xyzFile);
    formData.append(
      'polygon',
      JSON.stringify(this.volumePolygonGeoJSON!.geometry),
    );
    formData.append('baseHeight', this.volumeBaseHeight.toString());

    this.http
      .post('http://localhost:3000/v1/volume/calculate', formData)
      .subscribe({
        next: (res: any) => {
          this.volumeResult = {
            volume: res.volume,
            area: res.area,
            baseHeight: res.baseHeight,
            cutVolume: res.cutVolume,
          };
        },
        error: (err: any) => {
          console.error('❌ Volume calculation failed', err);
        },
      });
  }
}
