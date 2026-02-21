import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AssetDetailComponent } from './asset-detail.component';
import { SourcesComponent } from './sources/sources.component'; // Remove standalone
import { GroupsComponent } from './groups/groups.component'; // Remove standalone
import { LayersComponent } from './layers/layers.component'; // Remove standalone
import { PlotAttributesComponent } from './plot-attributes/plot-attributes.component'; // Remove standalone

@NgModule({
    declarations: [
        AssetDetailComponent,
        SourcesComponent,
        GroupsComponent,
        LayersComponent,
        PlotAttributesComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild([
            {
                path: '',
                component: AssetDetailComponent,
                children: [
                    { path: '', redirectTo: 'sources', pathMatch: 'full' },
                    { path: 'sources', component: SourcesComponent },
                    { path: 'groups', component: GroupsComponent },
                    { path: 'layers', component: LayersComponent },
                    { path: 'plot-attributes', component: PlotAttributesComponent }
                ]
            }
        ])
    ]
})
export class AssetDetailModule { }