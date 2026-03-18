import { Readable } from 'stream';

// Local type definition to avoid Express namespace dependency
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  stream?: Readable;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}
