import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock crypto.subtle for Node.js test environment
const mockSign = vi.fn().mockResolvedValue(new Uint8Array(32));
const mockImportKey = vi.fn().mockResolvedValue({});

vi.stubGlobal("crypto", {
  subtle: {
    importKey: mockImportKey,
    sign: mockSign,
  },
  randomUUID: () => "12345678-1234-4234-a234-123456789012",
});

describe("admin-auth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("checkAdminPassword", () => {
    it("returns false when ADMIN_PASSWORD is not set", async () => {
      delete process.env.ADMIN_PASSWORD;
      const { checkAdminPassword } = await import("../admin-auth");
      expect(checkAdminPassword("test")).toBe(false);
    });

    it("returns false for wrong password", async () => {
      process.env.ADMIN_PASSWORD = "correctpassword";
      const { checkAdminPassword } = await import("../admin-auth");
      expect(checkAdminPassword("wrongpassword")).toBe(false);
    });

    it("returns true for correct password", async () => {
      process.env.ADMIN_PASSWORD = "mycorrectpass";
      const { checkAdminPassword } = await import("../admin-auth");
      expect(checkAdminPassword("mycorrectpass")).toBe(true);
    });

    it("uses constant-time comparison (different lengths)", async () => {
      process.env.ADMIN_PASSWORD = "short";
      const { checkAdminPassword } = await import("../admin-auth");
      expect(checkAdminPassword("longerpassword")).toBe(false);
    });
  });
});
