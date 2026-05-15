import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { decode } from 'blurhash';
import { BlurhashTransitionType } from './ngx-blurhash.component';

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
@Directive({
  selector: 'img[ngxBlurhash]',
  standalone: true,
})
export class NgxBlurhashDirective implements AfterViewInit, OnChanges, OnDestroy {

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** The blurhash string to decode. This is also the selector binding. */
  @Input() ngxBlurhash: string = '';

  /**
   * Fallback `src` applied to the image when the original source fails to load.
   * If not set, the placeholder canvas remains visible on error.
   */
  @Input() ngxBlurhashFallback: string = '';

  /**
   * Duration of the CSS reveal transition — any valid CSS time value
   * (e.g. `'400ms'`, `'0.5s'`).
   * @default '400ms'
   */
  @Input() ngxBlurhashDuration: string = '400ms';

  /**
   * CSS easing function for the reveal transition.
   * @default 'ease-in'
   */
  @Input() ngxBlurhashEasing: string = 'ease-in';

  /**
   * Visual style of the image reveal transition.
   * - `'fade'`  – simple cross-fade.
   * - `'blur'`  – image materialises through a decreasing blur effect.
   * - `'scale'` – image fades in with a subtle zoom-out motion.
   * @default 'fade'
   */
  @Input() ngxBlurhashTransition: BlurhashTransitionType = 'fade';

  /**
   * Resolution (pixels) used for the blurhash canvas decode.
   * @default 32
   */
  @Input() ngxBlurhashResolution: number = 32;

  /**
   * Defer the blurhash decode until the image enters the viewport.
   * Uses `IntersectionObserver` with a `200px` root margin.
   * @default false
   */
  @Input() ngxBlurhashLazy: boolean = false;

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted once the image has successfully loaded. */
  @Output() readonly blurhashLoaded = new EventEmitter<void>();

  /** Emitted when the image fails to load, carrying the original DOM `Event`. */
  @Output() readonly blurhashError = new EventEmitter<Event>();

  /** Emitted when the CSS reveal transition completes. */
  @Output() readonly blurhashTransitionEnd = new EventEmitter<void>();

  // ── Private state ────────────────────────────────────────────────────────────

  private canvas: HTMLCanvasElement | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private hasIntersected = false;

  readonly isBrowser: boolean;

  // Stored unlisten functions returned by Renderer2.listen for proper cleanup.
  private unlistenLoad!: () => void;
  private unlistenError!: () => void;
  private unlistenTransitionEnd!: () => void;

  constructor(
    private readonly el: ElementRef<HTMLImageElement>,
    private readonly renderer: Renderer2,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.buildCanvas();
    this.applyImgStyles();
    this.attachEventListeners();

    if (this.ngxBlurhashLazy) {
      this.setupIntersectionObserver();
    } else {
      this.hasIntersected = true;
      this.renderCanvas();
    }

    // Browsers fire `load` before Angular attaches listeners for cached images.
    const img = this.el.nativeElement;
    if (img.complete && img.naturalWidth > 0) {
      Promise.resolve().then(() => this.revealImage());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['ngxBlurhash'] || changes['ngxBlurhashResolution']) && this.canvas) {
      if (!this.ngxBlurhashLazy || this.hasIntersected) {
        this.renderCanvas();
      }
    }
  }

  ngOnDestroy(): void {
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

  private buildCanvas(): void {
    const img = this.el.nativeElement;
    const parent = this.renderer.parentNode(img);

    this.canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
    this.renderer.setAttribute(this.canvas, 'aria-hidden', 'true');
    this.renderer.setStyle(this.canvas, 'position', 'absolute');
    this.renderer.setStyle(this.canvas, 'inset', '0');
    this.renderer.setStyle(this.canvas, 'width', '100%');
    this.renderer.setStyle(this.canvas, 'height', '100%');
    this.renderer.insertBefore(parent, this.canvas, img);
  }

  private applyImgStyles(): void {
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
    } else if (this.ngxBlurhashTransition === 'scale') {
      this.renderer.setStyle(img, 'transform', 'scale(1.06)');
    }
  }

  private attachEventListeners(): void {
    const img = this.el.nativeElement;

    this.unlistenLoad = this.renderer.listen(img, 'load', () => this.revealImage());

    this.unlistenError = this.renderer.listen(img, 'error', (event: Event) => {
      if (this.ngxBlurhashFallback) {
        this.renderer.setAttribute(img, 'src', this.ngxBlurhashFallback);
      }
      this.blurhashError.emit(event);
    });

    this.unlistenTransitionEnd = this.renderer.listen(img, 'transitionend', () => {
      this.blurhashTransitionEnd.emit();
    });
  }

  private revealImage(): void {
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

  private renderCanvas(): void {
    if (!this.canvas || !this.ngxBlurhash) return;

    const res = this.ngxBlurhashResolution;
    this.renderer.setAttribute(this.canvas, 'width', String(res));
    this.renderer.setAttribute(this.canvas, 'height', String(res));

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const pixels = decode(this.ngxBlurhash, res, res);
    const imageData = ctx.createImageData(res, res);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.hasIntersected = true;
      this.renderCanvas();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.hasIntersected) {
          this.hasIntersected = true;
          this.renderCanvas();
          this.intersectionObserver?.disconnect();
          this.intersectionObserver = null;
        }
      },
      { rootMargin: '200px 0px' },
    );

    this.intersectionObserver.observe(this.el.nativeElement);
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
