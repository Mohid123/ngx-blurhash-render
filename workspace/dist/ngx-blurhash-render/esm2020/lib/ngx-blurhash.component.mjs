import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID, ViewChild } from '@angular/core';
import { decode } from 'blurhash';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
/**
 * Blurhash rendering component for Angular 15+
 */
export class NgxBlurhashComponent {
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
            const imageData = context?.createImageData(this.canvasWidth, this.canvasHeight);
            const pixels = decode(this.blurHash, this.canvasWidth, this.canvasHeight);
            imageData?.data.set(pixels);
            if (imageData)
                context?.putImageData(imageData, 0, 0);
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
        }], ctorParameters: function () { return [{ type: Object, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }]; }, propDecorators: { blurHash: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWJsdXJoYXNoLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1ibHVyaGFzaC1yZW5kZXIvc3JjL2xpYi9uZ3gtYmx1cmhhc2guY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3BELE9BQU8sRUFBRSxTQUFTLEVBQWMsTUFBTSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzdGLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxVQUFVLENBQUM7OztBQUVsQzs7R0FFRztBQWdFSCxNQUFNLE9BQU8sb0JBQW9CO0lBOEQvQixZQUFpQyxVQUFrQjtRQWpDbkQ7O1dBRUc7UUFDTSxZQUFPLEdBQVcsT0FBTyxDQUFDO1FBRW5DOztXQUVHO1FBQ00saUJBQVksR0FBVyxHQUFHLENBQUM7UUFFcEM7O1dBRUc7UUFDTSxVQUFLLEdBQVcsT0FBTyxDQUFDO1FBRWpDOztXQUVHO1FBQ00sV0FBTSxHQUFXLE9BQU8sQ0FBQztRQUUzQixnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNwQixjQUFTLEdBQUcsS0FBSyxDQUFDO1FBS2xCLGdCQUFXLEdBQUcsR0FBRyxDQUFDO1FBQ2xCLGlCQUFZLEdBQUcsR0FBRyxDQUFDO1FBT3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQTVERDs7T0FFRztJQUNILElBQ0ksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM1QixDQUFDO0lBQ0QsSUFBSSxRQUFRLENBQUMsS0FBYTtRQUN4QixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUMzQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQU9ELElBQ0ksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM1QixDQUFDO0lBQ0QsSUFBSSxRQUFRLENBQUMsS0FBYTtRQUN4QixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztJQUM3QixDQUFDO0lBc0NNLGVBQWU7UUFDcEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFTyxjQUFjO1FBQ3BCLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzRCxNQUFNLFNBQVMsR0FBRyxPQUFPLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzFFLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLElBQUcsU0FBUztnQkFDVixPQUFPLEVBQUUsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDMUM7SUFDSCxDQUFDOztpSEE5RVUsb0JBQW9CLGtCQThEWCxXQUFXO3FHQTlEcEIsb0JBQW9CLHlTQTdEckI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCVDsyRkF3Q1Usb0JBQW9CO2tCQS9EaEMsU0FBUzsrQkFDRSxxQkFBcUIsWUFDckI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCVDs7MEJBc0dZLE1BQU07MkJBQUMsV0FBVzs0Q0F0RDNCLFFBQVE7c0JBRFgsS0FBSztnQkFlRixRQUFRO3NCQURYLEtBQUs7Z0JBV0csT0FBTztzQkFBZixLQUFLO2dCQUtHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBS0csS0FBSztzQkFBYixLQUFLO2dCQUtHLE1BQU07c0JBQWQsS0FBSztnQkFNRSxNQUFNO3NCQURiLFNBQVM7dUJBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzUGxhdGZvcm1Ccm93c2VyIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcclxuaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBJbmplY3QsIElucHV0LCBQTEFURk9STV9JRCwgVmlld0NoaWxkIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gJ2JsdXJoYXNoJztcclxuXHJcbi8qKlxyXG4gKiBCbHVyaGFzaCByZW5kZXJpbmcgY29tcG9uZW50IGZvciBBbmd1bGFyIDE1K1xyXG4gKi9cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICduZ3gtYmx1cmhhc2gtcmVuZGVyJyxcclxuICB0ZW1wbGF0ZTogYFxyXG4gICAgPGNhbnZhc1xyXG4gICAgICAjY2FudmFzXHJcbiAgICAgIFt3aWR0aF09XCJjYW52YXNXaWR0aFwiXHJcbiAgICAgIFtoZWlnaHRdPVwiY2FudmFzSGVpZ2h0XCJcclxuICAgICAgW3N0eWxlLmJvcmRlclJhZGl1c109XCJib3JkZXJSYWRpdXNcIlxyXG4gICAgICBbc3R5bGUud2lkdGhdPVwid2lkdGhcIlxyXG4gICAgICBbc3R5bGUuaGVpZ2h0XT1cImhlaWdodFwiXHJcbiAgICA+PC9jYW52YXM+XHJcbiAgICA8aW1nXHJcbiAgICAgIGFsdD1cImJsdXJyZWQtaW1hZ2VcIlxyXG4gICAgICBbbmdTcmNdPVwiaW1hZ2VTcmNcIlxyXG4gICAgICB3aWR0aD1cIjEwMFwiXHJcbiAgICAgIGhlaWdodD1cIjEwMFwiXHJcbiAgICAgIChsb2FkKT1cImltYWdlTG9hZCA9IHRydWVcIlxyXG4gICAgICAob25sb2FkZWRkYXRhKT1cImltYWdlTG9hZGVkID0gdHJ1ZVwiXHJcbiAgICAgIFtjbGFzcy5pbWctbG9hZGVkXT1cImltYWdlTG9hZFwiXHJcbiAgICAgIFtzdHlsZS5ib3JkZXJSYWRpdXNdPVwiYm9yZGVyUmFkaXVzXCJcclxuICAgICAgW3N0eWxlLndpZHRoXT1cIndpZHRoXCJcclxuICAgICAgW3N0eWxlLmhlaWdodF09XCJoZWlnaHRcIlxyXG4gICAgPlxyXG4gIGAsXHJcbiAgc3R5bGVzOiBbXHJcbiAgICBgXHJcbiAgICA6aG9zdCB7XHJcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xyXG4gICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbiAgICB9XHJcblxyXG4gICAgY2FudmFzIHtcclxuICAgICAgaGVpZ2h0OiAxMDAlO1xyXG4gICAgICB3aWR0aDogMTAwJTtcclxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICBsZWZ0OiAwO1xyXG4gICAgfVxyXG5cclxuICAgIGltZyB7XHJcbiAgICAgIG9wYWNpdHk6IDA7XHJcbiAgICAgIHdpZHRoOiAxMDAlO1xyXG4gICAgICBoZWlnaHQ6IDEwMCU7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgb2JqZWN0LWZpdDogY292ZXI7XHJcbiAgICAgIGxlZnQ6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLmltZy1sb2FkZWQge1xyXG4gICAgICBhbmltYXRpb246IHBvcEluIDAuNHMgYm90aCBlYXNlLWluO1xyXG4gICAgfVxyXG5cclxuICAgIEBrZXlmcmFtZXMgcG9wSW4ge1xyXG4gICAgICAwJSB7XHJcbiAgICAgICAgb3BhY2l0eTogMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgMTAwJSB7XHJcbiAgICAgICAgb3BhY2l0eTogMTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIGBcclxuICBdXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBOZ3hCbHVyaGFzaENvbXBvbmVudCB7XHJcblxyXG4gIHByaXZhdGUgYmx1ckhhc2hWYWx1ZSE6IHN0cmluZztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGJsdXJIYXNoIHN0cmluZyB0byByZW5kZXIgb24gdGhlIENhbnZhc1xyXG4gICAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IGJsdXJIYXNoKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5ibHVySGFzaFZhbHVlO1xyXG4gIH1cclxuICBzZXQgYmx1ckhhc2godmFsdWU6IHN0cmluZykge1xyXG4gICAgdGhpcy5ibHVySGFzaFZhbHVlID0gdmFsdWU7XHJcbiAgICB0aGlzLmRlY29kZUJsdXJIYXNoKCk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGltYWdlIHNyYyBzdHJpbmcgdG8gcmVuZGVyIGFmdGVyIGZ1bGx5IGxvYWRlZFxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW1hZ2VTcmNWYWx1ZSE6IHN0cmluZztcclxuICBASW5wdXQoKVxyXG4gIGdldCBpbWFnZVNyYygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuaW1hZ2VTcmNWYWx1ZTtcclxuICB9XHJcbiAgc2V0IGltYWdlU3JjKHZhbHVlOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuaW1hZ2VTcmNWYWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGxvYWRpbmcgb2YgdGhlIGltYWdlIGJhc2VkIG9uIGl0cyBwb3NpdGlvbiBpbiB0aGUgRE9NLiBCeSBkZWZhdWx0IGxvYWRpbmcgaXMgc2V0IHRvICdlYWdlcidcclxuICAgKi9cclxuICBASW5wdXQoKSBsb2FkaW5nOiBzdHJpbmcgPSAnZWFnZXInO1xyXG5cclxuICAvKipcclxuICAgKiBCb3JkZXIgUmFkaXVzIGZvciB0aGUgaW1hZ2UgaW4gcHguIERlZmF1bHQgdmFsdWUgaXMgMHB4XHJcbiAgICovXHJcbiAgQElucHV0KCkgYm9yZGVyUmFkaXVzOiBzdHJpbmcgPSAnMCc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSB3aWR0aCBvZiB0aGUgaW1hZ2UgYW5kIGNhbnZhcyBpbiBweC4gRGVmYXVsdCB2YWx1ZSBpcyAyMDBweFxyXG4gICAqL1xyXG4gIEBJbnB1dCgpIHdpZHRoOiBzdHJpbmcgPSAnMjAwcHgnO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgaGVpZ2h0IG9mIHRoZSBpbWFnZSBhbmQgY2FudmFzIGluIHB4LiBEZWZhdWx0IHZhbHVlIGlzIDIwMHB4XHJcbiAgICovXHJcbiAgQElucHV0KCkgaGVpZ2h0OiBzdHJpbmcgPSAnMjAwcHgnO1xyXG5cclxuICBwdWJsaWMgaW1hZ2VMb2FkZWQgPSBmYWxzZTtcclxuICBwdWJsaWMgaW1hZ2VMb2FkID0gZmFsc2U7XHJcblxyXG4gIEBWaWV3Q2hpbGQoJ2NhbnZhcycpXHJcbiAgcHJpdmF0ZSBjYW52YXMhOiBFbGVtZW50UmVmPEhUTUxDYW52YXNFbGVtZW50PjtcclxuXHJcbiAgcHVibGljIGNhbnZhc1dpZHRoID0gMTAwO1xyXG4gIHB1YmxpYyBjYW52YXNIZWlnaHQgPSAxMDA7XHJcblxyXG5cclxuXHJcbiAgcHVibGljIGlzQnJvd3NlcjogYm9vbGVhbjtcclxuXHJcbiAgY29uc3RydWN0b3IoQEluamVjdChQTEFURk9STV9JRCkgcGxhdGZvcm1JZDogT2JqZWN0KSB7XHJcbiAgICB0aGlzLmlzQnJvd3NlciA9IGlzUGxhdGZvcm1Ccm93c2VyKHBsYXRmb3JtSWQpO1xyXG4gIH1cclxuICBwdWJsaWMgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5kZWNvZGVCbHVySGFzaCgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBkZWNvZGVCbHVySGFzaCgpIHtcclxuICAgIGlmICh0aGlzLmNhbnZhcyAmJiB0aGlzLmJsdXJIYXNoKSB7XHJcbiAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNhbnZhcy5uYXRpdmVFbGVtZW50LmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgIGNvbnN0IGltYWdlRGF0YSA9IGNvbnRleHQ/LmNyZWF0ZUltYWdlRGF0YSh0aGlzLmNhbnZhc1dpZHRoLCB0aGlzLmNhbnZhc0hlaWdodCk7XHJcbiAgICAgIGNvbnN0IHBpeGVscyA9IGRlY29kZSh0aGlzLmJsdXJIYXNoLCB0aGlzLmNhbnZhc1dpZHRoLCB0aGlzLmNhbnZhc0hlaWdodCk7XHJcbiAgICAgIGltYWdlRGF0YT8uZGF0YS5zZXQocGl4ZWxzKTtcclxuICAgICAgaWYoaW1hZ2VEYXRhKVxyXG4gICAgICAgIGNvbnRleHQ/LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG59XHJcbiJdfQ==