import { describe, it, expect, vi, beforeEach } from "vitest";
import { scanFiles } from "../src/utils";
import type { ScanOption } from "../src/type";

const { mockGlobSync, mockReadFileSync } = vi.hoisted(() => {
  return {
    mockGlobSync: vi.fn(),
    mockReadFileSync: vi.fn(),
  };
});

vi.mock("glob", async () => {
  const mockGlob = {
    globSync: mockGlobSync,
  };
  return { ...mockGlob, default: mockGlob };
});

vi.mock("fs", async () => {
  const mockFs = {
    readFileSync: mockReadFileSync,
  };
  return { ...mockFs, default: mockFs };
});

describe("scanFiles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should scan files with matching pattern", () => {
    const mockFiles = ["/test/file1.ts", "/test/file2.ts", "/test/file3.js"];
    mockGlobSync.mockReturnValue(mockFiles);
    mockReadFileSync.mockReturnValue("file content");

    const scanOption: ScanOption = {
      pattern: "src/**/*.{ts,js}",
    };

    const result = scanFiles(scanOption);

    expect(mockGlobSync).toHaveBeenCalledWith("src/**/*.{ts,js}", {});
    expect(result.has("/test/file1.ts")).toBe(true);
    expect(result.has("/test/file2.ts")).toBe(true);
    expect(result.has("/test/file3.js")).toBe(true);
  });

  it("should scan files with custom glob options", () => {
    const mockFiles = ["/test/file1.ts", "/test/file2.ts"];
    mockGlobSync.mockReturnValue(mockFiles);
    mockReadFileSync.mockReturnValue("file content");

    const scanOption: ScanOption = {
      pattern: "src/**/*.ts",
      options: {
        ignore: ["**/node_modules/**", "**/dist/**"],
        dot: false,
      },
    };

    const result = scanFiles(scanOption);

    expect(mockGlobSync).toHaveBeenCalledWith("src/**/*.ts", {
      ignore: ["**/node_modules/**", "**/dist/**"],
      dot: false,
    });
    expect(result.size).toBe(2);
    expect(result.has("/test/file1.ts")).toBe(true);
    expect(result.has("/test/file2.ts")).toBe(true);
  });

  it("should handle array pattern", () => {
    const mockFiles = ["/test/file1.ts", "/test/file2.js"];
    mockGlobSync.mockReturnValue(mockFiles);
    mockReadFileSync.mockReturnValue("file content");

    const scanOption: ScanOption = {
      pattern: ["src/**/*.ts", "src/**/*.js"],
    };

    const result = scanFiles(scanOption);

    expect(mockGlobSync).toHaveBeenCalledWith(
      ["src/**/*.ts", "src/**/*.js"],
      {}
    );
    expect(result.size).toBe(2);
    expect(result.has("/test/file1.ts")).toBe(true);
    expect(result.has("/test/file2.js")).toBe(true);
  });

  it("should handle empty pattern", () => {
    mockGlobSync.mockReturnValue([]);

    const scanOption: ScanOption = {
      pattern: "nonexistent/**/*.ts",
    };

    const result = scanFiles(scanOption);

    expect(result.size).toBe(0);
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  it("should handle glob error gracefully", () => {
    mockGlobSync.mockImplementation(() => {
      throw new Error("Invalid pattern");
    });

    const scanOption: ScanOption = {
      pattern: "invalid[pattern",
    };

    expect(() => scanFiles(scanOption)).toThrow("Invalid pattern");
  });

  it("should handle file read error", () => {
    const mockFiles = ["/test/file1.ts", "/test/file2.ts"];
    mockGlobSync.mockReturnValue(mockFiles);
    mockReadFileSync
      .mockReturnValueOnce("content1")
      .mockImplementationOnce(() => {
        throw new Error("Permission denied");
      });

    const scanOption: ScanOption = {
      pattern: "src/**/*.ts",
    };

    expect(() => scanFiles(scanOption)).toThrow("Permission denied");
  });

  it("should use default options when options not provided", () => {
    const mockFiles = ["/test/file.ts"];
    mockGlobSync.mockReturnValue(mockFiles);
    mockReadFileSync.mockReturnValue("content");

    const scanOption: ScanOption = {
      pattern: "src/**/*.ts",
    };

    scanFiles(scanOption);

    expect(mockGlobSync).toHaveBeenCalledWith("src/**/*.ts", {});
  });
});
