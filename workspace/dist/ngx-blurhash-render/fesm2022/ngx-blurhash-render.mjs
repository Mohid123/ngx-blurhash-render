import * as i0 from '@angular/core';
import { EventEmitter, PLATFORM_ID, Component, Inject, Input, Output, ViewChild, Directive, Injectable } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { decode, encode } from 'blurhash';

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
class NgxBlurhashComponent {
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
class NgxBlurhashDirective {
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
class NgxBlurhashGeneratorService {
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

/*
 * Public API Surface of ngx-blurhash-render
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NgxBlurhashComponent, NgxBlurhashDirective, NgxBlurhashGeneratorService };
//# sourceMappingURL=ngx-blurhash-render.mjs.map
