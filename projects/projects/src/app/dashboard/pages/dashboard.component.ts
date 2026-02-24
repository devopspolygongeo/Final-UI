import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AppConstants } from '../../core/constants/app.constants';
import { ErrorMessages } from '../../core/constants/error-messages';
import {
  Asset,
  Group,
  Landmark,
  Layout,
  Project,
  Source,
  Survey,
  View,
} from '../../core/models';
import { AuthService } from '../../login/services/auth.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  public view!: View;
  public projects!: Project[];
  public surveys!: Survey[];
  public groups!: Group[];
  public layouts!: Layout[];
  public sources!: Source[];
  public assets!: Asset[];
  public landmarks!: Landmark[];
  public errorMsg: string = '';
  public isLoaded = false;
  public isMiningProject: boolean = false;

  // ✅ Share mode (added)
  public isShareMode = false;
  public shareToken: string | null = null;
  public shareMeta: any = null;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // ✅ Detect share mode from route param (added)
    this.shareToken = this.route.snapshot.paramMap.get('token');
    this.isShareMode = !!this.shareToken;

    if (this.isShareMode && this.shareToken) {
      this.loadShareData(this.shareToken);
      return;
    }

    // ✅ Existing working flow unchanged
    this.loadInitData();
  }

  // ✅ Share flow: resolve token -> load project + survey -> load survey datasets (extended safely)
  private async loadShareData(token: string) {
    try {
      // 1) Load view first (needed for mapStyles + topographies mapping)
      this.view = await firstValueFrom(this.dashboardService.getView());

      // 2) Resolve token -> survey context
      this.shareMeta = await firstValueFrom(
        this.dashboardService.getShareMeta(token),
      );
      console.log('✅ Share meta:', this.shareMeta);

      // 3) Fetch full project + survey objects (required by DashboardViewComponent)
      const [project, survey] = await Promise.all([
        firstValueFrom(
          this.dashboardService.getProjectById(this.shareMeta.projectid),
        ),
        firstValueFrom(
          this.dashboardService.getSurveyById(this.shareMeta.surveyid),
        ),
      ]);

      // 4) Provide projects/surveys arrays so child component sets selectedProject/selectedSurvey
      this.projects = [project];
      this.surveys = [survey];

      // 5) Mining flag (keep same logic as existing flow)
      this.isMiningProject = project.categoryId === 30;

      // 6) Load survey-scoped datasets using existing working method
      await this.onSurveyChange(survey);

      this.isLoaded = true;
    } catch (error) {
      console.error(error);
      this.errorMsg = 'Invalid or inactive share link';
    }
  }

  // ✅ Existing working code unchanged
  private loadInitData() {
    const user = this.authService.getUser();
    if (user) {
      forkJoin({
        view: this.dashboardService.getView(),
        projects: this.dashboardService.getProjects(user.id),
      }).subscribe({
        next: ({ view, projects }) => {
          this.view = view;
          this.projects = projects;
        },
        error: (error: HttpErrorResponse) => {
          if (error.error.status == 400) {
            this.errorMsg = error.error.message;
          } else {
            this.errorMsg = ErrorMessages.INTERNAL_SERVER_ERROR;
          }
        },
      });
    } else {
      this.errorMsg = ErrorMessages.INTERNAL_SERVER_ERROR;
      console.error('user info is not available');
    }
  }

  async onProjectChange(project: Project) {
    if (project) {
      this.isMiningProject = project.categoryId === 30;
      this.surveys = await firstValueFrom(
        this.dashboardService.getSurveys(project.id),
      );
    }
  }

  async onSurveyChange(survey: Survey) {
    if (survey) {
      try {
        const sourceResult = await firstValueFrom(
          this.dashboardService.getSources(survey.id),
        );

        const sourceIds = sourceResult.map((source) => source.id).join(',');
        const layerResult = await firstValueFrom(
          this.dashboardService.getLayers(sourceIds),
        );
        const groupResult = await firstValueFrom(
          this.dashboardService.getGroups(survey.id),
        );
        const layoutsResult = await firstValueFrom(
          this.dashboardService.getLayouts(survey.id),
        );
        const assetsResult = await firstValueFrom(
          this.dashboardService.getAssets(survey.id),
        );
        const landmarksResult = await firstValueFrom(
          this.dashboardService.getLandmarks(survey.id),
        );

        layerResult.forEach((layer) => {
          layer.topography = this.view.topographies.find(
            (topo) => layer.topoId == topo.id,
          );
          layer.groupId = (layer as any).groupid;
        });

        sourceResult.forEach((source) => {
          source.layers = layerResult.filter(
            (layer) => layer.sourceId == source.id,
          );

          source.layers.forEach((layer) => {
            layer.groupId = layer.groupId || (layer as any).groupid;
            const group = groupResult.find(
              (group) => group.id === layer.groupId,
            );
            if (group) {
              layer.visibility = group.visibility;
              layer.group = group;
              layer.group.type = group.type; // Ensure group type is set
            }
          });
        });

        this.sources = sourceResult;
        this.groups = groupResult;
        this.layouts = layoutsResult;
        this.assets = assetsResult;
        this.landmarks = landmarksResult;
      } catch (error) {
        console.error(error);
        this.errorMsg = ErrorMessages.INTERNAL_SERVER_ERROR;
      }
    }
  }

  onLogout(isLoggedOut: boolean) {
    // ✅ In share mode, ignore logout clicks (prevents /login routing error)
    if (this.isShareMode) return;

    if (isLoggedOut) {
      this.authService.logout().subscribe(() => {
        this.router.navigateByUrl(AppConstants.LOGIN_URL);
      });
    }
  }
}
