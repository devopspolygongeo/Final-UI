export interface ReportColumnConfigItem {
  label: string;
  keys: string[];
}

export const REPORT_COLUMN_CONFIG: Record<string, ReportColumnConfigItem[]> = {
  wadakapally_10_04_v1: [
    { label: 'Plot No', keys: ['plotNo', 'plot_no'] },
    {
      label: 'Document No',
      keys: ['doc_no', 'docNo', 'document_no', 'documentNo'],
    },
    { label: 'Owner Name', keys: ['ownername', 'owner_name', 'owner'] },
    { label: 'Developer', keys: ['Developer', 'developer', 'Devloper'] },
    { label: 'Sale Status', keys: ['salestatus', 'sale_status', 'status'] },
    { label: 'Facing', keys: ['facing'] },
    { label: 'Width', keys: ['width', 'Width'] },
    { label: 'Area', keys: ['area', 'Area'] },
  ],
};

export function normalizeReportConfigKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
