import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  PlotStatusService,
  ParsedCsvDataRes,
} from '../../../services/plot-status.service';

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
  filteredRows: Record<string, any>[] = [];

  globalSearch = '';
  columnFilters: Record<string, string> = {};

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
        this.loadReport(this.surveyId);
      } else {
        this.errorMessage = 'Survey ID is missing.';
        this.columns = [];
        this.rows = [];
        this.filteredRows = [];
      }
    });
  }

  loadReport(surveyId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.plotStatusService.getParsedCsvData(surveyId).subscribe({
      next: (resp: ParsedCsvDataRes) => {
        this.reportName = resp.file_name || 'Report';
        this.columns = Array.isArray(resp.columns) ? resp.columns : [];
        this.rows = Array.isArray(resp.rows) ? resp.rows : [];
        this.filteredRows = [...this.rows];
        this.initializeColumnFilters();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load report data', err);
        this.errorMessage = 'Failed to load report data.';
        this.columns = [];
        this.rows = [];
        this.filteredRows = [];
        this.loading = false;
      },
    });
  }

  initializeColumnFilters(): void {
    const nextFilters: Record<string, string> = {};
    this.columns.forEach((col) => {
      nextFilters[col] = this.columnFilters[col] || '';
    });
    this.columnFilters = nextFilters;
    this.applyFilters();
  }

  applyFilters(): void {
    const globalTerm = this.normalize(this.globalSearch);

    this.filteredRows = this.rows.filter((row) => {
      const matchesGlobal =
        !globalTerm ||
        this.columns.some((col) =>
          this.normalize(row[col]).includes(globalTerm),
        );

      if (!matchesGlobal) {
        return false;
      }

      const matchesColumnFilters = this.columns.every((col) => {
        const filterValue = this.normalize(this.columnFilters[col]);
        if (!filterValue) {
          return true;
        }

        return this.normalize(row[col]).includes(filterValue);
      });

      return matchesColumnFilters;
    });
  }

  clearAllFilters(): void {
    this.globalSearch = '';
    this.columns.forEach((col) => {
      this.columnFilters[col] = '';
    });
    this.applyFilters();
  }

  downloadFilteredCsv(): void {
    if (!this.columns.length) {
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

  buildCsvContent(rows: Record<string, any>[]): string {
    const headerLine = this.columns
      .map((col) => this.escapeCsvValue(col))
      .join(',');
    const dataLines = rows.map((row) =>
      this.columns.map((col) => this.escapeCsvValue(row[col])).join(','),
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

  getActiveColumnFilterCount(): number {
    return this.columns.filter((col) => this.normalize(this.columnFilters[col]))
      .length;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByColumn(_index: number, col: string): string {
    return col;
  }
}
