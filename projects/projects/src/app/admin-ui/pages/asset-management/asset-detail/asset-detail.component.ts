import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetSelectionService } from '../../../services/asset-selection.service';


@Component({
  selector: 'app-asset-detail',
  templateUrl: './asset-detail.component.html',
  styleUrls: ['./asset-detail.component.css']
})
export class AssetDetailComponent implements OnInit {
  assetId: string = '';
  activeTab: string = 'sources';
  assetName: string = '';
  assetType: string = '';
  terrainExaggeration: number = 1;
enableTerrain: boolean = false;
  surveyId!: number;

  constructor(
    private assetService: AssetSelectionService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.surveyId = +this.route.snapshot.paramMap.get('surveyId')!;
    console.log('Survey ID passed:', this.surveyId);
    const id = this.route.snapshot.paramMap.get('id');
    this.assetId = id ? id : ''; // Handle possible null value
    this.router.navigate(['sources'], { relativeTo: this.route });
    const selectedAsset = this.assetService.getAsset();
    if (selectedAsset) {
      this.assetName = selectedAsset.name;
      this.assetType = selectedAsset.type || '';
    }
  }
  

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.router.navigate([tab], { relativeTo: this.route });
  }
}