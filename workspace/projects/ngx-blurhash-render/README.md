# NgxBlurhashRender

This is a simple lighweight library that renders the blurhash of a provided image. For all versions of Angular 2+

**Note**:
Requires [blurhash](https://www.npmjs.com/package/blurhash) as a dependency

**Warning**
For versions older than Angular 15, run the command `npm i ngx-blurhash-render --legacy-peer-deps`

## Features
* Smooth animation for transition from canvas to image 💖
* Auto decoding of provided blurhash string and rendering to canvas 💪
* Customisable for images and containers of all sizes 🤖
* At around a measly 6-7kb it is blazingly fast and barely affects your bundle size 🚀

## Example
Add the Module import to your module file or directly import it if you are using a standalone component.

`import { NgxBlurhashModule } from 'ngx-blurhash-render';`

In your HTML file simply add the selector as follows:

`<ngx-blurhash-render [blurHash]="'L8CrZD~S5T^hIWE3IqRR0459^hxF'" [imageSrc]="'https://api.animetography-blog.com/api/media-upload/mediaFiles/test/40fc2d874f1d72e810322d266fabfa445.png'"></ngx-blurhash-render>`

## Options
| Input      | Value | Description     |
| :---        |    :----:   |          ---: |
| [blurHash]      | 'string'       | The blurhash string   |
| [imageSrc]   | 'string'        | The actual image path or url      |

