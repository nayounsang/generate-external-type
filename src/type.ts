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
  name: string;
}

export type GeneratedType = GeneratedBaseType &
  (GeneratedUnionType | GeneratedInterfaceType);

export interface ExtractExternalOptions {
  /**
   * entry points for scanning.
   */
  entries: string[];
  /**
   * file extensions to scan.
   */
  extensions: string[];
  /**
   * output file path.
   */
  output: string;
  /**
   * extract type from files.
   */
  extractor: (files: FilesMap) => GeneratedType[];
}
