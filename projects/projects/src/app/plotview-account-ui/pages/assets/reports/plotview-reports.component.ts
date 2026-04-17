import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PlotStatusService,
  ParsedCsvDataRes,
  ParsedCsvFiltersRes,
  CsvFilterGroupRes,
  CsvFilterItemRes,
} from '../../../services/plot-status.service';
import {
  REPORT_COLUMN_CONFIG,
  normalizeReportConfigKey,
} from './report-columns.config';

interface ResolvedDisplayColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-plotview-reports',
  templateUrl: './plotview-reports.component.html',
  styleUrls: ['./plotview-reports.component.css'],
})
export class PlotviewReportsComponent implements OnInit {
  assetName = 'New Asset';
  surveyId?: number;

  loading = false;
  errorMessage = '';

  reportName = '';

  columns: string[] = [];
  rows: Record<string, any>[] = [];

  displayColumns: ResolvedDisplayColumn[] = [];
  displayColumnKeys: string[] = [];
  filteredRows: Record<string, any>[] = [];

  filterGroups: CsvFilterGroupRes[] = [];
  selectedFilterValues: Record<string, string[]> = {};
  expandedFilterGroups: Record<number, boolean> = {};

  globalSearch = '';
  columnFilters: Record<string, string> = {};

  private reportLoaded = false;
  private filtersLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private plotStatusService: PlotStatusService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const name = params.get('name');
      const surveyIdStr = params.get('surveyId');

      this.assetName = name && name.trim() ? name : 'New Asset';
      this.surveyId = surveyIdStr ? Number(surveyIdStr) : undefined;

      if (this.surveyId && Number.isFinite(this.surveyId)) {
        this.resetStateForReload();
        this.loadReport(this.surveyId);
        this.loadFilters(this.surveyId);
      } else {
        this.errorMessage = 'Survey ID is missing.';
        this.resetAllState();
      }
    });
  }

  resetStateForReload(): void {
    this.loading = true;
    this.errorMessage = '';
    this.reportLoaded = false;
    this.filtersLoaded = false;
    this.reportName = '';
    this.columns = [];
    this.rows = [];
    this.displayColumns = [];
    this.displayColumnKeys = [];
    this.filteredRows = [];
    this.filterGroups = [];
    this.selectedFilterValues = {};
    this.expandedFilterGroups = {};
    this.globalSearch = '';
    this.columnFilters = {};
  }

  resetAllState(): void {
    this.reportName = '';
    this.columns = [];
    this.rows = [];
    this.displayColumns = [];
    this.displayColumnKeys = [];
    this.filteredRows = [];
    this.filterGroups = [];
    this.selectedFilterValues = {};
    this.expandedFilterGroups = {};
    this.globalSearch = '';
    this.columnFilters = {};
    this.loading = false;
  }

  loadReport(surveyId: number): void {
    this.plotStatusService.getParsedCsvData(surveyId).subscribe({
      next: (resp: ParsedCsvDataRes) => {
        this.reportName = resp.file_name || 'Report';
        this.columns = Array.isArray(resp.columns) ? resp.columns : [];
        this.rows = Array.isArray(resp.rows) ? resp.rows : [];

        this.setupDisplayColumns();
        this.initializeColumnFilters();

        this.reportLoaded = true;
        this.finishLoadAndApplyFiltersIfReady();
      },
      error: (err: any) => {
        console.error('Failed to load report data', err);
        this.errorMessage = 'Failed to load report data.';
        this.resetAllState();
      },
    });
  }

  loadFilters(surveyId: number): void {
    this.plotStatusService.getParsedCsvFilters(surveyId).subscribe({
      next: (resp: ParsedCsvFiltersRes) => {
        this.filterGroups = Array.isArray(resp.groups) ? resp.groups : [];
        this.initializeSelectedFilterValues();
        this.initializeExpandedFilterGroups();
        this.filtersLoaded = true;
        this.finishLoadAndApplyFiltersIfReady();
      },
      error: (err: any) => {
        console.error('Failed to load report filters', err);
        this.filterGroups = [];
        this.selectedFilterValues = {};
        this.expandedFilterGroups = {};
        this.filtersLoaded = true;
        this.finishLoadAndApplyFiltersIfReady();
      },
    });
  }

  finishLoadAndApplyFiltersIfReady(): void {
    if (!this.reportLoaded || !this.filtersLoaded) {
      return;
    }

    this.applyFilters();
    this.loading = false;
  }

  setupDisplayColumns(): void {
    const normalizedReportKey = normalizeReportConfigKey(this.reportName);
    const configuredColumns = REPORT_COLUMN_CONFIG[normalizedReportKey] || [];
    const availableColumnSet = new Set(this.columns);

    if (configuredColumns.length) {
      this.displayColumns = configuredColumns
        .map((configCol) => {
          const matchedKey = configCol.keys.find((key) =>
            availableColumnSet.has(key),
          );

          if (!matchedKey) {
            return null;
          }

          return {
            key: matchedKey,
            label: configCol.label,
          } as ResolvedDisplayColumn;
        })
        .filter((col): col is ResolvedDisplayColumn => !!col);
    } else {
      this.displayColumns = this.columns.map((col) => ({
        key: col,
        label: this.toDisplayLabel(col),
      }));
    }

    this.displayColumnKeys = this.displayColumns.map((col) => col.key);
    console.log('reportName:', this.reportName);
    console.log(
      'normalizedReportKey:',
      normalizeReportConfigKey(this.reportName),
    );
    console.log(
      'config exists:',
      REPORT_COLUMN_CONFIG[normalizeReportConfigKey(this.reportName)],
    );
    console.log('backend columns:', this.columns);
  }

  initializeColumnFilters(): void {
    const nextFilters: Record<string, string> = {};

    this.displayColumnKeys.forEach((col) => {
      nextFilters[col] = this.columnFilters[col] || '';
    });

    this.columnFilters = nextFilters;
  }

  initializeSelectedFilterValues(): void {
    const nextSelected: Record<string, string[]> = {};

    this.filterGroups.forEach((group) => {
      const key = this.getGroupSelectionKey(group);
      nextSelected[key] = this.selectedFilterValues[key] || [];
    });

    this.selectedFilterValues = nextSelected;
  }

  initializeExpandedFilterGroups(): void {
    const nextExpanded: Record<number, boolean> = {};

    this.filterGroups.forEach((group, index) => {
      nextExpanded[group.id] =
        this.expandedFilterGroups[group.id] ?? index === 0;
    });

    this.expandedFilterGroups = nextExpanded;
  }

  toggleFilterGroup(groupId: number): void {
    this.expandedFilterGroups[groupId] = !this.expandedFilterGroups[groupId];
  }

  isFilterGroupExpanded(groupId: number): boolean {
    return !!this.expandedFilterGroups[groupId];
  }

  getGroupSelectionKey(group: CsvFilterGroupRes): string {
    return `${group.id}__${group.name}`;
  }

  getGroupSelectedCount(group: CsvFilterGroupRes): number {
    const groupKey = this.getGroupSelectionKey(group);
    return (this.selectedFilterValues[groupKey] || []).length;
  }

  onFilterItemChange(
    group: CsvFilterGroupRes,
    item: CsvFilterItemRes,
    event: Event,
  ): void {
    const checked = (event.target as HTMLInputElement).checked;
    const groupKey = this.getGroupSelectionKey(group);
    const currentValues = [...(this.selectedFilterValues[groupKey] || [])];
    const itemValue = this.normalize(item.value);

    if (checked) {
      if (!currentValues.includes(itemValue)) {
        currentValues.push(itemValue);
      }
      this.selectedFilterValues[groupKey] = currentValues;
    } else {
      this.selectedFilterValues[groupKey] = currentValues.filter(
        (value) => value !== itemValue,
      );
    }

    this.applyFilters();
  }

  isFilterItemSelected(
    group: CsvFilterGroupRes,
    item: CsvFilterItemRes,
  ): boolean {
    const groupKey = this.getGroupSelectionKey(group);
    const selectedValues = this.selectedFilterValues[groupKey] || [];
    return selectedValues.includes(this.normalize(item.value));
  }

  clearAllFilters(): void {
    this.globalSearch = '';

    this.displayColumnKeys.forEach((col) => {
      this.columnFilters[col] = '';
    });

    Object.keys(this.selectedFilterValues).forEach((key) => {
      this.selectedFilterValues[key] = [];
    });

    this.applyFilters();
  }

  applyFilters(): void {
    const globalTerm = this.normalize(this.globalSearch);

    const filtered = this.rows.filter((row) => {
      const matchesGlobal =
        !globalTerm ||
        this.displayColumnKeys.some((col) =>
          this.normalize(row[col]).includes(globalTerm),
        );

      if (!matchesGlobal) {
        return false;
      }

      const matchesColumnFilters = this.displayColumnKeys.every((col) => {
        const filterValue = this.normalize(this.columnFilters[col]);
        if (!filterValue) {
          return true;
        }

        return this.normalize(row[col]).includes(filterValue);
      });

      if (!matchesColumnFilters) {
        return false;
      }

      const matchesGroupedFilters = this.filterGroups.every((group) => {
        const groupKey = this.getGroupSelectionKey(group);
        const selectedValues = this.selectedFilterValues[groupKey] || [];

        if (!selectedValues.length) {
          return true;
        }

        const attributeKeys = group.items
          .map((item) => item.attribute)
          .filter(
            (value, index, arr) => !!value && arr.indexOf(value) === index,
          );

        if (!attributeKeys.length) {
          return true;
        }

        return attributeKeys.some((attributeKey) => {
          const rowValue = this.normalize(row[attributeKey]);
          return selectedValues.includes(rowValue);
        });
      });

      return matchesGroupedFilters;
    });

    const plotNoKey =
      this.displayColumns.find((col) => col.label === 'Plot No')?.key ||
      'plotNo';

    this.filteredRows = [...filtered].sort((a, b) =>
      this.comparePlotNumbers(a?.[plotNoKey], b?.[plotNoKey]),
    );
  }

  downloadFilteredCsv(): void {
    if (!this.displayColumnKeys.length) {
      return;
    }

    const rowsToExport = this.filteredRows || [];
    const csvContent = this.buildCsvContent(rowsToExport);
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFileName = (this.reportName || 'report')
      .replace(/[^\w.\-]+/g, '_')
      .replace(/_+/g, '_');

    link.href = url;
    link.download = `${safeFileName}_filtered.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  downloadFilteredPdf(): void {
    if (!this.displayColumns.length) {
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 36;
    const topY = 36;

    const title = 'Survey Report';
    const subtitle = this.reportName || 'Report';
    const generatedAt = new Date().toLocaleString();

    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, pageWidth, 72, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(title, marginX, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`File: ${subtitle}`, marginX, 48);
    doc.text(`Generated: ${generatedAt}`, marginX, 62);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const summaryY = 96;
    doc.text(`Total Rows: ${this.rows.length}`, marginX, summaryY);
    doc.text(
      `Filtered Rows: ${this.filteredRows.length}`,
      marginX + 110,
      summaryY,
    );
    doc.text(
      `Active Group Filters: ${this.getActiveGroupedFilterCount()}`,
      marginX + 240,
      summaryY,
    );

    const selectedFilterSummary = this.getSelectedFilterSummary();
    if (selectedFilterSummary.length) {
      doc.setFont('helvetica', 'bold');
      doc.text('Applied Filters:', marginX, summaryY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedFilterSummary.join(' | '), marginX + 80, summaryY + 20, {
        maxWidth: pageWidth - marginX * 2 - 80,
      });
    }

    const head = [['S. No', ...this.displayColumns.map((col) => col.label)]];
    const body = this.filteredRows.map((row, index) => [
      String(index + 1),
      ...this.displayColumns.map((col) => this.safePdfCell(row[col.key])),
    ]);

    autoTable(doc, {
      head,
      body,
      startY: selectedFilterSummary.length ? 132 : 118,
      margin: { left: marginX, right: marginX, bottom: 32 },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 6,
        lineColor: [230, 230, 230],
        lineWidth: 0.5,
        textColor: [55, 65, 81],
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [248, 249, 250],
        textColor: [33, 37, 41],
        fontStyle: 'bold',
        lineColor: [220, 226, 230],
        lineWidth: 0.75,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [250, 252, 255],
      },
      didDrawPage: () => {
        const currentPage = doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Page ${currentPage}`, pageWidth - marginX, pageHeight - 14, {
          align: 'right',
        });
      },
    });

    const safeFileName = (this.reportName || 'report')
      .replace(/[^\w.\-]+/g, '_')
      .replace(/_+/g, '_');

    doc.save(`${safeFileName}_filtered.pdf`);
  }

  getSelectedFilterSummary(): string[] {
    return this.filterGroups
      .map((group) => {
        const groupKey = this.getGroupSelectionKey(group);
        const selectedValues = this.selectedFilterValues[groupKey] || [];

        if (!selectedValues.length) {
          return '';
        }

        const selectedLabels = group.items
          .filter((item) => selectedValues.includes(this.normalize(item.value)))
          .map((item) => item.label);

        if (!selectedLabels.length) {
          return '';
        }

        return `${group.name}: ${selectedLabels.join(', ')}`;
      })
      .filter((value) => !!value);
  }

  safePdfCell(value: any): string {
    return value === null || value === undefined ? '' : String(value);
  }

  buildCsvContent(rows: Record<string, any>[]): string {
    const headerLine = ['S. No', ...this.displayColumns.map((col) => col.label)]
      .map((value) => this.escapeCsvValue(value))
      .join(',');

    const dataLines = rows.map((row, index) =>
      [
        this.escapeCsvValue(index + 1),
        ...this.displayColumnKeys.map((colKey) =>
          this.escapeCsvValue(row[colKey]),
        ),
      ].join(','),
    );

    return [headerLine, ...dataLines].join('\n');
  }

  escapeCsvValue(value: any): string {
    const str = value === null || value === undefined ? '' : String(value);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  normalize(value: any): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  comparePlotNumbers(a: any, b: any): number {
    const aStr = String(a ?? '').trim();
    const bStr = String(b ?? '').trim();

    const aNum = Number(aStr);
    const bNum = Number(bStr);

    const aIsNumeric = aStr !== '' && !Number.isNaN(aNum);
    const bIsNumeric = bStr !== '' && !Number.isNaN(bNum);

    if (aIsNumeric && bIsNumeric) {
      return aNum - bNum;
    }

    if (aIsNumeric && !bIsNumeric) {
      return -1;
    }

    if (!aIsNumeric && bIsNumeric) {
      return 1;
    }

    return aStr.localeCompare(bStr, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  toDisplayLabel(key: string): string {
    const normalized = String(key || '').trim();

    if (!normalized) {
      return '';
    }

    return normalized
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  getActiveColumnFilterCount(): number {
    return this.displayColumnKeys.filter((col) =>
      this.normalize(this.columnFilters[col]),
    ).length;
  }

  getActiveGroupedFilterCount(): number {
    return Object.values(this.selectedFilterValues).reduce(
      (count, values) => count + values.length,
      0,
    );
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByColumn(_index: number, col: ResolvedDisplayColumn): string {
    return col.key;
  }

  trackByFilterGroup(_index: number, group: CsvFilterGroupRes): number {
    return group.id;
  }

  trackByFilterItem(_index: number, item: CsvFilterItemRes): number {
    return item.id;
  }
}
