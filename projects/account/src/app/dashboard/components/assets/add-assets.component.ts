import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { DashboardService } from "../../services/dashboard.service";

type NavItem = { name: string, active: boolean };
@Component({
    selector: 'assets-component',
    templateUrl: './add-assets.component.html',
    styleUrls: ['./add-assets.component.css'],
})

export class AssetsComponent implements OnInit {
    constructor(private router: Router,
        private dashboardService: DashboardService
    ) { }
    addAssets(selectedSurvey: any) {
        this.router.navigate(['dashboard/addAssets'], { state: { survey: selectedSurvey } });
    }
    activeTab = 'tab1';
    Surveys: any;
    assetList:any;
    activeAssets: any;
    filterActiveAassets() {
        // this.activeAssets = this.assetList.filter(asset => asset.status === "Active");
    }

    filterInActiveAassets() {
        // this.activeAssets = this.assetList.filter(asset => asset.status === "Inactive");
    }

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }




    ngOnInit(): void {
        this.dashboardService.getSurveyByUserId(2).subscribe((res)=>{
            this.assetList = res;
        })   
    }
}