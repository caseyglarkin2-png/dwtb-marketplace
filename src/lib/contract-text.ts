import { CONTRACT_VERSION } from "./constants";

export interface ContractParams {
  bidderName: string;
  bidderTitle: string;
  bidderCompany: string;
  bidAmount: number;
  date: string; // formatted date string
}

export interface ContractSection {
  id: string;
  number: number;
  title: string;
  /** Plain-English one-liner a VP can scan in 3 seconds */
  summary: string;
  /** Full legal text */
  body: string;
  /** Sections 1-5 are expanded by default, 6-10 collapsed */
  defaultOpen: boolean;
}

export function getContractVersion(): string {
  return CONTRACT_VERSION;
}

export function getContractSections(params: ContractParams): ContractSection[] {
  const amountFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(params.bidAmount);

  return [
    {
      id: "parties",
      number: 1,
      title: "Parties",
      summary: `Between DWTB?! Studios and ${params.bidderCompany}.`,
      body: `Provider: DWTB?! Studios LLC, a signal-driven go-to-market engine serving enterprise B2B freight and logistics companies.\n\nClient: ${params.bidderCompany}, represented by ${params.bidderName} (${params.bidderTitle}).`,
      defaultOpen: true,
    },
    {
      id: "term",
      number: 2,
      title: "Term",
      summary: "April 1 – June 30, 2026. Full quarter.",
      body: "This Agreement covers the Q2 2026 engagement period: April 1, 2026 through June 30, 2026. Services begin upon acceptance and mutual confirmation of the engagement start date.",
      defaultOpen: true,
    },
    {
      id: "scope",
      number: 3,
      title: "What You Get",
      summary: "Signal research, target ID, custom assets, campaign execution, performance tracking.",
      body: "DWTB?! Studios will provide the Client with access to its GTM engine, including:\n\n• Account-level signal research and monitoring\n• Target account identification and prioritization\n• Custom asset production (proposals, one-pagers, campaign materials)\n• Campaign direction and deployment strategy\n• Performance tracking and pipeline attribution\n\nSpecific deliverables and cadence will be determined during onboarding.",
      defaultOpen: true,
    },
    {
      id: "investment",
      number: 4,
      title: "Investment",
      summary: `${amountFormatted} total — 50% on acceptance, 50% at midpoint (May 15).`,
      body: `The Client submits an allocation request of ${amountFormatted} for a Q2 2026 partnership slot. This amount represents the total engagement fee for the Q2 term.\n\nPayment terms upon acceptance:\n• 50% due within 7 business days of acceptance\n• 50% due at the midpoint of the engagement (May 15, 2026)\n\nDWTB?! Studios reserves the right to accept, decline, or waitlist any request at its sole discretion.`,
      defaultOpen: true,
    },
    {
      id: "acceptance",
      number: 5,
      title: "Acceptance",
      summary: "Max 3 clients per quarter. You'll hear back within 48 hours.",
      body: "DWTB?! Studios operates with a maximum of 3 client slots per quarter. Submission of a signed request does not guarantee acceptance. Slots are reserved only upon explicit written acceptance by DWTB?! Studios.\n\nUpon acceptance, the Client will receive written confirmation and an onboarding schedule within 48 hours.",
      defaultOpen: true,
    },
    {
      id: "confidentiality",
      number: 6,
      title: "Confidentiality",
      summary: "Both sides keep proprietary info private. 12 months post-engagement.",
      body: "Both parties agree to maintain the confidentiality of proprietary information shared during the engagement, including but not limited to: target account lists, campaign strategies, signal data, and performance metrics.\n\nThis obligation survives termination of this Agreement for a period of 12 months.",
      defaultOpen: false,
    },
    {
      id: "liability",
      number: 7,
      title: "Liability",
      summary: `Capped at ${amountFormatted}. No indirect damages.`,
      body: `DWTB?! Studios' total liability under this Agreement shall not exceed the total amount paid by the Client. Neither party shall be liable for indirect, incidental, or consequential damages.`,
      defaultOpen: false,
    },
    {
      id: "termination",
      number: 8,
      title: "Termination",
      summary: "30 days written notice. Prorated refund for undelivered services.",
      body: "Either party may terminate this Agreement with 30 days' written notice. In the event of early termination by the Client, fees paid for services already rendered are non-refundable. DWTB?! Studios will provide a prorated refund for services not yet delivered.",
      defaultOpen: false,
    },
    {
      id: "governing-law",
      number: 9,
      title: "Governing Law",
      summary: "New York State.",
      body: "This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions.",
      defaultOpen: false,
    },
    {
      id: "esign",
      number: 10,
      title: "Electronic Signature",
      summary: "Your e-signature is legally binding under the ESIGN Act.",
      body: `By typing your full name and providing your electronic signature below, you acknowledge and agree that:\n\n(a) Your electronic signature has the same legal effect as a handwritten signature under the ESIGN Act (15 U.S.C. § 7001 et seq.).\n\n(b) You have reviewed this Agreement in its entirety and understand its terms.\n\n(c) You consent to conduct this transaction electronically.\n\n(d) You will receive a copy of this signed Agreement for your records.\n\n(e) This signed request, if accepted by DWTB?! Studios, constitutes a binding agreement at the submitted amount of ${amountFormatted}.`,
      defaultOpen: false,
    },
  ];
}

/** Full contract as flat text — used for PDF generation and hashing */
export function renderContractText(params: ContractParams): string {
  const sections = getContractSections(params);
  const amountFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(params.bidAmount);

  const header = `Q2 2026 PARTNERSHIP AGREEMENT
Version: ${CONTRACT_VERSION}

This Partnership Agreement ("Agreement") is entered into as of ${params.date} by and between:

DWTB?! Studios LLC ("DWTB" or "Provider")
and
${params.bidderName}, ${params.bidderTitle} at ${params.bidderCompany} ("Client")`;

  const body = sections
    .map((s) => `\n\n${s.number}. ${s.title.toUpperCase()}\n\n${s.body}`)
    .join("");

  return header + body;
}
