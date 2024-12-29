import * as i0 from "@angular/core";
/**
 * Blurhash rendering component for Angular 15+
 */
export declare class NgxBlurhashComponent {
    private blurHashValue;
    /**
     * The blurHash string to render on the Canvas
     */
    get blurHash(): string;
    set blurHash(value: string);
    /**
     * The image src string to render after fully loaded
     */
    private imageSrcValue;
    get imageSrc(): string;
    set imageSrc(value: string);
    /**
     * The loading of the image based on its position in the DOM. By default loading is set to 'eager'
     */
    loading: string;
    /**
     * Border Radius for the image in px. Default value is 0px
     */
    borderRadius: string;
    /**
     * The width of the image and canvas in px. Default value is 200px
     */
    width: string;
    /**
     * The height of the image and canvas in px. Default value is 200px
     */
    height: string;
    imageLoaded: boolean;
    imageLoad: boolean;
    private canvas;
    canvasWidth: number;
    canvasHeight: number;
    isBrowser: boolean;
    constructor(platformId: Object);
    ngAfterViewInit(): void;
    private decodeBlurHash;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxBlurhashComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<NgxBlurhashComponent, "ngx-blurhash-render", never, { "blurHash": { "alias": "blurHash"; "required": false; }; "imageSrc": { "alias": "imageSrc"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "borderRadius": { "alias": "borderRadius"; "required": false; }; "width": { "alias": "width"; "required": false; }; "height": { "alias": "height"; "required": false; }; }, {}, never, never, true, never>;
}
