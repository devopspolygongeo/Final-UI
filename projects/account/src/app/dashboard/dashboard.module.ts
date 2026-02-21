import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardViewComponent } from './components/dashboard-view.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './pages/dashboard.component';
import { RouterModule } from '@angular/router';
import { AddAssetsComponent } from './components/add-assets/add-assets.component'
import { AssetsComponent } from './components/assets/add-assets.component'
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SubscriptionComponent} from './components/subscription/subscription.components'
import {InvoicesComponent} from './components/invoices/invoice.components'
import { SupportComponent } from './components/support/support.components';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {SubscriptionDialogComponent} from './components/subscription/add-subscription/subscription-dialog.component'
import { ReportIssueDialogComponent } from './components/support/report-issue/report-issue.component';
import {UsersComponent} from './components/user/user.component'
import {SharedModule} from '../dashboard/shared/shared.module'
import {DashboardService} from './services/dashboard.service'

@NgModule({
    imports: [
        CommonModule,
        MatDialogModule,
        MatDividerModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        SharedModule
    ],
    declarations: [
        DashboardComponent,
        DashboardViewComponent,
        AddAssetsComponent,
        AssetsComponent,
        SubscriptionComponent,
        InvoicesComponent,
        SupportComponent,
        SubscriptionDialogComponent,
        ReportIssueDialogComponent,
        UsersComponent
    ],
    providers: [
        DashboardService
    ],
    exports: [
        DashboardRoutingModule
    ]
})
export class DashboardModule { }
