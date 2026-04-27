declare module 'pdfkit' {
  interface PDFDocumentOptions {
    size?: string | [number, number];
    margins?: { top?: number; bottom?: number; left?: number; right?: number };
    margin?: number;
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, options?: { align?: string; width?: number; continued?: boolean }): this;
    moveDown(count?: number): this;
    fillColor(color: string): this;
    on(event: 'data', handler: (chunk: Buffer) => void): this;
    on(event: 'end', handler: () => void): this;
    end(): void;
  }

  export = PDFDocument;
}
