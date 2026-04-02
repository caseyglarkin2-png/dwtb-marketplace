// SHA-256 integrity hash for e-sign compliance
// Hash binds: contract version, bid ID, signer name, email, amount, typed name, timestamp
export async function generateSignatureHash(params: {
  contractVersion: string;
  bidId: string;
  signerName: string;
  signerEmail: string;
  bidAmount: number;
  typedName: string;
  signedAt: string;
}): Promise<string> {
  const input = [
    params.contractVersion,
    params.bidId,
    params.signerName,
    params.signerEmail,
    params.bidAmount.toFixed(2),
    params.typedName,
    params.signedAt,
  ].join("|");

  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
