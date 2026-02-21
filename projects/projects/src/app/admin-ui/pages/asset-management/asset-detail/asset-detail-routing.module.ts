import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssetDetailComponent } from './asset-detail.component';
import { SourcesComponent } from './sources/sources.component';
import { GroupsComponent } from './groups/groups.component';
import { LayersComponent } from './layers/layers.component';
import { PlotAttributesComponent } from './plot-attributes/plot-attributes.component';

const routes: Routes = [
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
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AssetDetailRoutingModule { }