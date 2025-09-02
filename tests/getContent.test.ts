import { describe, it, expect } from "vitest";
import { getContent } from "../src/utils";
import type { GeneratedType } from "../src/type";

describe("getContent", () => {
  it("should write comment at the beginning of the output file", () => {
    const types: GeneratedType[] = [{
      name: "Status",
      type: "union",
      members: ["active", "inactive", "pending"],
    }];
    const result = getContent(types, "This is a comment");
    expect(result).toContain(`// This is a comment

export type Status = "active" | "inactive" | "pending";`);
  });

  it("should generate union type content", () => {
    const types: GeneratedType[] = [
      {
        name: "Status",
        type: "union",
        members: ["active", "inactive", "pending"],
      },
    ];

    const result = getContent(types);
    expect(result).toContain(
      'export type Status = "active" | "inactive" | "pending"'
    );
  });

  it("should handle union type with null and undefined", () => {
    const types: GeneratedType[] = [
      {
        name: "NullableString",
        type: "union",
        members: ["hello", "world"],
        allowNull: true,
        allowUndefined: true,
      },
    ];

    const result = getContent(types);
    expect(result).toContain(
      'export type NullableString = "hello" | "world" | null | undefined'
    );
  });

  it("should remove duplicate null and undefined", () => {
    const types: GeneratedType[] = [
      {
        name: "TestType",
        type: "union",
        members: ["value", null, undefined],
        allowNull: true,
        allowUndefined: true,
      },
    ];

    const result = getContent(types);
    expect(result).toContain(
      'export type TestType = "value" | null | undefined'
    );
  });

  it("should generate interface content", () => {
    const types: GeneratedType[] = [
      {
        name: "User",
        type: "interface",
        properties: {
          id: "number",
          name: "string",
          active: "boolean",
        },
      },
    ];

    const result = getContent(types);
    expect(result).toContain(`export interface User {
  id: number;
  name: string;
  active: boolean;
}`);
  });

  it("should handle mixed types", () => {
    const types: GeneratedType[] = [
      {
        name: "Status",
        type: "union",
        members: ["active", "inactive"],
      },
      {
        name: "Config",
        type: "interface",
        properties: {
          debug: "boolean",
          port: "number",
        },
      },
    ];

    const result = getContent(types);
    expect(result).toContain(`export type Status = "active" | "inactive";

export interface Config {
  debug: boolean;
  port: number;
}`);
  });

  it("should handle empty types array", () => {
    const result = getContent([]);
    expect(result).toBe("");
  });

  it("should handle union type with numbers", () => {
    const types: GeneratedType[] = [
      {
        name: "Priority",
        type: "union",
        members: [1, 2, 3, "high", "low"],
      },
    ];

    const result = getContent(types);
    expect(result).toContain(
      'export type Priority = 1 | 2 | 3 | "high" | "low"'
    );
  });

  it("should write jsDoc", () => {
    const types: GeneratedType[] = [
      {
        name: "Priority",
        type: "union",
        members: [1, 2],
        jsDoc: `This is a jsDoc`,
      },
    ];

    const result = getContent(types);
    expect(result).toContain(`/**
 *  This is a jsDoc
 */
export type Priority = 1 | 2;`);
  });
});
