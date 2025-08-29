import fs from "fs";
import path from "path";

import { GeneratedType } from "./type";

export function scanFiles(entries: string[], extensions: string[]) {
  const fileMap = new Map<string, string>();
  function walkDir(dir: string) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        walkDir(itemPath);
      } else if (stats.isFile()) {
        const ext = path.extname(itemPath);
        if (extensions.includes(ext)) {
          fileMap.set(itemPath, fs.readFileSync(itemPath, "utf-8"));
        }
      }
    }
  }
  for (const entry of entries) {
    walkDir(entry);
  }
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
  });
  return content;
}
