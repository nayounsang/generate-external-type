import { describe, it, expect, vi, beforeEach } from "vitest";
import { scanFiles } from "../src/utils";

const {
  mockReaddirSync,
  mockStatSync,
  mockReadFileSync,
  mockJoin,
  mockExtname,
} = vi.hoisted(() => {
  return {
    mockReaddirSync: vi.fn(),
    mockStatSync: vi.fn(),
    mockReadFileSync: vi.fn(),
    mockJoin: vi.fn(),
    mockExtname: vi.fn(),
  };
});

vi.mock("fs", async () => {
  const mockFs = {
    readdirSync: mockReaddirSync,
    statSync: mockStatSync,
    readFileSync: mockReadFileSync,
  };
  return { ...mockFs, default: mockFs };
});

vi.mock("path", async () => {
  const mockPath = {
    join: mockJoin,
    extname: mockExtname,
  };
  return { ...mockPath, default: mockPath };
});

describe("scanFiles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should scan files with matching extensions", () => {
    mockReaddirSync.mockReturnValue(["file1.ts", "file2.js", "file3.ts"]);
    mockStatSync.mockImplementation(() => ({
      isDirectory: () => false,
      isFile: () => true,
    }));
    mockReadFileSync.mockReturnValue("file content");
    mockJoin.mockImplementation((...args: string[]) => args.join("/"));
    mockExtname.mockImplementation((filePath: string) => {
      if (filePath.endsWith(".ts")) return ".ts";
      if (filePath.endsWith(".js")) return ".js";
      return "";
    });

    const result = scanFiles(["/test"], [".ts"]);

    expect(result.size).toBe(2);
    expect(result.has("/test/file1.ts")).toBe(true);
    expect(result.has("/test/file3.ts")).toBe(true);
    expect(result.has("/test/file2.js")).toBe(false);
  });

  it("should handle nested directories", () => {
    mockReaddirSync
      .mockReturnValueOnce(["dir1", "file1.ts"])
      .mockReturnValueOnce(["nested.ts"]);
    mockStatSync.mockImplementation((filePath: string) => ({
      isDirectory: () => !filePath.includes("."),
      isFile: () => filePath.includes("."),
    }));
    mockReadFileSync.mockReturnValue("content");
    mockJoin.mockImplementation((...args: string[]) => args.join("/"));
    mockExtname.mockReturnValue(".ts");

    const result = scanFiles(["/test"], [".ts"]);

    expect(result.size).toBe(2);
    expect(result.has("/test/file1.ts")).toBe(true);
    expect(result.has("/test/dir1/nested.ts")).toBe(true);
  });

  it("should handle non-existent directories gracefully", () => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    expect(() => scanFiles(["/nonexistent"], [".ts"])).toThrow("ENOENT");
  });

  it("should throw an error if no entries are provided", () => {
    expect(() => scanFiles([], [".ts"])).toThrow("You must provide at least one entry path.");
  });
});
