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
} from '../../../services/plot-status.service';

/** --- Status helpers (UI <-> storage) --- */
const STATUS_UI = ['Available', 'In Progress', 'Sold'] as const;
type Status = (typeof STATUS_UI)[number];

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
  return 'Available';
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

  // RIGHT: editable plot details model
  plotModel = {
    plotNo: '',
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

      this.ownersList = [];
      this.developersList = [];

      this.sources.forEach((src: any) => {
        if (src?.data?.features) {
          src.data.features.forEach((f: any) => {
            const owner =
              f.properties?.ownername ||
              f.properties?.owner_name ||
              f.properties?.owner;

            if (owner && !this.ownersList.includes(owner)) {
              this.ownersList.push(owner);
            }

            const Developer =
              f.properties?.Developer ||
              f.properties?.developer ||
              f.properties?.Devloper;

            if (Developer && !this.developersList.includes(Developer)) {
              this.developersList.push(Developer);
            }
          });
        }
      });

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
    this.isDirty = false;
  }

  private hydratePlotModelFromDataset(plot: PlotDetails) {
    this.plotModel.plotNo = String(plot?.plotNo ?? '');
    this.plotModel.east = String(plot?.east ?? '');
    this.plotModel.west = String(plot?.west ?? '');
    this.plotModel.north = String(plot?.north ?? '');
    this.plotModel.south = String(plot?.south ?? '');
    this.plotModel.facing = String(plot?.facing ?? '');
    this.plotModel.salestatus = storageToUI(plot?.salestatus ?? 'Available');
    this.plotModel.ownername = String(plot?.ownername ?? '');
    this.plotModel.Developer = String(plot?.Developer ?? '');
    this.plotModel.priceMin = String(plot?.priceMin ?? '');
    this.plotModel.priceMax = String(plot?.priceMax ?? '');
    this.plotModel.priceUnit = String(plot?.priceUnit ?? 'Sq ft');

    if (
      this.plotModel.ownername &&
      !this.ownersList.includes(this.plotModel.ownername)
    ) {
      this.ownersList.push(this.plotModel.ownername);
    }

    if (
      this.plotModel.Developer &&
      !this.developersList.includes(this.plotModel.Developer)
    ) {
      this.developersList.push(this.plotModel.Developer);
    }

    this.commitBaseline();
  }

  private async fetchPlotDetailsFromDataset(showError = true): Promise<void> {
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
    } catch (e) {
      console.error(
        '[PlotDetails] Failed to fetch plot details from dataset',
        e,
      );
      if (showError) {
        alert('Failed to load plot details from dataset');
      }
    }
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

        if (!this.selectedPlotNo) {
          console.warn('No plot number found in feature:', p);
          return;
        }

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
    this.isDirty =
      JSON.stringify(this.plotModel) !== JSON.stringify(this.originalModel);
  }

  private commitBaseline() {
    this.originalModel = JSON.parse(JSON.stringify(this.plotModel));
    this.isDirty = false;
  }

  async onSave() {
    if (!this.isDirty || this.isSaving) return;

    if (!this.selectedPlotNo && !this.selectedFeatureId) {
      alert('Select a plot on the map first.');
      return;
    }

    if (!this.tilesetId || !this.datasetId) {
      alert('Missing tileset/dataset mapping for this survey.');
      return;
    }

    const payload = {
      surveyId: Number(this.selectedSurvey?.id ?? this.surveyId ?? 0),
      tilesetId: this.tilesetId,
      datasetId: this.datasetId,
      featureId: this.selectedFeatureId,
      plotNo: this.selectedFeatureId ? undefined : this.selectedPlotNo,
      newStatus: this.normalizeStatus(this.plotModel.salestatus),
      ownername: this.plotModel.ownername,
      Developer: this.plotModel.Developer,
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

      if (updateRes?.plot) {
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
