import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
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
import { environment } from '../../../../../environments/environment';
import { AppConstants } from '../../../../core/constants/app.constants';
import {
  Layer,
  MapBoxDirections,
  MapConfig,
  PaintProperty,
  Toggle,
} from '../../../../core/models';
import { MapService } from '../../services/map.service';

const DRAW_CTRL = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    line_string: true,
    polygon: true,
    trash: true,
  },
});
const NAVIGATION_CTRL = new mapboxgl.NavigationControl();

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
  @Input() mapConfig!: MapConfig;
  @Input() styleType: string = 'Street';
  @Input() layerVisibility!: Toggle[];
  @Input() layerPaintChange!: PaintProperty[];
  @Input() showLandmarks = false;
  @Input() directions!: MapBoxDirections;

  @Output() btnEv: EventEmitter<string> = new EventEmitter<string>();
  @Output() mapMouseEv: EventEmitter<MapLayerMouseEvent> =
    new EventEmitter<MapLayerMouseEvent>();

  map!: mapboxgl.Map;
  layersToBePreserved!: AnyLayer[];
  layerNames: string[] = [];
  markers!: mapboxgl.Marker[];
  navigationEnabled = false;
  streetToggleActive = true;
  layoutPanelToggleActive = true;
  clickedFeatureId!: string;

  onMouseEventFn = this.onMouseEvent.bind(this);

  constructor(private readonly mapService: MapService) {}

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
    this.listenOnLoad();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['mapConfig'] &&
      changes['mapConfig'].currentValue != changes['mapConfig'].previousValue
    ) {
      this.reloadMap();
    }
    if (
      changes['layerVisibility'] &&
      changes['layerVisibility'].currentValue !=
        changes['layerVisibility'].previousValue
    ) {
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
  }

  onStyleTypeChange() {
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
    // console.log(this.layersToBePreserved);
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
    });
  }

  private listenToMouseEvents() {
    this.layerNames = this.mapConfig.sources
      .flatMap((source) => source.layers || [])
      .map((layer) => this.getLayerName(layer));
    this.map.on('click', this.layerNames, this.onMouseEventFn);
    this.map.on('mousemove', this.layerNames, this.onMouseEventFn);
    this.map.on('mouseleave', this.layerNames, this.onMouseEventFn);
  }

  private onMouseEvent(event: MapLayerMouseEvent) {
    if (event.type === AppConstants.MAP_MOUSE_MOVE_EVENT) {
      this.map.getCanvas().style.cursor = 'pointer';
    } else if (event.type === AppConstants.MAP_MOUSE_LEAVE_EVENT) {
      this.map.getCanvas().style.cursor = '';
    } else if (event.type === AppConstants.MAP_MOUSE_LEFT_CLICK_EVENT) {
      if (this.mapConfig.enableHighlight) {
        if (event.features?.length) {
          const ft = event.features[0];
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
      // To add any styles on mouse click
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
    // this.addGoogleMapSources();
  }

  private addAllMapLayers() {
    let rasterLayers: { priority: number; layer: AnyLayer }[] = [];
    let vectorLayers: { priority: number; layer: AnyLayer }[] = [];

    this.mapConfig.sources.forEach((source) => {
      //----------------------------ratser tilesets-----------------------
      if (source.dataType === 'raster') {
        let rasterLayer: RasterLayer = {
          id: source.name,
          layout: {
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
                  visibility: layer.visibility ? 'visible' : 'none',
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
                layout: {
                  visibility: layer.visibility ? 'visible' : 'none',
                  'text-field': ['format', ['get', layer.attribute]],
                  'text-size': 10,
                  'text-justify': 'auto',
                  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                },
              };
              vectorLayers.push({
                priority: layer.priority,
                layer: wayPointsLayer,
              });
            } else {
              if (layer.topography?.vectorType == 'line') {
                const lineLayer: AnyLayer = {
                  id: layerName,
                  layout: {
                    visibility: layer.visibility ? 'visible' : 'none',
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
                    visibility: layer.visibility ? 'visible' : 'none',
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
                const fillLayer: AnyLayer = {
                  id: layerName,
                  layout: {
                    visibility: layer.visibility ? 'visible' : 'none',
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
        // create a HTML element for each landmark
        const el = document.createElement('div');
        el.className = 'marker';
        // make a marker for each feature and add it to the map
        this.markers.push(
          new mapboxgl.Marker(el)
            .setLngLat([landmark.longitude, landmark.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }) // add popups
                .setHTML(
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
      // filters Ex: ['all', [in, 'facing', 'East', 'West', 'South], ['saleStatus', 'Available', 'Sold']]
      const filters = [
        'all',
        ...[...attrMap.entries()].map((entry) => ['in', entry[0], ...entry[1]]),
      ];

      visibleLayers.forEach((layer) => {
        this.map.setFilter(this.getLayerName(layer), filters);
      });
    }
  }

  private toggleMarkersAndNavigation() {
    if (this.showLandmarks) {
      if (this.markers && this.markers.length) {
        this.markers.forEach((marker) => marker.addTo(this.map));
        // the zoom level and center should be set to make all the landmarks visible in the map
        this.setBounds(
          this.markers.map((marker) => marker.getLngLat()),
          120,
        );
      }
      // enable click on points to allow navigation.
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
    // disable navigation
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
      // if the route already exists on the map, we'll reset it using setData
      if (this.map.getSource('route')) {
        (this.map.getSource('route') as GeoJSONSource).setData(geoJson);
      }
      // otherwise, we'll make a new request
      else {
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
      this.map.setLayoutProperty(
        toggleItem.id,
        'visibility',
        toggleItem.checked ? 'visible' : 'none',
      );
    });
    // if the toggles are of filter classify group type, then set filters on the map
    const isFilterToggle = toggleItems.some(
      (toggleItem) =>
        toggleItem.metaData?.groupType &&
        toggleItem.metaData.groupType === AppConstants.CLASSIFY_BY_FILTER,
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
    this.map.addControl(DRAW_CTRL);
    this.map.addControl(NAVIGATION_CTRL);
  }

  private removeControls() {
    this.map.removeControl(DRAW_CTRL);
    this.map.removeControl(NAVIGATION_CTRL);
  }

  private removeMouseEventListeners() {
    this.map.off('click', this.layerNames, this.onMouseEventFn);
    this.map.off('mousemove', this.layerNames, this.onMouseEventFn);
    this.map.off('mouseleave', this.layerNames, this.onMouseEventFn);
    if (this.navigationEnabled) {
      this.map.off('click', this.onMouseEventFn);
    }
  }
}
