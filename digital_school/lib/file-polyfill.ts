// File polyfill for Node.js server environment
// This solves the "File is not defined" error with Appwrite SDK

if (typeof File === 'undefined') {
  // Create a minimal File polyfill
  global.File = class File {
    public name: string;
    public size: number;
    public type: string;
    public lastModified: number;
    public arrayBuffer: () => Promise<ArrayBuffer>;
    public stream: () => any;
    public text: () => Promise<string>;
    public slice: (start?: number, end?: number, contentType?: string) => File;

    constructor(
      bits: ArrayBuffer | ArrayBufferView | Blob | string | Array<string>,
      name: string,
      options?: { type?: string; lastModified?: number }
    ) {
      this.name = name;
      this.type = options?.type || 'application/octet-stream';
      this.lastModified = options?.lastModified || Date.now();
      
      // Handle different input types
      if (typeof bits === 'string') {
        this.size = new TextEncoder().encode(bits).length;
        this.arrayBuffer = async () => new TextEncoder().encode(bits).buffer;
      } else if (bits instanceof ArrayBuffer) {
        this.size = bits.byteLength;
        this.arrayBuffer = async () => bits;
      } else if (ArrayBuffer.isView(bits)) {
        this.size = bits.byteLength;
        this.arrayBuffer = async () => bits.buffer.slice(bits.byteOffset, bits.byteOffset + bits.byteLength);
      } else if (Array.isArray(bits)) {
        const combined = bits.join('');
        this.size = new TextEncoder().encode(combined).length;
        this.arrayBuffer = async () => new TextEncoder().encode(combined).buffer;
      } else {
        this.size = 0;
        this.arrayBuffer = async () => new ArrayBuffer(0);
      }

      // Implement other required methods
      this.stream = () => {
        throw new Error('Stream not implemented in polyfill');
      };

      this.text = async () => {
        const buffer = await this.arrayBuffer();
        return new TextDecoder().decode(buffer);
      };

      this.slice = (start = 0, end = this.size, contentType = this.type) => {
        return new File([this], this.name, { type: contentType, lastModified: this.lastModified });
      };
    }
  } as any;

  // Also polyfill FileReader if needed
  if (typeof FileReader === 'undefined') {
    global.FileReader = class FileReader {
      public readyState: number = 0;
      public result: any = null;
      public error: any = null;
      public onload: ((this: FileReader, ev: any) => any) | null = null;
      public onerror: ((this: FileReader, ev: any) => any) | null = null;
      public onloadend: ((this: FileReader, ev: any) => any) | null = null;

      readAsArrayBuffer(blob: any) {
        this.readyState = 1;
        if (blob.arrayBuffer) {
          blob.arrayBuffer().then((buffer: ArrayBuffer) => {
            this.result = buffer;
            this.readyState = 2;
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
          });
        }
      }

      readAsText(blob: any) {
        this.readyState = 1;
        if (blob.text) {
          blob.text().then((text: string) => {
            this.result = text;
            this.readyState = 2;
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
          });
        }
      }
    } as any;
  }
}

export {}; 