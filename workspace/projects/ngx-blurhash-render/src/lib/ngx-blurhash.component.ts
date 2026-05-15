import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgIf, isPlatformBrowser } from '@angular/common';
import { decode } from 'blurhash';

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
@Component({
  selector: 'ngx-blurhash-render',
  standalone: true,
  imports: [NgIf],
  host: {
    '[style.width]': 'width',
    '[style.height]': 'height',
    '[style.borderRadius]': 'borderRadius',
  },
  template: `
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
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
    }

    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    img {
      display: block;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
    }

    img.is-loaded.transition-fade {
      animation: blurhash-fade var(--blurhash-duration, 400ms) var(--blurhash-easing, ease-in) both;
    }

    img.is-loaded.transition-blur {
      animation: blurhash-blur var(--blurhash-duration, 400ms) var(--blurhash-easing, ease-in) both;
    }

    img.is-loaded.transition-scale {
      animation: blurhash-scale var(--blurhash-duration, 400ms) var(--blurhash-easing, ease-in) both;
    }

    @media (prefers-reduced-motion: reduce) {
      img.is-loaded {
        animation: none !important;
        opacity: 1;
      }
    }

    @keyframes blurhash-fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes blurhash-blur {
      from { opacity: 0; filter: blur(12px) saturate(1.8); }
      to   { opacity: 1; filter: blur(0)    saturate(1);   }
    }

    @keyframes blurhash-scale {
      from { opacity: 0; transform: scale(1.06); }
      to   { opacity: 1; transform: scale(1);    }
    }
  `],
})
export class NgxBlurhashComponent implements AfterViewInit, OnChanges, OnDestroy {

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** The blurhash string to decode and render as a canvas placeholder. */
  @Input() blurHash!: string;

  /** URL or asset path of the full-quality image to reveal after loading. */
  @Input() imageSrc!: string;

  /**
   * Accessible description forwarded to the underlying `<img>` `alt` attribute.
   * Provide a meaningful value for every image; omit only for purely decorative images.
   */
  @Input() alt: string = '';

  /** CSS width applied to the host element (e.g. `'300px'`, `'100%'`). @default '200px' */
  @Input() width: string = '200px';

  /** CSS height applied to the host element (e.g. `'200px'`, `'50vh'`). @default '200px' */
  @Input() height: string = '200px';

  /** CSS `border-radius` applied to the host element. @default '0' */
  @Input() borderRadius: string = '0';

  /**
   * Native `<img>` loading strategy.
   * Use `'lazy'` for below-the-fold images. Ignored when `priority` is `true`.
   * @default 'eager'
   */
  @Input() loading: 'eager' | 'lazy' = 'eager';

  /**
   * Mark this image as a high-priority Largest Contentful Paint candidate.
   * Sets `fetchpriority="high"` on the image element, signalling the browser
   * to fetch it as soon as possible.
   * @default false
   */
  @Input() priority: boolean = false;

  /**
   * URL displayed when `imageSrc` fails to load.
   * When omitted, the `[blurhashError]` content-projection slot is rendered instead.
   */
  @Input() fallbackSrc: string = '';

  /**
   * Duration of the image reveal animation — any valid CSS time value
   * (e.g. `'400ms'`, `'0.5s'`).
   * @default '400ms'
   */
  @Input() transitionDuration: string = '400ms';

  /**
   * CSS easing function for the reveal animation (e.g. `'ease-in'`, `'cubic-bezier(0.4,0,0.2,1)'`).
   * @default 'ease-in'
   */
  @Input() transitionEasing: string = 'ease-in';

  /**
   * Visual style of the image reveal transition.
   * - `'fade'`  – simple cross-fade from placeholder to image.
   * - `'blur'`  – image materialises through a decreasing blur and saturation effect.
   * - `'scale'` – image fades in with a subtle zoom-out motion.
   * @default 'fade'
   */
  @Input() transitionType: BlurhashTransitionType = 'fade';

  /**
   * Internal resolution (in pixels) at which the blurhash is decoded onto the canvas.
   * The canvas is always CSS-stretched to fill the host, so this only affects placeholder
   * gradient smoothness. Lower values decode faster; higher values are finer-grained.
   * @default 32
   */
  @Input() canvasResolution: number = 32;

  /**
   * When `true`, defers the blurhash decode until the component enters the viewport,
   * using `IntersectionObserver` with a `200px` root margin.
   * Falls back to immediate decode in environments without `IntersectionObserver`.
   * @default false
   */
  @Input() lazyDecode: boolean = false;

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted once the image has successfully loaded. */
  @Output() readonly loaded = new EventEmitter<void>();

  /** Emitted when the image fails to load, carrying the original DOM `Event`. */
  @Output() readonly loadError = new EventEmitter<Event>();

  /** Emitted when the CSS reveal animation completes. */
  @Output() readonly transitionEnd = new EventEmitter<void>();

  // ── Internal state ───────────────────────────────────────────────────────────

  protected isLoaded = false;
  protected hasError = false;

  @ViewChild('blurhashCanvas') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('blurhashImg') private readonly imgRef!: ElementRef<HTMLImageElement>;

  readonly isBrowser: boolean;
  private intersectionObserver: IntersectionObserver | null = null;
  private hasIntersected = false;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly hostEl: ElementRef<HTMLElement>,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
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

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    if (this.lazyDecode) {
      this.setupIntersectionObserver();
    } else {
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

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
  }

  // ── Event handlers ───────────────────────────────────────────────────────────

  protected onLoad(): void {
    this.isLoaded = true;
    this.loaded.emit();
  }

  protected onError(event: Event): void {
    this.hasError = true;
    this.loadError.emit(event);
  }

  protected onTransitionEnd(): void {
    this.transitionEnd.emit();
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private renderCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.blurHash) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const res = this.canvasResolution;
    const pixels = decode(this.blurHash, res, res);
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

    this.intersectionObserver.observe(this.hostEl.nativeElement);
  }
}
