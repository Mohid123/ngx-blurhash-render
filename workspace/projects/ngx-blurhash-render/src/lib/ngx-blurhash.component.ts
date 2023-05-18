import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, Input, PLATFORM_ID, ViewChild } from '@angular/core';
import { decode } from 'blurhash';

/**
 * Blurhash rendering component for Angular 15+
 */
@Component({
  selector: 'ngx-blurhash-render',
  template: `
    <canvas
      #canvas
      [width]="canvasWidth"
      [height]="canvasHeight"
      [style.borderRadius]="borderRadius"
      [style.width]="width"
      [style.height]="height"
    ></canvas>
    <img
      alt="blurred-image"
      [ngSrc]="imageSrc"
      width="100"
      height="100"
      (load)="imageLoad = true"
      (onloadeddata)="imageLoaded = true"
      [class.img-loaded]="imageLoad"
      [style.borderRadius]="borderRadius"
      [style.width]="width"
      [style.height]="height"
    >
  `,
  styles: [
    `
    :host {
      display: block;
      position: relative;
    }

    canvas {
      height: 100%;
      width: 100%;
      position: absolute;
      left: 0;
    }

    img {
      opacity: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      object-fit: cover;
      left: 0;
    }

    .img-loaded {
      animation: popIn 0.4s both ease-in;
    }

    @keyframes popIn {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }
  `
  ]
})
export class NgxBlurhashComponent {

  private blurHashValue!: string;

  /**
   * The blurHash string to render on the Canvas
   */
  @Input()
  get blurHash(): string {
    return this.blurHashValue;
  }
  set blurHash(value: string) {
    this.blurHashValue = value;
    this.decodeBlurHash();
  }


  /**
   * The image src string to render after fully loaded
   */
  private imageSrcValue!: string;
  @Input()
  get imageSrc(): string {
    return this.imageSrcValue;
  }
  set imageSrc(value: string) {
    this.imageSrcValue = value;
  }

  /**
   * The loading of the image based on its position in the DOM. By default loading is set to 'eager'
   */
  @Input() loading: string = 'eager';

  /**
   * Border Radius for the image in px. Default value is 0px
   */
  @Input() borderRadius: string = '0';

  /**
   * The width of the image and canvas in px. Default value is 200px
   */
  @Input() width: string = '200px';

  /**
   * The height of the image and canvas in px. Default value is 200px
   */
  @Input() height: string = '200px';

  public imageLoaded = false;
  public imageLoad = false;

  @ViewChild('canvas')
  private canvas!: ElementRef<HTMLCanvasElement>;

  public canvasWidth = 100;
  public canvasHeight = 100;



  public isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  public ngAfterViewInit(): void {
    this.decodeBlurHash();
  }

  private decodeBlurHash() {
    if (this.canvas && this.blurHash) {
      const context = this.canvas.nativeElement.getContext('2d');
      const imageData = context?.createImageData(this.canvasWidth, this.canvasHeight);
      const pixels = decode(this.blurHash, this.canvasWidth, this.canvasHeight);
      imageData?.data.set(pixels);
      if(imageData)
        context?.putImageData(imageData, 0, 0);
    }
  }


}
