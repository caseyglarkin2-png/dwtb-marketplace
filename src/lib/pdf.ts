// Minimal PDF generator — no external dependencies
// Produces a valid PDF 1.4 document with contract text

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// ── Payment Instructions PDF ────────────────────────────

interface PaymentInstructionsParams {
  bidderName: string;
  bidderCompany: string;
  bidAmount: number;
  bidId: string;
  contractVersion: string;
  acceptedAt: string;
}

export function generatePaymentInstructionsPdf(
  params: PaymentInstructionsParams
): Uint8Array {
  const halfAmount = Math.round(params.bidAmount / 2);
  const formattedTotal = params.bidAmount.toLocaleString("en-US");
  const formattedHalf = halfAmount.toLocaleString("en-US");

  const text = [
    "DWTB?! STUDIOS — PAYMENT INSTRUCTIONS",
    "Q2 2026 GTM Engine Partnership",
    "",
    "────────────────────────────────────────────",
    "",
    `Prepared for: ${params.bidderName}`,
    `Company: ${params.bidderCompany}`,
    `Allocation Amount: $${formattedTotal}`,
    `Reference: ${params.bidId}`,
    `Contract: ${params.contractVersion}`,
    `Accepted: ${new Date(params.acceptedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
    "────────────────────────────────────────────",
    "",
    "PAYMENT SCHEDULE",
    "",
    `  Installment 1:  $${formattedHalf}  —  Due within 7 business days`,
    `  Installment 2:  $${formattedHalf}  —  Due by May 15, 2026`,
    "",
    "────────────────────────────────────────────",
    "",
    "ACCEPTED PAYMENT METHODS",
    "",
    "1. ZELLE (Preferred — instant, no fees)",
    "   Send to: casey@dwtb.dev",
    "   Name: Casey Glarkin / DWTB Studios LLC",
    "",
    "2. VENMO",
    "   @CaseyGlarkin",
    "   Note: Include your bid reference number",
    "",
    "3. WIRE TRANSFER / ACH",
    "   Bank: [Provided upon request]",
    "   Routing: [Provided upon request]",
    "   Account: [Provided upon request]",
    "   Reference: " + params.bidId,
    "",
    "   For wire details, email casey@dwtb.dev",
    "   or reply to this email.",
    "",
    "────────────────────────────────────────────",
    "",
    "IMPORTANT NOTES",
    "",
    "- Please include your bid reference in all payments",
    "- Confirmation will be sent within 24 hours of receipt",
    "- Questions? casey@dwtb.dev",
    "",
    "────────────────────────────────────────────",
    "",
    "DWTB?! Studios LLC",
    "casey@dwtb.dev",
    `Reference: ${params.bidId}`,
  ].join("\n");

  return buildSimplePdf(text, {
    header: "DWTB?! Studios LLC — Payment Instructions",
    showPageNumbers: true,
  });
}

// ── Contract PDF ────────────────────────────────────────

interface PdfParams {
  contractText: string;
  bidderName: string;
  bidderCompany: string;
  bidAmount: number;
  signedAt: string;
  bidId: string;
  signatureHash: string;
  contractVersion: string;
}

export function generateContractPdf(params: PdfParams): Uint8Array {
  const {
    contractText,
    bidderName,
    bidderCompany,
    bidAmount,
    signedAt,
    bidId,
    signatureHash,
    contractVersion,
  } = params;

  const generatedAt = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const letterhead = [
    "DWTB?! STUDIOS LLC",
    "Offering Memorandum — Q2 2026 Partnership Agreement",
    "CONFIDENTIAL — FOR ADDRESSEE ONLY",
    "────────────────────────────────────────────",
    "",
  ].join("\n");

  const sigBlock = [
    "",
    "────────────────────────────────────────────",
    "",
    `Electronically Signed By: ${bidderName}`,
    `Company: ${bidderCompany}`,
    `Bid Amount: $${bidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    `Date: ${new Date(signedAt).toLocaleString("en-US", { timeZone: "America/New_York" })}`,
    `Bid Reference: ${bidId}`,
    `Contract Version: ${contractVersion}`,
    `Integrity Hash: ${signatureHash}`,
    "",
    "This document was electronically signed in accordance with the",
    "Electronic Signatures in Global and National Commerce Act (ESIGN Act).",
    "",
    `Generated: ${generatedAt} ET`,
  ].join("\n");

  return buildSimplePdf(letterhead + contractText + sigBlock, {
    header: "DWTB?! Studios LLC — CONFIDENTIAL",
    showPageNumbers: true,
  });
}

// ── Shared PDF Builder ──────────────────────────────────

interface BuildOptions {
  header?: string;
  showPageNumbers?: boolean;
}

function buildSimplePdf(text: string, opts: BuildOptions = {}): Uint8Array {
  const { header: pageHeader, showPageNumbers } = opts;

  const fontSize = 10;
  const lineHeight = 14;
  const marginLeft = 50;
  const marginTop = 750;
  const pageWidth = 612;
  const pageHeight = 792;
  const maxCharsPerLine = 85;
  const maxLinesPerPage = Math.floor((marginTop - 60) / lineHeight);

  // Split text into lines
  const rawLines = text.split("\n");
  const allLines: string[] = [];

  for (const line of rawLines) {
    if (line.trim() === "") {
      allLines.push("");
    } else {
      allLines.push(...wrapText(line, maxCharsPerLine));
    }
  }

  // Split into pages
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += maxLinesPerPage) {
    pages.push(allLines.slice(i, i + maxLinesPerPage));
  }

  // Build PDF
  const objects: string[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  function addObj(content: string): number {
    const objNum = objects.length + 1;
    const obj = `${objNum} 0 obj\n${content}\nendobj\n`;
    offsets.push(currentOffset);
    currentOffset += new TextEncoder().encode(obj).length;
    objects.push(obj);
    return objNum;
  }

  const pdfHeader = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  currentOffset = new TextEncoder().encode(pdfHeader).length;

  // Object 1: Catalog
  const catalogObj = addObj("<< /Type /Catalog /Pages 2 0 R >>");

  // Object 2: Pages (placeholder — we'll fix refs)
  const pagesObjNum = objects.length + 1;
  objects.push(""); // placeholder
  offsets.push(currentOffset);
  currentOffset += 0; // will be recalculated

  // Object 3: Font
  const fontObj = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"
  );

  // Create page objects
  const pageObjNums: number[] = [];
  const streamObjNums: number[] = [];

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageLines = pages[pageIdx];
    const pageNum = pageIdx + 1;

    // Build content stream
    let stream = `BT\n/F1 ${fontSize} Tf\n`;
    let y = marginTop;

    // Page header line
    if (pageHeader) {
      stream += `${marginLeft} 775 Td\n(${escapeText(pageHeader)}) Tj\n`;
      stream += `${-marginLeft} ${-775} Td\n`;
    }

    // Page content
    for (const line of pageLines) {
      stream += `${marginLeft} ${y} Td\n(${escapeText(line)}) Tj\n`;
      stream += `${-marginLeft} ${-y} Td\n`;
      y -= lineHeight;
    }

    // Page footer: confidential + page number
    const confidentialText = "CONFIDENTIAL — FOR ADDRESSEE ONLY";
    stream += `${marginLeft} 30 Td\n(${escapeText(confidentialText)}) Tj\n`;
    stream += `${-marginLeft} ${-30} Td\n`;

    if (showPageNumbers) {
      const pageText = `Page ${pageNum} of ${pages.length}`;
      const approxX = pageWidth - marginLeft - pageText.length * 6;
      stream += `${approxX} 30 Td\n(${escapeText(pageText)}) Tj\n`;
      stream += `${-approxX} ${-30} Td\n`;
    }

    stream += "ET\n";

    const streamBytes = new TextEncoder().encode(stream);
    const streamObjNum = addObj(
      `<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream`
    );
    streamObjNums.push(streamObjNum);

    const pageObjNum = addObj(
      `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamObjNum} 0 R /Resources << /Font << /F1 ${fontObj} 0 R >> >> >>`
    );
    pageObjNums.push(pageObjNum);
  }

  // Fix Pages object
  const kidsStr = pageObjNums.map((n) => `${n} 0 R`).join(" ");
  const pagesContent = `<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>`;
  const pagesObj = `${pagesObjNum} 0 obj\n${pagesContent}\nendobj\n`;
  objects[pagesObjNum - 1] = pagesObj;

  // Recalculate all offsets
  let runningOffset = new TextEncoder().encode(pdfHeader).length;
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = runningOffset;
    runningOffset += new TextEncoder().encode(objects[i]).length;
  }

  // Cross-reference table
  const xrefOffset = runningOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  // Trailer
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  // Combine
  const fullPdf = pdfHeader + objects.join("") + xref + trailer;
  return new TextEncoder().encode(fullPdf);
}
