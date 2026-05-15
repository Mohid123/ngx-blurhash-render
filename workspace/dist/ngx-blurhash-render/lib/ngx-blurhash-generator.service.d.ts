import * as i0 from "@angular/core";
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
export declare class NgxBlurhashGeneratorService {
    readonly isBrowser: boolean;
    constructor(platformId: object);
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
    generate(src: string, options?: BlurhashGenerateOptions): Promise<string>;
    private fromCanvas;
    /**
     * Dynamic import wrapper that bypasses TypeScript's module resolution so
     * `sharp` can remain a truly optional runtime dependency with no `@types/sharp`
     * required in devDependencies.
     */
    private readonly _dynamicImport;
    private fromSharp;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxBlurhashGeneratorService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<NgxBlurhashGeneratorService>;
}
