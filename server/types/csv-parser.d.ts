declare module 'csv-parser' {
  import { Transform } from 'stream';
  
  interface Options {
    separator?: string;
    quote?: string;
    escape?: string;
    newline?: string;
    headers?: string[] | boolean;
    skipEmptyLines?: boolean;
    skipLinesWithError?: boolean;
    maxRowBytes?: number;
    strict?: boolean;
  }
  
  function csvParser(options?: Options): Transform;
  
  export = csvParser;
}