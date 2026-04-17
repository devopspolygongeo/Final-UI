export interface ReportColumnConfigItem {
  label: string;
  keys: string[];
}

export const REPORT_COLUMN_CONFIG: Record<string, ReportColumnConfigItem[]> = {
  wadakaplly_topo_16_04: [
    { label: 'Plot No', keys: ['plotNo', 'plot_no'] },
    { label: 'Extent', keys: ['area', 'Area'] },
    { label: 'Facing', keys: ['facing'] },
    { label: 'Sale Status', keys: ['salestatus', 'sale_status', 'status'] },
    { label: 'Developer/Seller', keys: ['Developer', 'developer', 'Devloper'] },

    { label: 'Owner/Buyer', keys: ['ownername', 'owner_name', 'owner'] },
    {
      label: 'Document No',
      keys: ['doc_no', 'docNo', 'document_no', 'documentNo'],
    },
    { label: 'Remarks', keys: ['Sales_Consideration'] },
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
