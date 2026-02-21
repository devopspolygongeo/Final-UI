import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SharedModule } from '../shared/shared.module';
import { AccessibilityComponent } from './components/accessibility/accessibility.component';
import { DashboardViewComponent } from './components/dashboard-view.component';
import { DocumentsComponent } from './components/documents/documents.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { LandmarksComponent } from './components/landmarks/landmarks.component';
import { LayersComponent } from './components/layers/layers.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './pages/dashboard.component';
import { DashboardService } from './services/dashboard.service';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutsPanelComponent } from './components/layouts-panel/layouts-panel.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { View360Component } from './components/view-360/view-360.component';
import { LandmarksMobileViewComponent } from './components/landmarks-mobile-view/landmarks.component';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from "@angular/material/menu";


@NgModule({
  imports: [
    CommonModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDialogModule,
    //   BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    HttpClientModule,
    MatSelectModule,
    MatMenuModule
  ],
  declarations: [
    DashboardViewComponent,
    LayoutsPanelComponent,
    LayersComponent,
    DashboardComponent,
    GalleryComponent,
    DocumentsComponent,
    LandmarksComponent,
    AccessibilityComponent,
    View360Component,
    LandmarksMobileViewComponent
  ],
  providers: [
    DashboardService
  ],
  exports: [
    DashboardRoutingModule,
    SharedModule,              // re-export so <app-map> is visible
    LayersComponent,           // <app-layers>
    LayoutsPanelComponent,
    LandmarksComponent
  ]
})
export class DashboardModule { }
