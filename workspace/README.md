# NgxBlurhashRender

This is a simple lighweight library that renders the blurhash of a provided image. For Angular 15+

**Note**:
Requires [blurhash](https://www.npmjs.com/package/blurhash) as a dependency

**Warning**:
Not available for versions older than Angular 15

## Features
* Smooth animation for transition from canvas to image 💖
* Auto decoding of provided blurhash string and rendering to canvas 💪
* Customisable for images and containers of all sizes 🤖
* Blazingly fast and easy on your bundle size 🚀

## Example
Add the Module import to your module file or directly import it if you are using a standalone component.

`import { NgxBlurhashModule } from 'ngx-blurhash-render';`

In your HTML file simply add the following code snippet:

```
  <ngx-blurhash-render
    [blurHash]="'L38gy-00~qIUIUt7M{RjM{j[t7of'"
    [imageSrc]="'https://api.animetography-blog.com/api/media-upload/mediaFiles/test/31146bc10b344cdb90a13eae66102953f7.jpg'"
    [width]="'100px'"
    [height]="'100px'"
    [borderRadius]="'12px'"
  >
  </ngx-blurhash-render>
```

## Options
| Input      | Value | Description     |
| :---        |    :----:   |          ---: |
| [blurHash]      | 'string'       | The blurhash string   |
| [imageSrc]   | 'string'        | The actual image path or url      |
| [width]   | 'string'        | The width of the image      |
| [height]   | 'string'        | The height of the image      |
| [borderRadius]   | 'string'        | The border radius of the image      |

