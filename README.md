<h1 align="center">
    <img alt="Epub Composer" src="https://gateway.pinata.cloud/ipfs/QmNMaCvYR8bzz8gehRwNokUVd7knU2ReYVdYrTHCcs5XDi" />
</h1>
<p align="center">Light library to creat epub files</p>

## Installing

### Package manager

Using npm:

```bash
$ npm i epub-composer
```

Once the package is installed, you can import the library using `import`:

```js
import {EpubComposer} from 'epub-composer';
```

## Usage Example
```js
import {EpubComposer} from 'epub-composer';

//...


// Define the path where you want to save the epub file.
const filePath = "path/of/file.epub";
// Create a new EpubComposer object passing options
const epubComposer = new EpubComposer(options);

// Once EpubComposer object was created,  call the compose method, passing filePath to genarate file.epub;
epubComposer.compose(filePath);
```

## Options

- `title`: Title  of The book (required)
- `author`: Author of the book (required)
- `publisher`: Publisher name (optional)
- `lang`: Language of the book in 2 letters code (optional) => default: `en`; 
- `titlePage`: If true, insert  title page in book (optional) => default: `false`; 
- `cover`: Object containing book cover options (optional)

    **Inside Cover Object:**
    - `path`: File path eg. `"image/cover.jpg"` (required)
    - `includeInToc`: If true, will show Cover in Table Of Contentes (Optional) => default: `false`;

- `toc`: Object containing Table Of Content options (optional)

    **Inside Toc Object**
    - `title`: Title of the Table of Contents (optional) => default: `Table Of Contents`;
- `content`: Book Chapters content. It's must be a array of objects (required).

    **Inside Content Objects**
    - `title`: Chapter title (optional) => default: `undefined`;
    - `author`: Chapter author (optional) => default: `undefined`;
    - `beforeToc`: If true, the chapter will be positioned before Table of Content on navigation flow (optional) => default: `false`;  
    - `excludeFromToc`: If true, the chapter will not be showed on Table of content (optional) => default: `false`;
    - `data`: HTML String of the chapter content (required);
### Example
```js
import {EpubComposer} from 'epub-composer';

const options({
    title: "Dune",
    author: "Frank Herbert",
    publisher: "New English Library",
    cover: {
        path: "image/cover.jpg"
    },
    content: [
        {
            author: "Neil Gaiman",
            beforeToc: true,
            data: "<p>First published in 1965... <p>...</p></p>"
        },
        {
            title: "Chapter One"
            data: "<div><p>In the week before departure for Arrakis...</p> <p>...</p></div>"
        }
    ]

});

const epubComposer = new EpubComposer(options);

epubComposer.compose("path/of/file.epub");
```

## Images

If you want to add some images to your e-book, simply add the `<img>` tag at the desired location and point the `src` attribute to the image path. This library does not support HTTP or HTTPS requests, so the image must be stored locally.

## Subtitles

It is possible to track subtitles in the Table of Contents. To do this, simply insert your subtitle within an `<h>` tag and add the `data-ec-role` attribute with the value "subtitle". This library only supports one level of subtitles.
### Example:
```html
<h3 data-ec-role="subtitle"> Your subtitle </h3>
```

## Pro version
This version includes an Epub Composer credit page. To have permission to remove this page, consider purchasing the pro version of Epub Composer at the link below:

https://app.privjs.com/buy/packageDetail?pkg=epub-composer



