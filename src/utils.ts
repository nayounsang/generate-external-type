
import type { GeneratedType, ScanOption } from "./type";
import { globSync } from "glob";
import fs from "fs";

export function scanFiles(scanOption: ScanOption) {
  const fileMap = new Map<string, string>();
  const files = globSync(scanOption.pattern, scanOption.options ?? {});
  files.forEach((file) => {
    fileMap.set(file, fs.readFileSync(file, "utf-8"));
  });
  return fileMap;
}

export function getTypeContent(types: GeneratedType[]) {
  let content = "";
  types.forEach((type) => {
    if (type.type === "union") {
      const membersSet = new Set<string>();

      type.members.forEach((member) => {
        if (member === null) {
          membersSet.add("null");
        } else if (member === undefined) {
          membersSet.add("undefined");
        } else if (typeof member === "string") {
          membersSet.add(`"${member}"`);
        } else {
          membersSet.add(member.toString());
        }
      });

      if (type.allowNull) {
        membersSet.add("null");
      }
      if (type.allowUndefined) {
        membersSet.add("undefined");
      }

      const members = Array.from(membersSet);
      content += `export type ${type.name} = ${members.join(" | ")};\n`;
    } else if (type.type === "interface") {
      content += `export interface ${type.name} {\n`;
      Object.entries(type.properties).forEach(([key, value]) => {
        content += `  ${key}: ${value};\n`;
      });
      content += "}\n";
    }
    content += "\n";
  });
  return content;
}