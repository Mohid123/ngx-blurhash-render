import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, Input, PLATFORM_ID, ViewChild } from '@angular/core';
import { decode } from 'blurhash';

@Component({
  selector: 'ngx-blurhash-render',
  template: `
    <canvas #canvas [width]="canvasWidth" [height]="canvasHeight"></canvas>
    <img [attr.loading]="loading" [src]="imageSrc" (load)="imageLoad = true" (onloadeddata)="imageLoaded = true" [class.img-loaded]="imageLoad">
  `,
  styles: [
    `
    :host {
      display: block;
    }

    canvas {
      height: 100%;
      width: 100%;
      position: absolute;
      left: 0;
      border-radius: 12px;
    }

    img {
      opacity: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      object-fit: cover;
      left: 0;
      border-radius: 8px;
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
  @Input()
  get blurHash(): string {
    return this.blurHashValue;
  }
  set blurHash(value: string) {
    this.blurHashValue = value;
    this.decodeBlurHash();
  }

  private imageSrcValue!: string;
  @Input()
  get imageSrc(): string {
    return this.imageSrcValue;
  }
  set imageSrc(value: string) {
    this.imageSrcValue = value;
  }

  @Input() loading: string = 'eager';
  @Input() first: boolean = false;


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
