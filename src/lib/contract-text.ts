import { CONTRACT_VERSION } from "./constants";

export interface ContractParams {
  bidderName: string;
  bidderTitle: string;
  bidderCompany: string;
  bidAmount: number;
  date: string; // formatted date string
}

export function getContractVersion(): string {
  return CONTRACT_VERSION;
}

export function renderContractText(params: ContractParams): string {
  const amountFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(params.bidAmount);

  return `Q2 2026 PARTNERSHIP AGREEMENT
Version: ${CONTRACT_VERSION}

This Partnership Agreement ("Agreement") is entered into as of ${params.date} by and between:

DWTB?! Studios LLC ("DWTB" or "Provider")
and
${params.bidderName}, ${params.bidderTitle} at ${params.bidderCompany} ("Client")


1. PARTIES

Provider: DWTB?! Studios LLC, a signal-driven go-to-market engine serving enterprise B2B freight and logistics companies.

Client: ${params.bidderCompany}, represented by ${params.bidderName} (${params.bidderTitle}).


2. TERM

This Agreement covers the Q2 2026 engagement period: April 1, 2026 through June 30, 2026. Services begin upon acceptance of the Client's bid by DWTB?! Studios and mutual confirmation of the engagement start date.


3. SCOPE OF SERVICES

DWTB?! Studios will provide the Client with access to its GTM engine, including but not limited to:

- Account-level signal research and monitoring
- Target account identification and prioritization
- Custom asset production (proposals, one-pagers, campaign materials)
- Campaign direction and deployment strategy
- Performance tracking and pipeline attribution

Specific deliverables and cadence will be determined during the onboarding phase following bid acceptance.


4. BID AMOUNT AND PAYMENT TERMS

The Client submits a bid of ${amountFormatted} for a Q2 2026 partnership slot. This bid amount represents the total engagement fee for the Q2 term.

Payment terms upon acceptance:
- 50% due within 7 business days of bid acceptance
- 50% due at the midpoint of the engagement (May 15, 2026)

DWTB?! Studios reserves the right to accept, decline, or waitlist any bid at its sole discretion.


5. ACCEPTANCE AND SLOT RESERVATION

DWTB?! Studios operates with a maximum of 3 client slots per quarter. Submission of a signed bid does not guarantee acceptance. Slots are reserved only upon explicit written acceptance by DWTB?! Studios.

Upon acceptance, the Client will receive written confirmation and an onboarding schedule within 48 hours.


6. CONFIDENTIALITY

Both parties agree to maintain the confidentiality of proprietary information shared during the engagement, including but not limited to: target account lists, campaign strategies, signal data, and performance metrics.

This obligation survives termination of this Agreement for a period of 12 months.


7. LIMITATION OF LIABILITY

DWTB?! Studios' total liability under this Agreement shall not exceed the total bid amount paid by the Client. Neither party shall be liable for indirect, incidental, or consequential damages.


8. TERMINATION

Either party may terminate this Agreement with 30 days' written notice. In the event of early termination by the Client, fees paid for services already rendered are non-refundable. DWTB?! Studios will provide a prorated refund for services not yet delivered.


9. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions.


10. ELECTRONIC SIGNATURE ACKNOWLEDGMENT

By typing your full name and providing your electronic signature below, you acknowledge and agree that:

(a) Your electronic signature has the same legal effect as a handwritten signature under the Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. § 7001 et seq.).

(b) You have reviewed this Agreement in its entirety and understand its terms.

(c) You consent to conduct this transaction electronically.

(d) You will receive a copy of this signed Agreement for your records.

(e) This signed bid, if accepted by DWTB?! Studios, constitutes a binding agreement at the submitted bid amount of ${amountFormatted}.`;
}
