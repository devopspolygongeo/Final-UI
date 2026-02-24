import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { MapLayerMouseEvent, MapMouseEvent } from 'mapbox-gl';
import { AppConstants } from '../../core/constants/app.constants';

import {
  Asset,
  Group,
  Landmark,
  Layout,
  MapBoxDirections,
  MapConfig,
  MapStyle,
  PaintProperty,
  PlotDetails,
  Project,
  Source,
  Survey,
  Toggle,
  View,
} from '../../core/models';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AuthService } from '../../login/services/auth.service';
import { UserResponse } from '../../login/models/user.response';
import { DashboardService } from '../services/dashboard.service';
import { MapService } from '../../shared/services/map.service';
type NavItem = { name: string; active: boolean; width: string };
type HoverItem = { name: string; value: string };

@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./dashboard-view.component.css'],
})
export class DashboardViewComponent implements OnChanges {
  @ViewChild('bottomSheetTemplate') bottomSheetTemplate!: TemplateRef<any>;
  @Input() view!: View;
  @Input() projects!: Project[];
  @Input() surveys!: Survey[];
  @Input() sources!: Source[];
  @Input() groups!: Group[];
  @Input() layouts!: Layout[];
  @Input() assets!: Asset[];
  @Input() landmarks!: Landmark[];

  @Input() errorMsg: string = '';

  @Input() isMiningProject!: boolean;

  @Output() projectChangeEv: EventEmitter<Project> =
    new EventEmitter<Project>();
  @Output() surveyChangeEv: EventEmitter<Survey> = new EventEmitter<Survey>();
  @Output() logoutEv: EventEmitter<boolean> = new EventEmitter<boolean>();

  styles: MapStyle[] = [];
  selectedProject!: Project;
  selectedSurvey!: Survey;
  selectedPlot!: PlotDetails | undefined;
  mapConfig!: MapConfig;
  showLandmarks = false;
  directions!: MapBoxDirections;
  layerVisibility!: Toggle[];
  layerPaintChange!: PaintProperty[];
  showLayoutPanel: boolean = true;
  mapEvent!: MapMouseEvent;
  hoverDetails!: HoverItem[];
  selectedNav: NavItem = { name: 'layers', active: true, width: '15%' };
  hideNavPanel: boolean = false;
  isSidebarCollapsed: boolean = false;

  buildings3DConfig: {
    tilesetId: string;
    layerName: string;
    heightField?: string;
  } | null = null;

  public logoClass: string = 'logo';
  public userEmail: string = '';

  // ✅ Public share mode flag (added)
  public isPublicShare: boolean = false;

  getUserInitial(): string {
    if (this.userEmail && this.userEmail.length > 0) {
      return this.userEmail.charAt(0).toUpperCase();
    }
    return 'U';
  }

  handleClickOutside = (event: MouseEvent): void => {
    const userMenuElement = document.querySelector('.user-account-menu');
    if (userMenuElement && !userMenuElement.contains(event.target as Node)) {
    }
  };

  ngOnInit() {
    // ✅ Detect public share mode from URL hash (added)
    this.isPublicShare = window.location.hash.includes('#/share/');

    const userData = this.authService.getUser();
    if (userData && userData.email) {
      this.userEmail = userData.email;
      console.log('User email:', this.userEmail);
    } else {
      console.log('No user data found');
    }

    document.addEventListener('click', this.handleClickOutside);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  navItems: NavItem[] = [
    { name: 'logo', active: false, width: '15%' },
    { name: 'layers', active: true, width: '28rem' },
    { name: 'proximity', active: false, width: '15%' },
    { name: 'accessibility', active: false, width: '15%' },
    { name: 'gallery', active: false, width: '60%' },
    { name: 'docs', active: false, width: '60%' },
    { name: 'view-360', active: false, width: '35rem' },
  ];

  constructor(
    private bottomSheet: MatBottomSheet,
    private authService: AuthService,
    private dashboardService: DashboardService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['view'] &&
      changes['view'].currentValue != changes['view'].previousValue
    ) {
      this.styles = this.view.mapStyles;
    }

    if (
      changes['projects'] &&
      changes['projects'].currentValue != changes['projects'].previousValue
    ) {
      if (this.projects.length) {
        this.selectedProject = this.projects[0];
        this.onProjectChange(this.selectedProject);
      }
    }

    if (
      changes['surveys'] &&
      changes['surveys'].currentValue != changes['surveys'].previousValue
    ) {
      if (this.surveys.length) {
        this.selectedSurvey = this.surveys[this.surveys.length - 1];
        this.onSurveyChange(this.selectedSurvey);
        this.showLayoutPanel = true;
        this.selectedPlot = undefined;
      }
    }

    if (
      changes['sources'] &&
      changes['sources'].currentValue != changes['sources'].previousValue
    ) {
      if (this.sources.length) {
        this.updateMapConfig();
      }
    }

    try {
      const host = window.location.hostname;
      const logoClass = host.includes('maprx.aero360.co.in') ? 'logo1' : 'logo';
      if (this.navItems.length && this.navItems[0].name.startsWith('logo')) {
        this.navItems[0].name = logoClass;
      }
    } catch (err) {
      console.warn('Could not determine hostname for logo switch:', err);
      if (this.navItems.length) {
        this.navItems[0].name = 'logo';
      }
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  openBottomSheet(selectedNav: NavItem): void {
    this.bottomSheet.open(this.bottomSheetTemplate);

    for (let navItem of this.navItems) {
      navItem.active = navItem.name === selectedNav.name;
    }
    this.selectedNav = selectedNav;
    this.hideNavPanel = false;
    this.showLandmarks = selectedNav.name === 'proximity';
  }

  onProjectChange(project: Project) {
    this.projectChangeEv.emit(project);

    // ✅ LOAD 2.5D DATA FOR PROJECT
    this.loadBuildings3D(project.id);
  }

  onSurveyChange(survey: Survey) {
    this.surveyChangeEv.emit(survey);
  }

  onLayerToggle(toggleItems: Toggle[]) {
    this.layerVisibility = toggleItems;
  }

  onLayerPaintChange(painrProperties: PaintProperty[]) {
    this.layerPaintChange = painrProperties;
  }

  onNavItemClick(selectedNav: NavItem) {
    for (let navItem of this.navItems) {
      navItem.active = navItem.name === selectedNav.name;
    }
    this.selectedNav = selectedNav;
    this.hideNavPanel = false;
    this.showLandmarks = selectedNav.name === 'proximity';

    if (this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  oprnBottomSheet(selectedNav: NavItem) {
    for (let navItem of this.navItems) {
      navItem.active = navItem.name === selectedNav.name;
    }
    this.selectedNav = selectedNav;
    this.hideNavPanel = false;
    this.showLandmarks = selectedNav.name === 'proximity';
  }

  onShowDirections(directions: MapBoxDirections) {
    this.directions = directions;
  }

  onCloseNav(shouldClose: boolean) {
    if (shouldClose) {
      this.hideNavPanel = true;
    }
  }

  onLogout() {
    this.logoutEv.emit(true);
  }

  updateMapConfig() {
    const streetMap = this.view.mapStyles.find(
      (style) => style.id == this.selectedProject.streetMapId,
    );
    const satelliteMap = this.view.mapStyles.find(
      (style) => style.id == this.selectedProject.satelliteMapId,
    );
    console.log(
      'selectedProject.streetMapId:',
      this.selectedProject.streetMapId,
    );
    console.log(
      'available mapStyles ids:',
      this.view.mapStyles.map((s) => s.id),
    );
    console.log('streetMap found:', streetMap);
    this.mapConfig = {
      streetUrl: streetMap
        ? streetMap.url
        : AppConstants.DEFAULT_STREET_MAP_URL,
      satelliteUrl: satelliteMap
        ? satelliteMap.url
        : AppConstants.DEFAULT_SATELITE_MAP_URL,
      latitude: this.selectedSurvey.latitude,
      longitude: this.selectedSurvey.longitude,
      zoom: this.selectedSurvey.zoom,
      minZoom: this.selectedSurvey.zoomMin,
      maxZoom: this.selectedSurvey.zoomMax,
      enableHighlight: this.selectedSurvey.plotView ? true : false,
      sources: this.sources,
      landmarks: this.landmarks,
    };
  }

  onMapBtnEvents(btnEvent: string) {
    if (btnEvent === AppConstants.TOGGLE_LAYOUT_PANEL_VISIBILITY) {
      this.showLayoutPanel = !this.showLayoutPanel;
    }
  }

  mapMouseEvents(mapEvent: MapLayerMouseEvent | MapMouseEvent) {
    this.mapEvent = mapEvent;
    if (mapEvent.type === AppConstants.MAP_MOUSE_MOVE_EVENT) {
      const hoverAttributes = this.layouts.length
        ? this.layouts[0]?.hoverAttributes?.split(',') || []
        : [];
      let properties = (mapEvent as MapLayerMouseEvent).features
        ?.map((feature) => feature.properties)
        ?.filter((prop) => {
          return (
            prop && hoverAttributes.some((attr) => prop.hasOwnProperty(attr))
          );
        });
      this.hoverDetails = [];
      hoverAttributes.forEach((attr) => {
        const prop = properties?.find(
          (property) => property && property.hasOwnProperty(attr),
        );
        if (prop && prop[attr] && prop[attr] != 'na') {
          this.hoverDetails.push({
            name: attr.replace('_', ' '),
            value: prop[attr],
          });
        }
      });
    } else if (mapEvent.type === AppConstants.MAP_MOUSE_LEAVE_EVENT) {
      this.hoverDetails = [];
    } else if (mapEvent.type === AppConstants.MAP_MOUSE_LEFT_CLICK_EVENT) {
      const clickAttributes = this.layouts.length
        ? this.layouts[0]?.clickAttributes?.split(',') || []
        : [];
      const property = (mapEvent as MapLayerMouseEvent).features
        ?.map((feature) => feature.properties)
        ?.find(
          (prop) =>
            prop && clickAttributes.some((attr) => prop.hasOwnProperty(attr)),
        );
      if (property) this.selectedPlot = property as PlotDetails;
    }
  }

  is3D: boolean = false;
  is25D: boolean = false;

  get hasPointCloud(): boolean {
    const url = (this.selectedSurvey?.threeD || '').trim().toLowerCase();

    // treat these as "no point cloud"
    if (
      !url ||
      url === 'na' ||
      url === 'n/a' ||
      url === 'null' ||
      url === 'undefined'
    ) {
      return false;
    }

    // allow only real urls (local or hosted)
    return url.startsWith('http://') || url.startsWith('https://');
  }

  toggle3D() {
    this.is3D = !this.is3D;

    // ENTERING 3D with point cloud → hide left panels
    if (this.is3D && this.hasPointCloud) {
      this.hideNavPanel = true;
      this.isSidebarCollapsed = true;
      return;
    }

    // EXITING 3D (back to 2D) → RESTORE left panels
    this.hideNavPanel = false;
    this.isSidebarCollapsed = false;

    // Ensure previously selected nav becomes visible again
    if (this.selectedNav) {
      this.navItems.forEach(
        (nav) => (nav.active = nav.name === this.selectedNav.name),
      );
    }
  }
  set2D(): void {
    this.is25D = false;

    if (this.is3D) {
      this.toggle3D();
    }
  }
  set3D(): void {
    this.is25D = false;

    if (!this.is3D) {
      this.toggle3D();
    }
  }
  set25D(): void {
    // Ensure full 3D is OFF
    if (this.is3D) {
      this.toggle3D();
    }

    this.is25D = true;
  }
  loadBuildings3D(projectId: number): void {
    this.dashboardService.getBuildings3DSource(projectId).subscribe({
      next: (config) => {
        console.log('🏗️ 2.5D config loaded:', config);
        this.buildings3DConfig = config;
      },
      error: () => {
        console.warn('No 2.5D config for this project');
        this.buildings3DConfig = null;
      },
    });
  }
}
