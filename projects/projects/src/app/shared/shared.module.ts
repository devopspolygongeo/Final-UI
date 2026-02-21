import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule } from '@angular/material/dialog';
import { AppDialogComponent } from '../shared/components/app-dialog/app-dialog.component';
import { MapComponent } from '../shared/components/map/map.component';
import { MapValuePipe } from './pipes/map-value.pipe';
import { SanitizeHtmlPipe } from './pipes/sanitize-html.pipe';
import { SanitizeUrlPipe } from './pipes/sanitize-url.pipe';
import { SortPipe } from './pipes/sort.pipe';
import { FormsModule } from '@angular/forms';
@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule
  ],
  declarations: [
    MapComponent,
    AppDialogComponent,
    SortPipe,
    MapValuePipe,
    SanitizeHtmlPipe,
    SanitizeUrlPipe
  ],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true } }
  ],
  exports: [
    MapComponent,
    AppDialogComponent,
    SortPipe,
    MapValuePipe,
    SanitizeHtmlPipe,
    SanitizeUrlPipe
  ]
})
export class SharedModule { }
