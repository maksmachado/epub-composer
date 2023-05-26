<h1 align="center">
    <img alt="Epub Composer" src="https://gateway.pinata.cloud/ipfs/QmPa8v4dioWRKRssuB6afS7GEM29MV84m98jx5fhQSEJZj" />
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
    - `excludeFromSpine`: If true, will remove Table of content from navigation flow (optional) => default: `false`;
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



