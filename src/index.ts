import fs from "fs";

import { ExtractExternalOptions } from "./type";
import { getTypeContent, scanFiles } from "./utils";



export default function generateExternalType({
  entries,
  extensions,
  output,
  extractor,
}: ExtractExternalOptions) {
  const files = scanFiles(entries, extensions);
  const types = extractor(files);
  const content = getTypeContent(types);
  fs.writeFileSync(output, content);
}
