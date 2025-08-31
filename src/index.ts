import fs from "fs";

import type { ExtractExternalOptions } from "./type";
import { getTypeContent, scanFiles } from "./utils";

export default function generateExternalType({
  scanOption,
  output,
  extractor,
}: ExtractExternalOptions) {
  const files = scanFiles(scanOption);
  const types = extractor(files);
  const content = getTypeContent(types);
  fs.writeFileSync(output, content);
}

export * from "./type";
