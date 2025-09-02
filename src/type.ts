import type { GlobOptions } from "glob";

/**
 * key is the file path, value is the file content with utf-8 encoding.
 */
export type FilesMap = Map<string, string>;

export interface GeneratedUnionType {
  type: "union";
  /**
   * members of the union.
   */
  members: (string | number | null | undefined)[];
  /**
   * If true, the union type allows null.
   */
  allowNull?: boolean;
  /**
   * If true, the union type allows undefined.
   */
  allowUndefined?: boolean;
}
export interface GeneratedInterfaceType {
  type: "interface";
  /**
   * properties of the interface and the type of the property.
   */
  properties: {
    [key: string]: "string" | "number" | "boolean" | "null" | "undefined";
  };
  /**
   * If true, all of the properties are optional.
   */
  partial?: boolean;
}

export interface GeneratedBaseType {
  /**
   * name of the type.
   */
  name: string;
  /**
   * jsDoc of the type. Don't write format of jsDoc at the beginning and the end.
   */
  jsDoc?: string;
}

export type GeneratedType = GeneratedBaseType &
  (GeneratedUnionType | GeneratedInterfaceType);

export interface ScanOption {
  pattern: string | string[];
  options?: Omit<GlobOptions, "withFileTypes">;
}

export interface ExtractExternalOptions {
  /**
   * option for scanning files. Write with glob pattern.
   * Same as the option for `globSync` of the glob package, but `withFileTypes` is not supported.
   * @see {@link https://github.com/isaacs/node-glob?tab=readme-ov-file#globsyncpattern-string--string-options-globoptions--string--path}
   */
  scanOption: ScanOption;
  /**
   * output file path.
   */
  output: string;
  /**
   * extract type from files.
   */
  extractor: (files: FilesMap) => GeneratedType[];
  /**
   * comment to write at the beginning of the output file.
   */
  comment?: string;
}
