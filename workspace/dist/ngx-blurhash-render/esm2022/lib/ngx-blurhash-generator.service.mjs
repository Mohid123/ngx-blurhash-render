import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { encode } from 'blurhash';
import * as i0 from "@angular/core";
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
export class NgxBlurhashGeneratorService {
    isBrowser;
    constructor(platformId) {
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
    async generate(src, options = {}) {
        const cx = Math.min(9, Math.max(1, options.componentX ?? 4));
        const cy = Math.min(9, Math.max(1, options.componentY ?? 3));
        const size = options.sampleSize ?? 64;
        return this.isBrowser
            ? this.fromCanvas(src, cx, cy, size)
            : this.fromSharp(src, cx, cy, size);
    }
    // ── Browser ───────────────────────────────────────────────────────────────
    fromCanvas(src, cx, cy, size) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onerror = () => reject(new Error(`[ngx-blurhash-render] Could not load image: "${src}". ` +
                `Ensure the server allows cross-origin requests (CORS).`));
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
                let imageData;
                try {
                    imageData = ctx.getImageData(0, 0, w, h);
                }
                catch {
                    return reject(new Error(`[ngx-blurhash-render] Canvas is tainted by cross-origin data. ` +
                        `The image server must send "Access-Control-Allow-Origin: *" headers.`));
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
    _dynamicImport = new Function('id', 'return import(id)');
    async fromSharp(src, cx, cy, size) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sharp;
        try {
            const mod = await this._dynamicImport('sharp');
            sharp = mod.default ?? mod;
        }
        catch {
            throw new Error('[ngx-blurhash-render] Server-side generation requires "sharp". ' +
                'Install it with: npm install sharp');
        }
        // sharp accepts file paths natively; for remote URLs we fetch first.
        let input = src;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgxBlurhashGeneratorService, deps: [{ token: PLATFORM_ID }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgxBlurhashGeneratorService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgxBlurhashGeneratorService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWJsdXJoYXNoLWdlbmVyYXRvci5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWJsdXJoYXNoLXJlbmRlci9zcmMvbGliL25neC1ibHVyaGFzaC1nZW5lcmF0b3Iuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDcEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQzs7QUEwQmxDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EyQkc7QUFFSCxNQUFNLE9BQU8sMkJBQTJCO0lBRTdCLFNBQVMsQ0FBVTtJQUU1QixZQUFpQyxVQUFrQjtRQUNqRCxJQUFJLENBQUMsU0FBUyxHQUFHLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQVcsRUFBRSxVQUFtQyxFQUFFO1FBQy9ELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0QsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUM7UUFFdEMsT0FBTyxJQUFJLENBQUMsU0FBUztZQUNuQixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUM7WUFDcEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELDZFQUE2RTtJQUVyRSxVQUFVLENBQUMsR0FBVyxFQUFFLEVBQVUsRUFBRSxFQUFVLEVBQUUsSUFBWTtRQUNsRSxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7WUFDeEIsR0FBRyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7WUFFOUIsR0FBRyxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FDakIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUNkLGdEQUFnRCxHQUFHLEtBQUs7Z0JBQ3hELHdEQUF3RCxDQUN6RCxDQUFDLENBQUM7WUFFTCxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRTtnQkFDaEIsb0VBQW9FO2dCQUNwRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBRXZELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNqQixNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFFbEIsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNULE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUMsQ0FBQztnQkFDM0YsQ0FBQztnQkFFRCxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFL0IsSUFBSSxTQUFvQixDQUFDO2dCQUN6QixJQUFJLENBQUM7b0JBQ0gsU0FBUyxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLENBQUM7Z0JBQUMsTUFBTSxDQUFDO29CQUNQLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxDQUNyQixnRUFBZ0U7d0JBQ2hFLHNFQUFzRSxDQUN2RSxDQUFDLENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRCxDQUFDLENBQUM7WUFFRixHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCw2RUFBNkU7SUFFN0U7Ozs7T0FJRztJQUNILDhEQUE4RDtJQUM3QyxjQUFjLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUMxQyxDQUFDO0lBRXZCLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBVyxFQUFFLEVBQVUsRUFBRSxFQUFVLEVBQUUsSUFBWTtRQUN2RSw4REFBOEQ7UUFDOUQsSUFBSSxLQUFVLENBQUM7UUFDZixJQUFJLENBQUM7WUFDSCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0MsS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDO1FBQzdCLENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCxNQUFNLElBQUksS0FBSyxDQUNiLGlFQUFpRTtnQkFDakUsb0NBQW9DLENBQ3JDLENBQUM7UUFDSixDQUFDO1FBRUQscUVBQXFFO1FBQ3JFLElBQUksS0FBSyxHQUFvQixHQUFHLENBQUM7UUFDakMsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUM1RCxNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELEdBQUcsQ0FBQyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN6RixDQUFDO1lBQ0QsS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUM7YUFDdEMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDO2FBQy9ELFdBQVcsRUFBRTthQUNiLEdBQUcsRUFBRTthQUNMLFFBQVEsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFekMsT0FBTyxNQUFNLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNyRixDQUFDO3dHQXBIVSwyQkFBMkIsa0JBSWxCLFdBQVc7NEdBSnBCLDJCQUEyQixjQURkLE1BQU07OzRGQUNuQiwyQkFBMkI7a0JBRHZDLFVBQVU7bUJBQUMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFOzswQkFLbkIsTUFBTTsyQkFBQyxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlLCBQTEFURk9STV9JRCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgaXNQbGF0Zm9ybUJyb3dzZXIgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgZW5jb2RlIH0gZnJvbSAnYmx1cmhhc2gnO1xuXG4vKiogT3B0aW9ucyBmb3IgYE5neEJsdXJoYXNoR2VuZXJhdG9yU2VydmljZS5nZW5lcmF0ZSgpYC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmx1cmhhc2hHZW5lcmF0ZU9wdGlvbnMge1xuICAvKipcbiAgICogTnVtYmVyIG9mIGhvcml6b250YWwgY29tcG9uZW50cyAoMeKAkzkpLlxuICAgKiBIaWdoZXIgdmFsdWVzIGVuY29kZSBtb3JlIGhvcml6b250YWwgZGV0YWlsIGF0IHRoZSBjb3N0IG9mIGEgbG9uZ2VyIGhhc2ggc3RyaW5nLlxuICAgKiBAZGVmYXVsdCA0XG4gICAqL1xuICBjb21wb25lbnRYPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgdmVydGljYWwgY29tcG9uZW50cyAoMeKAkzkpLlxuICAgKiBIaWdoZXIgdmFsdWVzIGVuY29kZSBtb3JlIHZlcnRpY2FsIGRldGFpbCBhdCB0aGUgY29zdCBvZiBhIGxvbmdlciBoYXNoIHN0cmluZy5cbiAgICogQGRlZmF1bHQgM1xuICAgKi9cbiAgY29tcG9uZW50WT86IG51bWJlcjtcblxuICAvKipcbiAgICogV2lkdGggKGFuZCBoZWlnaHQpIGluIHBpeGVscyB0byB3aGljaCB0aGUgaW1hZ2UgaXMgcmVzYW1wbGVkIGludGVybmFsbHlcbiAgICogYmVmb3JlIGVuY29kaW5nLiBMYXJnZXIgdmFsdWVzIGltcHJvdmUgYWNjdXJhY3kgYnV0IGFyZSBzbG93ZXIuXG4gICAqIEBkZWZhdWx0IDY0XG4gICAqL1xuICBzYW1wbGVTaXplPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIEluamVjdGFibGUgc2VydmljZSB0aGF0IGdlbmVyYXRlcyBhIGJsdXJoYXNoIHN0cmluZyBmcm9tIGFuIGltYWdlIFVSTCBvclxuICogbG9jYWwgZmlsZSBwYXRoLlxuICpcbiAqIC0gKipCcm93c2VyKiog4oCUIGxvYWRzIHRoZSBpbWFnZSB2aWEgYSBoaWRkZW4gYDxpbWc+YCBlbGVtZW50LCBkcmF3cyBpdFxuICogICBvbnRvIGFuIG9mZi1zY3JlZW4gYDxjYW52YXM+YCwgcmVhZHMgdGhlIHBpeGVsIGRhdGEsIGFuZCBlbmNvZGVzIGl0LlxuICogICBUaGUgc291cmNlIHNlcnZlciBtdXN0IHNlbmQgYXBwcm9wcmlhdGUgQ09SUyBoZWFkZXJzIGZvciBjcm9zcy1vcmlnaW4gVVJMcy5cbiAqXG4gKiAtICoqU2VydmVyIChBbmd1bGFyIFNTUiAvIE5vZGUuanMpKiog4oCUIGZldGNoZXMgYW5kIGRlY29kZXMgdGhlIGltYWdlIHZpYVxuICogICBbYHNoYXJwYF0oaHR0cHM6Ly9zaGFycC5waXhlbHBsdW1iaW5nLmNvbS8pLCB3aGljaCBtdXN0IGJlIGluc3RhbGxlZCBhc1xuICogICBhbiBvcHRpb25hbCBkZXBlbmRlbmN5OlxuICogICBgYGBiYXNoXG4gKiAgIG5wbSBpbnN0YWxsIHNoYXJwXG4gKiAgIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBleHBvcnQgY2xhc3MgTXlDb21wb25lbnQge1xuICogICBoYXNoID0gJyc7XG4gKlxuICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIGdlbmVyYXRvcjogTmd4Qmx1cmhhc2hHZW5lcmF0b3JTZXJ2aWNlKSB7fVxuICpcbiAqICAgYXN5bmMgbG9hZEltYWdlKHVybDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gKiAgICAgdGhpcy5oYXNoID0gYXdhaXQgdGhpcy5nZW5lcmF0b3IuZ2VuZXJhdGUodXJsKTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKi9cbkBJbmplY3RhYmxlKHsgcHJvdmlkZWRJbjogJ3Jvb3QnIH0pXG5leHBvcnQgY2xhc3MgTmd4Qmx1cmhhc2hHZW5lcmF0b3JTZXJ2aWNlIHtcblxuICByZWFkb25seSBpc0Jyb3dzZXI6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChQTEFURk9STV9JRCkgcGxhdGZvcm1JZDogb2JqZWN0KSB7XG4gICAgdGhpcy5pc0Jyb3dzZXIgPSBpc1BsYXRmb3JtQnJvd3NlcihwbGF0Zm9ybUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIGJsdXJoYXNoIHN0cmluZyBmcm9tIGFuIGltYWdlIFVSTCBvciBsb2NhbCBmaWxlIHBhdGguXG4gICAqXG4gICAqIEBwYXJhbSBzcmMgICAgICBBYnNvbHV0ZSBVUkwgKGBodHRwczovL+KApmApIG9yIGxvY2FsIGZpbGUgcGF0aCBmb3Igc2VydmVyLXNpZGUgdXNlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAgT3B0aW9uYWwgZW5jb2RpbmcgcGFyYW1ldGVycy5cbiAgICogQHJldHVybnMgICAgICAgIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBibHVyaGFzaCBzdHJpbmcuXG4gICAqXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgaW1hZ2UgY2Fubm90IGJlIGxvYWRlZCBvciBDT1JTIGJsb2NrcyBjYW52YXMgYWNjZXNzIChicm93c2VyKS5cbiAgICogQHRocm93cyBXaGVuIGBzaGFycGAgaXMgbm90IGluc3RhbGxlZCAoc2VydmVyKS5cbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlKHNyYzogc3RyaW5nLCBvcHRpb25zOiBCbHVyaGFzaEdlbmVyYXRlT3B0aW9ucyA9IHt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjeCA9IE1hdGgubWluKDksIE1hdGgubWF4KDEsIG9wdGlvbnMuY29tcG9uZW50WCA/PyA0KSk7XG4gICAgY29uc3QgY3kgPSBNYXRoLm1pbig5LCBNYXRoLm1heCgxLCBvcHRpb25zLmNvbXBvbmVudFkgPz8gMykpO1xuICAgIGNvbnN0IHNpemUgPSBvcHRpb25zLnNhbXBsZVNpemUgPz8gNjQ7XG5cbiAgICByZXR1cm4gdGhpcy5pc0Jyb3dzZXJcbiAgICAgID8gdGhpcy5mcm9tQ2FudmFzKHNyYywgY3gsIGN5LCBzaXplKVxuICAgICAgOiB0aGlzLmZyb21TaGFycChzcmMsIGN4LCBjeSwgc2l6ZSk7XG4gIH1cblxuICAvLyDilIDilIAgQnJvd3NlciDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBwcml2YXRlIGZyb21DYW52YXMoc3JjOiBzdHJpbmcsIGN4OiBudW1iZXIsIGN5OiBudW1iZXIsIHNpemU6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1nLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG5cbiAgICAgIGltZy5vbmVycm9yID0gKCkgPT5cbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICBgW25neC1ibHVyaGFzaC1yZW5kZXJdIENvdWxkIG5vdCBsb2FkIGltYWdlOiBcIiR7c3JjfVwiLiBgICtcbiAgICAgICAgICBgRW5zdXJlIHRoZSBzZXJ2ZXIgYWxsb3dzIGNyb3NzLW9yaWdpbiByZXF1ZXN0cyAoQ09SUykuYCxcbiAgICAgICAgKSk7XG5cbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIC8vIFByZXNlcnZlIGFzcGVjdCByYXRpbyBzbyBwaXhlbHMgYXJlbid0IGRpc3RvcnRlZCBiZWZvcmUgZW5jb2RpbmcuXG4gICAgICAgIGNvbnN0IHJhdGlvID0gaW1nLm5hdHVyYWxXaWR0aCAvIGltZy5uYXR1cmFsSGVpZ2h0O1xuICAgICAgICBjb25zdCB3ID0gcmF0aW8gPj0gMSA/IHNpemUgOiBNYXRoLnJvdW5kKHNpemUgKiByYXRpbyk7XG4gICAgICAgIGNvbnN0IGggPSByYXRpbyA+PSAxID8gTWF0aC5yb3VuZChzaXplIC8gcmF0aW8pIDogc2l6ZTtcblxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY2FudmFzLndpZHRoID0gdztcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGg7XG5cbiAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGlmICghY3R4KSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1tuZ3gtYmx1cmhhc2gtcmVuZGVyXSBDb3VsZCBub3QgYWNxdWlyZSBhIDJEIGNhbnZhcyBjb250ZXh0LicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCB3LCBoKTtcblxuICAgICAgICBsZXQgaW1hZ2VEYXRhOiBJbWFnZURhdGE7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaW1hZ2VEYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCB3LCBoKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICBgW25neC1ibHVyaGFzaC1yZW5kZXJdIENhbnZhcyBpcyB0YWludGVkIGJ5IGNyb3NzLW9yaWdpbiBkYXRhLiBgICtcbiAgICAgICAgICAgIGBUaGUgaW1hZ2Ugc2VydmVyIG11c3Qgc2VuZCBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbjogKlwiIGhlYWRlcnMuYCxcbiAgICAgICAgICApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmUoZW5jb2RlKGltYWdlRGF0YS5kYXRhLCB3LCBoLCBjeCwgY3kpKTtcbiAgICAgIH07XG5cbiAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgfSk7XG4gIH1cblxuICAvLyDilIDilIAgU2VydmVyIChOb2RlLmpzIC8gQW5ndWxhciBTU1IpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIC8qKlxuICAgKiBEeW5hbWljIGltcG9ydCB3cmFwcGVyIHRoYXQgYnlwYXNzZXMgVHlwZVNjcmlwdCdzIG1vZHVsZSByZXNvbHV0aW9uIHNvXG4gICAqIGBzaGFycGAgY2FuIHJlbWFpbiBhIHRydWx5IG9wdGlvbmFsIHJ1bnRpbWUgZGVwZW5kZW5jeSB3aXRoIG5vIGBAdHlwZXMvc2hhcnBgXG4gICAqIHJlcXVpcmVkIGluIGRldkRlcGVuZGVuY2llcy5cbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8taW1wbGllZC1ldmFsXG4gIHByaXZhdGUgcmVhZG9ubHkgX2R5bmFtaWNJbXBvcnQgPSBuZXcgRnVuY3Rpb24oJ2lkJywgJ3JldHVybiBpbXBvcnQoaWQpJykgYXNcbiAgICAoaWQ6IHN0cmluZykgPT4gUHJvbWlzZTxhbnk+O1xuXG4gIHByaXZhdGUgYXN5bmMgZnJvbVNoYXJwKHNyYzogc3RyaW5nLCBjeDogbnVtYmVyLCBjeTogbnVtYmVyLCBzaXplOiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgbGV0IHNoYXJwOiBhbnk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1vZCA9IGF3YWl0IHRoaXMuX2R5bmFtaWNJbXBvcnQoJ3NoYXJwJyk7XG4gICAgICBzaGFycCA9IG1vZC5kZWZhdWx0ID8/IG1vZDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1tuZ3gtYmx1cmhhc2gtcmVuZGVyXSBTZXJ2ZXItc2lkZSBnZW5lcmF0aW9uIHJlcXVpcmVzIFwic2hhcnBcIi4gJyArXG4gICAgICAgICdJbnN0YWxsIGl0IHdpdGg6IG5wbSBpbnN0YWxsIHNoYXJwJyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gc2hhcnAgYWNjZXB0cyBmaWxlIHBhdGhzIG5hdGl2ZWx5OyBmb3IgcmVtb3RlIFVSTHMgd2UgZmV0Y2ggZmlyc3QuXG4gICAgbGV0IGlucHV0OiBzdHJpbmcgfCBCdWZmZXIgPSBzcmM7XG4gICAgaWYgKHNyYy5zdGFydHNXaXRoKCdodHRwOi8vJykgfHwgc3JjLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHNyYyk7XG4gICAgICBpZiAoIXJlcy5vaykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFtuZ3gtYmx1cmhhc2gtcmVuZGVyXSBGYWlsZWQgdG8gZmV0Y2ggaW1hZ2UgKCR7cmVzLnN0YXR1c30pOiAke3NyY31gKTtcbiAgICAgIH1cbiAgICAgIGlucHV0ID0gQnVmZmVyLmZyb20oYXdhaXQgcmVzLmFycmF5QnVmZmVyKCkpO1xuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgaW5mbyB9ID0gYXdhaXQgc2hhcnAoaW5wdXQpXG4gICAgICAucmVzaXplKHNpemUsIHNpemUsIHsgZml0OiAnaW5zaWRlJywgd2l0aG91dEVubGFyZ2VtZW50OiB0cnVlIH0pXG4gICAgICAuZW5zdXJlQWxwaGEoKVxuICAgICAgLnJhdygpXG4gICAgICAudG9CdWZmZXIoeyByZXNvbHZlV2l0aE9iamVjdDogdHJ1ZSB9KTtcblxuICAgIHJldHVybiBlbmNvZGUobmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGRhdGEuYnVmZmVyKSwgaW5mby53aWR0aCwgaW5mby5oZWlnaHQsIGN4LCBjeSk7XG4gIH1cbn1cbiJdfQ==