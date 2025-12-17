declare module "pdf-parse" {
  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: Record<string, any>;
    metadata: any;
    version: string;
  }

  interface PDFData {
    text: string;
    info: PDFInfo;
  }

  function pdf(dataBuffer: Buffer | Uint8Array | ArrayBuffer): Promise<PDFData>;
  export = pdf;
}
