import * as i0 from '@angular/core';
import { Injectable, PLATFORM_ID, Component, Inject, Input, ViewChild, NgModule } from '@angular/core';
import * as i1 from '@angular/common';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { decode } from 'blurhash';

class NgxBlurhashService {
    constructor() { }
}
NgxBlurhashService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
NgxBlurhashService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return []; } });

/**
 * Blurhash rendering component for Angular 15+
 */
class NgxBlurhashComponent {
    constructor(platformId) {
        /**
         * The loading of the image based on its position in the DOM. By default loading is set to 'eager'
         */
        this.loading = 'eager';
        /**
         * Border Radius for the image in px. Default value is 0px
         */
        this.borderRadius = '0';
        /**
         * The width of the image and canvas in px. Default value is 200px
         */
        this.width = '200px';
        /**
         * The height of the image and canvas in px. Default value is 200px
         */
        this.height = '200px';
        this.imageLoaded = false;
        this.imageLoad = false;
        this.canvasWidth = 100;
        this.canvasHeight = 100;
        this.isBrowser = isPlatformBrowser(platformId);
    }
    /**
     * The blurHash string to render on the Canvas
     */
    get blurHash() {
        return this.blurHashValue;
    }
    set blurHash(value) {
        this.blurHashValue = value;
        this.decodeBlurHash();
    }
    get imageSrc() {
        return this.imageSrcValue;
    }
    set imageSrc(value) {
        this.imageSrcValue = value;
    }
    ngAfterViewInit() {
        this.decodeBlurHash();
    }
    decodeBlurHash() {
        if (this.canvas && this.blurHash) {
            const context = this.canvas.nativeElement.getContext('2d');
            const imageData = context === null || context === void 0 ? void 0 : context.createImageData(this.canvasWidth, this.canvasHeight);
            const pixels = decode(this.blurHash, this.canvasWidth, this.canvasHeight);
            imageData === null || imageData === void 0 ? void 0 : imageData.data.set(pixels);
            if (imageData)
                context === null || context === void 0 ? void 0 : context.putImageData(imageData, 0, 0);
        }
    }
}
NgxBlurhashComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashComponent, deps: [{ token: PLATFORM_ID }], target: i0.ɵɵFactoryTarget.Component });
NgxBlurhashComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.1.0", type: NgxBlurhashComponent, selector: "ngx-blurhash-render", inputs: { blurHash: "blurHash", imageSrc: "imageSrc", loading: "loading", borderRadius: "borderRadius", width: "width", height: "height" }, viewQueries: [{ propertyName: "canvas", first: true, predicate: ["canvas"], descendants: true }], ngImport: i0, template: `
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
  `, isInline: true, styles: [":host{display:block;position:relative}canvas{height:100%;width:100%;position:absolute;left:0}img{opacity:0;width:100%;height:100%;position:absolute;object-fit:cover;left:0}.img-loaded{animation:popIn .4s both ease-in}@keyframes popIn{0%{opacity:0}to{opacity:1}}\n"], dependencies: [{ kind: "directive", type: i1.NgOptimizedImage, selector: "img[ngSrc]", inputs: ["ngSrc", "ngSrcset", "sizes", "width", "height", "loading", "priority", "disableOptimizedSrcset", "fill", "src", "srcset"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-blurhash-render', template: `
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
  `, styles: [":host{display:block;position:relative}canvas{height:100%;width:100%;position:absolute;left:0}img{opacity:0;width:100%;height:100%;position:absolute;object-fit:cover;left:0}.img-loaded{animation:popIn .4s both ease-in}@keyframes popIn{0%{opacity:0}to{opacity:1}}\n"] }]
        }], ctorParameters: function () {
        return [{ type: Object, decorators: [{
                        type: Inject,
                        args: [PLATFORM_ID]
                    }] }];
    }, propDecorators: { blurHash: [{
                type: Input
            }], imageSrc: [{
                type: Input
            }], loading: [{
                type: Input
            }], borderRadius: [{
                type: Input
            }], width: [{
                type: Input
            }], height: [{
                type: Input
            }], canvas: [{
                type: ViewChild,
                args: ['canvas']
            }] } });

class NgxBlurhashModule {
}
NgxBlurhashModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
NgxBlurhashModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashModule, declarations: [NgxBlurhashComponent], imports: [NgOptimizedImage], exports: [NgxBlurhashComponent] });
NgxBlurhashModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashModule });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.0", ngImport: i0, type: NgxBlurhashModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        NgxBlurhashComponent
                    ],
                    imports: [
                        NgOptimizedImage
                    ],
                    exports: [
                        NgxBlurhashComponent
                    ]
                }]
        }] });

/*
 * Public API Surface of ngx-blurhash-render
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NgxBlurhashComponent, NgxBlurhashModule, NgxBlurhashService };
//# sourceMappingURL=ngx-blurhash-render.mjs.map
