import * as XLSX from 'xlsx';

export interface ExcelItemRow {
  ITNO: string;
  'ITEM NAME': string;
  'AVAILABLE QTY': number;
  'ONE PIECE PRICE': number;
  REASON?: string;
}

export function generateTemplateBlob(): Blob {
  const sampleData: ExcelItemRow[] = [
    {
      ITNO: 'PO-A4-01',
      'ITEM NAME': 'Double A A4 80gsm Paper Rim',
      'AVAILABLE QTY': 50,
      'ONE PIECE PRICE': 1450,
      REASON: 'Regular Office Stock',
    },
    {
      ITNO: 'PO-MUG-02',
      'ITEM NAME': 'White Ceramic Sublimation Mug 11oz',
      'AVAILABLE QTY': 120,
      'ONE PIECE PRICE': 420,
      REASON: 'Gift Printing Material',
    },
    {
      ITNO: 'PO-INK-03',
      'ITEM NAME': 'Epson 003 Black Ink Bottle',
      'AVAILABLE QTY': 25,
      'ONE PIECE PRICE': 2100,
      REASON: 'Printer Refill Ink',
    },
    {
      ITNO: 'PO-TSHIRT-04',
      'ITEM NAME': 'Round Neck Cotton T-Shirt L White',
      'AVAILABLE QTY': 80,
      'ONE PIECE PRICE': 950,
      REASON: 'Apparel Printing',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Auto-width columns for clean presentation
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 38 },
    { wch: 18 },
    { wch: 20 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock_Items');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function exportItemsToExcel(items: any[]): void {
  const exportData = items.map((item) => ({
    ITNO: item.itno,
    'ITEM NAME': item.itemName,
    'AVAILABLE QTY': item.availableQty,
    'ONE PIECE PRICE': item.unitPrice,
    'TOTAL VALUE (LKR)': item.availableQty * item.unitPrice,
    REASON: item.reason || 'Stock In',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 40 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory_Stock');

  XLSX.writeFile(
    workbook,
    `PRINT_OPTION_STOCK_${new Date().toISOString().split('T')[0]}.xlsx`
  );
}

export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
