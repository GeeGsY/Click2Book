// Builds a one-page PDF receipt without any library, and downloads it.

export interface ReceiptData {
  reference: string;
  stay: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guestName: string;
  guestEmail: string;
  method: string;
  total: number; // Philippine peso
  status?: string; // defaults to Confirmed
  issuedAt: Date;
}

// The PDF's built-in fonts only cover Latin-1 text, so other characters are replaced.
function clean(text: string): string {
  return text
    .replace(/₱/g, 'PHP ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\xff]/g, '?');
}

function escapePdf(text: string): string {
  return clean(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function longDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function pesoAmount(value: number): string {
  return `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildReceiptPdf(data: ReceiptData): Blob {
  const ops: string[] = [];
  const text = (x: number, y: number, size: number, bold: boolean, value: string, color = '0.12 0.16 0.14') => {
    ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg ${x} ${y} Td (${escapePdf(value)}) Tj ET`);
  };
  const line = (y: number) => {
    ops.push(`0.85 0.85 0.82 RG 0.8 w 56 ${y} m 539 ${y} l S`);
  };

  const ocean = '0.055 0.231 0.263';
  const teal = '0.11 0.43 0.44';
  const nights = `${data.nights} night${data.nights === 1 ? '' : 's'}`;

  // Header
  text(56, 770, 26, true, 'Click2Book', ocean);
  text(56, 750, 11, false, 'Dream. Book. Travel.', teal);
  text(56, 700, 18, true, 'Booking receipt', ocean);
  text(56, 680, 10, false, `Issued ${longDate(data.issuedAt)}`, '0.4 0.4 0.4');
  line(662);

  // Details, label above value
  const rows: [string, string][] = [
    ['Booking reference', data.reference],
    ['Status', data.status ?? 'Confirmed'],
    ['Stay', data.stay],
    ['Check-in', longDate(data.checkIn)],
    ['Check-out', `${longDate(data.checkOut)}  (${nights})`],
    ['Guest', data.guestName],
    ['Email', data.guestEmail],
    ['Payment method', data.method],
  ];
  let y = 636;
  for (const [label, value] of rows) {
    text(56, y, 9, true, label.toUpperCase(), teal);
    text(56, y - 16, 12, false, value);
    y -= 46;
  }

  // Total
  line(y + 14);
  text(56, y - 12, 10, true, 'AMOUNT PAID', teal);
  text(56, y - 38, 22, true, pesoAmount(data.total), ocean);

  // Footer
  text(56, 70, 9, false, 'Prototype receipt - no real payment was made.', '0.4 0.4 0.4');

  const content = ops.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  // Every character is 1 byte (Latin-1), so string lengths are byte offsets.
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }
  return new Blob([bytes], { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}