import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-plotview-assets',
    templateUrl: './plotview-assets.component.html',
    styleUrls: ['./plotview-assets.component.css']
})
export class PlotviewAssetsComponent implements OnInit {
    assetName = 'New Asset';

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        // Read ?name=<assetName> and fall back to "New Asset"
        this.route.queryParamMap.subscribe(params => {
            const name = params.get('name');
            this.assetName = name && name.trim() ? name : 'New Asset';
        });
    }
}
