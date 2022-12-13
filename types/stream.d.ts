// interface ReadableStream<T = string | Buffer> extends NodeJS.EventEmitter {
//   readable: boolean;
//   read(size?: number): string | Buffer;
//   setEncoding(encoding: BufferEncoding): this;
//   pause(): this;
//   resume(): this;
//   isPaused(): boolean;
//   pipe<T extends WritableStream>(destination: T, options?: { end?: boolean | undefined; }): T;
//   unpipe(destination?: WritableStream): this;
//   unshift(chunk: string | Uint8Array, encoding?: BufferEncoding): void;
//   wrap(oldStream: ReadableStream): this;
//   [Symbol.asyncIterator](): AsyncIterableIterator<T>;
// }

// interface WritableStream extends NodeJS.EventEmitter {
//   writable: boolean;
//   write(buffer: Uint8Array | string, cb?: (err?: Error | null) => void): boolean;
//   write(str: string, encoding?: BufferEncoding, cb?: (err?: Error | null) => void): boolean;
//   end(cb?: () => void): void;
//   end(data: string | Uint8Array, cb?: () => void): void;
//   end(str: string, encoding?: BufferEncoding, cb?: () => void): void;
// }

type ArrElm<T> = T extends (infer E)[] ? E : T;


type ReadWriteStream<T = string | Buffer> =
Omit<NodeJS.ReadableStream, typeof Symbol.asyncIterator>
& NodeJS.WritableStream
& {[Symbol.asyncIterator](): AsyncIterableIterator<ArrElm<T>>}

