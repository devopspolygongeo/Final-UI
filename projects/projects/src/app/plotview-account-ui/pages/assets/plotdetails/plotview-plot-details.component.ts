// import {
//     Component, OnDestroy, OnInit, AfterViewInit, ChangeDetectorRef,
//     ElementRef, ViewChild
// } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { firstValueFrom, Subscription } from 'rxjs';

// import { DashboardService } from '../../../../dashboard/services/dashboard.service';
// import { AssetSelectionService } from '../../../../admin-ui/services/asset-selection.service';

// import {
//     Asset, Group, Landmark, Layout, MapConfig, Project, Source, Survey, View
// } from '../../../../core/models';
// import { AppConstants } from '../../../../core/constants/app.constants';
// import { MapLayerMouseEvent, MapMouseEvent } from 'mapbox-gl';

// @Component({
//     selector: 'app-plotview-plot-details',
//     templateUrl: './plotview-plot-details.component.html',
//     styleUrls: ['./plotview-plot-details.component.css']
// })
// export class PlotviewPlotDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
//     // route context
//     assetName = 'New Asset';
//     projectId?: number;
//     surveyId?: number;

//     // map context
//     view!: View;
//     selectedProject!: Project;
//     selectedSurvey!: Survey;
//     sources: Source[] = [];
//     groups: Group[] = [];
//     layouts: Layout[] = [];
//     assets: Asset[] = [];
//     landmarks: Landmark[] = [];
//     mapConfig!: MapConfig;
//     is3D = false;

//     // RIGHT: editable plot details model
//     plotModel = {
//         plotNo: '',
//         east: '',
//         west: '',
//         north: '',
//         south: '',
//         salestatus: '',
//         facing: '',
//         priceMin: '',
//         priceMax: '',
//         priceUnit: 'Sq ft'
//     };

//     // NEW: Sale status dropdown options
//     saleStatusOptions: string[] = [
//         'Available', 'Sold', 'Hold', 'Blocked', 'N/A'
//     ];

//     // NEW: dirty tracking
//     private originalModel: any = {};
//     isDirty = false;

//     private subs: Subscription[] = [];
//     @ViewChild('mapHost', { static: false, read: ElementRef }) mapHost?: ElementRef<HTMLElement>;
//     @ViewChild('leftCol', { read: ElementRef }) leftCol!: ElementRef<HTMLElement>;
//     @ViewChild('mapCmp') mapCmp?: any;
//     private ro?: ResizeObserver;

//     constructor(
//         private route: ActivatedRoute,
//         private dashboardService: DashboardService,
//         private adminAssets: AssetSelectionService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.subs.push(
//             this.route.queryParamMap.subscribe(async (params) => {
//                 const name = params.get('name');
//                 const projectIdStr = params.get('projectId');
//                 const surveyIdStr = params.get('surveyId');

//                 this.assetName = name && name.trim() ? name : 'New Asset';
//                 this.projectId = projectIdStr ? Number(projectIdStr) : undefined;
//                 this.surveyId = surveyIdStr ? Number(surveyIdStr) : undefined;

//                 // 1) view (map styles)
//                 try { this.view = await firstValueFrom(this.dashboardService.getView()); } catch { }

//                 // 2) project & survey
//                 this.selectedProject = await this.resolveProject(this.projectId);
//                 this.selectedSurvey = await this.resolveSurvey(this.projectId, this.surveyId);

//                 // 3) load map
//                 await this.loadSurveyDataAndBuildMap(this.selectedSurvey);

//                 // 4) clear form
//                 this.resetPlotModel();
//                 this.commitBaseline(); // fresh baseline
//             })
//         );
//     }

//     ngAfterViewInit(): void {
//         this.ro = new ResizeObserver(() => this.nudgeMapResize());
//         if (this.leftCol?.nativeElement) this.ro.observe(this.leftCol.nativeElement);
//         this.nudgeMapResize();
//     }
//     ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); this.ro?.disconnect(); }

//     private nudgeMapResize(): void {
//         try { this.mapCmp?.resize?.(); } catch { }
//         setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
//         requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
//         setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
//     }

//     // ───────────── project/survey helpers (unchanged) ─────────────
//     private async resolveProject(projectId?: number): Promise<Project> {
//         try {
//             const projects = await firstValueFrom(this.adminAssets.getAllProjects());
//             const proj = projects?.find((p: any) => Number(p.id) === Number(projectId));
//             return proj ?? { id: 0, name: 'Unknown', categoryId: 0, clientId: 0, streetMapId: 0, satelliteMapId: 0, location: '', area: 0, description: '', frequency: '' } as Project;
//         } catch {
//             return { id: 0, name: 'Unknown', categoryId: 0, clientId: 0, streetMapId: 0, satelliteMapId: 0, location: '', area: 0, description: '', frequency: '' } as Project;
//         }
//     }
//     private async resolveSurvey(projectId?: number, surveyId?: number): Promise<Survey> {
//         if (!projectId) {
//             return { id: 0, projectId: 0, name: 'Unknown', latitude: 16.69524, longitude: 78.044937, zoom: 14, zoomMin: 4, zoomMax: 20, plotView: false } as Survey;
//         }
//         const surveys = await firstValueFrom(this.dashboardService.getSurveys(projectId));
//         let survey = surveys?.find(s => s.id === surveyId);
//         if (!survey) survey = surveys?.[0];
//         return survey ?? { id: 0, projectId, name: 'Unknown', latitude: 16.69524, longitude: 78.044937, zoom: 14, zoomMin: 4, zoomMax: 20, plotView: false } as Survey;
//     }

//     private async loadSurveyDataAndBuildMap(survey: Survey): Promise<void> {
//         if (!survey || !survey.id) { this.buildMinimalMapConfig(); return; }
//         try {
//             const srcs = await firstValueFrom(this.adminAssets.getSourcesBySurveyId(Number(survey.id)));
//             const sourceIds = srcs?.map((s: any) => s.id).filter(Boolean).join(',') || '';
//             const [layers, groups, layouts] = await Promise.all([
//                 firstValueFrom(this.dashboardService.getLayers(sourceIds)),
//                 firstValueFrom(this.dashboardService.getGroups(Number(survey.id))),
//                 firstValueFrom(this.dashboardService.getLayouts(Number(survey.id))),
//             ]);
//             layers.forEach((l: any) => { if (this.view?.topographies) l.topography = this.view.topographies.find((t: any) => l.topoId == t.id); l.groupId = l.groupid; });
//             srcs.forEach((s: any) => s.layers = layers.filter((l: any) => l.sourceId == s.id));
//             this.sources = srcs as Source[]; this.groups = groups as any; this.layouts = layouts as any;
//             this.buildMapConfigFromViewProjectSurvey(survey, this.sources);
//         } catch {
//             this.sources = []; this.groups = []; this.layouts = []; this.buildMinimalMapConfig();
//         }
//     }
//     private buildMapConfigFromViewProjectSurvey(survey: Survey, sources: Source[]): void {
//         const streetMap = this.view?.mapStyles?.find(s => s.id == (this.selectedProject?.streetMapId ?? 0));
//         const satelliteMap = this.view?.mapStyles?.find(s => s.id == (this.selectedProject?.satelliteMapId ?? 0));
//         this.mapConfig = {
//             streetUrl: streetMap ? streetMap.url : 'mapbox://styles/mapbox/streets-v12',
//             satelliteUrl: satelliteMap ? satelliteMap.url : 'mapbox://styles/mapbox/satellite-streets-v12',
//             latitude: survey.latitude ?? 16.69524,
//             longitude: survey.longitude ?? 78.044937,
//             zoom: survey.zoom ?? 14,
//             minZoom: survey.zoomMin ?? 4, maxZoom: survey.zoomMax ?? 20,
//             enableHighlight: !!survey.plotView, sources, landmarks: this.landmarks
//         } as MapConfig;
//         try { this.cdr.detectChanges(); } catch { }
//         this.nudgeMapResize();
//     }
//     private buildMinimalMapConfig(): void {
//         this.mapConfig = {
//             streetUrl: 'mapbox://styles/mapbox/streets-v12',
//             satelliteUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
//             latitude: 16.69524, longitude: 78.044937, zoom: 14,
//             minZoom: 4, maxZoom: 20, enableHighlight: false, sources: [], landmarks: []
//         } as MapConfig;
//     }

//     // ───────────── plot model mapping ─────────────
//     private resetPlotModel() {
//         this.plotModel = {
//             plotNo: '', east: '', west: '', north: '', south: '',
//             salestatus: '', facing: '', priceMin: '', priceMax: '', priceUnit: 'Sq ft'
//         };
//         this.isDirty = false;
//     }
//     private getProp(props: any, keys: string[], fallback = ''): string {
//         for (const k of keys) if (props?.[k] !== undefined && props?.[k] !== null) return String(props[k]);
//         return fallback;
//     }
//     private hydratePlotModelFromFeatureProps(props: any) {
//         this.plotModel.plotNo = this.getProp(props, ['plotNo', 'plot_no', 'name', 'plot'], '');
//         this.plotModel.east = this.getProp(props, ['east', 'eastBoundary', 'east_boundary'], '');
//         this.plotModel.west = this.getProp(props, ['west', 'westBoundary', 'west_boundary'], '');
//         this.plotModel.north = this.getProp(props, ['north', 'northBoundary', 'north_boundary'], '');
//         this.plotModel.south = this.getProp(props, ['south', 'southBoundary', 'south_boundary'], '');
//         this.plotModel.facing = this.getProp(props, ['facing'], '');
//         this.plotModel.salestatus = this.getProp(props, ['salestatus', 'sale_status', 'status'], '');
//         const priceMin = this.getProp(props, ['priceMin', 'price_min'], '');
//         const priceMax = this.getProp(props, ['priceMax', 'price_max'], '');
//         if (priceMin || priceMax) {
//             this.plotModel.priceMin = priceMin; this.plotModel.priceMax = priceMax;
//         } else {
//             const rangeStr = this.getProp(props, ['priceRange', 'price_range'], '');
//             const m = rangeStr.match(/(\d+)\s*-\s*(\d+)/);
//             this.plotModel.priceMin = m ? m[1] : ''; this.plotModel.priceMax = m ? m[2] : '';
//         }
//         this.commitBaseline(); // set "saved" snapshot for the selected plot
//     }

//     // map click → fill form
//     onMapMouseEvents(mapEvent: MapLayerMouseEvent | MapMouseEvent) {
//         if (mapEvent.type === AppConstants.MAP_MOUSE_LEFT_CLICK_EVENT) {
//             const clickAttributes = this.layouts.length
//                 ? this.layouts[0]?.clickAttributes?.split(',') || []
//                 : [];
//             const property = (mapEvent as MapLayerMouseEvent).features
//                 ?.map(f => f.properties)
//                 ?.find(p => p && (clickAttributes.length ? clickAttributes.some(attr => p.hasOwnProperty(attr)) : true));
//             if (property) this.hydratePlotModelFromFeatureProps(property);
//         }
//     }

//     // ───────────── dirty tracking + save ─────────────
//     markDirty() {
//         this.isDirty = JSON.stringify(this.plotModel) !== JSON.stringify(this.originalModel);
//     }
//     private commitBaseline() {
//         this.originalModel = JSON.parse(JSON.stringify(this.plotModel));
//         this.isDirty = false;
//     }

//     onSave() {
//         // TODO: call your backend here to persist plot details (if/when the API is ready)
//         // e.g., this.dashboardService.updatePlotDetails(this.plotModel).subscribe(...)
//         this.commitBaseline(); // consider it "saved" on the right panel
//         alert('Saved!');
//     }
// }

import {
    Component, OnDestroy, OnInit, AfterViewInit, ChangeDetectorRef,
    ElementRef, ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

import { DashboardService } from '../../../../dashboard/services/dashboard.service';
import { AssetSelectionService } from '../../../../admin-ui/services/asset-selection.service';

import {
    Asset, Group, Landmark, Layout, MapConfig, Project, Source, Survey, View
} from '../../../../core/models';
import { AppConstants } from '../../../../core/constants/app.constants';
import { MapLayerMouseEvent, MapMouseEvent } from 'mapbox-gl';

// backend call for dataset update + tileset rebuild
import { PlotStatusService } from '../../../services/plot-status.service';

/** --- Status helpers (UI <-> storage) --- */
const STATUS_UI = ['Available', 'In Progress', 'Sold'] as const;
type Status = typeof STATUS_UI[number];

function storageToUI(s: any): Status {
    const t = String(s || '').trim().toLowerCase();
    if (t.startsWith('avail')) return 'Available';
    if (t.startsWith('sold')) return 'Sold';
    if (t.includes('progress') || t.startsWith('in')) return 'In Progress';
    return 'Available';
}
function uiToStorage(s: any): Status {
    const t = String(s || '').trim().toLowerCase();
    if (t.startsWith('avail')) return 'Available';
    if (t.startsWith('sold')) return 'Sold';
    if (t.includes('progress') || t.startsWith('in')) return 'In Progress';
    return 'Available';
}

@Component({
    selector: 'app-plotview-plot-details',
    templateUrl: './plotview-plot-details.component.html',
    styleUrls: ['./plotview-plot-details.component.css']
})
export class PlotviewPlotDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
    // route context
    assetName = 'New Asset';
    projectId?: number;
    surveyId?: number;
    private selectedPlotNo?: string | number;


    // map context
    view!: View;
    selectedProject!: Project;
    selectedSurvey!: Survey;
    sources: Source[] = [];
    groups: Group[] = [];
    layouts: Layout[] = [];
    assets: Asset[] = [];
    landmarks: Landmark[] = [];
    mapConfig!: MapConfig;
    is3D = false;

    // Map host refs
    @ViewChild('mapHost', { static: false, read: ElementRef }) mapHost?: ElementRef<HTMLElement>;
    @ViewChild('leftCol', { read: ElementRef }) leftCol!: ElementRef<HTMLElement>;
    @ViewChild('mapCmp') mapCmp?: any;

    // Sale Status integration context
    /** tilesetId from source record: link | sourcelink | sourceLink */
    private tilesetId?: string;
    /** datasetId that feeds the tileset (must come from API/DB or a backend mapping) */
    private datasetId?: string;
    /** feature id from the clicked polygon */
    private selectedFeatureId?: string;

    // RIGHT: editable plot details model (unchanged fields + salestatus)
    plotModel = {
        plotNo: '',
        east: '',
        west: '',
        north: '',
        south: '',
        salestatus: '' as Status,
        facing: '',
        priceMin: '',
        priceMax: '',
        priceUnit: 'Sq ft'
    };

    /** Allowed statuses (UI) */
    saleStatusOptions: Status[] = ['Available', 'In Progress', 'Sold'];

    // Dirty tracking
    private originalModel: any = {};
    isDirty = false;

    private subs: Subscription[] = [];
    private ro?: ResizeObserver;

    constructor(
        private route: ActivatedRoute,
        private dashboardService: DashboardService,
        private adminAssets: AssetSelectionService,
        private cdr: ChangeDetectorRef,
        private plotStatusSvc: PlotStatusService
    ) { }

    // ───────────── lifecycle ─────────────
    ngOnInit(): void {
        this.subs.push(
            this.route.queryParamMap.subscribe(async (params) => {
                const name = params.get('name');
                const projectIdStr = params.get('projectId');
                const surveyIdStr = params.get('surveyId');

                this.assetName = name && name.trim() ? name : 'New Asset';
                this.projectId = projectIdStr ? Number(projectIdStr) : undefined;
                this.surveyId = surveyIdStr ? Number(surveyIdStr) : undefined;

                console.log('[PlotDetails] init → assetName:', this.assetName, 'projectId:', this.projectId, 'surveyId:', this.surveyId);

                // 1) view (map styles)
                try { this.view = await firstValueFrom(this.dashboardService.getView()); } catch { }

                // 2) project & survey
                this.selectedProject = await this.resolveProject(this.projectId);
                this.selectedSurvey = await this.resolveSurvey(this.projectId, this.surveyId);

                // 3) load map + sources
                await this.loadSurveyDataAndBuildMap(this.selectedSurvey);

                // 4) clear form
                this.resetPlotModel();
                this.commitBaseline();
            })
        );
    }

    ngAfterViewInit(): void {
        this.ro = new ResizeObserver(() => this.nudgeMapResize());
        if (this.leftCol?.nativeElement) this.ro.observe(this.leftCol.nativeElement);
        this.nudgeMapResize();
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
        this.ro?.disconnect();
    }

    private nudgeMapResize(): void {
        try { this.mapCmp?.resize?.(); } catch { }
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    }

    // ───────────── project/survey helpers (unchanged) ─────────────
    private async resolveProject(projectId?: number): Promise<Project> {
        try {
            const projects = await firstValueFrom(this.adminAssets.getAllProjects());
            const proj = projects?.find((p: any) => Number(p.id) === Number(projectId));
            return proj ?? { id: 0, name: 'Unknown', categoryId: 0, clientId: 0, streetMapId: 0, satelliteMapId: 0, location: '', area: 0, description: '', frequency: '' } as Project;
        } catch {
            return { id: 0, name: 'Unknown', categoryId: 0, clientId: 0, streetMapId: 0, satelliteMapId: 0, location: '', area: 0, description: '', frequency: '' } as Project;
        }
    }
    // Maps any string to one of the 3 allowed values
    private normalizeStatus(s: any): 'Available' | 'In Progress' | 'Sold' {
        const t = String(s ?? '').trim().toLowerCase();
        if (t.startsWith('avail')) return 'Available';
        if (t.startsWith('sold')) return 'Sold';
        if (t.includes('progress') || t.startsWith('in')) return 'In Progress';
        return 'Available';
    }

    private async resolveSurvey(projectId?: number, surveyId?: number): Promise<Survey> {
        if (!projectId) {
            return { id: 0, projectId: 0, name: 'Unknown', latitude: 16.69524, longitude: 78.044937, zoom: 14, zoomMin: 4, zoomMax: 20, plotView: false } as Survey;
        }
        const surveys = await firstValueFrom(this.dashboardService.getSurveys(projectId));
        let survey = surveys?.find(s => s.id === surveyId);
        if (!survey) survey = surveys?.[0];
        return survey ?? { id: 0, projectId, name: 'Unknown', latitude: 16.69524, longitude: 78.044937, zoom: 14, zoomMin: 4, zoomMax: 20, plotView: false } as Survey;
    }

    private async loadSurveyDataAndBuildMap(survey: Survey): Promise<void> {
        if (!survey || !survey.id) { this.buildMinimalMapConfig(); return; }
        try {
            const srcs: any[] = await firstValueFrom(this.adminAssets.getSourcesBySurveyId(Number(survey.id)));
            const sourceIds = srcs?.map((s: any) => s.id).filter(Boolean).join(',') || '';
            const [layers, groups, layouts] = await Promise.all([
                firstValueFrom(this.dashboardService.getLayers(sourceIds)),
                firstValueFrom(this.dashboardService.getGroups(Number(survey.id))),
                firstValueFrom(this.dashboardService.getLayouts(Number(survey.id))),
            ]);

            layers.forEach((l: any) => { if (this.view?.topographies) l.topography = this.view.topographies.find((t: any) => l.topoId == t.id); l.groupId = l.groupid; });
            srcs.forEach((s: any) => s.layers = layers.filter((l: any) => l.sourceId == s.id));
            this.sources = srcs as Source[]; this.groups = groups as any; this.layouts = layouts as any;

            this.buildMapConfigFromViewProjectSurvey(survey, this.sources);

            // ---- pick your plots source (unchanged) ----
            const plots = (this.sources || []).find((s: any) =>
                String(s.datatype).toLowerCase() === 'vector' &&
                /plot|parcel|layout/i.test(String(s.sourcename || s.name || ''))
            ) || (this.sources || [])[0];

            console.log('[PlotDetails] chosen plots source', plots);

            // ✅ PUT THE SNIPPET RIGHT HERE
            // tilesetId may come from link | sourcelink | sourceLink
            this.tilesetId =
                (plots as any)?.link ??
                (plots as any)?.sourcelink ??
                (plots as any)?.sourceLink ??
                undefined;

            // datasetId from API if present
            this.datasetId =
                (plots as any)?.datasetid ??
                (plots as any)?.datasetId ??
                undefined;

            // if datasetId missing OR tileset has a build hash, derive datasetId from tileset
            if (this.tilesetId) {
                this.datasetId = this.datasetIdFromTileset(this.tilesetId);
            }

            console.log('[PlotDetails] ids → tilesetId =', this.tilesetId, 'datasetId =', this.datasetId);

        } catch (e) {
            console.error('[PlotDetails] loadSurveyDataAndBuildMap error', e);
            this.sources = []; this.groups = []; this.layouts = [];
            this.buildMinimalMapConfig();
        }
    }

    private datasetIdFromTileset(tilesetId: string): string {
        // "owner.dataset-suffix"  -> "dataset"
        // "owner.dataset"         -> "dataset"
        const suffix = tilesetId.includes('.') ? tilesetId.split('.')[1] : tilesetId;
        return suffix.replace(/-[a-z0-9]{4,}$/i, ''); // strip trailing build hash like "-7oby3"
    }


    private buildMapConfigFromViewProjectSurvey(survey: Survey, sources: Source[]): void {
        const streetMap = this.view?.mapStyles?.find(s => s.id == (this.selectedProject?.streetMapId ?? 0));
        const satelliteMap = this.view?.mapStyles?.find(s => s.id == (this.selectedProject?.satelliteMapId ?? 0));
        this.mapConfig = {
            streetUrl: streetMap ? streetMap.url : 'mapbox://styles/mapbox/streets-v12',
            satelliteUrl: satelliteMap ? satelliteMap.url : 'mapbox://styles/mapbox/satellite-streets-v12',
            latitude: survey.latitude ?? 16.69524,
            longitude: survey.longitude ?? 78.044937,
            zoom: survey.zoom ?? 14,
            minZoom: survey.zoomMin ?? 4, maxZoom: survey.zoomMax ?? 20,
            enableHighlight: !!survey.plotView, sources, landmarks: this.landmarks
        } as MapConfig;
        try { this.cdr.detectChanges(); } catch { }
        this.nudgeMapResize();
    }

    private buildMinimalMapConfig(): void {
        this.mapConfig = {
            streetUrl: 'mapbox://styles/mapbox/streets-v12',
            satelliteUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
            latitude: 16.69524, longitude: 78.044937, zoom: 14,
            minZoom: 4, maxZoom: 20, enableHighlight: false, sources: [], landmarks: []
        } as MapConfig;
    }

    // ───────────── plot model mapping ─────────────
    private resetPlotModel() {
        this.plotModel = {
            plotNo: '', east: '', west: '', north: '', south: '',
            salestatus: 'Available', facing: '', priceMin: '', priceMax: '', priceUnit: 'Sq ft'
        };
        this.isDirty = false;
    }
    private getProp(props: any, keys: string[], fallback = ''): string {
        for (const k of keys) if (props?.[k] !== undefined && props?.[k] !== null) return String(props[k]);
        return fallback;
    }
    private hydratePlotModelFromFeatureProps(props: any) {
        this.plotModel.plotNo = this.getProp(props, ['plotNo', 'plot_no', 'name', 'plot'], '');
        this.plotModel.east = this.getProp(props, ['east', 'eastBoundary', 'east_boundary'], '');
        this.plotModel.west = this.getProp(props, ['west', 'westBoundary', 'west_boundary'], '');
        this.plotModel.north = this.getProp(props, ['north', 'northBoundary', 'north_boundary'], '');
        this.plotModel.south = this.getProp(props, ['south', 'southBoundary', 'south_boundary'], '');
        this.plotModel.facing = this.getProp(props, ['facing'], '');
        // map storage -> UI exactly (Available | In Progress | Sold)
        this.plotModel.salestatus = storageToUI(this.getProp(props, ['salestatus', 'sale_status', 'status'], ''));
        const priceMin = this.getProp(props, ['priceMin', 'price_min'], '');
        const priceMax = this.getProp(props, ['priceMax', 'price_max'], '');
        if (priceMin || priceMax) {
            this.plotModel.priceMin = priceMin; this.plotModel.priceMax = priceMax;
        } else {
            const rangeStr = this.getProp(props, ['priceRange', 'price_range'], '');
            const m = rangeStr.match(/(\d+)\s*-\s*(\d+)/);
            this.plotModel.priceMin = m ? m[1] : ''; this.plotModel.priceMax = m ? m[2] : '';
        }
        this.commitBaseline(); // set "saved" snapshot for the selected plot
    }

    // map click → capture feature id + fill form from properties
    onMapMouseEvents(mapEvent: MapLayerMouseEvent | MapMouseEvent) {
        if (mapEvent.type === AppConstants.MAP_MOUSE_LEFT_CLICK_EVENT) {
            const clickAttributes = this.layouts.length
                ? this.layouts[0]?.clickAttributes?.split(',') || []
                : [];
            const features = (mapEvent as MapLayerMouseEvent).features || [];

            // Pick the first feature that matches clickAttributes
            const matched = features.find(f => {
                const p = f?.properties;
                return p && (clickAttributes.length ? clickAttributes.some(attr => p.hasOwnProperty(attr)) : true);
            });

            if (matched) {
                // Capture stable id for save (bracket access to appease TS4111)
                const p = matched.properties || {};
                this.selectedPlotNo =
                    p['plot_no']  ?? undefined;

                // existing hydrate
                this.hydratePlotModelFromFeatureProps(p);
                console.log('[PlotDetails] click → selectedPlotNo:', this.selectedPlotNo, 'props:', p);
            }
        }
    }

    // ───────────── dirty tracking + save ─────────────
    markDirty() {
        this.isDirty = JSON.stringify(this.plotModel) !== JSON.stringify(this.originalModel);
    }
    private commitBaseline() {
        this.originalModel = JSON.parse(JSON.stringify(this.plotModel));
        this.isDirty = false;
    }

    async onSave() {
        if (!this.isDirty) return;
        if (!this.selectedPlotNo) { alert('Select a plot on the map first.'); return; }
        if (!this.tilesetId || !this.datasetId) { alert('Missing tileset/dataset mapping for this survey.'); return; }

        const newStatus = this.normalizeStatus(this.plotModel.salestatus);

        const payload = {
            surveyId: Number(this.selectedSurvey?.id ?? this.surveyId ?? 0),
            tilesetId: this.tilesetId!,
            datasetId: this.datasetId!,     // clean id derived from tileset
            plotNo: this.selectedPlotNo,    // ✅ send plot number
            newStatus
        };
        console.log('[PlotDetails] request payload →', payload);

        try {
            await firstValueFrom(this.plotStatusSvc.updateStatus(payload as any));
            this.commitBaseline();
        } catch (e) {
            console.error(e);
            alert('Failed to update sale status.');
        }
    }

}
