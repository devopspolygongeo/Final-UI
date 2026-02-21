import {
    Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

import { DashboardService } from '../../../../dashboard/services/dashboard.service';
import { AssetSelectionService } from '../../../../admin-ui/services/asset-selection.service';
import { MapService } from '../../../../shared/services/map.service';

import { LngLat } from 'mapbox-gl';
import {
    Group, Layout, MapConfig, MapStyle, Project, Source, Survey, View,
    Landmark, MapBoxDirections
} from '../../../../core/models';

@Component({
    selector: 'app-plotview-proximity',
    templateUrl: './plotview-proximity.component.html',
    styleUrls: ['./plotview-proximity.component.css']
})
export class PlotviewProximityComponent implements OnInit, OnDestroy {
    // route context
    assetName = 'New Asset';
    projectId?: number;
    surveyId?: number;

    // map context
    view!: View;
    selectedProject!: Project;
    selectedSurvey!: Survey;

    sources: Source[] = [];
    groups: Group[] = [];
    layouts: Layout[] = [];
    mapConfig!: MapConfig;
    is3D = false;

    // right panel + map extras
    landmarks: Landmark[] = [];
    directions?: MapBoxDirections;
    lastMapEvent: any;

    // search box state
    searchText = '';
    suggestions: any[] = [];
    searching = false;

    private subs: Subscription[] = [];
    @ViewChild('leftCol', { read: ElementRef }) leftCol!: ElementRef<HTMLElement>;

    constructor(
        private route: ActivatedRoute,
        private dashboard: DashboardService,
        private adminAssets: AssetSelectionService,
        private mapSvc: MapService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.subs.push(
            this.route.queryParamMap.subscribe(async params => {
                const name = params.get('name');
                const projectIdStr = params.get('projectId');
                const surveyIdStr = params.get('surveyId');

                this.assetName = name && name.trim() ? name : 'New Asset';
                this.projectId = projectIdStr ? Number(projectIdStr) : undefined;
                this.surveyId = surveyIdStr ? Number(surveyIdStr) : undefined;

                // map styles/view
                try { this.view = await firstValueFrom(this.dashboard.getView()); } catch { }

                // select project + survey (prefer surveyId; else first)
                this.selectedProject = await this.resolveProject(this.projectId);
                this.selectedSurvey = await this.resolveSurvey(this.projectId, this.surveyId);

                // map data + config
                await this.loadSurveyDataAndBuildMap(this.selectedSurvey);

                // existing proximities
                await this.loadExistingLandmarks(this.selectedSurvey?.id);
            })
        );
    }

    ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

    // ───── helpers: project/survey ─────
    private async resolveProject(projectId?: number): Promise<Project> {
        try {
            const projects = await firstValueFrom(this.adminAssets.getAllProjects());
            const proj = projects?.find((p: any) => Number(p.id) === Number(projectId));
            return proj ?? {
                id: 0, name: 'Unknown', categoryId: 0, clientId: 0,
                streetMapId: 0, satelliteMapId: 0, location: '', area: 0, description: '', frequency: ''
            } as Project;
        } catch {
            return {
                id: 0, name: 'Unknown', categoryId: 0, clientId: 0,
                streetMapId: 0, satelliteMapId: 0, location: '', area: 0, description: '', frequency: ''
            } as Project;
        }
    }

    private async resolveSurvey(projectId?: number, surveyId?: number): Promise<Survey> {
        if (!projectId) {
            return {
                id: 0, projectId: 0, name: 'Unknown',
                latitude: 16.69524, longitude: 78.044937, zoom: 14, zoomMin: 4, zoomMax: 20, plotView: false
            } as Survey;
        }
        const surveys = await firstValueFrom(this.dashboard.getSurveys(projectId));
        let survey = surveys?.find(s => s.id === surveyId);
        if (!survey) survey = surveys?.[0];
        return survey ?? {
            id: 0, projectId, name: 'Unknown',
            latitude: 16.69524, longitude: 78.044937, zoom: 14, zoomMin: 4, zoomMax: 20, plotView: false
        } as Survey;
    }

    // ───── map pipeline ─────
    private async loadSurveyDataAndBuildMap(survey: Survey): Promise<void> {
        if (!survey || !survey.id) { this.buildMinimalMapConfig(); return; }

        try {
            const srcs = await firstValueFrom(this.adminAssets.getSourcesBySurveyId(Number(survey.id)));
            const sourceIds = (srcs || []).map((s: any) => s.id).filter(Boolean).join(',');
            const [layers, groups, layouts] = sourceIds
                ? await Promise.all([
                    firstValueFrom(this.dashboard.getLayers(sourceIds)),
                    firstValueFrom(this.dashboard.getGroups(Number(survey.id))),
                    firstValueFrom(this.dashboard.getLayouts(Number(survey.id)))
                ])
                : [[], [], []];

            (layers || []).forEach((l: any) => {
                if (this.view?.topographies) l.topography = this.view.topographies.find((t: any) => l.topoId == t.id);
                l.groupId = l.groupid;
            });
            (srcs || []).forEach((s: any) => s.layers = (layers || []).filter((l: any) => l.sourceId == s.id));

            this.sources = (srcs || []) as Source[];
            this.groups = (groups || []) as Group[];
            this.layouts = Array.isArray(layouts) ? (layouts as Layout[]) : [];

            this.buildMapConfigFromSurvey(survey, this.sources);
        } catch {
            this.sources = []; this.groups = []; this.layouts = [];
            this.buildMapConfigFromSurvey(survey, []);
        }
    }

    private buildMapConfigFromSurvey(survey: Survey, sources: Source[]): void {
        const street = this.view?.mapStyles?.find((s: MapStyle) => s.id == (this.selectedProject?.streetMapId ?? 0));
        const sat = this.view?.mapStyles?.find((s: MapStyle) => s.id == (this.selectedProject?.satelliteMapId ?? 0));

        this.mapConfig = {
            streetUrl: street ? street.url : 'mapbox://styles/mapbox/streets-v12',
            satelliteUrl: sat ? sat.url : 'mapbox://styles/mapbox/satellite-streets-v12',
            latitude: this.selectedSurvey?.latitude ?? 16.69524,
            longitude: this.selectedSurvey?.longitude ?? 78.044937,
            zoom: this.selectedSurvey?.zoom ?? 14,
            minZoom: this.selectedSurvey?.zoomMin ?? 4,
            maxZoom: this.selectedSurvey?.zoomMax ?? 20,
            enableHighlight: false,
            sources,
            landmarks: this.landmarks
        } as MapConfig;

        try { this.cdr.detectChanges(); } catch { }
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
    }

    private buildMinimalMapConfig(): void {
        this.mapConfig = {
            streetUrl: 'mapbox://styles/mapbox/streets-v12',
            satelliteUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
            latitude: 16.69524, longitude: 78.044937,
            zoom: 14, minZoom: 4, maxZoom: 20,
            enableHighlight: false, sources: [], landmarks: []
        } as MapConfig;
    }

    // ───── proximities ─────
    private async loadExistingLandmarks(surveyId?: number) {
        if (!surveyId) return;
        try {
            const saved = await firstValueFrom(this.dashboard.getLandmarks(Number(surveyId)));
            this.landmarks = Array.isArray(saved) ? saved : [];
            this.mapConfig = { ...this.mapConfig, landmarks: this.landmarks };
            this.cdr.detectChanges();
        } catch (err) {
            console.error('Failed to load landmarks', err);
            this.landmarks = [];
        }
    }

    // ───── search + suggestions ─────
    onSearch(): void {
        const q = (this.searchText || '').trim();
        if (!q) { this.suggestions = []; return; }
        this.searching = true;

        const prox = `${this.mapConfig.longitude},${this.mapConfig.latitude}`;
        this.mapSvc.getSuggestions(q, prox).subscribe({
            next: list => { this.suggestions = list || []; this.searching = false; },
            error: () => { this.suggestions = []; this.searching = false; }
        });
    }

    async addSuggestion(s: any) {
        try {
            let lnglat: [number, number] | undefined =
                (Array.isArray(s?.coordinates) && s.coordinates.length >= 2)
                    ? [s.coordinates[0], s.coordinates[1]]
                    : undefined;

            if (!lnglat) {
                const fc: any = await firstValueFrom(this.mapSvc.retrieveFeature(s.mapbox_id));
                const feat = fc?.features?.find((f: any) => f?.geometry?.type === 'Point') ?? fc?.features?.[0];
                if (feat?.geometry?.type === 'Point') {
                    const c = feat.geometry.coordinates;
                    if (Array.isArray(c) && c.length >= 2) lnglat = [c[0], c[1]];
                } else if (Array.isArray(feat?.bbox) && feat.bbox.length === 4) {
                    const [minx, miny, maxx, maxy] = feat.bbox;
                    lnglat = [(minx + maxx) / 2, (miny + maxy) / 2];
                }
            }
            if (!lnglat) return;

            const lm: Landmark = {
                id: 0,
                surveyId: this.selectedSurvey?.id ?? 0,
                name: s.name || s.full_address || 'Place',
                description: s.full_address || '',
                longitude: lnglat[0],
                latitude: lnglat[1],
                metaData: {} as any
            };

            this.landmarks = [...this.landmarks, lm];
            this.mapConfig = { ...this.mapConfig, landmarks: this.landmarks };

            // preview route immediately
            this.focusLandmark(lm);

            // clear UI
            this.searchText = '';
            this.suggestions = [];
            this.cdr.detectChanges();
        } catch { /* ignore */ }
    }

    // ───── list actions ─────
    focusLandmark(lm: Landmark) {
        const endLL = new LngLat(lm.longitude, lm.latitude);
        const startLL = new LngLat(this.mapConfig.longitude, this.mapConfig.latitude);
        this.mapSvc.getRoute(startLL, endLL).subscribe(d => (this.directions = d));
    }

    removeLandmark(i: number) {
        this.landmarks = this.landmarks.filter((_, idx) => idx !== i);
        this.mapConfig = { ...this.mapConfig, landmarks: this.landmarks };
    }

    // map events (right-click route etc.)
    onMapMouseEvents(ev: any) {
        this.lastMapEvent = ev;
        if (ev?.type === 'contextmenu') {
            const endLL = new LngLat(ev.lngLat.lng, ev.lngLat.lat);
            const startLL = new LngLat(this.mapConfig.longitude, this.mapConfig.latitude);
            this.mapSvc.getRoute(startLL, endLL).subscribe(d => (this.directions = d));
        }
    }
}
