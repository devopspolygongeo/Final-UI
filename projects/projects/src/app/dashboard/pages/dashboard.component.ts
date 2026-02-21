import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AppConstants } from '../../core/constants/app.constants';
import { ErrorMessages } from '../../core/constants/error-messages';
import { Asset, Group, Landmark, Layout, Project, Source, Survey, View } from '../../core/models';
import { AuthService } from '../../login/services/auth.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
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

  constructor(private readonly dashboardService: DashboardService, private readonly authService: AuthService, private readonly router: Router) {
  }

  ngOnInit() {
    this.loadInitData();

    // this.view = getView()
  }

  private loadInitData() {
    const user = this.authService.getUser();
    if (user) {
      forkJoin(
        {
          view: this.dashboardService.getView(),
          projects: this.dashboardService.getProjects(user.id)
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
          }
        });
    } else {
      this.errorMsg = ErrorMessages.INTERNAL_SERVER_ERROR
      console.error("user info is not available");
    }
  }

  async onProjectChange(project: Project) {
    if (project) {
      this.isMiningProject = project.categoryId === 30;
      this.surveys = await firstValueFrom(this.dashboardService.getSurveys(project.id));
    }
  }

  async onSurveyChange(survey: Survey) {
    if (survey) {
      try {
        const sourceResult = await firstValueFrom(this.dashboardService.getSources(survey.id));

        const sourceIds = sourceResult.map(source => source.id).join(',');
       // console.log("📦 Source IDs for layers:", sourceIds);
        const layerResult = await firstValueFrom(this.dashboardService.getLayers(sourceIds));
        //console.log("📦 Raw Layers from backend: layeresult", layerResult);
        const groupResult = await firstValueFrom(this.dashboardService.getGroups(survey.id));
        //console.log("🔥 groupResult from backend:", groupResult);
        const layoutsResult = await firstValueFrom(this.dashboardService.getLayouts(survey.id));
        const assetsResult = await firstValueFrom(this.dashboardService.getAssets(survey.id));
        const landmarksResult = await firstValueFrom(this.dashboardService.getLandmarks(survey.id));

        layerResult.forEach(layer => {
          layer.topography = this.view.topographies.find(topo => layer.topoId == topo.id);
          layer.groupId = (layer as any).groupid;
        })

        sourceResult.forEach(source => {
         // console.log("📦 Raw Layers from backend:", layerResult);

          source.layers = layerResult.filter(layer => layer.sourceId == source.id);

          source.layers.forEach(layer => {
           // console.log(`Layer: ${layer.name}, groupid: ${(layer as any).groupid}, final groupId: ${layer.groupId}`);

            layer.groupId = layer.groupId || (layer as any).groupid;
            const group = groupResult.find(group => group.id === layer.groupId)
            if (group) {
              layer.visibility = group.visibility;
              layer.group = group;
           //   console.log("group", group)
              layer.group.type = group.type; // Ensure group type is set
              // console.log("🎯 Mapping Layer:", layer.displayName);
              // console.log("🧩 Assigned Group:", group);
              // console.log("📛 Assigned group.type (should be name):", group.type);
            }
          })
        });
        this.sources = sourceResult;
        this.groups = groupResult;

        // this.plots = plotsResult;
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
    if (isLoggedOut) {
      this.authService.logout().subscribe(() => {
        this.router.navigateByUrl(AppConstants.LOGIN_URL)
      });
    };
  }

}
