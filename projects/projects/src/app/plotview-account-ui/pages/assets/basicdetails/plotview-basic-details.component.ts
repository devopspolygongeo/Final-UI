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

  isSaving: boolean = false;
  isSaved: boolean = false;


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

  /*   availableSizes = [
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
     ];  */

  availableSizes: any[] = [];
  availableAmenities: any[] = [];
  surveyId!: number;

  availablePlotAttributes: any[] = [];

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
    const surveyId = await this.getSurveyIdFromRoute();

    if (surveyId) {
      this.surveyId = surveyId;
      console.log('Survey ID:', this.surveyId); // debug
      await this.loadLayoutDetails();
    } else {
      console.error('No surveyId found in URL');
    }
  }
  async loadLayoutDetails() {
    try {
      const res: any = await firstValueFrom(
        this.admin.getLayoutDetails(this.surveyId)
      );

      console.log('RAW 👉', res);

      if (!res) return;

      // ===============================
      // ✅ BASIC FIELDS (AUTO-FILL FORM)
      // ===============================
      this.layoutName = res.name || 'NA';
      this.layoutOwner = res.owner || 'NA';
      this.area = res.area || '';
      this.location = res.location || 'NA';
      this.city = res.city || 'NA';
      this.state = res.state || 'NA';
      this.approval = res.approval || 'NA';
      this.assetManager = res.assetManager || 'NA';

      // ===============================
      // ✅ PRICE RANGE (split min-max)
      // ===============================
      if (res.priceRange) {
        const [min, max] = res.priceRange.split('-');
        this.priceRangeMin = Number(min) || 0;
        this.priceRangeMax = Number(max) || 0;
      } else {
        this.priceRangeMin = 0;
        this.priceRangeMax = 0;
      }

      // ===============================
      // ✅ SIZES (string → array)
      // ===============================
      const sizes = res.sizes ? res.sizes.split(',') : [];

      this.availableSizes = sizes.map((s: string) => ({
        value: s,
        label: s,
        selected: true
      }));

      // ===============================
      // ✅ AMENITIES (API → UI)
      // ===============================
      const amenitiesFromApi = res.amenities || [];

      this.availableAmenities = amenitiesFromApi.map((a: any) => ({
        value: a.id || a.infrastructureid,
        label: a.label || a.infrstructuredisplay,
        selected: true
      }));



      // ===============================
      // ✅ PLOT ATTRIBUTES FROM BACKEND
      // ===============================
      const plotAttrsFromApi = res.plotAttributes || [];

      // only store names for display
      this.availablePlotAttributes = plotAttrsFromApi.map((g: any) => ({
        label: g.label
      }));

      // ===============================
      // 🔥 FORCE UI REFRESH
      // ===============================
      this.availableSizes = [...this.availableSizes];
      this.availableAmenities = [...this.availableAmenities];
      this.availablePlotAttributes = [...this.availablePlotAttributes];

      console.log('FINAL DATA 👉', {
        sizes: this.availableSizes,
        amenities: this.availableAmenities,
        plotAttributes: this.availablePlotAttributes
      });

    } catch (err) {
      console.error('❌ LOAD ERROR', err);
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

    if (!label) return;

    const exists = this.availableAmenities.find(
      a => a.label.toLowerCase() === label.toLowerCase()
    );

    if (!exists) {
      this.availableAmenities.push({
        value: null,   // 🔥 IMPORTANT → no ID yet
        label: label,
        selected: true
      });
    } else {
      exists.selected = true;
    }

    this.availableAmenities = [...this.availableAmenities];
    this.newAmenityLabel = '';
  }

  addCustomSize() {
    if (this.newSizeValue && !isNaN(this.newSizeValue)) {
      const label = `${this.newSizeValue} ${this.newSizeUnit}`;

      const exists = this.availableSizes.find(s => s.label === label);

      if (!exists) {
        this.availableSizes.push({
          value: label,
          label: label,
          selected: true
        });
      } else {
        exists.selected = true;
      }

      // 🔥 force UI update
      this.availableSizes = [...this.availableSizes];

      this.newSizeValue = null;
    }
  }

  toggleSize(i: number) { this.availableSizes[i].selected = !this.availableSizes[i].selected; }
  toggleAmenity(i: number) { this.availableAmenities[i].selected = !this.availableAmenities[i].selected; }
  //togglePlotAttribute(i: number) { this.availablePlotAttributes[i].selected = !this.availablePlotAttributes[i].selected; }

  getSelectedSizes() { return this.availableSizes.filter(s => s.selected); }
  getSelectedAmenities() { return this.availableAmenities.filter(a => a.selected); }
  //getSelectedPlotAttributes() { return this.availablePlotAttributes.filter(p => p.selected); }

  removeSize(v: string) { const s = this.availableSizes.find(x => x.value === v); if (s) s.selected = false; }
  removeAmenity(v: string) { const a = this.availableAmenities.find(x => x.value === v); if (a) a.selected = false; }
  //removePlotAttribute(v: string) { const a = this.availablePlotAttributes.find(x => x.value === v); if (a) a.selected = false; }

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
    this.isSaving = true;
    this.isSaved = false;

    const selectedAmenities = this.availableAmenities.filter(a => a.selected);
    /*
   const selectedPlotAttrs = this.availablePlotAttributes
     .filter(p => p.selected)
     .map(p => p.label);
   */

    const payload = {
      surveyId: this.surveyId,

      // ✅ sizes
      sizes: this.availableSizes
        .filter(s => s.selected)
        .map(s => s.label)
        .join(','),

      // ✅ amenities
      amenityIds: selectedAmenities
        .filter(a => a.value)   // existing
        .map(a => a.value),

      amenityLabels: selectedAmenities
        .filter(a => !a.value)  // new
        .map(a => a.label),

      // ✅ layout basic fields
      name: this.layoutName,
      owner: this.layoutOwner,
      area: this.area,
      location: this.location,
      city: this.city,
      state: this.state,
      approval: this.approval,
      //assetManager: this.assetManager,

      // ✅ price range
      priceRange: `${this.priceRangeMin}-${this.priceRangeMax}`,

      // ✅ plot attributes
      // hoverAttributes: selectedPlotAttrs.join(','),
      // clickAttributes: selectedPlotAttrs.join(',')
    };

    console.log('SENDING 👉', payload);

    this.admin.saveLayoutDetails(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isSaved = true;

        console.log('✅ Saved successfully');

        // 🔄 reload latest data
        this.loadLayoutDetails();

        // ⏳ reset button after 2 sec
        setTimeout(() => {
          this.isSaved = false;
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Save failed', err);
        this.isSaving = false;
        this.isSaved = false;
      }
    });
  }
}
