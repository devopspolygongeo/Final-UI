import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Layer } from '../../../../../core/models/geo/layer.model';
import { Source } from '../../../../../core/models/geo/source.model';
import { Group } from '../../../../../core/models/geo/group.model';
import { DTopography } from '../../../../../core/models/core/topography.model';
import { AssetSelectionService } from '../../../../services/asset-selection.service';

@Component({
  selector: 'app-layers',
  templateUrl: './layers.component.html',
  styleUrls: ['./layers.component.css']
})
export class LayersComponent implements OnInit {
  @ViewChild('layerForm') layerForm!: NgForm;

  activeNavTab: 'sources' | 'groups' | 'layers' | 'plotattributes' = 'layers';
  currentPage = 1;
  pageSize = 4;
  assetId: string = '';
  assetName = 'Sri Venkateswara Farms';
  isLoading = true;
  isSubmitting = false;

  sortConfig: { key: keyof LayerUI; direction: 'asc' | 'desc' } = {
    key: 'id',
    direction: 'asc'
  };

  layers: LayerUI[] = [];
  filteredLayers: LayerUI[] = [];
  sources: Source[] = [];
  groups: Group[] = [];
  topographies: DTopography[] = [];

  sourceOptions: { id: number, name: string, surveyId: number }[] = [];
  groupOptions: { id: number, name: string, surveyId: number }[] = [];
  topographyOptions: { id: number, name: string }[] = [];
  layerAttributes = ['salesstatus', 'layer'];

  newLayer: LayerUI = this.getEmptyLayer();
  surveyId!: number;

  constructor(
    private route: ActivatedRoute,
    private assetSelectionService: AssetSelectionService
  ) { }

  ngOnInit(): void {
    this.assetName = this.route.snapshot.paramMap.get('assetName') || 'Sri Venkateswara Farms';
    const id = this.route.parent?.snapshot.paramMap.get('id');
    this.assetId = id ? id : '';
    this.surveyId = +this.route.parent?.snapshot.paramMap.get('surveyId')!;
    this.loadSourcesAndGroups();
    this.loadTopographies();
  }


  
  loadTopographies(): void {
    this.assetSelectionService.getAllTopographies().subscribe({
      next: (topographies: DTopography[]) => {
        this.topographies = topographies;
        this.topographyOptions = topographies.map(topo => ({
          id: topo.id,
          name: topo.name
        }));
      },
      error: (error) => {
        console.error('Error loading topographies:', error);
      }
    });
  }

  loadSourcesAndGroups(): void {
    this.isLoading = true;

    // Fetch sources and filter by surveyId
    this.assetSelectionService.getSources().subscribe({
      next: (sources: Source[]) => {
        // Filter sources by surveyId
        this.sources = sources.filter(source => source.surveyId === this.surveyId);
        this.sourceOptions = this.sources.map(source => ({
          id: source.id,
          name: source.name,
          surveyId: source.surveyId
        }));

        // If groups are already loaded, load layers
        if (this.groups.length > 0) {
          this.loadLayers();
        }
      },
      error: (error) => {
        console.error('Error loading sources:', error);
      }
    });

    // Fetch groups and filter by surveyId
    this.assetSelectionService.getGroups().subscribe({
      next: (groups: Group[]) => {
        // Filter groups by surveyId
        this.groups = groups.filter(group => group.surveyId === this.surveyId);
        this.groupOptions = this.groups.map(group => ({
          id: group.id,
          name: group.name,
          surveyId: group.surveyId
        }));

        // If sources are already loaded, load layers
        if (this.sources.length > 0) {
          this.loadLayers();
        }
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      }
    });
  }

  loadLayers(): void {
    this.assetSelectionService.getAllLayers().subscribe({
      next: (layers: Layer[]) => {
        // First filter layers by checking if their sourceId or groupId belongs to this survey
        const filteredLayers = layers.filter(layer => {
          const source = this.sources.find(s => s.id === layer.sourceId);
          const group = this.groups.find(g => g.id === layer.groupId);
          return source || group; // Keep layer if it has a source or group in this survey
        });

        this.layers = filteredLayers.map(layer => {
          // Find source by sourceId
          const source = this.sources.find(s => s.id === layer.sourceId);
          const sourceName = source ? source.name : 'N/A';

          // Find group by groupId
          const group = this.groups.find(g => g.id === layer.groupId);
          const groupName = group ? group.name : 'N/A';

          // Find topography by topoId
          const topography = this.topographies.find(t => t.id === layer.topoId);
          const topoName = topography ? topography.name : 'N/A';

          return {
            ...layer,
           

            sourceName: sourceName,
            groupName: groupName,
            topoName: topoName
          };
        });
        this.filterLayers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading layers:', error);
        this.isLoading = false;
      }
    });
  }
  getParentLayers(): LayerUI[] {
  return this.layers.filter(l => l.hasSubLayer);
}

getChildLayers(parentId: number): LayerUI[] {
  return this.layers.filter(l => l.parentLayerId === parentId);
}


  getEmptyLayer(): LayerUI {
    return {
      id: 0,
      sourceId: 0,
      topoId: 0,
      groupId: 0,
      attribute: '',
      name: '',
      displayName: '',
      priority: 1,
      visibility: false,
     
      sourceName: '',
      groupName: '',
      topoName: ''
    };
  }

  initializeNewLayer(): void {
    this.newLayer = this.getEmptyLayer();

    if (this.layerForm) {
      this.layerForm.resetForm();
    }
  }

  resetForm(): void {
    this.initializeNewLayer();
  }

  onSourceChange(selectedValue: string): void {
    if (selectedValue) {
      this.newLayer.sourceId = parseInt(selectedValue);
    }
  }

  onGroupChange(selectedValue: string): void {
    if (selectedValue) {
      this.newLayer.groupId = parseInt(selectedValue);
    }
  }

  filterLayers(): void {
    let result = [...this.layers];

    result.sort((a, b) => {
      const aVal = a[this.sortConfig.key];
      const bVal = b[this.sortConfig.key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return this.sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return this.sortConfig.direction === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    this.filteredLayers = result;
  }

  sortBy(key: keyof LayerUI): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }
    this.filterLayers();
  }

  getSortIcon(_key: keyof LayerUI): string {
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  toggleLayerVisibility(layer: LayerUI): void {
    layer.visibility = !layer.visibility;
    if (layer.hasSubLayer) {
    this.getChildLayers(layer.id)
      .forEach(child => child.visibility = layer.visibility);
  }

  // 🔥 Child → parent
  if (layer.parentLayerId) {
    const siblings = this.getChildLayers(layer.parentLayerId);
    const parent = this.layers.find(l => l.id === layer.parentLayerId);

    if (parent) {
      parent.visibility = siblings.some(s => s.visibility);
    }
  }
    this.filterLayers();
  }

  editLayer(layer: LayerUI): void {
    this.newLayer = { ...layer };

    // Set the dropdown values for editing
    const source = this.sources.find(s => s.id === layer.sourceId);
    if (source) {
      this.newLayer.sourceName = source.name;
    }

    const group = this.groups.find(g => g.id === layer.groupId);
    if (group) {
      this.newLayer.groupName = group.name;
    }
  }

  deleteLayer(layer: LayerUI): void {
    if (confirm('Are you sure you want to delete this layer?')) {
      this.assetSelectionService.deleteLayer(layer.id).subscribe({
        next: () => {
          // Remove the layer from the local list
          this.layers = this.layers.filter(l => l.id !== layer.id);
          this.filterLayers();
          alert('Layer deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting layer:', error);
          alert('Error deleting layer. Please try again.');
        }
      });
    }
  }

  submitNewLayer(): void {
    if (this.layerForm.invalid) {
      Object.keys(this.layerForm.controls).forEach(key => {
        this.layerForm.controls[key].markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Prepare the data for API call
    const layerData = {
      sourceid: this.newLayer.sourceId,
      groupid: this.newLayer.groupId,
      layerattribute: this.newLayer.attribute,
      layername: this.newLayer.name,
      layervisibility: this.newLayer.visibility,
      layerpriority: this.newLayer.priority,
      topoid: this.newLayer.topoId,
      display_name: this.newLayer.displayName,
      has_sublayer: this.newLayer.hasSubLayer ? 1 : 0,
  parent_layerid: this.newLayer.parentLayerId
    };

    const apiCall = this.newLayer.id === 0
      ? this.assetSelectionService.createLayer(layerData)
      : this.assetSelectionService.updateLayer(this.newLayer.id, layerData);

    apiCall.subscribe({
      next: () => {
        // Instead of manually updating the array, reload all data
        this.loadSourcesAndGroups(); // This will trigger loadLayers() automatically
        this.initializeNewLayer();
        this.isSubmitting = false;
        alert(this.newLayer.id === 0 ? 'Layer created successfully!' : 'Layer updated successfully!');
      },
      error: (error) => {
        console.error('Error saving layer:', error);
        this.isSubmitting = false;
        alert('Error saving layer. Please try again.');
      }
    });
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredLayers.length / this.pageSize);
  }

  getVisiblePages(): (number | string)[] {
    const total = this.getTotalPages();
    const current = this.currentPage;
    const range: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (current > 3) range.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) range.push(i);

      if (current < total - 2) range.push('...');
      range.push(total);
    }

    return range;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredLayers.length);
  }

  getTotalFilteredItems(): number {
    return this.filteredLayers.length;
  }

  get paginatedLayers(): LayerUI[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredLayers.slice(start, end);
  }
}

interface LayerUI extends Layer {
  sourceName: string;
  groupName: string;
  topoName: string;
  hasSubLayer?: boolean;
  parentLayerId?: number | null;
}