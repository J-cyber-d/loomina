/**
 * Loomina 1-Click Export Suite
 * Zero-dependency, ultra-lightweight (<3 KB) client-side exporter.
 * Adheres strictly to Loomina Rule #2: Featherweight (<80 KB) React SDK.
 */

export interface ExportColumn<T = Record<string, unknown>> {
  header: string;
  key: keyof T & string;
  format?: (value: unknown, row: T) => string | number;
}

/**
 * Cleanly format and sanitize a string or value for CSV (RFC 4180 compliant)
 */
function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 1. Export Dataset to CSV with UTF-8 BOM for universal Excel / Numbers compatibility
 */
export function exportToCsv<T extends object>(
  filename: string,
  data: T[],
  columns?: ExportColumn<T>[]
): void {
  if (!data || data.length === 0) {
    console.warn('[Loomina Export] No data available to export to CSV.');
    return;
  }

  const cols: ExportColumn<T>[] =
    columns ||
    (Object.keys(data[0]) as (keyof T & string)[]).map((key) => ({
      header: key,
      key,
    }));

  const headerRow = cols.map((col) => sanitizeCsvValue(col.header)).join(',');
  const dataRows = data.map((row) =>
    cols
      .map((col) => {
        const rawVal = row[col.key as keyof T];
        const val = col.format ? col.format(rawVal, row) : rawVal;
        return sanitizeCsvValue(val);
      })
      .join(',')
  );

  // UTF-8 BOM ensures Excel on Windows correctly decodes UTF-8 characters
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * 2. Export Dataset to Formatted Excel (.xls / XML Spreadsheet 2003)
 * Full styling, custom column types, and Electric Indigo Loomina brand header styling.
 */
export function exportToExcel<T extends object>(
  filename: string,
  sheetName: string,
  data: T[],
  columns?: ExportColumn<T>[]
): void {
  if (!data || data.length === 0) {
    console.warn('[Loomina Export] No data available to export to Excel.');
    return;
  }

  const cols: ExportColumn<T>[] =
    columns ||
    (Object.keys(data[0]) as (keyof T & string)[]).map((key) => ({
      header: key,
      key,
    }));

  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>Loomina Embedded Analytics</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Borders/>
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#18181b"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#4f46e5"/>
      </Borders>
      <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
      <Interior ss:Color="#6366f1" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="ZebraRow">
      <Interior ss:Color="#f8fafc" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
      </Borders>
    </Style>
    <Style ss:ID="NormalRow">
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(sheetName || 'Analytics')}">
    <Table ss:DefaultColumnWidth="120" ss:DefaultRowHeight="22">
`;

  let rowsXml = '      <Row ss:Height="26">\n';
  for (const col of cols) {
    rowsXml += `        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>\n`;
  }
  rowsXml += '      </Row>\n';

  data.forEach((row, idx) => {
    const styleId = idx % 2 === 1 ? 'ZebraRow' : 'NormalRow';
    rowsXml += `      <Row ss:StyleID="${styleId}">\n`;
    for (const col of cols) {
      const rawVal = row[col.key as keyof T];
      const val = col.format ? col.format(rawVal, row) : rawVal;
      const isNumber = typeof val === 'number' && !isNaN(val);
      const cellType = isNumber ? 'Number' : 'String';
      const cellValue = isNumber ? String(val) : escapeXml(String(val ?? ''));
      rowsXml += `        <Cell><Data ss:Type="${cellType}">${cellValue}</Data></Cell>\n`;
    }
    rowsXml += '      </Row>\n';
  });

  const xmlFooter = `    </Table>
  </Worksheet>
</Workbook>`;

  const excelContent = xmlHeader + rowsXml + xmlFooter;
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
}

/**
 * 3. Export Dashboard Snapshot to Print/PDF
 * Formats the embedded view with clean print media layout and launches the browser PDF print engine.
 */
export function exportToPdf(dashboardTitle: string, tenantId?: string): void {
  // Set printable document title temporarily so saved PDF defaults to this name
  const originalTitle = document.title;
  const cleanTitle = `Loomina_${(dashboardTitle || 'Dashboard').replace(/\s+/g, '_')}_${tenantId || 'Report'}`;
  document.title = cleanTitle;

  window.print();

  // Restore original document title
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

/**
 * Helper: Triggers instant browser download via temporary anchor element
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: XML character escaping
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
