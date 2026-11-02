// Export laporan ke Excel (.xlsx) dan PDF — hasil sudah rapi & siap arsip:
// kop nama instansi, header berwarna, border, lebar kolom otomatis, dan sel
// status gizi ikut diwarnai sesuai level (lihat giziLevel.js).
// Library di-load on-demand (dynamic import) supaya tidak memberatkan bundle awal.
//
// `sections` = [{ label, rows }] — tiap section digambar sebagai blok terpisah
// (mis. satu blok per RW) dengan judul blok + header kolom sendiri.
// Setiap cell bisa berupa nilai biasa ATAU { v, lv } — `lv` = kunci
// GIZI_LEVELS ("bahaya" | "waspada" | "normal") atau status object growth.js.

import { GIZI_LEVELS, lvOf } from "./giziLevel";

const PINK = "FFDB2777";
const PINK_SOFT = "FFFCE7F3";

const cellVal = (c) => (c !== null && typeof c === "object" ? c.v : c);
const cellLv = (c) => (c !== null && typeof c === "object" ? (typeof c.lv === "string" ? c.lv : lvOf(c.lv)) : null);

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const BORDER = { style: "thin", color: { argb: "FFD1D5DB" } };
const allBorders = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };

export async function exportHealthXlsx({ filename, instansi, judul, headers, sections }) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Laporan");
  const nCols = headers.length;
  const allRows = sections.flatMap((s) => s.rows);

  // Lebar kolom otomatis dari isi terpanjang (maks 42)
  ws.columns = headers.map((h, i) => ({
    width: Math.min(
      Math.max(String(h).length, ...allRows.map((r) => String(cellVal(r[i]) ?? "").length), 8) + 2,
      42
    ),
  }));

  // Kop surat
  const title = (r, text, font) => {
    ws.mergeCells(r, 1, r, nCols);
    const c = ws.getCell(r, 1);
    c.value = text;
    c.font = font;
    c.alignment = { horizontal: "center", vertical: "middle" };
  };
  title(1, instansi, { bold: true, size: 14, color: { argb: PINK } });
  title(2, judul, { bold: true, size: 11, color: { argb: "FF1F2937" } });
  title(3, `Diekspor ${new Date().toLocaleString("id-ID")}`, { size: 9, color: { argb: "FF6B7280" } });
  ws.addRow([]);

  const headerRow = () => {
    const hr = ws.addRow(headers);
    hr.height = 20;
    hr.eachCell((c) => {
      c.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PINK } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      c.border = allBorders;
    });
  };

  sections.forEach((sec, si) => {
    if (si > 0) ws.addRow([]);

    // Judul blok (mis. "RW 01") — satu baris penuh
    if (sec.label) {
      const lr = ws.addRow([sec.label]);
      lr.height = 18;
      for (let i = 1; i <= nCols; i++) {
        const c = ws.getCell(lr.number, i);
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PINK_SOFT } };
        c.border = allBorders;
      }
      ws.mergeCells(lr.number, 1, lr.number, nCols);
      const c = ws.getCell(lr.number, 1);
      c.value = sec.label;
      c.font = { bold: true, size: 11, color: { argb: PINK } };
      c.alignment = { horizontal: "left", vertical: "middle" };
    }

    headerRow();

    // Baris data (selang-seling + warna level)
    sec.rows.forEach((r, ri) => {
      const row = ws.addRow(r.map(cellVal));
      row.eachCell((c, ci) => {
        const lv = cellLv(r[ci - 1]);
        c.border = allBorders;
        c.font = lv
          ? { size: 10, bold: lv === "bahaya", color: { argb: GIZI_LEVELS[lv].argb } }
          : { size: 10, color: { argb: "FF374151" } };
        if (ri % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      });
    });
  });

  ws.views = [{ state: "frozen", ySplit: 4 }];

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(filename, new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));
}

export async function exportHealthPdf({ filename, instansi, judul, headers, sections }) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Kop
  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(219, 39, 119);
  doc.text(instansi, pageW / 2, 42, { align: "center" });
  doc.setFontSize(11).setTextColor(31, 41, 55);
  doc.text(judul, pageW / 2, 59, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(107, 114, 128);
  doc.text(`Diekspor ${new Date().toLocaleString("id-ID")}`, pageW / 2, 72, { align: "center" });

  const drawFooter = () => {
    const { pageNumber } = doc.getCurrentPageInfo();
    const total = doc.getNumberOfPages();
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(107, 114, 128);
    doc.text(`${instansi} — ${judul}`, 24, pageH - 12);
    doc.text(`Halaman ${pageNumber} dari ${total}`, pageW - 24, pageH - 12, { align: "right" });
  };

  let y = 82;
  sections.forEach((sec) => {
    // Judul blok RW — pastikan tidak terpotong di ujung halaman
    if (sec.label) {
      if (y > pageH - 90) { doc.addPage(); y = 40; }
      doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(219, 39, 119);
      doc.text(sec.label, 24, y + 8);
      y += 12;
    }

    autoTable(doc, {
      startY: y + 4,
      head: [headers],
      body: sec.rows.map((r) => r.map(cellVal)),
      styles: { fontSize: 6.8, cellPadding: 3, textColor: [55, 65, 81], lineColor: [229, 231, 235], lineWidth: 0.4 },
      headStyles: { fillColor: [219, 39, 119], textColor: 255, fontSize: 7, fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [253, 242, 248] },
      columnStyles: {
        0: { fontStyle: "bold" }, // Nama
      },
      margin: { left: 24, right: 24 },
      didParseCell: (d) => {
        if (d.section !== "body") return;
        const lv = cellLv(sec.rows[d.row.index][d.column.index]);
        if (lv) {
          d.cell.styles.textColor = GIZI_LEVELS[lv].rgb;
          if (lv === "bahaya") d.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: drawFooter,
    });
    y = doc.lastAutoTable.finalY + 14;
  });

  doc.save(filename);
}
