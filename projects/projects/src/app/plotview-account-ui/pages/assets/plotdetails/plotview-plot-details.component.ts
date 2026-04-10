import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

import { DashboardService } from '../../../../dashboard/services/dashboard.service';
import { AssetSelectionService } from '../../../../admin-ui/services/asset-selection.service';

import {
  Asset,
  Group,
  Landmark,
  Layout,
  MapConfig,
  Project,
  Source,
  Survey,
  View,
} from '../../../../core/models';
import { AppConstants } from '../../../../core/constants/app.constants';
import { MapLayerMouseEvent, MapMouseEvent } from 'mapbox-gl';

// backend call for dataset read/update
import {
  PlotStatusService,
  PlotDetails,
  PlotBBox,
} from '../../../services/plot-status.service';

/** --- Status helpers (UI <-> storage) --- */
const STATUS_UI = ['Available', 'In Progress', 'Sold'] as const;
type Status = (typeof STATUS_UI)[number];
type PlotSourceType = 'dataset' | 'tileset';

function storageToUI(s: any): Status {
  const t = String(s || '')
    .trim()
    .toLowerCase();
  if (t.startsWith('avail')) return 'Available';
  if (t.startsWith('sold')) return 'Sold';
  if (t.includes('progress') || t.startsWith('in')) return 'In Progress';
  return 'Available';
}

function uiToStorage(s: any): Status {
  const t = String(s || '')
    .trim()
    .toLowerCase();
  if (t.startsWith('avail')) return 'Available';
  if (t.startsWith('sold')) return 'Sold';
  if (t.includes('progress') || t.startsWith('in')) return 'In Progress';
  return 'In Progress' === s ? 'In Progress' : 'Available';
}

@Component({
  selector: 'app-plotview-plot-details',
  templateUrl: './plotview-plot-details.component.html',
  styleUrls: ['./plotview-plot-details.component.css'],
})
export class PlotviewPlotDetailsComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  // route context
  assetName = 'New Asset';
  projectId?: number;
  surveyId?: number;
  private selectedPlotNo?: string | number;

  // search context
  searchPlotNo = '';
  isSearchingPlot = false;
  isPlotSelected = false;

  // add new option context
  readonly ADD_NEW_OPTION = 'Add new';
  customOwnerName = '';
  customDeveloperName = '';

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
  @ViewChild('mapHost', { static: false, read: ElementRef })
  mapHost?: ElementRef<HTMLElement>;
  @ViewChild('leftCol', { read: ElementRef }) leftCol!: ElementRef<HTMLElement>;
  @ViewChild('mapCmp') mapCmp?: any;

  // Sale Status integration context
  private tilesetId?: string;
  private datasetId?: string;
  private selectedFeatureId?: string;
  private selectedFeatureProps: any;

  // source mode
  plotSourceType: PlotSourceType = 'dataset';
  isTilesetOnlyReadOnly = false;

  // RIGHT: editable plot details model
  plotModel = {
    plotNo: '',
    doc_no: '',
    east: '',
    west: '',
    north: '',
    south: '',
    salestatus: '' as Status,
    facing: '',
    ownername: '',
    Developer: '',
    priceMin: '',
    priceMax: '',
    priceUnit: 'Sq ft',
  };

  saleStatusOptions: Status[] = ['Available', 'In Progress', 'Sold'];
  ownersList: string[] = [];
  developersList: string[] = [];

  private originalModel: any = {};
  isDirty = false;
  isSaving = false;

  private subs: Subscription[] = [];
  private ro?: ResizeObserver;

  constructor(
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private adminAssets: AssetSelectionService,
    private cdr: ChangeDetectorRef,
    private plotStatusSvc: PlotStatusService,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.route.queryParamMap.subscribe(async (params) => {
        const name = params.get('name');
        const projectIdStr = params.get('projectId');
        const surveyIdStr = params.get('surveyId');

        this.assetName = name && name.trim() ? name : 'New Asset';
        this.projectId = projectIdStr ? Number(projectIdStr) : undefined;
        this.surveyId = surveyIdStr ? Number(surveyIdStr) : undefined;

        console.log(
          '[PlotDetails] init → assetName:',
          this.assetName,
          'projectId:',
          this.projectId,
          'surveyId:',
          this.surveyId,
        );

        try {
          this.view = await firstValueFrom(this.dashboardService.getView());
        } catch {}

        this.selectedProject = await this.resolveProject(this.projectId);
        this.selectedSurvey = await this.resolveSurvey(
          this.projectId,
          this.surveyId,
        );

        await this.loadSurveyDataAndBuildMap(this.selectedSurvey);

        this.resetPlotModel();
        this.commitBaseline();
      }),
    );
  }

  ngAfterViewInit(): void {
    this.ro = new ResizeObserver(() => this.nudgeMapResize());
    if (this.leftCol?.nativeElement) {
      this.ro.observe(this.leftCol.nativeElement);
    }
    this.nudgeMapResize();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.ro?.disconnect();
  }

  private nudgeMapResize(): void {
    try {
      this.mapCmp?.resize?.();
    } catch {}
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
  }

  private getMapInstance(): any {
    return (
      this.mapCmp?.map ||
      this.mapCmp?.mapInstance ||
      this.mapCmp?._map ||
      this.mapCmp?.mbMap ||
      this.mapCmp
    );
  }

  private zoomToBBox(bbox?: PlotBBox): void {
    if (!bbox || bbox.length !== 4) {
      return;
    }

    const [minX, minY, maxX, maxY] = bbox;

    if (
      [minX, minY, maxX, maxY].some(
        (v) => typeof v !== 'number' || Number.isNaN(v),
      )
    ) {
      return;
    }

    try {
      const map = this.getMapInstance();

      if (map?.fitBounds) {
        map.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          {
            padding: { top: 60, bottom: 60, left: 60, right: 60 },
            duration: 1000,
            maxZoom: 20,
          },
        );
        return;
      }

      if (map?.flyTo) {
        const centerLng = (minX + maxX) / 2;
        const centerLat = (minY + maxY) / 2;

        map.flyTo({
          center: [centerLng, centerLat],
          zoom: 18,
          duration: 1000,
        });
      }
    } catch (e) {
      console.warn('[PlotDetails] zoomToBBox failed', e);
    }
  }

  private async resolveProject(projectId?: number): Promise<Project> {
    try {
      const projects = await firstValueFrom(this.adminAssets.getAllProjects());
      const proj = projects?.find(
        (p: any) => Number(p.id) === Number(projectId),
      );
      return (
        proj ??
        ({
          id: 0,
          name: 'Unknown',
          categoryId: 0,
          clientId: 0,
          streetMapId: 0,
          satelliteMapId: 0,
          location: '',
          area: 0,
          description: '',
          frequency: '',
        } as Project)
      );
    } catch {
      return {
        id: 0,
        name: 'Unknown',
        categoryId: 0,
        clientId: 0,
        streetMapId: 0,
        satelliteMapId: 0,
        location: '',
        area: 0,
        description: '',
        frequency: '',
      } as Project;
    }
  }

  private normalizeStatus(s: any): 'Available' | 'In Progress' | 'Sold' {
    return uiToStorage(s);
  }

  private async resolveSurvey(
    projectId?: number,
    surveyId?: number,
  ): Promise<Survey> {
    if (!projectId) {
      return {
        id: 0,
        projectId: 0,
        name: 'Unknown',
        latitude: 16.69524,
        longitude: 78.044937,
        zoom: 14,
        zoomMin: 4,
        zoomMax: 20,
        plotView: false,
      } as Survey;
    }

    const surveys = await firstValueFrom(
      this.dashboardService.getSurveys(projectId),
    );
    let survey = surveys?.find((s) => s.id === surveyId);
    if (!survey) survey = surveys?.[0];

    return (
      survey ??
      ({
        id: 0,
        projectId,
        name: 'Unknown',
        latitude: 16.69524,
        longitude: 78.044937,
        zoom: 14,
        zoomMin: 4,
        zoomMax: 20,
        plotView: false,
      } as Survey)
    );
  }

  private async loadOwnersAndDevelopersFromDataset(): Promise<void> {
    if (!this.tilesetId || !this.selectedSurvey?.id) {
      console.warn(
        '[PlotDetails] meta fetch skipped: missing tilesetId/surveyId',
      );
      return;
    }

    try {
      const res = await firstValueFrom(
        this.plotStatusSvc.getPlotMeta({
          surveyId: Number(this.selectedSurvey.id),
          tilesetId: this.tilesetId,
        }),
      );

      console.log('[PlotDetails] meta response →', res);

      const owners = Array.isArray(res?.owners) ? res.owners : [];
      const developers = Array.isArray(res?.developers) ? res.developers : [];

      this.ownersList = this.withAddNewOption(owners);
      this.developersList = this.withAddNewOption(developers);
    } catch (e) {
      console.error('[PlotDetails] Failed to fetch owners/developers', e);
      this.ownersList = this.withAddNewOption([]);
      this.developersList = this.withAddNewOption([]);
    }
  }

  private withAddNewOption(values: string[]): string[] {
    const clean = values
      .map((v) => String(v || '').trim())
      .filter((v) => !!v && v !== this.ADD_NEW_OPTION);

    return [this.ADD_NEW_OPTION, ...Array.from(new Set(clean))];
  }

  private async loadSurveyDataAndBuildMap(survey: Survey): Promise<void> {
    if (!survey || !survey.id) {
      this.buildMinimalMapConfig();
      return;
    }

    try {
      const srcs: any[] = await firstValueFrom(
        this.adminAssets.getSourcesBySurveyId(Number(survey.id)),
      );

      const sourceIds =
        srcs
          ?.map((s: any) => s.id)
          .filter(Boolean)
          .join(',') || '';

      const [layers, groups, layouts] = await Promise.all([
        firstValueFrom(this.dashboardService.getLayers(sourceIds)),
        firstValueFrom(this.dashboardService.getGroups(Number(survey.id))),
        firstValueFrom(this.dashboardService.getLayouts(Number(survey.id))),
      ]);

      layers.forEach((l: any) => {
        if (this.view?.topographies) {
          l.topography = this.view.topographies.find(
            (t: any) => l.topoId == t.id,
          );
        }
        l.groupId = l.groupid;
      });

      srcs.forEach(
        (s: any) => (s.layers = layers.filter((l: any) => l.sourceId == s.id)),
      );

      this.sources = srcs as Source[];

      console.log('Owners List →', this.ownersList);

      this.groups = groups as any;
      this.layouts = layouts as any;

      this.buildMapConfigFromViewProjectSurvey(survey, this.sources);

      const plots =
        (this.sources || []).find(
          (s: any) =>
            String(s.datatype).toLowerCase() === 'vector' &&
            /plot|parcel|layout/i.test(String(s.sourcename || s.name || '')),
        ) || (this.sources || [])[0];

      console.log('[PlotDetails] chosen plots source', plots);

      this.tilesetId =
        (plots as any)?.link ??
        (plots as any)?.sourcelink ??
        (plots as any)?.sourceLink ??
        undefined;

      this.datasetId =
        (plots as any)?.datasetid ??
        (plots as any)?.datasetId ??
        (this.tilesetId
          ? this.datasetIdFromTileset(this.tilesetId)
          : undefined);

      await this.loadOwnersAndDevelopersFromDataset();

      console.log(
        '[PlotDetails] ids → tilesetId =',
        this.tilesetId,
        'datasetId =',
        this.datasetId,
      );
    } catch (e) {
      console.error('[PlotDetails] loadSurveyDataAndBuildMap error', e);
      this.sources = [];
      this.groups = [];
      this.layouts = [];
      this.buildMinimalMapConfig();
      this.ownersList = this.withAddNewOption([]);
      this.developersList = this.withAddNewOption([]);
    }
  }

  private datasetIdFromTileset(tilesetId: string): string {
    const suffix = tilesetId.includes('.')
      ? tilesetId.split('.')[1]
      : tilesetId;
    return suffix.replace(/-[a-z0-9]{4,}$/i, '');
  }

  private buildMapConfigFromViewProjectSurvey(
    survey: Survey,
    sources: Source[],
  ): void {
    const streetMap = this.view?.mapStyles?.find(
      (s) => s.id == (this.selectedProject?.streetMapId ?? 0),
    );
    const satelliteMap = this.view?.mapStyles?.find(
      (s) => s.id == (this.selectedProject?.satelliteMapId ?? 0),
    );

    this.mapConfig = {
      streetUrl: streetMap
        ? streetMap.url
        : 'mapbox://styles/mapbox/streets-v12',
      satelliteUrl: satelliteMap
        ? satelliteMap.url
        : 'mapbox://styles/mapbox/satellite-streets-v12',
      latitude: survey.latitude ?? 16.69524,
      longitude: survey.longitude ?? 78.044937,
      zoom: survey.zoom ?? 14,
      minZoom: survey.zoomMin ?? 4,
      maxZoom: survey.zoomMax ?? 20,
      enableHighlight: !!survey.plotView,
      sources,
      landmarks: this.landmarks,
    } as MapConfig;

    try {
      this.cdr.detectChanges();
    } catch {}

    this.nudgeMapResize();
  }

  private buildMinimalMapConfig(): void {
    this.mapConfig = {
      streetUrl: 'mapbox://styles/mapbox/streets-v12',
      satelliteUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
      latitude: 16.69524,
      longitude: 78.044937,
      zoom: 14,
      minZoom: 4,
      maxZoom: 20,
      enableHighlight: false,
      sources: [],
      landmarks: [],
    } as MapConfig;
  }

  private resetPlotModel() {
    this.plotModel = {
      plotNo: '',
      doc_no: '',
      east: '',
      west: '',
      north: '',
      south: '',
      salestatus: 'Available',
      facing: '',
      ownername: '',
      Developer: '',
      priceMin: '',
      priceMax: '',
      priceUnit: 'Sq ft',
    };
    this.customOwnerName = '';
    this.customDeveloperName = '';
    this.isPlotSelected = false;
    this.plotSourceType = 'dataset';
    this.isTilesetOnlyReadOnly = false;
    this.selectedFeatureProps = undefined;
    this.isDirty = false;
  }

  private mapFeaturePropertiesToPlot(
    props: any,
    plotNoFallback: string | number = '',
  ): PlotDetails {
    const p = props || {};

    const getProp = (keys: string[], fallback = ''): string => {
      for (const k of keys) {
        if (p?.[k] !== undefined && p?.[k] !== null) {
          return String(p[k]);
        }
      }
      return fallback;
    };

    const priceMin = getProp(['priceMin', 'price_min'], '');
    const priceMax = getProp(['priceMax', 'price_max'], '');
    const priceRange = getProp(['priceRange', 'price_range'], '');
    const rangeMatch =
      !priceMin && !priceMax ? priceRange.match(/(\d+)\s*-\s*(\d+)/) : null;

    return {
      plotNo: getProp(
        ['plotNo', 'plot_no', 'name', 'plot'],
        String(plotNoFallback),
      ),
      doc_no: getProp(['doc_no', 'docNo', 'document_no', 'documentNo'], ''),
      east: getProp(['east', 'eastBoundary', 'east_boundary'], ''),
      west: getProp(['west', 'westBoundary', 'west_boundary'], ''),
      north: getProp(['north', 'northBoundary', 'north_boundary'], ''),
      south: getProp(['south', 'southBoundary', 'south_boundary'], ''),
      salestatus: getProp(['salestatus', 'sale_status', 'status'], 'Available'),
      facing: getProp(['facing'], ''),
      ownername: getProp(['ownername', 'owner_name', 'owner'], ''),
      Developer: getProp(['Developer', 'developer', 'Devloper'], ''),
      priceMin: priceMin || (rangeMatch ? rangeMatch[1] : ''),
      priceMax: priceMax || (rangeMatch ? rangeMatch[2] : ''),
      priceUnit: getProp(['priceUnit', 'price_unit'], 'Sq ft'),
    };
  }

  private hydratePlotModelFromDataset(plot: PlotDetails) {
    const ownerValue = String(plot?.ownername ?? '').trim();
    const developerValue = String(plot?.Developer ?? '').trim();

    this.plotModel.plotNo = String(plot?.plotNo ?? '');
    this.plotModel.doc_no = String(plot?.doc_no ?? '');
    this.plotModel.east = String(plot?.east ?? '');
    this.plotModel.west = String(plot?.west ?? '');
    this.plotModel.north = String(plot?.north ?? '');
    this.plotModel.south = String(plot?.south ?? '');
    this.plotModel.facing = String(plot?.facing ?? '');
    this.plotModel.salestatus = storageToUI(plot?.salestatus ?? 'Available');
    this.plotModel.ownername = ownerValue;
    this.plotModel.Developer = developerValue;
    this.plotModel.priceMin = String(plot?.priceMin ?? '');
    this.plotModel.priceMax = String(plot?.priceMax ?? '');
    this.plotModel.priceUnit = String(plot?.priceUnit ?? 'Sq ft');

    this.customOwnerName = '';
    this.customDeveloperName = '';

    if (ownerValue && !this.ownersList.includes(ownerValue)) {
      this.ownersList = this.withAddNewOption([...this.ownersList, ownerValue]);
    }

    if (developerValue && !this.developersList.includes(developerValue)) {
      this.developersList = this.withAddNewOption([
        ...this.developersList,
        developerValue,
      ]);
    }

    this.commitBaseline();
  }

  private hydratePlotModelFromTilesetProperties(props: any) {
    const plot = this.mapFeaturePropertiesToPlot(
      props,
      this.selectedPlotNo ?? '',
    );

    this.plotSourceType = 'tileset';
    this.isTilesetOnlyReadOnly = true;

    this.hydratePlotModelFromDataset(plot);

    console.log('[PlotDetails] using tileset properties fallback →', plot);
  }

  private shouldFallbackToTileset(err: any): boolean {
    const status = Number(err?.status ?? err?.error?.status ?? 0);
    const message = String(
      err?.error?.message || err?.message || '',
    ).toLowerCase();

    return (
      !!this.selectedFeatureProps &&
      (status === 404 ||
        message.includes('dataset') ||
        message.includes('datasetsref') ||
        message.includes('failed to fetch dataset id') ||
        message.includes('no dataset found'))
    );
  }

  private async fetchPlotDetailsFromDataset(
    showError = true,
    zoomToPlot = false,
  ): Promise<void> {
    if (!this.tilesetId) {
      console.warn('[PlotDetails] fetch skipped: missing tilesetId');
      return;
    }

    if (!this.selectedPlotNo && !this.selectedFeatureId) {
      console.warn(
        '[PlotDetails] fetch skipped: missing both selectedPlotNo and selectedFeatureId',
      );
      return;
    }

    try {
      const res = await firstValueFrom(
        this.plotStatusSvc.getPlotDetails({
          surveyId: Number(this.selectedSurvey?.id ?? this.surveyId ?? 0),
          tilesetId: this.tilesetId,
          featureId: this.selectedFeatureId,
          plotNo: this.selectedFeatureId ? undefined : this.selectedPlotNo,
        }),
      );

      console.log('[PlotDetails] dataset response →', res);

      this.plotSourceType = 'dataset';
      this.isTilesetOnlyReadOnly = false;

      if (res?.datasetId) {
        this.datasetId = res.datasetId;
      }

      if (res?.featureId) {
        this.selectedFeatureId = res.featureId;
      }

      if (res?.plot) {
        this.hydratePlotModelFromDataset(res.plot);
      } else {
        console.warn('[PlotDetails] No plot object returned from dataset API');
      }

      if (zoomToPlot && res?.bbox) {
        this.zoomToBBox(res.bbox);
      }
    } catch (e: any) {
      console.error(
        '[PlotDetails] Failed to fetch plot details from dataset',
        e,
      );

      if (this.shouldFallbackToTileset(e)) {
        console.warn(
          '[PlotDetails] dataset not available, falling back to tileset feature properties',
        );
        this.selectedFeatureId = undefined;
        this.datasetId = undefined;
        this.hydratePlotModelFromTilesetProperties(this.selectedFeatureProps);
        return;
      }

      if (showError) {
        alert('Failed to load plot details');
      }
    }
  }

  isAddNewOwnerSelected(): boolean {
    return this.plotModel.ownername === this.ADD_NEW_OPTION;
  }

  isAddNewDeveloperSelected(): boolean {
    return this.plotModel.Developer === this.ADD_NEW_OPTION;
  }

  onOwnerDropdownChange() {
    if (!this.isAddNewOwnerSelected()) {
      this.customOwnerName = '';
    }
    this.markDirty();
  }

  onDeveloperDropdownChange() {
    if (!this.isAddNewDeveloperSelected()) {
      this.customDeveloperName = '';
    }
    this.markDirty();
  }

  private getFinalOwnerValue(): string {
    if (this.isAddNewOwnerSelected()) {
      return String(this.customOwnerName || '').trim();
    }
    return String(this.plotModel.ownername || '').trim();
  }

  private getFinalDeveloperValue(): string {
    if (this.isAddNewDeveloperSelected()) {
      return String(this.customDeveloperName || '').trim();
    }
    return String(this.plotModel.Developer || '').trim();
  }

  async onSearchPlot(): Promise<void> {
    const plotNo = String(this.searchPlotNo || '').trim();

    if (!plotNo) {
      alert('Please enter a plot number');
      return;
    }

    if (!this.tilesetId) {
      alert('Tileset mapping is missing for this survey.');
      return;
    }

    this.isSearchingPlot = true;

    try {
      this.selectedPlotNo = plotNo;
      this.isPlotSelected = true;
      this.selectedFeatureId = undefined;
      this.selectedFeatureProps = undefined;
      this.plotSourceType = 'dataset';
      this.isTilesetOnlyReadOnly = false;

      await this.fetchPlotDetailsFromDataset(true, true);
    } finally {
      this.isSearchingPlot = false;
    }
  }

  onSearchPlotEnter(event: Event): void {
    event.preventDefault();
    this.onSearchPlot();
  }

  onMapMouseEvents(mapEvent: MapLayerMouseEvent | MapMouseEvent) {
    if (mapEvent.type === AppConstants.MAP_MOUSE_LEFT_CLICK_EVENT) {
      const clickAttributes = this.layouts.length
        ? this.layouts[0]?.clickAttributes?.split(',') || []
        : [];

      const features = (mapEvent as MapLayerMouseEvent).features || [];

      const matched = features.find((f) => {
        const p = f?.properties;
        return (
          p &&
          (clickAttributes.length
            ? clickAttributes.some((attr) => p.hasOwnProperty(attr))
            : true)
        );
      });

      if (matched) {
        const p = matched.properties || {};

        this.selectedPlotNo =
          p['plot_no'] ??
          p['plotNo'] ??
          p['plot'] ??
          p['plotid'] ??
          p['plotId'] ??
          p['name'];

        // important: clear old featureId when selecting a different plot from map
        this.selectedFeatureId = undefined;
        this.selectedFeatureProps = p;
        this.plotSourceType = 'dataset';
        this.isTilesetOnlyReadOnly = false;

        if (!this.selectedPlotNo) {
          console.warn('No plot number found in feature:', p);
          return;
        }

        this.isPlotSelected = true;
        this.searchPlotNo = String(this.selectedPlotNo);
        this.plotModel.plotNo = String(this.selectedPlotNo);

        console.log(
          '[PlotDetails] click → selectedPlotNo:',
          this.selectedPlotNo,
          'props:',
          p,
        );

        this.fetchPlotDetailsFromDataset(true);
      }
    }
  }

  markDirty() {
    if (this.isTilesetOnlyReadOnly) {
      this.isDirty = false;
      return;
    }

    const comparableModel = {
      ...this.plotModel,
      customOwnerName: this.customOwnerName,
      customDeveloperName: this.customDeveloperName,
    };

    const comparableOriginal = {
      ...this.originalModel,
      customOwnerName: this.originalModel?.customOwnerName ?? '',
      customDeveloperName: this.originalModel?.customDeveloperName ?? '',
    };

    this.isDirty =
      JSON.stringify(comparableModel) !== JSON.stringify(comparableOriginal);
  }

  private commitBaseline() {
    this.originalModel = JSON.parse(
      JSON.stringify({
        ...this.plotModel,
        customOwnerName: this.customOwnerName,
        customDeveloperName: this.customDeveloperName,
      }),
    );
    this.isDirty = false;
  }

  async onSave() {
    if (this.isTilesetOnlyReadOnly || this.plotSourceType === 'tileset') {
      alert(
        'This project is tileset-only. Viewing is supported, but editing is not available.',
      );
      return;
    }

    if (!this.isDirty || this.isSaving) return;

    if (!this.selectedPlotNo && !this.selectedFeatureId) {
      alert('Select a plot on the map first.');
      return;
    }

    if (!this.tilesetId || !this.datasetId) {
      alert('Missing tileset/dataset mapping for this survey.');
      return;
    }

    const finalOwnerName = this.getFinalOwnerValue();
    const finalDeveloperName = this.getFinalDeveloperValue();
    const finalDocNo = String(this.plotModel.doc_no || '').trim();

    if (this.isAddNewOwnerSelected() && !finalOwnerName) {
      alert('Please enter the new owner name.');
      return;
    }

    if (this.isAddNewDeveloperSelected() && !finalDeveloperName) {
      alert('Please enter the new developer name.');
      return;
    }

    const payload = {
      surveyId: Number(this.selectedSurvey?.id ?? this.surveyId ?? 0),
      tilesetId: this.tilesetId,
      datasetId: this.datasetId,
      featureId: this.selectedFeatureId,
      plotNo: this.selectedFeatureId ? undefined : this.selectedPlotNo,
      newStatus: this.normalizeStatus(this.plotModel.salestatus),
      ownername: finalOwnerName,
      Developer: finalDeveloperName,
      doc_no: finalDocNo,
    };

    console.log('[PlotDetails] request payload →', payload);

    this.isSaving = true;
    try {
      const updateRes = await firstValueFrom(
        this.plotStatusSvc.updateStatus(payload as any),
      );

      console.log('[PlotDetails] update response →', updateRes);

      if (updateRes?.datasetId) {
        this.datasetId = updateRes.datasetId;
      }

      if (updateRes?.featureId) {
        this.selectedFeatureId = updateRes.featureId;
      }

      if (finalOwnerName && !this.ownersList.includes(finalOwnerName)) {
        this.ownersList = this.withAddNewOption([
          ...this.ownersList,
          finalOwnerName,
        ]);
      }

      if (
        finalDeveloperName &&
        !this.developersList.includes(finalDeveloperName)
      ) {
        this.developersList = this.withAddNewOption([
          ...this.developersList,
          finalDeveloperName,
        ]);
      }

      if (updateRes?.plot) {
        this.plotSourceType = 'dataset';
        this.isTilesetOnlyReadOnly = false;
        this.hydratePlotModelFromDataset(updateRes.plot);
      }

      // One more fresh fetch using featureId path
      await this.fetchPlotDetailsFromDataset(false);

      this.nudgeMapResize();
    } catch (e) {
      console.error(e);
      alert('Failed to update');
    } finally {
      this.isSaving = false;
    }
  }
}
