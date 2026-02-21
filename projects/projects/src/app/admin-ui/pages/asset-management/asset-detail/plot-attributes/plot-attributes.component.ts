import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface PlotAttribute {
  displayAttribute: string;
  attributeName: string;
  clientAccess: boolean;
  attributeType: string;
  accessValues: string;
  hover: boolean; // Changed to boolean for toggle
}

@Component({
  selector: 'app-plot-attributes',
  templateUrl: './plot-attributes.component.html',
  styleUrls: ['./plot-attributes.component.css']
})
export class PlotAttributesComponent implements OnInit {
  activeNavTab: 'sources' | 'groups' | 'layers' | 'plotattributes' = 'plotattributes';
  searchTerm = '';
  sortConfig: { key: keyof PlotAttribute; direction: 'asc' | 'desc' } = {
    key: 'displayAttribute',
    direction: 'asc'
  };
  assetId: string = '';

  plotAttributes: PlotAttribute[] = [
    {
      displayAttribute: 'Plot No',
      attributeName: 'plomo',
      clientAccess: true,
      attributeType: 'text',
      accessValues: 'Available, Inprogress, Sold',
      hover: true
    },
    {
      displayAttribute: 'East',
      attributeName: 'east',
      clientAccess: true,
      attributeType: 'text',
      accessValues: 'Plot Attributes',
      hover: false
    },
    {
      displayAttribute: 'West',
      attributeName: 'west',
      clientAccess: true,
      attributeType: 'text',
      accessValues: 'Plot Attributes',
      hover: false
    },
    {
      displayAttribute: 'North',
      attributeName: 'north',
      clientAccess: true,
      attributeType: 'text',
      accessValues: 'Plot Attributes',
      hover: false
    },
    {
      displayAttribute: 'South',
      attributeName: 'south',
      clientAccess: true,
      attributeType: 'text',
      accessValues: 'Plot Attributes',
      hover: false
    },
    {
      displayAttribute: 'Area',
      attributeName: 'area',
      clientAccess: true,
      attributeType: 'number',
      accessValues: 'Plot Attributes',
      hover: false
    },
    {
      displayAttribute: 'Salestatus',
      attributeName: 'salestatus',
      clientAccess: true,
      attributeType: 'text',
      accessValues: 'Available, Inprogress, Sold',
      hover: true
    },
    {
      displayAttribute: 'Facing',
      attributeName: 'facing',
      clientAccess: true,
      attributeType: 'text',
      accessValues: 'Plot Attributes',
      hover: false
    },
    {
      displayAttribute: 'Owner Name',
      attributeName: 'ownerName',
      clientAccess: false,
      attributeType: 'text',
      accessValues: 'Plot Attributes',
      hover: false
    }
  ];

  filteredPlotAttributes: PlotAttribute[] = [];
  assetName = 'Sri Venkateswara Farms';

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.assetName = this.route.snapshot.paramMap.get('assetName') || 'Sri Venkateswara Farms';
    this.filteredPlotAttributes = [...this.plotAttributes];
    const id = this.route.parent?.snapshot.paramMap.get('id');
    this.assetId = id ? id : '';
  }

  onNavTabChange(tab: 'sources' | 'groups' | 'layers' | 'plotattributes'): void {
    this.activeNavTab = tab;
    const baseRoute = `/admin/asset-management/${this.assetId}`;
    switch (tab) {
      case 'sources':
        this.router.navigate([`${baseRoute}/sources`]);
        break;
      case 'groups':
        this.router.navigate([`${baseRoute}/groups`]);
        break;
      case 'layers':
        this.router.navigate([`${baseRoute}/layers`]);
        break;
      case 'plotattributes':
        this.router.navigate([`${baseRoute}/plot-attributes`]);
        break;
    }
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterPlotAttributes();
  }

  filterPlotAttributes(): void {
    let result = [...this.plotAttributes];

    if (this.searchTerm) {
      result = result.filter(attr =>
        attr.displayAttribute.toLowerCase().includes(this.searchTerm) ||
        attr.attributeName.toLowerCase().includes(this.searchTerm) ||
        attr.attributeType.toLowerCase().includes(this.searchTerm)
      );
    }

    result.sort((a, b) => {
      const aVal = a[this.sortConfig.key];
      const bVal = b[this.sortConfig.key];

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return this.sortConfig.direction === 'asc'
          ? (aVal === bVal ? 0 : aVal ? -1 : 1)
          : (aVal === bVal ? 0 : aVal ? 1 : -1);
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return this.sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });

    this.filteredPlotAttributes = result;
  }

  sortBy(key: keyof PlotAttribute): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }
    this.filterPlotAttributes();
  }

  getSortIcon(key: keyof PlotAttribute): string {
    if (this.sortConfig.key !== key) {
      return 'assets/admin-dashboard/admin-reorder.png';
    }
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  toggleClientAccess(attribute: PlotAttribute): void {
    attribute.clientAccess = !attribute.clientAccess;
  }

  toggleHover(attribute: PlotAttribute): void {
    attribute.hover = !attribute.hover;
  }
}