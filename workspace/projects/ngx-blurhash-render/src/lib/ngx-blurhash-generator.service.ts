import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { encode } from 'blurhash';

/** Options for `NgxBlurhashGeneratorService.generate()`. */
export interface BlurhashGenerateOptions {
  /**
   * Number of horizontal components (1–9).
   * Higher values encode more horizontal detail at the cost of a longer hash string.
   * @default 4
   */
  componentX?: number;

  /**
   * Number of vertical components (1–9).
   * Higher values encode more vertical detail at the cost of a longer hash string.
   * @default 3
   */
  componentY?: number;

  /**
   * Width (and height) in pixels to which the image is resampled internally
   * before encoding. Larger values improve accuracy but are slower.
   * @default 64
   */
  sampleSize?: number;
}

/**
 * Injectable service that generates a blurhash string from an image URL or
 * local file path.
 *
 * - **Browser** — loads the image via a hidden `<img>` element, draws it
 *   onto an off-screen `<canvas>`, reads the pixel data, and encodes it.
 *   The source server must send appropriate CORS headers for cross-origin URLs.
 *
 * - **Server (Angular SSR / Node.js)** — fetches and decodes the image via
 *   [`sharp`](https://sharp.pixelplumbing.com/), which must be installed as
 *   an optional dependency:
 *   ```bash
 *   npm install sharp
 *   ```
 *
 * @example
 * ```typescript
 * export class MyComponent {
 *   hash = '';
 *
 *   constructor(private generator: NgxBlurhashGeneratorService) {}
 *
 *   async loadImage(url: string): Promise<void> {
 *     this.hash = await this.generator.generate(url);
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class NgxBlurhashGeneratorService {

  readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Generate a blurhash string from an image URL or local file path.
   *
   * @param src      Absolute URL (`https://…`) or local file path for server-side use.
   * @param options  Optional encoding parameters.
   * @returns        A Promise that resolves to the blurhash string.
   *
   * @throws When the image cannot be loaded or CORS blocks canvas access (browser).
   * @throws When `sharp` is not installed (server).
   */
  async generate(src: string, options: BlurhashGenerateOptions = {}): Promise<string> {
    const cx = Math.min(9, Math.max(1, options.componentX ?? 4));
    const cy = Math.min(9, Math.max(1, options.componentY ?? 3));
    const size = options.sampleSize ?? 64;

    return this.isBrowser
      ? this.fromCanvas(src, cx, cy, size)
      : this.fromSharp(src, cx, cy, size);
  }

  // ── Browser ───────────────────────────────────────────────────────────────

  private fromCanvas(src: string, cx: number, cy: number, size: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onerror = () =>
        reject(new Error(
          `[ngx-blurhash-render] Could not load image: "${src}". ` +
          `Ensure the server allows cross-origin requests (CORS).`,
        ));

      img.onload = () => {
        // Preserve aspect ratio so pixels aren't distorted before encoding.
        const ratio = img.naturalWidth / img.naturalHeight;
        const w = ratio >= 1 ? size : Math.round(size * ratio);
        const h = ratio >= 1 ? Math.round(size / ratio) : size;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('[ngx-blurhash-render] Could not acquire a 2D canvas context.'));
        }

        ctx.drawImage(img, 0, 0, w, h);

        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, w, h);
        } catch {
          return reject(new Error(
            `[ngx-blurhash-render] Canvas is tainted by cross-origin data. ` +
            `The image server must send "Access-Control-Allow-Origin: *" headers.`,
          ));
        }

        resolve(encode(imageData.data, w, h, cx, cy));
      };

      img.src = src;
    });
  }

  // ── Server (Node.js / Angular SSR) ────────────────────────────────────────

  /**
   * Dynamic import wrapper that bypasses TypeScript's module resolution so
   * `sharp` can remain a truly optional runtime dependency with no `@types/sharp`
   * required in devDependencies.
   */
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  private readonly _dynamicImport = new Function('id', 'return import(id)') as
    (id: string) => Promise<any>;

  private async fromSharp(src: string, cx: number, cy: number, size: number): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sharp: any;
    try {
      const mod = await this._dynamicImport('sharp');
      sharp = mod.default ?? mod;
    } catch {
      throw new Error(
        '[ngx-blurhash-render] Server-side generation requires "sharp". ' +
        'Install it with: npm install sharp',
      );
    }

    // sharp accepts file paths natively; for remote URLs we fetch first.
    let input: string | Buffer = src;
    if (src.startsWith('http://') || src.startsWith('https://')) {
      const res = await fetch(src);
      if (!res.ok) {
        throw new Error(`[ngx-blurhash-render] Failed to fetch image (${res.status}): ${src}`);
      }
      input = Buffer.from(await res.arrayBuffer());
    }

    const { data, info } = await sharp(input)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data.buffer), info.width, info.height, cx, cy);
  }
}
