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

  const fontSize = 10;
  const lineHeight = 14;
  const marginLeft = 50;
  const marginTop = 750;
  const pageWidth = 612;
  const pageHeight = 792;
  const maxCharsPerLine = 85;
  const maxLinesPerPage = Math.floor((marginTop - 60) / lineHeight);

  // Split contract text into lines
  const rawLines = contractText.split("\n");
  const allLines: string[] = [];

  for (const line of rawLines) {
    if (line.trim() === "") {
      allLines.push("");
    } else {
      allLines.push(...wrapText(line, maxCharsPerLine));
    }
  }

  // Add signature block
  allLines.push("");
  allLines.push("────────────────────────────────────────────");
  allLines.push("");
  allLines.push(`Electronically Signed By: ${bidderName}`);
  allLines.push(`Company: ${bidderCompany}`);
  allLines.push(
    `Bid Amount: $${bidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  );
  allLines.push(`Date: ${new Date(signedAt).toLocaleString("en-US", { timeZone: "America/New_York" })}`);
  allLines.push(`Bid Reference: ${bidId}`);
  allLines.push(`Contract Version: ${contractVersion}`);
  allLines.push(`Integrity Hash: ${signatureHash}`);
  allLines.push("");
  allLines.push(
    "This document was electronically signed in accordance with the"
  );
  allLines.push(
    "Electronic Signatures in Global and National Commerce Act (ESIGN Act)."
  );

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

  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  currentOffset = new TextEncoder().encode(header).length;

  // Object 1: Catalog
  const catalogObj = addObj("<< /Type /Catalog /Pages 2 0 R >>");

  // Object 2: Pages (placeholder — we'll fix refs)
  const pagesObjNum = objects.length + 1;
  // Skip for now, add after page objects
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

  for (const pageLines of pages) {
    // Build content stream
    let stream = `BT\n/F1 ${fontSize} Tf\n`;
    let y = marginTop;

    for (const line of pageLines) {
      stream += `${marginLeft} ${y} Td\n(${escapeText(line)}) Tj\n`;
      // Reset position for next line
      stream += `${-marginLeft} ${-y} Td\n`;
      y -= lineHeight;
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
  let runningOffset = new TextEncoder().encode(header).length;
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
  const fullPdf = header + objects.join("") + xref + trailer;
  return new TextEncoder().encode(fullPdf);
}
