import { AfterViewInit, ElementRef, EventEmitter, OnChanges, OnDestroy, Renderer2, SimpleChanges } from '@angular/core';
import { BlurhashTransitionType } from './ngx-blurhash.component';
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
export declare class NgxBlurhashDirective implements AfterViewInit, OnChanges, OnDestroy {
    private readonly el;
    private readonly renderer;
    /** The blurhash string to decode. This is also the selector binding. */
    ngxBlurhash: string;
    /**
     * Fallback `src` applied to the image when the original source fails to load.
     * If not set, the placeholder canvas remains visible on error.
     */
    ngxBlurhashFallback: string;
    /**
     * Duration of the CSS reveal transition — any valid CSS time value
     * (e.g. `'400ms'`, `'0.5s'`).
     * @default '400ms'
     */
    ngxBlurhashDuration: string;
    /**
     * CSS easing function for the reveal transition.
     * @default 'ease-in'
     */
    ngxBlurhashEasing: string;
    /**
     * Visual style of the image reveal transition.
     * - `'fade'`  – simple cross-fade.
     * - `'blur'`  – image materialises through a decreasing blur effect.
     * - `'scale'` – image fades in with a subtle zoom-out motion.
     * @default 'fade'
     */
    ngxBlurhashTransition: BlurhashTransitionType;
    /**
     * Resolution (pixels) used for the blurhash canvas decode.
     * @default 32
     */
    ngxBlurhashResolution: number;
    /**
     * Defer the blurhash decode until the image enters the viewport.
     * Uses `IntersectionObserver` with a `200px` root margin.
     * @default false
     */
    ngxBlurhashLazy: boolean;
    /** Emitted once the image has successfully loaded. */
    readonly blurhashLoaded: EventEmitter<void>;
    /** Emitted when the image fails to load, carrying the original DOM `Event`. */
    readonly blurhashError: EventEmitter<Event>;
    /** Emitted when the CSS reveal transition completes. */
    readonly blurhashTransitionEnd: EventEmitter<void>;
    private canvas;
    private intersectionObserver;
    private hasIntersected;
    readonly isBrowser: boolean;
    private unlistenLoad;
    private unlistenError;
    private unlistenTransitionEnd;
    constructor(el: ElementRef<HTMLImageElement>, renderer: Renderer2, platformId: object);
    ngAfterViewInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    private buildCanvas;
    private applyImgStyles;
    private attachEventListeners;
    private revealImage;
    private renderCanvas;
    private setupIntersectionObserver;
    private prefersReducedMotion;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxBlurhashDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<NgxBlurhashDirective, "img[ngxBlurhash]", never, { "ngxBlurhash": { "alias": "ngxBlurhash"; "required": false; }; "ngxBlurhashFallback": { "alias": "ngxBlurhashFallback"; "required": false; }; "ngxBlurhashDuration": { "alias": "ngxBlurhashDuration"; "required": false; }; "ngxBlurhashEasing": { "alias": "ngxBlurhashEasing"; "required": false; }; "ngxBlurhashTransition": { "alias": "ngxBlurhashTransition"; "required": false; }; "ngxBlurhashResolution": { "alias": "ngxBlurhashResolution"; "required": false; }; "ngxBlurhashLazy": { "alias": "ngxBlurhashLazy"; "required": false; }; }, { "blurhashLoaded": "blurhashLoaded"; "blurhashError": "blurhashError"; "blurhashTransitionEnd": "blurhashTransitionEnd"; }, never, never, true, never>;
}
