import { Component, EventEmitter, Inject, Input, Output, PLATFORM_ID, ViewChild, } from '@angular/core';
import { NgIf, isPlatformBrowser } from '@angular/common';
import { decode } from 'blurhash';
import * as i0 from "@angular/core";
/**
 * Renders a blurhash placeholder canvas that smoothly transitions to the
 * real image once it has loaded.
 *
 * The host element becomes the sized container; `width`, `height`, and
 * `borderRadius` are applied directly to it so a single element controls
 * the layout footprint.
 *
 * @example
 * ```html
 * <ngx-blurhash-render
 *   [blurHash]="'L6Pj0^jE.AyE_3t7t7R**0o#DgR4'"
 *   [imageSrc]="'/assets/photo.jpg'"
 *   [alt]="'A scenic mountain landscape'"
 *   [width]="'400px'"
 *   [height]="'300px'"
 *   [borderRadius]="'12px'"
 *   [transitionType]="'blur'"
 *   [priority]="true"
 *   (loaded)="onImageLoaded()"
 *   (loadError)="onImageError($event)"
 * />
 * ```
 */
export class NgxBlurhashComponent {
    hostEl;
    // ── Inputs ──────────────────────────────────────────────────────────────────
    /** The blurhash string to decode and render as a canvas placeholder. */
    blurHash;
    /** URL or asset path of the full-quality image to reveal after loading. */
    imageSrc;
    /**
     * Accessible description forwarded to the underlying `<img>` `alt` attribute.
     * Provide a meaningful value for every image; omit only for purely decorative images.
     */
    alt = '';
    /** CSS width applied to the host element (e.g. `'300px'`, `'100%'`). @default '200px' */
    width = '200px';
    /** CSS height applied to the host element (e.g. `'200px'`, `'50vh'`). @default '200px' */
    height = '200px';
    /** CSS `border-radius` applied to the host element. @default '0' */
    borderRadius = '0';
    /**
     * Native `<img>` loading strategy.
     * Use `'lazy'` for below-the-fold images. Ignored when `priority` is `true`.
     * @default 'eager'
     */
    loading = 'eager';
    /**
     * Mark this image as a high-priority Largest Contentful Paint candidate.
     * Sets `fetchpriority="high"` on the image element, signalling the browser
     * to fetch it as soon as possible.
     * @default false
     */
    priority = false;
    /**
     * URL displayed when `imageSrc` fails to load.
     * When omitted, the `[blurhashError]` content-projection slot is rendered instead.
     */
    fallbackSrc = '';
    /**
     * Duration of the image reveal animation — any valid CSS time value
     * (e.g. `'400ms'`, `'0.5s'`).
     * @default '400ms'
     */
    transitionDuration = '400ms';
    /**
     * CSS easing function for the reveal animation (e.g. `'ease-in'`, `'cubic-bezier(0.4,0,0.2,1)'`).
     * @default 'ease-in'
     */
    transitionEasing = 'ease-in';
    /**
     * Visual style of the image reveal transition.
     * - `'fade'`  – simple cross-fade from placeholder to image.
     * - `'blur'`  – image materialises through a decreasing blur and saturation effect.
     * - `'scale'` – image fades in with a subtle zoom-out motion.
     * @default 'fade'
     */
    transitionType = 'fade';
    /**
     * Internal resolution (in pixels) at which the blurhash is decoded onto the canvas.
     * The canvas is always CSS-stretched to fill the host, so this only affects placeholder
     * gradient smoothness. Lower values decode faster; higher values are finer-grained.
     * @default 32
     */
    canvasResolution = 32;
    /**
     * When `true`, defers the blurhash decode until the component enters the viewport,
     * using `IntersectionObserver` with a `200px` root margin.
     * Falls back to immediate decode in environments without `IntersectionObserver`.
     * @default false
     */
    lazyDecode = false;
    // ── Outputs ─────────────────────────────────────────────────────────────────
    /** Emitted once the image has successfully loaded. */
    loaded = new EventEmitter();
    /** Emitted when the image fails to load, carrying the original DOM `Event`. */
    loadError = new EventEmitter();
    /** Emitted when the CSS reveal animation completes. */
    transitionEnd = new EventEmitter();
    // ── Internal state ───────────────────────────────────────────────────────────
    isLoaded = false;
    hasError = false;
    canvasRef;
    imgRef;
    isBrowser;
    intersectionObserver = null;
    hasIntersected = false;
    constructor(platformId, hostEl) {
        this.hostEl = hostEl;
        this.isBrowser = isPlatformBrowser(platformId);
    }
    // ── Lifecycle ────────────────────────────────────────────────────────────────
    ngOnChanges(changes) {
        if (changes['imageSrc'] && !changes['imageSrc'].firstChange) {
            this.isLoaded = false;
            this.hasError = false;
        }
        // Re-render the canvas when the hash or resolution changes, but only after
        // ngAfterViewInit has run (canvasRef available) and, for lazy mode, only
        // after the element has entered the viewport.
        if ((changes['blurHash'] || changes['canvasResolution']) && this.canvasRef) {
            if (!this.lazyDecode || this.hasIntersected) {
                this.renderCanvas();
            }
        }
    }
    ngAfterViewInit() {
        if (!this.isBrowser)
            return;
        if (this.lazyDecode) {
            this.setupIntersectionObserver();
        }
        else {
            this.hasIntersected = true;
            this.renderCanvas();
        }
        // Browsers fire `load` before Angular attaches event bindings for cached images.
        // Defer to the next microtask to avoid ExpressionChangedAfterItHasBeenCheckedError.
        const img = this.imgRef?.nativeElement;
        if (img?.complete && img.naturalWidth > 0) {
            Promise.resolve().then(() => this.onLoad());
        }
    }
    ngOnDestroy() {
        this.intersectionObserver?.disconnect();
    }
    // ── Event handlers ───────────────────────────────────────────────────────────
    onLoad() {
        this.isLoaded = true;
        this.loaded.emit();
    }
    onError(event) {
        this.hasError = true;
        this.loadError.emit(event);
    }
    onTransitionEnd() {
        this.transitionEnd.emit();
    }
    // ── Private helpers ──────────────────────────────────────────────────────────
    renderCanvas() {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas || !this.blurHash)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const res = this.canvasResolution;
        const pixels = decode(this.blurHash, res, res);
        const imageData = ctx.createImageData(res, res);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
    }
    setupIntersectionObserver() {
        if (typeof IntersectionObserver === 'undefined') {
            this.hasIntersected = true;
            this.renderCanvas();
            return;
        }
        this.intersectionObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !this.hasIntersected) {
                this.hasIntersected = true;
                this.renderCanvas();
                this.intersectionObserver?.disconnect();
                this.intersectionObserver = null;
            }
        }, { rootMargin: '200px 0px' });
        this.intersectionObserver.observe(this.hostEl.nativeElement);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgxBlurhashComponent, deps: [{ token: PLATFORM_ID }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.3.12", type: NgxBlurhashComponent, isStandalone: true, selector: "ngx-blurhash-render", inputs: { blurHash: "blurHash", imageSrc: "imageSrc", alt: "alt", width: "width", height: "height", borderRadius: "borderRadius", loading: "loading", priority: "priority", fallbackSrc: "fallbackSrc", transitionDuration: "transitionDuration", transitionEasing: "transitionEasing", transitionType: "transitionType", canvasResolution: "canvasResolution", lazyDecode: "lazyDecode" }, outputs: { loaded: "loaded", loadError: "loadError", transitionEnd: "transitionEnd" }, host: { properties: { "style.width": "width", "style.height": "height", "style.borderRadius": "borderRadius" } }, viewQueries: [{ propertyName: "canvasRef", first: true, predicate: ["blurhashCanvas"], descendants: true }, { propertyName: "imgRef", first: true, predicate: ["blurhashImg"], descendants: true }], usesOnChanges: true, ngImport: i0, template: `
    <!-- Decorative canvas: screen readers skip this; the img below carries the description. -->
    <canvas
      #blurhashCanvas
      aria-hidden="true"
      [width]="canvasResolution"
      [height]="canvasResolution"
    ></canvas>

    <!-- Primary image -->
    <img
      *ngIf="!hasError"
      #blurhashImg
      [src]="imageSrc"
      [alt]="alt"
      [attr.loading]="loading"
      [attr.fetchpriority]="priority ? 'high' : null"
      [attr.aria-busy]="!isLoaded ? true : null"
      [class.is-loaded]="isLoaded"
      [class.transition-fade]="transitionType === 'fade'"
      [class.transition-blur]="transitionType === 'blur'"
      [class.transition-scale]="transitionType === 'scale'"
      [style.--blurhash-duration]="transitionDuration"
      [style.--blurhash-easing]="transitionEasing"
      (load)="onLoad()"
      (error)="onError($event)"
      (animationend)="onTransitionEnd()"
    />

    <!-- Fallback image shown when the primary source fails and a fallbackSrc is provided. -->
    <img
      *ngIf="hasError && fallbackSrc"
      [src]="fallbackSrc"
      [alt]="alt"
      class="is-loaded transition-fade"
      [style.--blurhash-duration]="transitionDuration"
      [style.--blurhash-easing]="transitionEasing"
      (animationend)="onTransitionEnd()"
    />

    <!-- Custom error slot. Rendered when the image fails and no fallbackSrc is configured. -->
    <ng-container *ngIf="hasError && !fallbackSrc">
      <ng-content select="[blurhashError]"></ng-content>
    </ng-container>
  `, isInline: true, styles: [":host{display:block;position:relative;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%}img{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0}img.is-loaded.transition-fade{animation:blurhash-fade var(--blurhash-duration, .4s) var(--blurhash-easing, ease-in) both}img.is-loaded.transition-blur{animation:blurhash-blur var(--blurhash-duration, .4s) var(--blurhash-easing, ease-in) both}img.is-loaded.transition-scale{animation:blurhash-scale var(--blurhash-duration, .4s) var(--blurhash-easing, ease-in) both}@media (prefers-reduced-motion: reduce){img.is-loaded{animation:none!important;opacity:1}}@keyframes blurhash-fade{0%{opacity:0}to{opacity:1}}@keyframes blurhash-blur{0%{opacity:0;filter:blur(12px) saturate(1.8)}to{opacity:1;filter:blur(0) saturate(1)}}@keyframes blurhash-scale{0%{opacity:0;transform:scale(1.06)}to{opacity:1;transform:scale(1)}}\n"], dependencies: [{ kind: "directive", type: NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgxBlurhashComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-blurhash-render', standalone: true, imports: [NgIf], host: {
                        '[style.width]': 'width',
                        '[style.height]': 'height',
                        '[style.borderRadius]': 'borderRadius',
                    }, template: `
    <!-- Decorative canvas: screen readers skip this; the img below carries the description. -->
    <canvas
      #blurhashCanvas
      aria-hidden="true"
      [width]="canvasResolution"
      [height]="canvasResolution"
    ></canvas>

    <!-- Primary image -->
    <img
      *ngIf="!hasError"
      #blurhashImg
      [src]="imageSrc"
      [alt]="alt"
      [attr.loading]="loading"
      [attr.fetchpriority]="priority ? 'high' : null"
      [attr.aria-busy]="!isLoaded ? true : null"
      [class.is-loaded]="isLoaded"
      [class.transition-fade]="transitionType === 'fade'"
      [class.transition-blur]="transitionType === 'blur'"
      [class.transition-scale]="transitionType === 'scale'"
      [style.--blurhash-duration]="transitionDuration"
      [style.--blurhash-easing]="transitionEasing"
      (load)="onLoad()"
      (error)="onError($event)"
      (animationend)="onTransitionEnd()"
    />

    <!-- Fallback image shown when the primary source fails and a fallbackSrc is provided. -->
    <img
      *ngIf="hasError && fallbackSrc"
      [src]="fallbackSrc"
      [alt]="alt"
      class="is-loaded transition-fade"
      [style.--blurhash-duration]="transitionDuration"
      [style.--blurhash-easing]="transitionEasing"
      (animationend)="onTransitionEnd()"
    />

    <!-- Custom error slot. Rendered when the image fails and no fallbackSrc is configured. -->
    <ng-container *ngIf="hasError && !fallbackSrc">
      <ng-content select="[blurhashError]"></ng-content>
    </ng-container>
  `, styles: [":host{display:block;position:relative;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%}img{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0}img.is-loaded.transition-fade{animation:blurhash-fade var(--blurhash-duration, .4s) var(--blurhash-easing, ease-in) both}img.is-loaded.transition-blur{animation:blurhash-blur var(--blurhash-duration, .4s) var(--blurhash-easing, ease-in) both}img.is-loaded.transition-scale{animation:blurhash-scale var(--blurhash-duration, .4s) var(--blurhash-easing, ease-in) both}@media (prefers-reduced-motion: reduce){img.is-loaded{animation:none!important;opacity:1}}@keyframes blurhash-fade{0%{opacity:0}to{opacity:1}}@keyframes blurhash-blur{0%{opacity:0;filter:blur(12px) saturate(1.8)}to{opacity:1;filter:blur(0) saturate(1)}}@keyframes blurhash-scale{0%{opacity:0;transform:scale(1.06)}to{opacity:1;transform:scale(1)}}\n"] }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: i0.ElementRef }], propDecorators: { blurHash: [{
                type: Input
            }], imageSrc: [{
                type: Input
            }], alt: [{
                type: Input
            }], width: [{
                type: Input
            }], height: [{
                type: Input
            }], borderRadius: [{
                type: Input
            }], loading: [{
                type: Input
            }], priority: [{
                type: Input
            }], fallbackSrc: [{
                type: Input
            }], transitionDuration: [{
                type: Input
            }], transitionEasing: [{
                type: Input
            }], transitionType: [{
                type: Input
            }], canvasResolution: [{
                type: Input
            }], lazyDecode: [{
                type: Input
            }], loaded: [{
                type: Output
            }], loadError: [{
                type: Output
            }], transitionEnd: [{
                type: Output
            }], canvasRef: [{
                type: ViewChild,
                args: ['blurhashCanvas']
            }], imgRef: [{
                type: ViewChild,
                args: ['blurhashImg']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWJsdXJoYXNoLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1ibHVyaGFzaC1yZW5kZXIvc3JjL2xpYi9uZ3gtYmx1cmhhc2guY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFFTCxTQUFTLEVBRVQsWUFBWSxFQUNaLE1BQU0sRUFDTixLQUFLLEVBR0wsTUFBTSxFQUNOLFdBQVcsRUFFWCxTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQzFELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxVQUFVLENBQUM7O0FBS2xDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVCRztBQWtISCxNQUFNLE9BQU8sb0JBQW9CO0lBNkdaO0lBM0duQiwrRUFBK0U7SUFFL0Usd0VBQXdFO0lBQy9ELFFBQVEsQ0FBVTtJQUUzQiwyRUFBMkU7SUFDbEUsUUFBUSxDQUFVO0lBRTNCOzs7T0FHRztJQUNNLEdBQUcsR0FBVyxFQUFFLENBQUM7SUFFMUIseUZBQXlGO0lBQ2hGLEtBQUssR0FBVyxPQUFPLENBQUM7SUFFakMsMEZBQTBGO0lBQ2pGLE1BQU0sR0FBVyxPQUFPLENBQUM7SUFFbEMsb0VBQW9FO0lBQzNELFlBQVksR0FBVyxHQUFHLENBQUM7SUFFcEM7Ozs7T0FJRztJQUNNLE9BQU8sR0FBcUIsT0FBTyxDQUFDO0lBRTdDOzs7OztPQUtHO0lBQ00sUUFBUSxHQUFZLEtBQUssQ0FBQztJQUVuQzs7O09BR0c7SUFDTSxXQUFXLEdBQVcsRUFBRSxDQUFDO0lBRWxDOzs7O09BSUc7SUFDTSxrQkFBa0IsR0FBVyxPQUFPLENBQUM7SUFFOUM7OztPQUdHO0lBQ00sZ0JBQWdCLEdBQVcsU0FBUyxDQUFDO0lBRTlDOzs7Ozs7T0FNRztJQUNNLGNBQWMsR0FBMkIsTUFBTSxD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TUFBTTtnQkFHWSxTQUFTO3NCQUEzQixNQUFNO2dCQUdZLGFBQWE7c0JBQS9CLE1BQU07Z0JBT3VDLFNBQVM7c0JBQXRELFNBQVM7dUJBQUMsZ0JBQWdCO2dCQUNnQixNQUFNO3NCQUFoRCxTQUFTO3VCQUFDLGFBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbiAgUExBVEZPUk1fSUQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFZpZXdDaGlsZCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBOZ0lmLCBpc1BsYXRmb3JtQnJvd3NlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBkZWNvZGUgfSBmcm9tICdibHVyaGFzaCc7XG5cbi8qKiBBbmltYXRpb24gc3R5bGUgdXNlZCBmb3IgdGhlIGltYWdlIHJldmVhbCB0cmFuc2l0aW9uLiAqL1xuZXhwb3J0IHR5cGUgQmx1cmhhc2hUcmFuc2l0aW9uVHlwZSA9ICdmYWRlJyB8ICdibHVyJyB8ICdzY2FsZSc7XG5cbi8qKlxuICogUmVuZGVycyBhIGJsdXJoYXNoIHBsYWNlaG9sZGVyIGNhbnZhcyB0aGF0IHNtb290aGx5IHRyYW5zaXRpb25zIHRvIHRoZVxuICogcmVhbCBpbWFnZSBvbmNlIGl0IGhhcyBsb2FkZWQuXG4gKlxuICogVGhlIGhvc3QgZWxlbWVudCBiZWNvbWVzIHRoZSBzaXplZCBjb250YWluZXI7IGB3aWR0aGAsIGBoZWlnaHRgLCBhbmRcbiAqIGBib3JkZXJSYWRpdXNgIGFyZSBhcHBsaWVkIGRpcmVjdGx5IHRvIGl0IHNvIGEgc2luZ2xlIGVsZW1lbnQgY29udHJvbHNcbiAqIHRoZSBsYXlvdXQgZm9vdHByaW50LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBodG1sXG4gKiA8bmd4LWJsdXJoYXNoLXJlbmRlclxuICogICBbYmx1ckhhc2hdPVwiJ0w2UGowXmpFLkF5RV8zdDd0N1IqKjBvI0RnUjQnXCJcbiAqICAgW2ltYWdlU3JjXT1cIicvYXNzZXRzL3Bob3RvLmpwZydcIlxuICogICBbYWx0XT1cIidBIHNjZW5pYyBtb3VudGFpbiBsYW5kc2NhcGUnXCJcbiAqICAgW3dpZHRoXT1cIic0MDBweCdcIlxuICogICBbaGVpZ2h0XT1cIiczMDBweCdcIlxuICogICBbYm9yZGVyUmFkaXVzXT1cIicxMnB4J1wiXG4gKiAgIFt0cmFuc2l0aW9uVHlwZV09XCInYmx1cidcIlxuICogICBbcHJpb3JpdHldPVwidHJ1ZVwiXG4gKiAgIChsb2FkZWQpPVwib25JbWFnZUxvYWRlZCgpXCJcbiAqICAgKGxvYWRFcnJvcik9XCJvbkltYWdlRXJyb3IoJGV2ZW50KVwiXG4gKiAvPlxuICogYGBgXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ25neC1ibHVyaGFzaC1yZW5kZXInLFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBpbXBvcnRzOiBbTmdJZl0sXG4gIGhvc3Q6IHtcbiAgICAnW3N0eWxlLndpZHRoXSc6ICd3aWR0aCcsXG4gICAgJ1tzdHlsZS5oZWlnaHRdJzogJ2hlaWdodCcsXG4gICAgJ1tzdHlsZS5ib3JkZXJSYWRpdXNdJzogJ2JvcmRlclJhZGl1cycsXG4gIH0sXG4gIHRlbXBsYXRlOiBgXG4gICAgPCEtLSBEZWNvcmF0aXZlIGNhbnZhczogc2NyZWVuIHJlYWRlcnMgc2tpcCB0aGlzOyB0aGUgaW1nIGJlbG93IGNhcnJpZXMgdGhlIGRlc2NyaXB0aW9uLiAtLT5cbiAgICA8Y2FudmFzXG4gICAgICAjYmx1cmhhc2hDYW52YXNcbiAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICBbd2lkdGhdPVwiY2FudmFzUmVzb2x1dGlvblwiXG4gICAgICBbaGVpZ2h0XT1cImNhbnZhc1Jlc29sdXRpb25cIlxuICAgID48L2NhbnZhcz5cblxuICAgIDwhLS0gUHJpbWFyeSBpbWFnZSAtLT5cbiAgICA8aW1nXG4gICAgICAqbmdJZj1cIiFoYXNFcnJvclwiXG4gICAgICAjYmx1cmhhc2hJbWdcbiAgICAgIFtzcmNdPVwiaW1hZ2VTcmNcIlxuICAgICAgW2FsdF09XCJhbHRcIlxuICAgICAgW2F0dHIubG9hZGluZ109XCJsb2FkaW5nXCJcbiAgICAgIFthdHRyLmZldGNocHJpb3JpdHldPVwicHJpb3JpdHkgPyAnaGlnaCcgOiBudWxsXCJcbiAgICAgIFthdHRyLmFyaWEtYnVzeV09XCIhaXNMb2FkZWQgPyB0cnVlIDogbnVsbFwiXG4gICAgICBbY2xhc3MuaXMtbG9hZGVkXT1cImlzTG9hZGVkXCJcbiAgICAgIFtjbGFzcy50cmFuc2l0aW9uLWZhZGVdPVwidHJhbnNpdGlvblR5cGUgPT09ICdmYWRlJ1wiXG4gICAgICBbY2xhc3MudHJhbnNpdGlvbi1ibHVyXT1cInRyYW5zaXRpb25UeXBlID09PSAnYmx1cidcIlxuICAgICAgW2NsYXNzLnRyYW5zaXRpb24tc2NhbGVdPVwidHJhbnNpdGlvblR5cGUgPT09ICdzY2FsZSdcIlxuICAgICAgW3N0eWxlLi0tYmx1cmhhc2gtZHVyYXRpb25dPVwidHJhbnNpdGlvbkR1cmF0aW9uXCJcbiAgICAgIFtzdHlsZS4tLWJsdXJoYXNoLWVhc2luZ109XCJ0cmFuc2l0aW9uRWFzaW5nXCJcbiAgICAgIChsb2FkKT1cIm9uTG9hZCgpXCJcbiAgICAgIChlcnJvcik9XCJvbkVycm9yKCRldmVudClcIlxuICAgICAgKGFuaW1hdGlvbmVuZCk9XCJvblRyYW5zaXRpb25FbmQoKVwiXG4gICAgLz5cblxuICAgIDwhLS0gRmFsbGJhY2sgaW1hZ2Ugc2hvd24gd2hlbiB0aGUgcHJpbWFyeSBzb3VyY2UgZmFpbHMgYW5kIGEgZmFsbGJhY2tTcmMgaXMgcHJvdmlkZWQuIC0tPlxuICAgIDxpbWdcbiAgICAgICpuZ0lmPVwiaGFzRXJyb3IgJiYgZmFsbGJhY2tTcmNcIlxuICAgICAgW3NyY109XCJmYWxsYmFja1NyY1wiXG4gICAgICBbYWx0XT1cImFsdFwiXG4gICAgICBjbGFzcz1cImlzLWxvYWRlZCB0cmFuc2l0aW9uLWZhZGVcIlxuICAgICAgW3N0eWxlLi0tYmx1cmhhc2gtZHVyYXRpb25dPVwidHJhbnNpdGlvbkR1cmF0aW9uXCJcbiAgICAgIFtzdHlsZS4tLWJsdXJoYXNoLWVhc2luZ109XCJ0cmFuc2l0aW9uRWFzaW5nXCJcbiAgICAgIChhbmltYXRpb25lbmQpPVwib25UcmFuc2l0aW9uRW5kKClcIlxuICAgIC8+XG5cbiAgICA8IS0tIEN1c3RvbSBlcnJvciBzbG90LiBSZW5kZXJlZCB3aGVuIHRoZSBpbWFnZSBmYWlscyBhbmQgbm8gZmFsbGJhY2tTcmMgaXMgY29uZmlndXJlZC4gLS0+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImhhc0Vycm9yICYmICFmYWxsYmFja1NyY1wiPlxuICAgICAgPG5nLWNvbnRlbnQgc2VsZWN0PVwiW2JsdXJoYXNoRXJyb3JdXCI+PC9uZy1jb250ZW50PlxuICAgIDwvbmctY29udGFpbmVyPlxuICBgLFxuICBzdHlsZXM6IFtgXG4gICAgOmhvc3Qge1xuICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIH1cblxuICAgIGNhbnZhcyB7XG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICBpbnNldDogMDtcbiAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgIH1cblxuICAgIGltZyB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIGluc2V0OiAwO1xuICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICBvYmplY3QtZml0OiBjb3ZlcjtcbiAgICAgIG9wYWNpdHk6IDA7XG4gICAgfVxuXG4gICAgaW1nLmlzLWxvYWRlZC50cmFuc2l0aW9uLWZhZGUge1xuICAgICAgYW5pbWF0aW9uOiBibHVyaGFzaC1mYWRlIHZhcigtLWJsdXJoYXNoLWR1cmF0aW9uLCA0MDBtcykgdmFyKC0tYmx1cmhhc2gtZWFzaW5nLCBlYXNlLWluKSBib3RoO1xuICAgIH1cblxuICAgIGltZy5pcy1sb2FkZWQudHJhbnNpdGlvbi1ibHVyIHtcbiAgICAgIGFuaW1hdGlvbjogYmx1cmhhc2gtYmx1ciB2YXIoLS1ibHVyaGFzaC1kdXJhdGlvbiwgNDAwbXMpIHZhcigtLWJsdXJoYXNoLWVhc2luZywgZWFzZS1pbikgYm90aDtcbiAgICB9XG5cbiAgICBpbWcuaXMtbG9hZGVkLnRyYW5zaXRpb24tc2NhbGUge1xuICAgICAgYW5pbWF0aW9uOiBibHVyaGFzaC1zY2FsZSB2YXIoLS1ibHVyaGFzaC1kdXJhdGlvbiwgNDAwbXMpIHZhcigtLWJsdXJoYXNoLWVhc2luZywgZWFzZS1pbikgYm90aDtcbiAgICB9XG5cbiAgICBAbWVkaWEgKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSkge1xuICAgICAgaW1nLmlzLWxvYWRlZCB7XG4gICAgICAgIGFuaW1hdGlvbjogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIEBrZXlmcmFtZXMgYmx1cmhhc2gtZmFkZSB7XG4gICAgICBmcm9tIHsgb3BhY2l0eTogMDsgfVxuICAgICAgdG8gICB7IG9wYWNpdHk6IDE7IH1cbiAgICB9XG5cbiAgICBAa2V5ZnJhbWVzIGJsdXJoYXNoLWJsdXIge1xuICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IGZpbHRlcjogYmx1cigxMnB4KSBzYXR1cmF0ZSgxLjgpOyB9XG4gICAgICB0byAgIHsgb3BhY2l0eTogMTsgZmlsdGVyOiBibHVyKDApICAgIHNhdHVyYXRlKDEpOyAgIH1cbiAgICB9XG5cbiAgICBAa2V5ZnJhbWVzIGJsdXJoYXNoLXNjYWxlIHtcbiAgICAgIGZyb20geyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHNjYWxlKDEuMDYpOyB9XG4gICAgICB0byAgIHsgb3BhY2l0eTogMTsgdHJhbnNmb3JtOiBzY2FsZSgxKTsgICAgfVxuICAgIH1cbiAgYF0sXG59KVxuZXhwb3J0IGNsYXNzIE5neEJsdXJoYXNoQ29tcG9uZW50IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3kge1xuXG4gIC8vIOKUgOKUgCBJbnB1dHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgLyoqIFRoZSBibHVyaGFzaCBzdHJpbmcgdG8gZGVjb2RlIGFuZCByZW5kZXIgYXMgYSBjYW52YXMgcGxhY2Vob2xkZXIuICovXG4gIEBJbnB1dCgpIGJsdXJIYXNoITogc3RyaW5nO1xuXG4gIC8qKiBVUkwgb3IgYXNzZXQgcGF0aCBvZiB0aGUgZnVsbC1xdWFsaXR5IGltYWdlIHRvIHJldmVhbCBhZnRlciBsb2FkaW5nLiAqL1xuICBASW5wdXQoKSBpbWFnZVNyYyE6IHN0cmluZztcblxuICAvKipcbiAgICogQWNjZXNzaWJsZSBkZXNjcmlwdGlvbiBmb3J3YXJkZWQgdG8gdGhlIHVuZGVybHlpbmcgYDxpbWc+YCBgYWx0YCBhdHRyaWJ1dGUuXG4gICAqIFByb3ZpZGUgYSBtZWFuaW5nZnVsIHZhbHVlIGZvciBldmVyeSBpbWFnZTsgb21pdCBvbmx5IGZvciBwdXJlbHkgZGVjb3JhdGl2ZSBpbWFnZXMuXG4gICAqL1xuICBASW5wdXQoKSBhbHQ6IHN0cmluZyA9ICcnO1xuXG4gIC8qKiBDU1Mgd2lkdGggYXBwbGllZCB0byB0aGUgaG9zdCBlbGVtZW50IChlLmcuIGAnMzAwcHgnYCwgYCcxMDAlJ2ApLiBAZGVmYXVsdCAnMjAwcHgnICovXG4gIEBJbnB1dCgpIHdpZHRoOiBzdHJpbmcgPSAnMjAwcHgnO1xuXG4gIC8qKiBDU1MgaGVpZ2h0IGFwcGxpZWQgdG8gdGhlIGhvc3QgZWxlbWVudCAoZS5nLiBgJzIwMHB4J2AsIGAnNTB2aCdgKS4gQGRlZmF1bHQgJzIwMHB4JyAqL1xuICBASW5wdXQoKSBoZWlnaHQ6IHN0cmluZyA9ICcyMDBweCc7XG5cbiAgLyoqIENTUyBgYm9yZGVyLXJhZGl1c2AgYXBwbGllZCB0byB0aGUgaG9zdCBlbGVtZW50LiBAZGVmYXVsdCAnMCcgKi9cbiAgQElucHV0KCkgYm9yZGVyUmFkaXVzOiBzdHJpbmcgPSAnMCc7XG5cbiAgLyoqXG4gICAqIE5hdGl2ZSBgPGltZz5gIGxvYWRpbmcgc3RyYXRlZ3kuXG4gICAqIFVzZSBgJ2xhenknYCBmb3IgYmVsb3ctdGhlLWZvbGQgaW1hZ2VzLiBJZ25vcmVkIHdoZW4gYHByaW9yaXR5YCBpcyBgdHJ1ZWAuXG4gICAqIEBkZWZhdWx0ICdlYWdlcidcbiAgICovXG4gIEBJbnB1dCgpIGxvYWRpbmc6ICdlYWdlcicgfCAnbGF6eScgPSAnZWFnZXInO1xuXG4gIC8qKlxuICAgKiBNYXJrIHRoaXMgaW1hZ2UgYXMgYSBoaWdoLXByaW9yaXR5IExhcmdlc3QgQ29udGVudGZ1bCBQYWludCBjYW5kaWRhdGUuXG4gICAqIFNldHMgYGZldGNocHJpb3JpdHk9XCJoaWdoXCJgIG9uIHRoZSBpbWFnZSBlbGVtZW50LCBzaWduYWxsaW5nIHRoZSBicm93c2VyXG4gICAqIHRvIGZldGNoIGl0IGFzIHNvb24gYXMgcG9zc2libGUuXG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICBASW5wdXQoKSBwcmlvcml0eTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBVUkwgZGlzcGxheWVkIHdoZW4gYGltYWdlU3JjYCBmYWlscyB0byBsb2FkLlxuICAgKiBXaGVuIG9taXR0ZWQsIHRoZSBgW2JsdXJoYXNoRXJyb3JdYCBjb250ZW50LXByb2plY3Rpb24gc2xvdCBpcyByZW5kZXJlZCBpbnN0ZWFkLlxuICAgKi9cbiAgQElucHV0KCkgZmFsbGJhY2tTcmM6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBEdXJhdGlvbiBvZiB0aGUgaW1hZ2UgcmV2ZWFsIGFuaW1hdGlvbiDigJQgYW55IHZhbGlkIENTUyB0aW1lIHZhbHVlXG4gICAqIChlLmcuIGAnNDAwbXMnYCwgYCcwLjVzJ2ApLlxuICAgKiBAZGVmYXVsdCAnNDAwbXMnXG4gICAqL1xuICBASW5wdXQoKSB0cmFuc2l0aW9uRHVyYXRpb246IHN0cmluZyA9ICc0MDBtcyc7XG5cbiAgLyoqXG4gICAqIENTUyBlYXNpbmcgZnVuY3Rpb24gZm9yIHRoZSByZXZlYWwgYW5pbWF0aW9uIChlLmcuIGAnZWFzZS1pbidgLCBgJ2N1YmljLWJlemllcigwLjQsMCwwLjIsMSknYCkuXG4gICAqIEBkZWZhdWx0ICdlYXNlLWluJ1xuICAgKi9cbiAgQElucHV0KCkgdHJhbnNpdGlvbkVhc2luZzogc3RyaW5nID0gJ2Vhc2UtaW4nO1xuXG4gIC8qKlxuICAgKiBWaXN1YWwgc3R5bGUgb2YgdGhlIGltYWdlIHJldmVhbCB0cmFuc2l0aW9uLlxuICAgKiAtIGAnZmFkZSdgICDigJMgc2ltcGxlIGNyb3NzLWZhZGUgZnJvbSBwbGFjZWhvbGRlciB0byBpbWFnZS5cbiAgICogLSBgJ2JsdXInYCAg4oCTIGltYWdlIG1hdGVyaWFsaXNlcyB0aHJvdWdoIGEgZGVjcmVhc2luZyBibHVyIGFuZCBzYXR1cmF0aW9uIGVmZmVjdC5cbiAgICogLSBgJ3NjYWxlJ2Ag4oCTIGltYWdlIGZhZGVzIGluIHdpdGggYSBzdWJ0bGUgem9vbS1vdXQgbW90aW9uLlxuICAgKiBAZGVmYXVsdCAnZmFkZSdcbiAgICovXG4gIEBJbnB1dCgpIHRyYW5zaXRpb25UeXBlOiBCbHVyaGFzaFRyYW5zaXRpb25UeXBlID0gJ2ZhZGUnO1xuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCByZXNvbHV0aW9uIChpbiBwaXhlbHMpIGF0IHdoaWNoIHRoZSBibHVyaGFzaCBpcyBkZWNvZGVkIG9udG8gdGhlIGNhbnZhcy5cbiAgICogVGhlIGNhbnZhcyBpcyBhbHdheXMgQ1NTLXN0cmV0Y2hlZCB0byBmaWxsIHRoZSBob3N0LCBzbyB0aGlzIG9ubHkgYWZmZWN0cyBwbGFjZWhvbGRlclxuICAgKiBncmFkaWVudCBzbW9vdGhuZXNzLiBMb3dlciB2YWx1ZXMgZGVjb2RlIGZhc3RlcjsgaGlnaGVyIHZhbHVlcyBhcmUgZmluZXItZ3JhaW5lZC5cbiAgICogQGRlZmF1bHQgMzJcbiAgICovXG4gIEBJbnB1dCgpIGNhbnZhc1Jlc29sdXRpb246IG51bWJlciA9IDMyO1xuXG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCwgZGVmZXJzIHRoZSBibHVyaGFzaCBkZWNvZGUgdW50aWwgdGhlIGNvbXBvbmVudCBlbnRlcnMgdGhlIHZpZXdwb3J0LFxuICAgKiB1c2luZyBgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJgIHdpdGggYSBgMjAwcHhgIHJvb3QgbWFyZ2luLlxuICAgKiBGYWxscyBiYWNrIHRvIGltbWVkaWF0ZSBkZWNvZGUgaW4gZW52aXJvbm1lbnRzIHdpdGhvdXQgYEludGVyc2VjdGlvbk9ic2VydmVyYC5cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIEBJbnB1dCgpIGxhenlEZWNvZGU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyDilIDilIAgT3V0cHV0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICAvKiogRW1pdHRlZCBvbmNlIHRoZSBpbWFnZSBoYXMgc3VjY2Vzc2Z1bGx5IGxvYWRlZC4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGxvYWRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxuICAvKiogRW1pdHRlZCB3aGVuIHRoZSBpbWFnZSBmYWlscyB0byBsb2FkLCBjYXJyeWluZyB0aGUgb3JpZ2luYWwgRE9NIGBFdmVudGAuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBsb2FkRXJyb3IgPSBuZXcgRXZlbnRFbWl0dGVyPEV2ZW50PigpO1xuXG4gIC8qKiBFbWl0dGVkIHdoZW4gdGhlIENTUyByZXZlYWwgYW5pbWF0aW9uIGNvbXBsZXRlcy4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IHRyYW5zaXRpb25FbmQgPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLy8g4pSA4pSAIEludGVybmFsIHN0YXRlIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIHByb3RlY3RlZCBpc0xvYWRlZCA9IGZhbHNlO1xuICBwcm90ZWN0ZWQgaGFzRXJyb3IgPSBmYWxzZTtcblxuICBAVmlld0NoaWxkKCdibHVyaGFzaENhbnZhcycpIHByaXZhdGUgcmVhZG9ubHkgY2FudmFzUmVmITogRWxlbWVudFJlZjxIVE1MQ2FudmFzRWxlbWVudD47XG4gIEBWaWV3Q2hpbGQoJ2JsdXJoYXNoSW1nJykgcHJpdmF0ZSByZWFkb25seSBpbWdSZWYhOiBFbGVtZW50UmVmPEhUTUxJbWFnZUVsZW1lbnQ+O1xuXG4gIHJlYWRvbmx5IGlzQnJvd3NlcjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBpbnRlcnNlY3Rpb25PYnNlcnZlcjogSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBoYXNJbnRlcnNlY3RlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHBsYXRmb3JtSWQ6IG9iamVjdCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGhvc3RFbDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICkge1xuICAgIHRoaXMuaXNCcm93c2VyID0gaXNQbGF0Zm9ybUJyb3dzZXIocGxhdGZvcm1JZCk7XG4gIH1cblxuICAvLyDilIDilIAgTGlmZWN5Y2xlIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlc1snaW1hZ2VTcmMnXSAmJiAhY2hhbmdlc1snaW1hZ2VTcmMnXS5maXJzdENoYW5nZSkge1xuICAgICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5oYXNFcnJvciA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFJlLXJlbmRlciB0aGUgY2FudmFzIHdoZW4gdGhlIGhhc2ggb3IgcmVzb2x1dGlvbiBjaGFuZ2VzLCBidXQgb25seSBhZnRlclxuICAgIC8vIG5nQWZ0ZXJWaWV3SW5pdCBoYXMgcnVuIChjYW52YXNSZWYgYXZhaWxhYmxlKSBhbmQsIGZvciBsYXp5IG1vZGUsIG9ubHlcbiAgICAvLyBhZnRlciB0aGUgZWxlbWVudCBoYXMgZW50ZXJlZCB0aGUgdmlld3BvcnQuXG4gICAgaWYgKChjaGFuZ2VzWydibHVySGFzaCddIHx8IGNoYW5nZXNbJ2NhbnZhc1Jlc29sdXRpb24nXSkgJiYgdGhpcy5jYW52YXNSZWYpIHtcbiAgICAgIGlmICghdGhpcy5sYXp5RGVjb2RlIHx8IHRoaXMuaGFzSW50ZXJzZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJDYW52YXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmlzQnJvd3NlcikgcmV0dXJuO1xuXG4gICAgaWYgKHRoaXMubGF6eURlY29kZSkge1xuICAgICAgdGhpcy5zZXR1cEludGVyc2VjdGlvbk9ic2VydmVyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGFzSW50ZXJzZWN0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5yZW5kZXJDYW52YXMoKTtcbiAgICB9XG5cbiAgICAvLyBCcm93c2VycyBmaXJlIGBsb2FkYCBiZWZvcmUgQW5ndWxhciBhdHRhY2hlcyBldmVudCBiaW5kaW5ncyBmb3IgY2FjaGVkIGltYWdlcy5cbiAgICAvLyBEZWZlciB0byB0aGUgbmV4dCBtaWNyb3Rhc2sgdG8gYXZvaWQgRXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvci5cbiAgICBjb25zdCBpbWcgPSB0aGlzLmltZ1JlZj8ubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoaW1nPy5jb21wbGV0ZSAmJiBpbWcubmF0dXJhbFdpZHRoID4gMCkge1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB0aGlzLm9uTG9hZCgpKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gIH1cblxuICAvLyDilIDilIAgRXZlbnQgaGFuZGxlcnMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgcHJvdGVjdGVkIG9uTG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICB0aGlzLmxvYWRlZC5lbWl0KCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25FcnJvcihldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICB0aGlzLmhhc0Vycm9yID0gdHJ1ZTtcbiAgICB0aGlzLmxvYWRFcnJvci5lbWl0KGV2ZW50KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBvblRyYW5zaXRpb25FbmQoKTogdm9pZCB7XG4gICAgdGhpcy50cmFuc2l0aW9uRW5kLmVtaXQoKTtcbiAgfVxuXG4gIC8vIOKUgOKUgCBQcml2YXRlIGhlbHBlcnMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgcHJpdmF0ZSByZW5kZXJDYW52YXMoKTogdm9pZCB7XG4gICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNSZWY/Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCFjYW52YXMgfHwgIXRoaXMuYmx1ckhhc2gpIHJldHVybjtcblxuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGlmICghY3R4KSByZXR1cm47XG5cbiAgICBjb25zdCByZXMgPSB0aGlzLmNhbnZhc1Jlc29sdXRpb247XG4gICAgY29uc3QgcGl4ZWxzID0gZGVjb2RlKHRoaXMuYmx1ckhhc2gsIHJlcywgcmVzKTtcbiAgICBjb25zdCBpbWFnZURhdGEgPSBjdHguY3JlYXRlSW1hZ2VEYXRhKHJlcywgcmVzKTtcbiAgICBpbWFnZURhdGEuZGF0YS5zZXQocGl4ZWxzKTtcbiAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gIH1cblxuICBwcml2YXRlIHNldHVwSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoKTogdm9pZCB7XG4gICAgaWYgKHR5cGVvZiBJbnRlcnNlY3Rpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuaGFzSW50ZXJzZWN0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5yZW5kZXJDYW52YXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKFxuICAgICAgKFtlbnRyeV0pID0+IHtcbiAgICAgICAgaWYgKGVudHJ5LmlzSW50ZXJzZWN0aW5nICYmICF0aGlzLmhhc0ludGVyc2VjdGVkKSB7XG4gICAgICAgICAgdGhpcy5oYXNJbnRlcnNlY3RlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5yZW5kZXJDYW52YXMoKTtcbiAgICAgICAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7IHJvb3RNYXJnaW46ICcyMDBweCAwcHgnIH0sXG4gICAgKTtcblxuICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLmhvc3RFbC5uYXRpdmVFbGVtZW50KTtcbiAgfVxufVxuIl19