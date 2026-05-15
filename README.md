# ngx-blurhash-render

[![npm version](https://img.shields.io/npm/v/ngx-blurhash-render)](https://www.npmjs.com/package/ngx-blurhash-render)
[![npm downloads](https://img.shields.io/npm/dw/ngx-blurhash-render)](https://www.npmjs.com/package/ngx-blurhash-render)
[![license](https://img.shields.io/npm/l/ngx-blurhash-render)](LICENSE.md)
[![Angular](https://img.shields.io/badge/Angular-15--19-red?logo=angular)](https://angular.io)

A lightweight Angular library that renders a [blurhash](https://blurha.sh) placeholder canvas and smoothly transitions to the real image once it has loaded.

**[Live Demo](https://blurhash-pkg-demo.pages.dev/)**

---

## What's New in v18.1

- **`NgxBlurhashGeneratorService`** — generate a blurhash string from any image URL, in the browser (Canvas API) or on the server (sharp + Angular SSR)

## What's New in v18.0

- **Directive** — apply blurhash to any existing `<img>` with `[ngxBlurhash]`, no template restructuring needed
- **Event outputs** — `(loaded)`, `(loadError)`, `(transitionEnd)` on both component and directive
- **Three transition types** — `fade`, `blur`, `scale` with configurable duration and easing
- **Error handling** — `[fallbackSrc]` input and a `[blurhashError]` content-projection slot
- **`priority` input** — sets `fetchpriority="high"` for LCP images
- **`lazyDecode` input** — defers the canvas decode until the element enters the viewport via `IntersectionObserver`
- **`alt` input** — forwarded to the underlying `<img>` for full accessibility compliance
- **`canvasResolution` input** — control the decode quality / speed trade-off
- **Host-element sizing** — `width`, `height`, and `borderRadius` now bind directly to the host element, not to internal children
- **`prefers-reduced-motion`** — animations are automatically skipped for users who opt out of motion
- **Angular 18 & 19 support** — peer dependency range extended to `^15 || ^16 || ^17 || ^18 || ^19`
- **Removed NgOptimizedImage** — the internal `[ngSrc]` binding is replaced with a standard `[src]`, removing the image-CDN requirement

---

## Generating Blurhash Strings

> **Don't have a blurhash string yet?**
> `NgxBlurhashGeneratorService` generates one from any image URL — in the **browser** using the Canvas API, or on the **server** using [sharp](https://sharp.pixelplumbing.com/) in Angular SSR apps. No pre-processing pipeline required.

### Import

The service is `providedIn: 'root'` — just inject it. No module setup needed.

```typescript
import { NgxBlurhashGeneratorService } from 'ngx-blurhash-render';

@Component({ ... })
export class MyComponent {
  hash = '';

  constructor(private readonly generator: NgxBlurhashGeneratorService) {}

  async loadImage(url: string): Promise<void> {
    this.hash = await this.generator.generate(url);
  }
}
```

```html
<ngx-blurhash-render
  [blurHash]="hash"
  [imageSrc]="imageUrl"
  [alt]="'My image'"
/>
```

### Server-side generation (Angular SSR / Node.js)

In an Angular Universal or SSR app the service automatically uses
[`sharp`](https://sharp.pixelplumbing.com/) on the server, which supports
local file paths, remote URLs, and any format sharp can decode.
Install it as an optional dependency:

```bash
npm install sharp
```

```typescript
// app.component.server.ts  (or any server-rendered component)
export class AppComponent implements OnInit {
  hash = '';

  constructor(private readonly generator: NgxBlurhashGeneratorService) {}

  async ngOnInit(): Promise<void> {
    // Runs on the server — uses sharp automatically
    this.hash = await this.generator.generate('/assets/hero.jpg');
  }
}
```

The generated hash is serialised into the SSR transfer state, so the client
receives a fully-rendered placeholder without re-generating on hydration.

### `generate()` options

```typescript
generator.generate(src, {
  componentX: 4,   // horizontal detail components (1–9, default 4)
  componentY: 3,   // vertical detail components   (1–9, default 3)
  sampleSize: 64,  // internal decode resolution in pixels (default 64)
});
```

| Option       | Type     | Default | Description                                                              |
|--------------|----------|---------|--------------------------------------------------------------------------|
| `componentX` | `number` | `4`     | Horizontal blurhash components (1–9). Higher = more horizontal detail.  |
| `componentY` | `number` | `3`     | Vertical blurhash components (1–9). Higher = more vertical detail.      |
| `sampleSize` | `number` | `64`    | Resolution for internal pixel sampling. Higher = more accurate hash.    |

### CORS note (browser)

When generating from a cross-origin URL in the browser, the image server must
send `Access-Control-Allow-Origin` headers, otherwise the canvas will be
tainted and `generate()` will throw. For same-origin URLs and local assets
this is never an issue.

---

## Installation

```bash
npm install ngx-blurhash-render blurhash
```

`blurhash` is a required peer dependency for the decode logic.

---

## Component

### Import

```typescript
import { NgxBlurhashComponent } from 'ngx-blurhash-render';

@Component({
  standalone: true,
  imports: [NgxBlurhashComponent],
  // ...
})
export class MyComponent {}
```

### Basic usage

```html
<ngx-blurhash-render
  [blurHash]="'L38gy-00~qIUIUt7M{RjM{j[t7of'"
  [imageSrc]="'/assets/photo.jpg'"
  [alt]="'A scenic mountain landscape'"
  [width]="'400px'"
  [height]="'300px'"
  [borderRadius]="'12px'"
/>
```

### With outputs and fallback

```html
<ngx-blurhash-render
  [blurHash]="hash"
  [imageSrc]="imageUrl"
  [alt]="imageAlt"
  [width]="'600px'"
  [height]="'400px'"
  [fallbackSrc]="'/assets/fallback.jpg'"
  [transitionType]="'blur'"
  [transitionDuration]="'600ms'"
  (loaded)="onImageLoaded()"
  (loadError)="onImageError($event)"
  (transitionEnd)="onRevealComplete()"
/>
```

### With a custom error slot

When `imageSrc` fails and no `fallbackSrc` is set, anything projected with `[blurhashError]` is shown:

```html
<ngx-blurhash-render
  [blurHash]="hash"
  [imageSrc]="imageUrl"
  [alt]="imageAlt"
  [width]="'400px'"
  [height]="'300px'"
>
  <div blurhashError class="error-overlay">
    Failed to load image
  </div>
</ngx-blurhash-render>
```

### LCP / above-the-fold images

```html
<ngx-blurhash-render
  [blurHash]="heroHash"
  [imageSrc]="heroImage"
  [alt]="'Hero banner'"
  [width]="'100%'"
  [height]="'500px'"
  [priority]="true"
/>
```

### Lazy decode for long lists

Defers the CPU-intensive canvas decode until the item enters the viewport:

```html
<ngx-blurhash-render
  *ngFor="let item of items"
  [blurHash]="item.hash"
  [imageSrc]="item.url"
  [alt]="item.alt"
  [width]="'200px'"
  [height]="'200px'"
  [lazyDecode]="true"
  [loading]="'lazy'"
/>
```

### Component API

#### Inputs

| Input               | Type                          | Default    | Description                                                              |
|---------------------|-------------------------------|------------|--------------------------------------------------------------------------|
| `blurHash`          | `string`                      | —          | The blurhash string to decode and render as a placeholder.               |
| `imageSrc`          | `string`                      | —          | URL or asset path of the full-quality image.                             |
| `alt`               | `string`                      | `''`       | Accessible description forwarded to the `<img>` alt attribute.           |
| `width`             | `string`                      | `'200px'`  | CSS width of the host element.                                           |
| `height`            | `string`                      | `'200px'`  | CSS height of the host element.                                          |
| `borderRadius`      | `string`                      | `'0'`      | CSS `border-radius` of the host element.                                 |
| `loading`           | `'eager' \| 'lazy'`           | `'eager'`  | Native `<img>` loading strategy.                                         |
| `priority`          | `boolean`                     | `false`    | Adds `fetchpriority="high"` for LCP images.                              |
| `fallbackSrc`       | `string`                      | `''`       | Image URL shown when `imageSrc` fails. Overrides the `[blurhashError]` slot. |
| `transitionDuration`| `string`                      | `'400ms'`  | CSS time value for the reveal animation duration.                        |
| `transitionEasing`  | `string`                      | `'ease-in'`| CSS easing function for the reveal animation.                            |
| `transitionType`    | `'fade' \| 'blur' \| 'scale'` | `'fade'`   | Visual style of the reveal transition.                                   |
| `canvasResolution`  | `number`                      | `32`       | Internal decode resolution in pixels. Higher = smoother gradients.       |
| `lazyDecode`        | `boolean`                     | `false`    | Defer decode until the element enters the viewport (IntersectionObserver).|

#### Outputs

| Output          | Type                   | Description                                          |
|-----------------|------------------------|------------------------------------------------------|
| `loaded`        | `EventEmitter<void>`   | Fires once the image has successfully loaded.        |
| `loadError`     | `EventEmitter<Event>`  | Fires when the image fails to load.                  |
| `transitionEnd` | `EventEmitter<void>`   | Fires when the CSS reveal animation completes.       |

#### Content projection

| Slot              | Condition                                     | Description                         |
|-------------------|-----------------------------------------------|-------------------------------------|
| `[blurhashError]` | Image failed and `fallbackSrc` is not set     | Render a custom error state.        |

---

## Directive

Use `NgxBlurhashDirective` when you already have an `<img>` element and don't want to restructure your template.

The directive creates a `<canvas>` sibling immediately before your `<img>` and positions both elements to fill the nearest **positioned** ancestor.

**Requirement:** The parent element must have `position: relative` (or any non-static value) and an explicit `width` / `height`.

### Import

```typescript
import { NgxBlurhashDirective } from 'ngx-blurhash-render';

@Component({
  standalone: true,
  imports: [NgxBlurhashDirective],
  // ...
})
export class MyComponent {}
```

### Usage

```html
<div style="position: relative; width: 400px; height: 300px; border-radius: 12px; overflow: hidden;">
  <img
    [ngxBlurhash]="'L38gy-00~qIUIUt7M{RjM{j[t7of'"
    src="/assets/photo.jpg"
    alt="A scenic mountain landscape"
    ngxBlurhashTransition="blur"
    ngxBlurhashDuration="600ms"
    ngxBlurhashFallback="/assets/fallback.jpg"
    (blurhashLoaded)="onLoaded()"
    (blurhashError)="onError($event)"
  />
</div>
```

### With lazy decode in a list

```html
<div
  *ngFor="let item of items"
  style="position: relative; width: 200px; height: 200px;"
>
  <img
    [ngxBlurhash]="item.hash"
    [src]="item.url"
    [alt]="item.alt"
    [ngxBlurhashLazy]="true"
    loading="lazy"
  />
</div>
```

### Directive API

#### Inputs

| Input                    | Type                          | Default    | Description                                                               |
|--------------------------|-------------------------------|------------|---------------------------------------------------------------------------|
| `ngxBlurhash`            | `string`                      | —          | The blurhash string (also the selector binding).                          |
| `ngxBlurhashFallback`    | `string`                      | `''`       | Fallback `src` applied when the image fails to load.                      |
| `ngxBlurhashDuration`    | `string`                      | `'400ms'`  | CSS time value for the reveal transition duration.                        |
| `ngxBlurhashEasing`      | `string`                      | `'ease-in'`| CSS easing function for the reveal transition.                            |
| `ngxBlurhashTransition`  | `'fade' \| 'blur' \| 'scale'` | `'fade'`   | Visual style of the reveal transition.                                    |
| `ngxBlurhashResolution`  | `number`                      | `32`       | Internal decode resolution in pixels.                                     |
| `ngxBlurhashLazy`        | `boolean`                     | `false`    | Defer decode until the element enters the viewport (IntersectionObserver).|

#### Outputs

| Output                   | Type                   | Description                                       |
|--------------------------|------------------------|---------------------------------------------------|
| `blurhashLoaded`         | `EventEmitter<void>`   | Fires once the image has successfully loaded.     |
| `blurhashError`          | `EventEmitter<Event>`  | Fires when the image fails to load.               |
| `blurhashTransitionEnd`  | `EventEmitter<void>`   | Fires when the CSS reveal transition completes.   |

---

## Transition types

| Type    | Effect                                                   |
|---------|----------------------------------------------------------|
| `fade`  | Image cross-fades from transparent to opaque.            |
| `blur`  | Image materialises through a decreasing blur and saturation effect. |
| `scale` | Image fades in with a subtle zoom-out motion.            |

All transitions respect `prefers-reduced-motion`: when enabled, animations are skipped and the image appears immediately.

---

## SSR / Angular Universal

The library is fully SSR-compatible. Canvas decoding and `IntersectionObserver` setup are gated behind `isPlatformBrowser()` and are skipped entirely on the server. The placeholder container renders with correct dimensions on the server, preventing layout shift on hydration.

---

## Migrating from v17

### Breaking changes

| Change | Action required |
|---|---|
| `[ngSrc]` replaced with `[src]` | No action needed — the `imageSrc` input works identically. If you relied on Angular's `NgOptimizedImage` CDN loaders, configure them on your own `<img>` elements or use the directive. |
| `loading` type narrowed to `'eager' \| 'lazy'` | Replace any other string values with `'eager'` or `'lazy'`. |
| `width` / `height` / `borderRadius` now on the host element | If you were overriding these via CSS targeting internal elements, target the `ngx-blurhash-render` host selector instead. |

### New default behaviour

The `canvasResolution` default changed from `100` to `32`. This makes the initial decode significantly faster with no perceptible quality difference, since the canvas is always CSS-scaled to fill the container. To restore the old behaviour, add `[canvasResolution]="100"`.

---

## Angular compatibility

| Library version | Angular version |
|-----------------|-----------------|
| 18.x            | 15, 16, 17, 18, 19 |
| 17.x            | 15, 16, 17      |

---

## License

[MIT](LICENSE.md) © Muhammad Mohid
