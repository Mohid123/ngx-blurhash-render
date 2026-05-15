import { AfterViewInit, ElementRef, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import * as i0 from "@angular/core";
/** Animation style used for the image reveal transition. */
export type BlurhashTransitionType = 'fade' | 'blur' | 'scale';
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
export declare class NgxBlurhashComponent implements AfterViewInit, OnChanges, OnDestroy {
    private readonly hostEl;
    /** The blurhash string to decode and render as a canvas placeholder. */
    blurHash: string;
    /** URL or asset path of the full-quality image to reveal after loading. */
    imageSrc: string;
    /**
     * Accessible description forwarded to the underlying `<img>` `alt` attribute.
     * Provide a meaningful value for every image; omit only for purely decorative images.
     */
    alt: string;
    /** CSS width applied to the host element (e.g. `'300px'`, `'100%'`). @default '200px' */
    width: string;
    /** CSS height applied to the host element (e.g. `'200px'`, `'50vh'`). @default '200px' */
    height: string;
    /** CSS `border-radius` applied to the host element. @default '0' */
    borderRadius: string;
    /**
     * Native `<img>` loading strategy.
     * Use `'lazy'` for below-the-fold images. Ignored when `priority` is `true`.
     * @default 'eager'
     */
    loading: 'eager' | 'lazy';
    /**
     * Mark this image as a high-priority Largest Contentful Paint candidate.
     * Sets `fetchpriority="high"` on the image element, signalling the browser
     * to fetch it as soon as possible.
     * @default false
     */
    priority: boolean;
    /**
     * URL displayed when `imageSrc` fails to load.
     * When omitted, the `[blurhashError]` content-projection slot is rendered instead.
     */
    fallbackSrc: string;
    /**
     * Duration of the image reveal animation — any valid CSS time value
     * (e.g. `'400ms'`, `'0.5s'`).
     * @default '400ms'
     */
    transitionDuration: string;
    /**
     * CSS easing function for the reveal animation (e.g. `'ease-in'`, `'cubic-bezier(0.4,0,0.2,1)'`).
     * @default 'ease-in'
     */
    transitionEasing: string;
    /**
     * Visual style of the image reveal transition.
     * - `'fade'`  – simple cross-fade from placeholder to image.
     * - `'blur'`  – image materialises through a decreasing blur and saturation effect.
     * - `'scale'` – image fades in with a subtle zoom-out motion.
     * @default 'fade'
     */
    transitionType: BlurhashTransitionType;
    /**
     * Internal resolution (in pixels) at which the blurhash is decoded onto the canvas.
     * The canvas is always CSS-stretched to fill the host, so this only affects placeholder
     * gradient smoothness. Lower values decode faster; higher values are finer-grained.
     * @default 32
     */
    canvasResolution: number;
    /**
     * When `true`, defers the blurhash decode until the component enters the viewport,
     * using `IntersectionObserver` with a `200px` root margin.
     * Falls back to immediate decode in environments without `IntersectionObserver`.
     * @default false
     */
    lazyDecode: boolean;
    /** Emitted once the image has successfully loaded. */
    readonly loaded: EventEmitter<void>;
    /** Emitted when the image fails to load, carrying the original DOM `Event`. */
    readonly loadError: EventEmitter<Event>;
    /** Emitted when the CSS reveal animation completes. */
    readonly transitionEnd: EventEmitter<void>;
    protected isLoaded: boolean;
    protected hasError: boolean;
    private readonly canvasRef;
    private readonly imgRef;
    readonly isBrowser: boolean;
    private intersectionObserver;
    private hasIntersected;
    constructor(platformId: object, hostEl: ElementRef<HTMLElement>);
    ngOnChanges(changes: SimpleChanges): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    protected onLoad(): void;
    protected onError(event: Event): void;
    protected onTransitionEnd(): void;
    private renderCanvas;
    private setupIntersectionObserver;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxBlurhashComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<NgxBlurhashComponent, "ngx-blurhash-render", never, { "blurHash": { "alias": "blurHash"; "required": false; }; "imageSrc": { "alias": "imageSrc"; "required": false; }; "alt": { "alias": "alt"; "required": false; }; "width": { "alias": "width"; "required": false; }; "height": { "alias": "height"; "required": false; }; "borderRadius": { "alias": "borderRadius"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "priority": { "alias": "priority"; "required": false; }; "fallbackSrc": { "alias": "fallbackSrc"; "required": false; }; "transitionDuration": { "alias": "transitionDuration"; "required": false; }; "transitionEasing": { "alias": "transitionEasing"; "required": false; }; "transitionType": { "alias": "transitionType"; "required": false; }; "canvasResolution": { "alias": "canvasResolution"; "required": false; }; "lazyDecode": { "alias": "lazyDecode"; "required": false; }; }, { "loaded": "loaded"; "loadError": "loadError"; "transitionEnd": "transitionEnd"; }, never, ["[blurhashError]"], true, never>;
}
