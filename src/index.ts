import fs from "fs";

import type { ExtractExternalOptions } from "./type";
import { getContent, scanFiles } from "./utils";

export default function generateExternalType({
  scanOption,
  output,
  extractor,
  comment,
}: ExtractExternalOptions) {
  const files = scanFiles(scanOption);
  const types = extractor(files);
  const content = getContent(types, comment);
  fs.writeFileSync(output, content);
}

export * from "./type";
