import { Component, Input, SimpleChanges, Output, EventEmitter } from "@angular/core";
import { Asset, Group, Landmark, Layout, MapBoxDirections, MapConfig, MapStyle, PaintProperty, PlotDetails, Project, Source, Survey, Toggle, View, MapboxSuggestion} from '../../../core/models';
import { AppConstants } from '../../../core/constants/app.constants';
import { MapLayerMouseEvent, MapMouseEvent } from 'mapbox-gl';
import { DashboardService } from "../../services/dashboard.service";
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { firstValueFrom } from "rxjs";
import { MapService } from '../../shared/services/map.service';
import { StorageConstants } from '../../../core/constants/storage.constants';

type NavItem = { name: string, active: boolean };
type HoverItem = { name: string, value: string };

@Component({
    selector: 'add-assets',
    templateUrl: './add-assets.component.html',
    styleUrls: ['./add-assets.component.css'],
  })

  export class AddAssetsComponent {
    view!: View;
    projects!: Project[];
    surveys!: Survey[];
    sources!: Source[];
    groups!: Group[];
    layouts!: Layout[];
    assets!: Asset[];
    landmarks!: Landmark[];
    plots!: PlotDetails[];
    plotForm: FormGroup;

constructor(private readonly dashboardService: DashboardService,
  private router: Router,
  private fb: FormBuilder,
  private mapService: MapService
){
  const navigation = this.router.getCurrentNavigation();
  const state = navigation?.extras.state as { survey: any };
  this.selectedSurvey = state?.survey;
  this.plotForm = this.fb.group({
    plotNo: [''],
    east: [''],
    west: [''],
    north: [''],
    south: [''],
    salestatus: [''],
    facing: [''],
    priceRange: ['']
  });
}

  styles: MapStyle[] = [];
  selectedProject!: Project;
  selectedSurvey!: Survey;
  selectedPlot!: PlotDetails;
  mapConfig!: MapConfig;
  showLandmarks = false;
  directions!: MapBoxDirections;
  layerVisibility!: Toggle[];
  layerPaintChange!: PaintProperty[];
  showLayoutPanel: boolean = true;
  mapEvent!: MapMouseEvent;
  hoverDetails!: HoverItem[];
  hideNavPanel: boolean = false;
  activeTab = 'tab1';

    navItems: NavItem[] = [
      { name: 'dashboard', active: true },
      { name: 'subscriptions', active: false },
      { name: 'invoices', active: false },
      { name: 'support', active: false }
    ]

    
    
  @Output() projectChangeEv: EventEmitter<Project> = new EventEmitter<Project>;
  @Output() surveyChangeEv: EventEmitter<Survey> = new EventEmitter<Survey>;
  @Output() logoutEv: EventEmitter<boolean> = new EventEmitter<boolean>;
   id: any; 
  
    ngOnInit() {
    if (!this.selectedSurvey) {
      console.error('No survey object passed');
    } else {
      this.dashboardService.getCachedView()?.subscribe(
        (response: View) => {
          this.view = response;
          this.onSurveyChange(this.selectedSurvey);
          
          console.log('View:', this.view); // Handle the response as needed
        },
        (error) => {
          console.error('Error fetching view:', error); // Handle the error as needed
        }
      );
    }
    }

    populateForm(plot: any): void {
      this.plotForm.patchValue({
        plotNo: plot.plot_no,
        east: plot.east,
        west: plot.west,
        north: plot.north,
        south: plot.south,
        salestatus: plot.salestatus,
        facing: plot.facing,
        priceRange: 'Price Range' // Assuming priceRange is a part of PlotDetails
      });
    }

    onProjectChange(project: Project) {
      // this.projectChangeEv.emit(project);
    }

  
    onLayerToggle(toggleItems: Toggle[]) {
      this.layerVisibility = toggleItems;
    }
  
    onLayerPaintChange(painrProperties: PaintProperty[]) {
      this.layerPaintChange = painrProperties;
    }

    onNavItemClick(navItem: NavItem) {
      this.navItems.forEach(item => item.active = navItem.name === item.name);
    }


    onMapBtnEvents(btnEvent: string) {
      if (btnEvent === AppConstants.TOGGLE_LAYOUT_PANEL_VISIBILITY) {
        this.showLayoutPanel = !this.showLayoutPanel;
      }
    }

    mapMouseEvents(mapEvent: MapLayerMouseEvent | MapMouseEvent) {
      this.mapEvent = mapEvent;
      if (mapEvent.type === AppConstants.MAP_MOUSE_MOVE_EVENT) {
        const hoverAttributes = this.layouts.length ? this.layouts[0]?.hoverAttributes?.split(',') || [] : [];
        let properties = (mapEvent as MapLayerMouseEvent).features?.map(feature => feature.properties)?.filter(prop => {
          return prop && hoverAttributes.some(attr => (prop.hasOwnProperty(attr)));
        });
        this.hoverDetails = [];
        hoverAttributes.forEach(attr => {
          const prop = properties?.find(property => property && property.hasOwnProperty(attr));
          if (prop && prop[attr] && prop[attr] != 'na') {
            this.hoverDetails.push({ name: attr.replace('_', ' '), value: prop[attr] })
          }
        })
      } else if (mapEvent.type === AppConstants.MAP_MOUSE_LEAVE_EVENT) {
        this.hoverDetails = [];
      } else if (mapEvent.type === AppConstants.MAP_MOUSE_LEFT_CLICK_EVENT) {
        const clickAttributes = this.layouts.length ? this.layouts[0]?.clickAttributes?.split(',') || [] : [];
        const property = (mapEvent as MapLayerMouseEvent).features?.map(feature => feature.properties)?.find(prop => prop && clickAttributes.some(attr => (prop.hasOwnProperty(attr))));
        if (property)
          this.selectedPlot = property as PlotDetails;
        this.populateForm(this.selectedPlot);
      }
    }


    updateSaleStatus(plotDetails: PlotDetails): void {
      if (this.plotForm.value.salestatus !== plotDetails.salestatus) {
        plotDetails.salestatus = plotDetails.salestatus;
        // this.updateMapData(plotDetails);
        // Optionally, send the update to your backend
        this.mapService.updateBackend(plotDetails).subscribe(response => {
          console.log('Update successful:', response);
        });
      }
    }

    // updateMapData(updatedPlot: PlotDetails): void {
    //   const source = this.map.getSource('plots') as mapboxgl.GeoJSONSource;
    //   const data = source._data as GeoJSON.FeatureCollection;
  
    //   // Find the feature and update its properties
    //   const feature = data.features.find(f => f.properties.plot_no === updatedPlot.plot_no);
    //   if (feature) {
    //     feature.properties.salestatus = updatedPlot.salestatus;
    //   }
  
    //   // Update the source with the modified data
    //   source.setData(data);
    // }

    

    
    updateMapConfig() {
      const streetMap = this.view.mapStyles.find(style => style.id == 4);
      const satelliteMap = this.view.mapStyles.find(style => style.id == 1);
      this.mapConfig = {
        streetUrl: streetMap ? streetMap.url : AppConstants.DEFAULT_SATELITE_MAP_URL,
        satelliteUrl: satelliteMap ? satelliteMap.url : AppConstants.DEFAULT_SATELITE_MAP_URL,
        latitude: this.selectedSurvey.latitude,
        longitude: this.selectedSurvey.longitude,
        zoom: this.selectedSurvey.zoom,
        minZoom: this.selectedSurvey.zoomMin,
        maxZoom: this.selectedSurvey.zoomMax,
        enableHighlight: this.selectedSurvey.plotView ? true : false,
        sources: this.sources,
        landmarks: this.landmarks
      }
      
    }

    async onSurveyChange(survey: Survey) {
      if (survey) {
        try {
          const sourceResult = await firstValueFrom(this.dashboardService.getSources(survey.id));
          const sourceIds = sourceResult.map(source => source.id).join(',');
          const layerResult = await firstValueFrom(this.dashboardService.getLayers(sourceIds));
          const groupResult = await firstValueFrom(this.dashboardService.getGroups(survey.id));
          const layoutsResult = await firstValueFrom(this.dashboardService.getLayouts(survey.id));
          const assetsResult = await firstValueFrom(this.dashboardService.getAssets(survey.id));
          const landmarksResult = await firstValueFrom(this.dashboardService.getLandmarks(survey.id));
          const plotsResult = await firstValueFrom(this.dashboardService.getPlots(survey.id));
          layerResult.forEach(layer => {
            layer.topography = this.view.topographies.find(topo => layer.topoId == topo.id);
          })
          sourceResult.forEach(source => {
            source.layers = layerResult.filter(layer => layer.sourceId == source.id);
            source.layers.forEach(layer => {
              const group = groupResult.find(group => group.id === layer.groupId)
              // setting the group visibility to the layer
              if (group) {
                layer.visibility = group.visibility;
                layer.group = group;
              }
            })
          });
          this.sources = sourceResult;
          this.groups = groupResult;
          this.plots = plotsResult;
          this.layouts = layoutsResult;
          this.assets = assetsResult;
          this.landmarks = landmarksResult;
          this.updateMapConfig();
        } catch (error) {
          console.error(error);
          // this.errorMsg = ErrorMessages.INTERNAL_SERVER_ERROR;
        }
      }
    }

    setActiveTab(tab: string) {
      this.activeTab = tab;
    }




    onAutocompleteSelection(selectedSuggestion: MapboxSuggestion) {
      // this.landmarkSearchInput.nativeElement.setSelectionRange(0, 0);
      // this.landmarkSearchInput.nativeElement.focus();
      this.mapService.retrieveFeature(selectedSuggestion.mapbox_id).subscribe(featureCollection => {
        const feature = featureCollection.features.find(feature => feature.geometry.type === 'Point');
        // if (feature) {
        //   const coords = (feature.geometry as GeoJSON.Point).coordinates;
        //   if (coords && coords.length == 2) {
        //     this.getRoute(new LngLat(coords[0], coords[1]));
        //   }
        // }
      });
    }

  }