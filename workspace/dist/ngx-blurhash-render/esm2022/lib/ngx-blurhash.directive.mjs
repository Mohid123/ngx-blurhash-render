import { Directive, EventEmitter, Inject, Input, Output, PLATFORM_ID, } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { decode } from 'blurhash';
import * as i0 from "@angular/core";
/**
 * Attribute directive that adds a blurhash placeholder to any existing `<img>`
 * element without requiring you to swap it for a component.
 *
 * The directive imperatively creates a `<canvas>` sibling immediately before
 * the `<img>` and positions both to fill the nearest positioned ancestor.
 *
 * **Requirement:** The immediate parent must have a non-static `position` and
 * an explicit `width` / `height` so that `position: absolute; inset: 0` works.
 *
 * @example
 * ```html
 * <div style="position: relative; width: 400px; height: 300px;">
 *   <img
 *     [ngxBlurhash]="'L6Pj0^jE.AyE_3t7t7R**0o#DgR4'"
 *     src="/assets/photo.jpg"
 *     alt="A scenic mountain landscape"
 *     ngxBlurhashTransition="blur"
 *     (blurhashLoaded)="onLoaded()"
 *   />
 * </div>
 * ```
 */
export class NgxBlurhashDirective {
    el;
    renderer;
    // ── Inputs ──────────────────────────────────────────────────────────────────
    /** The blurhash string to decode. This is also the selector binding. */
    ngxBlurhash = '';
    /**
     * Fallback `src` applied to the image when the original source fails to load.
     * If not set, the placeholder canvas remains visible on error.
     */
    ngxBlurhashFallback = '';
    /**
     * Duration of the CSS reveal transition — any valid CSS time value
     * (e.g. `'400ms'`, `'0.5s'`).
     * @default '400ms'
     */
    ngxBlurhashDuration = '400ms';
    /**
     * CSS easing function for the reveal transition.
     * @default 'ease-in'
     */
    ngxBlurhashEasing = 'ease-in';
    /**
     * Visual style of the image reveal transition.
     * - `'fade'`  – simple cross-fade.
     * - `'blur'`  – image materialises through a decreasing blur effect.
     * - `'scale'` – image fades in with a subtle zoom-out motion.
     * @default 'fade'
     */
    ngxBlurhashTransition = 'fade';
    /**
     * Resolution (pixels) used for the blurhash canvas decode.
     * @default 32
     */
    ngxBlurhashResolution = 32;
    /**
     * Defer the blurhash decode until the image enters the viewport.
     * Uses `IntersectionObserver` with a `200px` root margin.
     * @default false
     */
    ngxBlurhashLazy = false;
    // ── Outputs ─────────────────────────────────────────────────────────────────
    /** Emitted once the image has successfully loaded. */
    blurhashLoaded = new EventEmitter();
    /** Emitted when the image fails to load, carrying the original DOM `Event`. */
    blurhashError = new EventEmitter();
    /** Emitted when the CSS reveal transition completes. */
    blurhashTransitionEnd = new EventEmitter();
    // ── Private state ────────────────────────────────────────────────────────────
    canvas = null;
    intersectionObserver = null;
    hasIntersected = false;
    isBrowser;
    // Stored unlisten functions returned by Renderer2.listen for proper cleanup.
    unlistenLoad;
    unlistenError;
    unlistenTransitionEnd;
    constructor(el, renderer, platformId) {
        this.el = el;
        this.renderer = renderer;
        this.isBrowser = isPlatformBrowser(platformId);
    }
    // ── Lifecycle ────────────────────────────────────────────────────────────────
    ngAfterViewInit() {
        if (!this.isBrowser)
            return;
        this.buildCanvas();
        this.applyImgStyles();
        this.attachEventListeners();
        if (this.ngxBlurhashLazy) {
            this.setupIntersectionObserver();
        }
        else {
            this.hasIntersected = true;
            this.renderCanvas();
        }
        // Browsers fire `load` before Angular attaches listeners for cached images.
        const img = this.el.nativeElement;
        if (img.complete && img.naturalWidth > 0) {
            Promise.resolve().then(() => this.revealImage());
        }
    }
    ngOnChanges(changes) {
        if ((changes['ngxBlurhash'] || changes['ngxBlurhashResolution']) && this.canvas) {
            if (!this.ngxBlurhashLazy || this.hasIntersected) {
                this.renderCanvas();
            }
        }
    }
    ngOnDestroy() {
        this.intersectionObserver?.disconnect();
        this.unlistenLoad?.();
        this.unlistenError?.();
        this.unlistenTransitionEnd?.();
        if (this.canvas) {
            const parent = this.renderer.parentNode(this.canvas);
            if (parent) {
                this.renderer.removeChild(parent, this.canvas);
            }
        }
    }
    // ── Private helpers ──────────────────────────────────────────────────────────
    buildCanvas() {
        const img = this.el.nativeElement;
        const parent = this.renderer.parentNode(img);
        this.canvas = this.renderer.createElement('canvas');
        this.renderer.setAttribute(this.canvas, 'aria-hidden', 'true');
        this.renderer.setStyle(this.canvas, 'position', 'absolute');
        this.renderer.setStyle(this.canvas, 'inset', '0');
        this.renderer.setStyle(this.canvas, 'width', '100%');
        this.renderer.setStyle(this.canvas, 'height', '100%');
        this.renderer.insertBefore(parent, this.canvas, img);
    }
    applyImgStyles() {
        const img = this.el.nativeElement;
        this.renderer.setStyle(img, 'position', 'absolute');
        this.renderer.setStyle(img, 'inset', '0');
        this.renderer.setStyle(img, 'width', '100%');
        this.renderer.setStyle(img, 'height', '100%');
        this.renderer.setStyle(img, 'object-fit', 'cover');
        this.renderer.setStyle(img, 'opacity', '0');
        // Set the non-opacity start values now so the browser has a state to
        // transition FROM when the image loads later.
        if (this.ngxBlurhashTransition === 'blur') {
            this.renderer.setStyle(img, 'filter', 'blur(12px) saturate(1.8)');
        }
        else if (this.ngxBlurhashTransition === 'scale') {
            this.renderer.setStyle(img, 'transform', 'scale(1.06)');
        }
    }
    attachEventListeners() {
        const img = this.el.nativeElement;
        this.unlistenLoad = this.renderer.listen(img, 'load', () => this.revealImage());
        this.unlistenError = this.renderer.listen(img, 'error', (event) => {
            if (this.ngxBlurhashFallback) {
                this.renderer.setAttribute(img, 'src', this.ngxBlurhashFallback);
            }
            this.blurhashError.emit(event);
        });
        this.unlistenTransitionEnd = this.renderer.listen(img, 'transitionend', () => {
            this.blurhashTransitionEnd.emit();
        });
    }
    revealImage() {
        const img = this.el.nativeElement;
        const duration = this.ngxBlurhashDuration;
        const easing = this.ngxBlurhashEasing;
        // Respect the user's motion preference — skip animation and reveal immediately.
        if (this.prefersReducedMotion()) {
            this.renderer.setStyle(img, 'opacity', '1');
            this.renderer.removeStyle(img, 'filter');
            this.renderer.removeStyle(img, 'transform');
            this.blurhashLoaded.emit();
            return;
        }
        switch (this.ngxBlurhashTransition) {
            case 'blur':
                this.renderer.setStyle(img, 'transition', `opacity ${duration} ${easing}, filter ${duration} ${easing}`);
                this.renderer.setStyle(img, 'opacity', '1');
                this.renderer.setStyle(img, 'filter', 'blur(0) saturate(1)');
                break;
            case 'scale':
                this.renderer.setStyle(img, 'transition', `opacity ${duration} ${easing}, transform ${duration} ${easing}`);
                this.renderer.setStyle(img, 'opacity', '1');
                this.renderer.setStyle(img, 'transform', 'scale(1)');
                break;
            case 'fade':
            default:
                this.renderer.setStyle(img, 'transition', `opacity ${duration} ${easing}`);
                this.renderer.setStyle(img, 'opacity', '1');
                break;
        }
        this.blurhashLoaded.emit();
    }
    renderCanvas() {
        if (!this.canvas || !this.ngxBlurhash)
            return;
        const res = this.ngxBlurhashResolution;
        this.renderer.setAttribute(this.canvas, 'width', String(res));
        this.renderer.setAttribute(this.canvas, 'height', String(res));
        const ctx = this.canvas.getContext('2d');
        if (!ctx)
            return;
        const pixels = decode(this.ngxBlurhash, res, res);
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
        this.intersectionObserver.observe(this.el.nativeElement);
    }
    prefersReducedMotion() {
        return typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgxBlurhashDirective, deps: [{ token: i0.ElementRef }, { token: i0.Renderer2 }, { token: PLATFORM_ID }], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.3.12", type: NgxBlurhashDirective, isStandalone: true, selector: "img[ngxBlurhash]", inputs: { ngxBlurhash: "ngxBlurhash", ngxBlurhashFallback: "ngxBlurhashFallback", ngxBlurhashDuration: "ngxBlurhashDuration", ngxBlurhashEasing: "ngxBlurhashEasing", ngxBlurhashTransition: "ngxBlurhashTransition", ngxBlurhashResolution: "ngxBlurhashResolution", ngxBlurhashLazy: "ngxBlurhashLazy" }, outputs: { blurhashLoaded: "blurhashLoaded", blurhashError: "blurhashError", blurhashTransitionEnd: "blurhashTransitionEnd" }, usesOnChanges: true, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgxBlurhashDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: 'img[ngxBlurhash]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.Renderer2 }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }], propDecorators: { ngxBlurhash: [{
                type: Input
            }], ngxBlurhashFallback: [{
                type: Input
            }], ngxBlurhashDuration: [{
                type: Input
            }], ngxBlurhashEasing: [{
                type: Input
            }], ngxBlurhashTransition: [{
                type: Input
            }], ngxBlurhashResolution: [{
                type: Input
            }], ngxBlurhashLazy: [{
                type: Input
            }], blurhashLoaded: [{
                type: Output
            }], blurhashError: [{
                type: Output
            }], blurhashTransitionEnd: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWJsdXJoYXNoLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1ibHVyaGFzaC1yZW5kZXIvc3JjL2xpYi9uZ3gtYmx1cmhhc2guZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFFTCxTQUFTLEVBRVQsWUFBWSxFQUNaLE1BQU0sRUFDTixLQUFLLEVBR0wsTUFBTSxFQUNOLFdBQVcsR0FHWixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDOztBQUdsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUtILE1BQU0sT0FBTyxvQkFBb0I7SUF5RVo7SUFDQTtJQXhFbkIsK0VBQStFO0lBRS9FLHdFQUF3RTtJQUMvRCxXQUFXLEdBQVcsRUFBRSxDQUFDO0lBRWxDOzs7T0FHRztJQUNNLG1CQUFtQixHQUFXLEVBQUUsQ0FBQztJQUUxQzs7OztPQUlHO0lBQ00sbUJBQW1CLEdBQVcsT0FBTyxDQUFDO0lBRS9DOzs7T0FHRztJQUNNLGlCQUFpQixHQUFXLFNBQVMsQ0FBQztJQUUvQzs7Ozs7O09BTUc7SUFDTSxxQkFBcUIsR0FBMkIsTUFBTSxDQUFDO0lBRWhFOzs7T0FHRztJQUNNLHFCQUFxQixHQUFXLEVBQUUsQ0FBQztJQUU1Qzs7OztPQUlHO0lBQ00sZUFBZSxHQUFZLEtBQUssQ0FBQztJQUUxQywrRUFBK0U7SUFFL0Usc0RBQXNEO0lBQ25DLGNBQWMsR0FBRyxJQUFJLFlBQVksRUFBUSxDQUFDO0lBRTdELCtFQUErRTtJQUM1RCxhQUFhLEdBQUcsSUFBSSxZQUFZLEVBQVMsQ0FBQztJQUU3RCx3REFBd0Q7SUFDckMscUJBQXFCLEdBQUcsSUFBSSxZQUFZLEVBQVEsQ0FBQztJQUVwRSxnRkFBZ0Y7SUFFeEUsTUFB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LENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDbEUsQ0FBQzt3R0E5UFUsb0JBQW9CLHFFQTJFckIsV0FBVzs0RkEzRVYsb0JBQW9COzs0RkFBcEIsb0JBQW9CO2tCQUpoQyxTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjs7MEJBNEVJLE1BQU07MkJBQUMsV0FBVzt5Q0F0RVosV0FBVztzQkFBbkIsS0FBSztnQkFNRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBT0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQU1HLGlCQUFpQjtzQkFBekIsS0FBSztnQkFTRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBTUcscUJBQXFCO3NCQUE3QixLQUFLO2dCQU9HLGVBQWU7c0JBQXZCLEtBQUs7Z0JBS2EsY0FBYztzQkFBaEMsTUFBTTtnQkFHWSxhQUFhO3NCQUEvQixNQUFNO2dCQUdZLHFCQUFxQjtzQkFBdkMsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBQTEFURk9STV9JRCxcbiAgUmVuZGVyZXIyLFxuICBTaW1wbGVDaGFuZ2VzLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IGlzUGxhdGZvcm1Ccm93c2VyIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gJ2JsdXJoYXNoJztcbmltcG9ydCB7IEJsdXJoYXNoVHJhbnNpdGlvblR5cGUgfSBmcm9tICcuL25neC1ibHVyaGFzaC5jb21wb25lbnQnO1xuXG4vKipcbiAqIEF0dHJpYnV0ZSBkaXJlY3RpdmUgdGhhdCBhZGRzIGEgYmx1cmhhc2ggcGxhY2Vob2xkZXIgdG8gYW55IGV4aXN0aW5nIGA8aW1nPmBcbiAqIGVsZW1lbnQgd2l0aG91dCByZXF1aXJpbmcgeW91IHRvIHN3YXAgaXQgZm9yIGEgY29tcG9uZW50LlxuICpcbiAqIFRoZSBkaXJlY3RpdmUgaW1wZXJhdGl2ZWx5IGNyZWF0ZXMgYSBgPGNhbnZhcz5gIHNpYmxpbmcgaW1tZWRpYXRlbHkgYmVmb3JlXG4gKiB0aGUgYDxpbWc+YCBhbmQgcG9zaXRpb25zIGJvdGggdG8gZmlsbCB0aGUgbmVhcmVzdCBwb3NpdGlvbmVkIGFuY2VzdG9yLlxuICpcbiAqICoqUmVxdWlyZW1lbnQ6KiogVGhlIGltbWVkaWF0ZSBwYXJlbnQgbXVzdCBoYXZlIGEgbm9uLXN0YXRpYyBgcG9zaXRpb25gIGFuZFxuICogYW4gZXhwbGljaXQgYHdpZHRoYCAvIGBoZWlnaHRgIHNvIHRoYXQgYHBvc2l0aW9uOiBhYnNvbHV0ZTsgaW5zZXQ6IDBgIHdvcmtzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHN0eWxlPVwicG9zaXRpb246IHJlbGF0aXZlOyB3aWR0aDogNDAwcHg7IGhlaWdodDogMzAwcHg7XCI+XG4gKiAgIDxpbWdcbiAqICAgICBbbmd4Qmx1cmhhc2hdPVwiJ0w2UGowXmpFLkF5RV8zdDd0N1IqKjBvI0RnUjQnXCJcbiAqICAgICBzcmM9XCIvYXNzZXRzL3Bob3RvLmpwZ1wiXG4gKiAgICAgYWx0PVwiQSBzY2VuaWMgbW91bnRhaW4gbGFuZHNjYXBlXCJcbiAqICAgICBuZ3hCbHVyaGFzaFRyYW5zaXRpb249XCJibHVyXCJcbiAqICAgICAoYmx1cmhhc2hMb2FkZWQpPVwib25Mb2FkZWQoKVwiXG4gKiAgIC8+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdpbWdbbmd4Qmx1cmhhc2hdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgTmd4Qmx1cmhhc2hEaXJlY3RpdmUgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkNoYW5nZXMsIE9uRGVzdHJveSB7XG5cbiAgLy8g4pSA4pSAIElucHV0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICAvKiogVGhlIGJsdXJoYXNoIHN0cmluZyB0byBkZWNvZGUuIFRoaXMgaXMgYWxzbyB0aGUgc2VsZWN0b3IgYmluZGluZy4gKi9cbiAgQElucHV0KCkgbmd4Qmx1cmhhc2g6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBGYWxsYmFjayBgc3JjYCBhcHBsaWVkIHRvIHRoZSBpbWFnZSB3aGVuIHRoZSBvcmlnaW5hbCBzb3VyY2UgZmFpbHMgdG8gbG9hZC5cbiAgICogSWYgbm90IHNldCwgdGhlIHBsYWNlaG9sZGVyIGNhbnZhcyByZW1haW5zIHZpc2libGUgb24gZXJyb3IuXG4gICAqL1xuICBASW5wdXQoKSBuZ3hCbHVyaGFzaEZhbGxiYWNrOiBzdHJpbmcgPSAnJztcblxuICAvKipcbiAgICogRHVyYXRpb24gb2YgdGhlIENTUyByZXZlYWwgdHJhbnNpdGlvbiDigJQgYW55IHZhbGlkIENTUyB0aW1lIHZhbHVlXG4gICAqIChlLmcuIGAnNDAwbXMnYCwgYCcwLjVzJ2ApLlxuICAgKiBAZGVmYXVsdCAnNDAwbXMnXG4gICAqL1xuICBASW5wdXQoKSBuZ3hCbHVyaGFzaER1cmF0aW9uOiBzdHJpbmcgPSAnNDAwbXMnO1xuXG4gIC8qKlxuICAgKiBDU1MgZWFzaW5nIGZ1bmN0aW9uIGZvciB0aGUgcmV2ZWFsIHRyYW5zaXRpb24uXG4gICAqIEBkZWZhdWx0ICdlYXNlLWluJ1xuICAgKi9cbiAgQElucHV0KCkgbmd4Qmx1cmhhc2hFYXNpbmc6IHN0cmluZyA9ICdlYXNlLWluJztcblxuICAvKipcbiAgICogVmlzdWFsIHN0eWxlIG9mIHRoZSBpbWFnZSByZXZlYWwgdHJhbnNpdGlvbi5cbiAgICogLSBgJ2ZhZGUnYCAg4oCTIHNpbXBsZSBjcm9zcy1mYWRlLlxuICAgKiAtIGAnYmx1cidgICDigJMgaW1hZ2UgbWF0ZXJpYWxpc2VzIHRocm91Z2ggYSBkZWNyZWFzaW5nIGJsdXIgZWZmZWN0LlxuICAgKiAtIGAnc2NhbGUnYCDigJMgaW1hZ2UgZmFkZXMgaW4gd2l0aCBhIHN1YnRsZSB6b29tLW91dCBtb3Rpb24uXG4gICAqIEBkZWZhdWx0ICdmYWRlJ1xuICAgKi9cbiAgQElucHV0KCkgbmd4Qmx1cmhhc2hUcmFuc2l0aW9uOiBCbHVyaGFzaFRyYW5zaXRpb25UeXBlID0gJ2ZhZGUnO1xuXG4gIC8qKlxuICAgKiBSZXNvbHV0aW9uIChwaXhlbHMpIHVzZWQgZm9yIHRoZSBibHVyaGFzaCBjYW52YXMgZGVjb2RlLlxuICAgKiBAZGVmYXVsdCAzMlxuICAgKi9cbiAgQElucHV0KCkgbmd4Qmx1cmhhc2hSZXNvbHV0aW9uOiBudW1iZXIgPSAzMjtcblxuICAvKipcbiAgICogRGVmZXIgdGhlIGJsdXJoYXNoIGRlY29kZSB1bnRpbCB0aGUgaW1hZ2UgZW50ZXJzIHRoZSB2aWV3cG9ydC5cbiAgICogVXNlcyBgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJgIHdpdGggYSBgMjAwcHhgIHJvb3QgbWFyZ2luLlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgQElucHV0KCkgbmd4Qmx1cmhhc2hMYXp5OiBib29sZWFuID0gZmFsc2U7XG5cbiAgLy8g4pSA4pSAIE91dHB1dHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgLyoqIEVtaXR0ZWQgb25jZSB0aGUgaW1hZ2UgaGFzIHN1Y2Nlc3NmdWxseSBsb2FkZWQuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBibHVyaGFzaExvYWRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxuICAvKiogRW1pdHRlZCB3aGVuIHRoZSBpbWFnZSBmYWlscyB0byBsb2FkLCBjYXJyeWluZyB0aGUgb3JpZ2luYWwgRE9NIGBFdmVudGAuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBibHVyaGFzaEVycm9yID0gbmV3IEV2ZW50RW1pdHRlcjxFdmVudD4oKTtcblxuICAvKiogRW1pdHRlZCB3aGVuIHRoZSBDU1MgcmV2ZWFsIHRyYW5zaXRpb24gY29tcGxldGVzLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgYmx1cmhhc2hUcmFuc2l0aW9uRW5kID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIC8vIOKUgOKUgCBQcml2YXRlIHN0YXRlIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIHByaXZhdGUgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGludGVyc2VjdGlvbk9ic2VydmVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGhhc0ludGVyc2VjdGVkID0gZmFsc2U7XG5cbiAgcmVhZG9ubHkgaXNCcm93c2VyOiBib29sZWFuO1xuXG4gIC8vIFN0b3JlZCB1bmxpc3RlbiBmdW5jdGlvbnMgcmV0dXJuZWQgYnkgUmVuZGVyZXIyLmxpc3RlbiBmb3IgcHJvcGVyIGNsZWFudXAuXG4gIHByaXZhdGUgdW5saXN0ZW5Mb2FkITogKCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSB1bmxpc3RlbkVycm9yITogKCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSB1bmxpc3RlblRyYW5zaXRpb25FbmQhOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZWw6IEVsZW1lbnRSZWY8SFRNTEltYWdlRWxlbWVudD4sXG4gICAgcHJpdmF0ZSByZWFkb25seSByZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHBsYXRmb3JtSWQ6IG9iamVjdCxcbiAgKSB7XG4gICAgdGhpcy5pc0Jyb3dzZXIgPSBpc1BsYXRmb3JtQnJvd3NlcihwbGF0Zm9ybUlkKTtcbiAgfVxuXG4gIC8vIOKUgOKUgCBMaWZlY3ljbGUg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5pc0Jyb3dzZXIpIHJldHVybjtcblxuICAgIHRoaXMuYnVpbGRDYW52YXMoKTtcbiAgICB0aGlzLmFwcGx5SW1nU3R5bGVzKCk7XG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycygpO1xuXG4gICAgaWYgKHRoaXMubmd4Qmx1cmhhc2hMYXp5KSB7XG4gICAgICB0aGlzLnNldHVwSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oYXNJbnRlcnNlY3RlZCA9IHRydWU7XG4gICAgICB0aGlzLnJlbmRlckNhbnZhcygpO1xuICAgIH1cblxuICAgIC8vIEJyb3dzZXJzIGZpcmUgYGxvYWRgIGJlZm9yZSBBbmd1bGFyIGF0dGFjaGVzIGxpc3RlbmVycyBmb3IgY2FjaGVkIGltYWdlcy5cbiAgICBjb25zdCBpbWcgPSB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGltZy5jb21wbGV0ZSAmJiBpbWcubmF0dXJhbFdpZHRoID4gMCkge1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB0aGlzLnJldmVhbEltYWdlKCkpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoKGNoYW5nZXNbJ25neEJsdXJoYXNoJ10gfHwgY2hhbmdlc1snbmd4Qmx1cmhhc2hSZXNvbHV0aW9uJ10pICYmIHRoaXMuY2FudmFzKSB7XG4gICAgICBpZiAoIXRoaXMubmd4Qmx1cmhhc2hMYXp5IHx8IHRoaXMuaGFzSW50ZXJzZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJDYW52YXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gICAgdGhpcy51bmxpc3RlbkxvYWQ/LigpO1xuICAgIHRoaXMudW5saXN0ZW5FcnJvcj8uKCk7XG4gICAgdGhpcy51bmxpc3RlblRyYW5zaXRpb25FbmQ/LigpO1xuXG4gICAgaWYgKHRoaXMuY2FudmFzKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnJlbmRlcmVyLnBhcmVudE5vZGUodGhpcy5jYW52YXMpO1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudCwgdGhpcy5jYW52YXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgCBQcml2YXRlIGhlbHBlcnMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgcHJpdmF0ZSBidWlsZENhbnZhcygpOiB2b2lkIHtcbiAgICBjb25zdCBpbWcgPSB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5yZW5kZXJlci5wYXJlbnROb2RlKGltZyk7XG5cbiAgICB0aGlzLmNhbnZhcyA9IHRoaXMucmVuZGVyZXIuY3JlYXRlRWxlbWVudCgnY2FudmFzJykgYXMgSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRBdHRyaWJ1dGUodGhpcy5jYW52YXMsICdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmNhbnZhcywgJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmNhbnZhcywgJ2luc2V0JywgJzAnKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuY2FudmFzLCAnd2lkdGgnLCAnMTAwJScpO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5jYW52YXMsICdoZWlnaHQnLCAnMTAwJScpO1xuICAgIHRoaXMucmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudCwgdGhpcy5jYW52YXMsIGltZyk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5SW1nU3R5bGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IGltZyA9IHRoaXMuZWwubmF0aXZlRWxlbWVudDtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoaW1nLCAncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKGltZywgJ2luc2V0JywgJzAnKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKGltZywgJ3dpZHRoJywgJzEwMCUnKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKGltZywgJ2hlaWdodCcsICcxMDAlJyk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShpbWcsICdvYmplY3QtZml0JywgJ2NvdmVyJyk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShpbWcsICdvcGFjaXR5JywgJzAnKTtcblxuICAgIC8vIFNldCB0aGUgbm9uLW9wYWNpdHkgc3RhcnQgdmFsdWVzIG5vdyBzbyB0aGUgYnJvd3NlciBoYXMgYSBzdGF0ZSB0b1xuICAgIC8vIHRyYW5zaXRpb24gRlJPTSB3aGVuIHRoZSBpbWFnZSBsb2FkcyBsYXRlci5cbiAgICBpZiAodGhpcy5uZ3hCbHVyaGFzaFRyYW5zaXRpb24gPT09ICdibHVyJykge1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShpbWcsICdmaWx0ZXInLCAnYmx1cigxMnB4KSBzYXR1cmF0ZSgxLjgpJyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm5neEJsdXJoYXNoVHJhbnNpdGlvbiA9PT0gJ3NjYWxlJykge1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShpbWcsICd0cmFuc2Zvcm0nLCAnc2NhbGUoMS4wNiknKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGF0dGFjaEV2ZW50TGlzdGVuZXJzKCk6IHZvaWQge1xuICAgIGNvbnN0IGltZyA9IHRoaXMuZWwubmF0aXZlRWxlbWVudDtcblxuICAgIHRoaXMudW5saXN0ZW5Mb2FkID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oaW1nLCAnbG9hZCcsICgpID0+IHRoaXMucmV2ZWFsSW1hZ2UoKSk7XG5cbiAgICB0aGlzLnVubGlzdGVuRXJyb3IgPSB0aGlzLnJlbmRlcmVyLmxpc3RlbihpbWcsICdlcnJvcicsIChldmVudDogRXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLm5neEJsdXJoYXNoRmFsbGJhY2spIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBdHRyaWJ1dGUoaW1nLCAnc3JjJywgdGhpcy5uZ3hCbHVyaGFzaEZhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYmx1cmhhc2hFcnJvci5lbWl0KGV2ZW50KTtcbiAgICB9KTtcblxuICAgIHRoaXMudW5saXN0ZW5UcmFuc2l0aW9uRW5kID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oaW1nLCAndHJhbnNpdGlvbmVuZCcsICgpID0+IHtcbiAgICAgIHRoaXMuYmx1cmhhc2hUcmFuc2l0aW9uRW5kLmVtaXQoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmV2ZWFsSW1hZ2UoKTogdm9pZCB7XG4gICAgY29uc3QgaW1nID0gdGhpcy5lbC5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IGR1cmF0aW9uID0gdGhpcy5uZ3hCbHVyaGFzaER1cmF0aW9uO1xuICAgIGNvbnN0IGVhc2luZyA9IHRoaXMubmd4Qmx1cmhhc2hFYXNpbmc7XG5cbiAgICAvLyBSZXNwZWN0IHRoZSB1c2VyJ3MgbW90aW9uIHByZWZlcmVuY2Ug4oCUIHNraXAgYW5pbWF0aW9uIGFuZCByZXZlYWwgaW1tZWRpYXRlbHkuXG4gICAgaWYgKHRoaXMucHJlZmVyc1JlZHVjZWRNb3Rpb24oKSkge1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShpbWcsICdvcGFjaXR5JywgJzEnKTtcbiAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlU3R5bGUoaW1nLCAnZmlsdGVyJyk7XG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZVN0eWxlKGltZywgJ3RyYW5zZm9ybScpO1xuICAgICAgdGhpcy5ibHVyaGFzaExvYWRlZC5lbWl0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3dpdGNoICh0aGlzLm5neEJsdXJoYXNoVHJhbnNpdGlvbikge1xuICAgICAgY2FzZSAnYmx1cic6XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoaW1nLCAndHJhbnNpdGlvbicsIGBvcGFjaXR5ICR7ZHVyYXRpb259ICR7ZWFzaW5nfSwgZmlsdGVyICR7ZHVyYXRpb259ICR7ZWFzaW5nfWApO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKGltZywgJ29wYWNpdHknLCAnMScpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKGltZywgJ2ZpbHRlcicsICdibHVyKDApIHNhdHVyYXRlKDEpJyk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzY2FsZSc6XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoaW1nLCAndHJhbnNpdGlvbicsIGBvcGFjaXR5ICR7ZHVyYXRpb259ICR7ZWFzaW5nfSwgdHJhbnNmb3JtICR7ZHVyYXRpb259ICR7ZWFzaW5nfWApO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKGltZywgJ29wYWNpdHknLCAnMScpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKGltZywgJ3RyYW5zZm9ybScsICdzY2FsZSgxKScpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZmFkZSc6XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKGltZywgJ3RyYW5zaXRpb24nLCBgb3BhY2l0eSAke2R1cmF0aW9ufSAke2Vhc2luZ31gKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShpbWcsICdvcGFjaXR5JywgJzEnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgdGhpcy5ibHVyaGFzaExvYWRlZC5lbWl0KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckNhbnZhcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY2FudmFzIHx8ICF0aGlzLm5neEJsdXJoYXNoKSByZXR1cm47XG5cbiAgICBjb25zdCByZXMgPSB0aGlzLm5neEJsdXJoYXNoUmVzb2x1dGlvbjtcbiAgICB0aGlzLnJlbmRlcmVyLnNldEF0dHJpYnV0ZSh0aGlzLmNhbnZhcywgJ3dpZHRoJywgU3RyaW5nKHJlcykpO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0QXR0cmlidXRlKHRoaXMuY2FudmFzLCAnaGVpZ2h0JywgU3RyaW5nKHJlcykpO1xuXG4gICAgY29uc3QgY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBpZiAoIWN0eCkgcmV0dXJuO1xuXG4gICAgY29uc3QgcGl4ZWxzID0gZGVjb2RlKHRoaXMubmd4Qmx1cmhhc2gsIHJlcywgcmVzKTtcbiAgICBjb25zdCBpbWFnZURhdGEgPSBjdHguY3JlYXRlSW1hZ2VEYXRhKHJlcywgcmVzKTtcbiAgICBpbWFnZURhdGEuZGF0YS5zZXQocGl4ZWxzKTtcbiAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gIH1cblxuICBwcml2YXRlIHNldHVwSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoKTogdm9pZCB7XG4gICAgaWYgKHR5cGVvZiBJbnRlcnNlY3Rpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuaGFzSW50ZXJzZWN0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5yZW5kZXJDYW52YXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKFxuICAgICAgKFtlbnRyeV0pID0+IHtcbiAgICAgICAgaWYgKGVudHJ5LmlzSW50ZXJzZWN0aW5nICYmICF0aGlzLmhhc0ludGVyc2VjdGVkKSB7XG4gICAgICAgICAgdGhpcy5oYXNJbnRlcnNlY3RlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5yZW5kZXJDYW52YXMoKTtcbiAgICAgICAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7IHJvb3RNYXJnaW46ICcyMDBweCAwcHgnIH0sXG4gICAgKTtcblxuICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLmVsLm5hdGl2ZUVsZW1lbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBwcmVmZXJzUmVkdWNlZE1vdGlvbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHdpbmRvdy5tYXRjaE1lZGlhKCcocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKScpLm1hdGNoZXM7XG4gIH1cbn1cbiJdfQ==