import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AdminDataService } from '../../../../admin-ui/services/admin-data.service';
import { AssetSelectionService } from '../../../../admin-ui/services/asset-selection.service';

interface ClientRow {
    sno?: number;
    clientid?: number;
    state?: string;
    clientname?: string;
    clientnameforuser?: string;
    address?: string;
    gstin?: string;
    [key: string]: any;
}
interface ProjectRow {
    id?: number;
    projectid?: number;
    clientid?: number | string;
    clientId?: number | string;
    name?: string;
    [key: string]: any;
}
interface SurveyRow {
    id?: number;
    surveyid?: number;
    projectid?: number;
    projectId?: number;
    [key: string]: any;
}

@Component({
    selector: 'app-plotview-basic-details',
    templateUrl: './plotview-basic-details.component.html',
    styleUrls: ['./plotview-basic-details.component.css']
})
export class PlotviewBasicDetailsComponent implements OnInit {

    // ---- Form fields (auto-filled from client; NA by default) ----
    layoutName: string = 'NA';
    layoutOwner: string = 'NA';
    area: string = '';
    location: string = 'NA';
    city: string = 'NA';
    state: string = 'NA';
    approval: string = 'NA';
    assetManager: string = 'NA';
    priceRangeMin: number = 0;
    priceRangeMax: number = 0;

    // ---- Existing UI data below (left as-is) ----
    units = ['Sft', 'Sq.Yd', 'Acre'];
    newSizeUnit: string = 'Sft';
    newSizeValue: number | null = null;
    newAmenityLabel: string = '';
    newPlotAttributeLabel: string = '';

    availableSizes = [
        { value: '1250', label: '1250 Sft', selected: true },
        { value: '1500', label: '1500 Sft', selected: true },
        { value: '1750', label: '1750 Sft', selected: true },
        { value: '2150', label: '2150 Sft', selected: true }
    ];
    availableAmenities = [
        { value: 'roads', label: 'Roads', selected: true },
        { value: 'indoorSports', label: 'Indoor Sports area', selected: true },
        { value: 'childrenPlay', label: 'Children play area', selected: false },
        { value: 'gym', label: 'Gym', selected: false },
        { value: 'communityHall', label: 'Community Hall', selected: false },
        { value: 'swimmingPool', label: 'Swimming Pool', selected: false }
    ];
    availablePlotAttributes = [
        { value: 'directions', label: 'Directions', selected: true },
        { value: 'facing', label: 'Facing', selected: true },
        { value: 'saleStatus', label: 'Sale Status', selected: true },
        { value: 'priceRange', label: 'Price Range', selected: true },
        { value: 'development', label: 'Development', selected: false }
    ];

    stateOptions = ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu'];
    approvalOptions = ['DTCP', 'HMDA', 'RERA', 'GHMC'];
    assetManagerOptions = ['Rajasekhar, Rahul', 'John Doe', 'Jane Smith', 'Mike Johnson'];

    // dropdown state
    stateDropdownOpen = false;
    approvalDropdownOpen = false;
    assetManagerDropdownOpen = false;
    sizesDropdownOpen = false;
    amenitiesDropdownOpen = false;
    plotAttributesDropdownOpen = false;

    constructor(
        private route: ActivatedRoute,
        private admin: AdminDataService,
        private assetsApi: AssetSelectionService
    ) { }

    async ngOnInit() {
        // Try to get projectId from route
        let projectId = await this.getProjectIdFromRoute();

        // If missing, derive from surveyId -> surveys list -> projectId
        if (!projectId) {
            const surveyId = await this.getSurveyIdFromRoute();
            if (surveyId) {
                try {
                    const surveys = await firstValueFrom(this.assetsApi.getAllSurveys());
                    const s = (surveys as any[]).find(r => Number(r?.id ?? r?.surveyid) === Number(surveyId)) as SurveyRow | undefined;
                    projectId = Number(s?.projectId ?? s?.projectid) || undefined;
                } catch { }
            }
        }

        if (projectId) {
            await this.fillClientDetails(projectId);
        }
    }

    private async getProjectIdFromRoute(): Promise<number | undefined> {
        const map = await firstValueFrom(this.route.queryParamMap);
        const pid = map.get('projectId') || map.get('projectid');
        return pid ? Number(pid) : undefined;
        // (HTML stays the same as before. :contentReference[oaicite:2]{index=2})
    }

    private async getSurveyIdFromRoute(): Promise<number | undefined> {
        const map = await firstValueFrom(this.route.queryParamMap);
        const sid = map.get('surveyId') || map.get('surveyid');
        return sid ? Number(sid) : undefined;
    }

    private async fillClientDetails(projectId: number) {
        try {
            // projects → find clientId; clients → find row
            const [projects, clients] = await Promise.all([
                firstValueFrom(this.assetsApi.getAllProjects()),
                firstValueFrom(this.admin.getClients())
            ]);

            const project: ProjectRow | undefined = (projects as any[]).find(p =>
                Number(p?.id ?? p?.projectid) === Number(projectId)
            );

            const clientId = Number(project?.clientId ?? project?.clientid);
            const client: ClientRow | undefined = (clients as any[]).find(c =>
                Number(c?.clientid ?? c?.id) === clientId
            );

            // Map to fields (default to 'NA')
            this.layoutName = client?.clientname || 'NA';
            this.layoutOwner = client?.clientnameforuser || 'NA';
            this.location = client?.state || 'NA';
            this.city = client?.address || 'NA';
            this.state = client?.state || 'NA';
        } catch (err) {
            console.error('Failed to load client details', err);
        }
    }

    // ===== existing UI methods preserved from your original TS (unchanged) =====
    addCustomPlotAttribute() {
        const label = this.newPlotAttributeLabel.trim();
        const value = label.toLowerCase().replace(/\s+/g, '_');
        if (label && !this.availablePlotAttributes.find(a => a.value === value)) {
            this.availablePlotAttributes.push({ value, label, selected: true });
            this.newPlotAttributeLabel = '';
        }
    }

    addCustomAmenity() {
        const label = this.newAmenityLabel.trim();
        const value = label.toLowerCase().replace(/\s+/g, '_');
        if (label && !this.availableAmenities.find(a => a.value === value)) {
            this.availableAmenities.push({ value, label, selected: true });
            this.newAmenityLabel = '';
        }
    }

    addCustomSize() {
        if (this.newSizeValue && !isNaN(this.newSizeValue)) {
            const label = `${this.newSizeValue} ${this.newSizeUnit}`;
            const value = `${this.newSizeValue}_${this.newSizeUnit}`;
            const exists = this.availableSizes.find(s => s.value === value);
            if (!exists) this.availableSizes.push({ value, label, selected: true });
            this.newSizeValue = null;
            this.newSizeUnit = 'Sft';
        }
    }

    toggleSize(i: number) { this.availableSizes[i].selected = !this.availableSizes[i].selected; }
    toggleAmenity(i: number) { this.availableAmenities[i].selected = !this.availableAmenities[i].selected; }
    togglePlotAttribute(i: number) { this.availablePlotAttributes[i].selected = !this.availablePlotAttributes[i].selected; }

    getSelectedSizes() { return this.availableSizes.filter(s => s.selected); }
    getSelectedAmenities() { return this.availableAmenities.filter(a => a.selected); }
    getSelectedPlotAttributes() { return this.availablePlotAttributes.filter(p => p.selected); }

    removeSize(v: string) { const s = this.availableSizes.find(x => x.value === v); if (s) s.selected = false; }
    removeAmenity(v: string) { const a = this.availableAmenities.find(x => x.value === v); if (a) a.selected = false; }
    removePlotAttribute(v: string) { const a = this.availablePlotAttributes.find(x => x.value === v); if (a) a.selected = false; }

    toggleSizesDropdown() { this.sizesDropdownOpen = !this.sizesDropdownOpen; this.amenitiesDropdownOpen = false; this.plotAttributesDropdownOpen = false; this.closeRightSideDropdowns(); }
    toggleAmenitiesDropdown() { this.amenitiesDropdownOpen = !this.amenitiesDropdownOpen; this.sizesDropdownOpen = false; this.plotAttributesDropdownOpen = false; this.closeRightSideDropdowns(); }
    togglePlotAttributesDropdown() { this.plotAttributesDropdownOpen = !this.plotAttributesDropdownOpen; this.sizesDropdownOpen = false; this.amenitiesDropdownOpen = false; this.closeRightSideDropdowns(); }

    toggleStateDropdown() { this.stateDropdownOpen = !this.stateDropdownOpen; this.approvalDropdownOpen = false; this.assetManagerDropdownOpen = false; this.closeLeftSideDropdowns(); }
    toggleApprovalDropdown() { this.approvalDropdownOpen = !this.approvalDropdownOpen; this.stateDropdownOpen = false; this.assetManagerDropdownOpen = false; this.closeLeftSideDropdowns(); }
    toggleAssetManagerDropdown() { this.assetManagerDropdownOpen = !this.assetManagerDropdownOpen; this.stateDropdownOpen = false; this.approvalDropdownOpen = false; this.closeLeftSideDropdowns(); }

    selectState(state: string) { this.state = state; this.stateDropdownOpen = false; }
    selectApproval(approval: string) { this.approval = approval; this.approvalDropdownOpen = false; }
    selectAssetManager(manager: string) { this.assetManager = manager; this.assetManagerDropdownOpen = false; }

    closeLeftSideDropdowns() { this.sizesDropdownOpen = false; this.amenitiesDropdownOpen = false; this.plotAttributesDropdownOpen = false; }
    closeRightSideDropdowns() { this.stateDropdownOpen = false; this.approvalDropdownOpen = false; this.assetManagerDropdownOpen = false; }
    closeAllDropdowns() { this.closeRightSideDropdowns(); this.closeLeftSideDropdowns(); }

    saveChanges() {
        const formData = {
            layoutName: this.layoutName,
            layoutOwner: this.layoutOwner,
            area: this.area,
            location: this.location,
            city: this.city,
            state: this.state,
            approval: this.approval,
            assetManager: this.assetManager,
            priceRange: { min: this.priceRangeMin, max: this.priceRangeMax },
            selectedSizes: this.getSelectedSizes(),
            selectedAmenities: this.getSelectedAmenities(),
            selectedPlotAttributes: this.getSelectedPlotAttributes()
        };

        console.log('Form Data:', formData);
    }
}
