import { createRequire } from "module";
const require = createRequire(import.meta.url);
import * as cheerio from 'cheerio';
const fs = require('fs');
const xmljs = require('xml2js');
const path = require('path');
const JSZip = require('jszip');
import { dirname} from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { contentShell } from "../shells/content.js";
import { tocHTML } from "../shells/toc.xhtml.js";
import { tocNCX } from "../shells/toc.ncx.js";


export class Epub {

    #zip = new JSZip();
    #META_INF = this.#zip.folder("META-INF");
    #OEBPS = this.#zip.folder("OEBPS");
    #SECTIONS = this.#zip.folder("OEBPS/SECTIONS");
    #IMG = this.#zip.folder("OEBPS/IMG");

    constructor(filePath, options) {
        const hasEpubextension = filePath.match(/\.epub$/);
        if(hasEpubextension === null) {
            throw new Error('Not .epub extension');
        }
        const filePathArray = filePath.split('/');
        this.mainDir = filePathArray[filePathArray.length - 1].replace(/\.epub$/, '');

        var dirPath = "";
        
        if(filePathArray.length > 1) {
            filePathArray.pop();
            dirPath = filePathArray.join("/");

        }

        this.options = options;
        this.filePath = filePath;
        this.dirPath = dirPath;
        this.UID = this.#generateUID();

    }

    async compose() {
        const style = fs.readFileSync(path.join(__dirname, '../files/style.css'));
        this.#OEBPS.file('style.css', style);
        this.#setCover();
        this.#createContainer();
        this.#createMimetypeFile();
        this.#generateSections();
        this.#createContentFile(); 
        this.#createTocHTMLFile(); 
        this.#createTocNCXFile();      
        this.#generateZip();
        
    }

    #setCover() {
        if(this.options.cover) {
            const ext = this.options.cover.split('/').pop().split('.').pop();
            const coverFile = fs.readFileSync(this.options.cover);
            this.#OEBPS.file('cover.'+ext, coverFile);
        }
    }

    #createContainer() {
       const data = fs.readFileSync(path.join(__dirname,'../shells/container.xml'));
       this.#META_INF.file('container.xml', data);
    }

    #createMimetypeFile() {
        const content = 'application/epub+zip';
        this.#zip.file('mimetype', content);
    }

    #generateSections() {
        const content = this.options.content;
        const model = fs.readFileSync(path.join(__dirname, '../shells/section.xhtml'));
        var counter = 0;
        content.forEach(element => {
            const fileName = this.#generateSectionFileName(counter, element.title);
            const $ = cheerio.load(model, {
                xml: {
                    normalizeWhitespace: true,
                }
            });

            $('head').append(`<title>${element.title}</title>`);
            $('body').append(`<h1>${element.title}</h1>`);

            if(element.hasOwnProperty('author'))
                $('body').append(`<p class="sec-author">${element.author}</p>`);
            $('body').append(element.data);

            this.#SECTIONS.file(fileName.name_extension, $.html());
            counter++;

        })

    }


    #generateZip() {
        const streamPath = path.join(__dirname, '../temp/'+this.mainDir+'.zip') 
        this.#zip.generateNodeStream({type:'nodebuffer', streamFiles:true})
            .pipe(fs.createWriteStream(streamPath))
            .on('finish', () =>{

                fs.readFile(streamPath, (err,data) => {
                    if(err) {
                        console.log(err);
                    }

                    fs.writeFile(this.filePath, data, (err) => {
                        if(err) {
                            console.log(err)
                        }else {
                            console.log('success');
                        }
                    })

                })  
            })
    }

    #createContentFile() {
        const options = this.options;
        const cShell = contentShell;
        const builder = new xmljs.Builder();
        const metadata = cShell.package.metadata;
        const manifest = cShell.package.manifest;
        const spine = cShell.package.spine;
        const guide = cShell.package.guide;

        /**metadata definitions */
        if(options.title) metadata["dc:title"] = options.title;
        if(options.author)
            metadata["dc:creator"] = {
                $: {
                    id: "creator", 
                },
                _: options.author
            }
        if(options.subject) metadata["dc:subject"] = options.subject;
        if(options.description) metadata["dc:description"] = options.description;
        if(options.publisher) metadata["dc:publisher"] = options.publisher;
        
        metadata["dc:date"] = new Date().toISOString();
        metadata["dc:identifier"] = {
            $: {
                id: "BookId"
            },
            _:this.UID
        }
        if(options.language) metadata["dc:language"] = options.language;
        else metadata["dc:language"] = 'en';
        if(options.publisher) metadata["dc:rights"] = `Copyright &#x00A9; ${new Date().getFullYear()} by ${options.publisher}`;

        /**manifest definitions  */

        var counter = 0;
        options.content.forEach(element => {
            const fileName = this.#generateSectionFileName(counter, element.title);
            const item = {
                $: {
                    href: "SECTIONS/"+fileName.name_extension,
                    id: fileName.name,
                    "media-type": "application/xhtml+xml"
                }
            }
            manifest.item.push(item);
            console.log("counter => "+counter);
            counter++;
            
        });

        if(options.cover) {
            const ext = options.cover.split('/').pop().split('.').pop();
            const item = {
                $: {
                    href: "cover."+ext,
                    id: "image_cover",
                    "media-type": this.#getCoverMediaType(ext)
                }
            };

            manifest.item.push(item);
        }

        /** spine definitions */
        var tocPosition = 0;

        if(options.hasOwnProperty('toc') && options.toc.hasOwnProperty('position')) {
            tocPosition = options.toc.position;                       
        }

        counter = 0;

        options.content.forEach(element => {
            const fileName = this.#generateSectionFileName(counter, element.title);
            
            if(counter === tocPosition) {
                const tocRef = {
                    $: {
                        idref: "toc"
                    }
                }

                spine.itemref.push(tocRef);
            }

            const itemRef = {
                $: {
                    idref: fileName.name
                }
               }

                
            console.log('counter2 =>'+counter);

            spine.itemref.push(itemRef);

            counter++;
        })

        this.#OEBPS.file('content.opf', builder.buildObject(cShell));     
    }

    #createTocHTMLFile() {
        const shell  = tocHTML;
        const options = this.options;        
        const builder = new xmljs.Builder();
        const ol = shell.html.body.nav.ol;
        shell.html.head.title = options.title;
        var counter = 0;
        if(options.hasOwnProperty('toc') && options.toc.hasOwnProperty('title')) {
            shell.html.body.h1._ = options.toc.title;
        }

        options.content.forEach(element => {
            const fileName = this.#generateSectionFileName(counter, element.title);
            const li = {
                $: {
                    class: "table-of-content"
                },
                a: {
                    $: {
                        href: 'SECTIONS/'+fileName.name_extension
                    },
                    _: element.title
                }
            }
            ol.li.push(li);
            counter++;
        })

        this.#OEBPS.file('toc.xhtml', builder.buildObject(shell));

    }

    #createTocNCXFile() {
        const numPages = this.#calculeNumPage();
        const shell = tocNCX;
        const options = this.options;
        const builder = new xmljs.Builder();
        const head = shell.ncx.head;
        head.meta.push(
            {
                $: {
                    name: "dtb:uid",
                    content: this.UID
                }
            },
            {
                $: {
                    name: "dtb:depth",
                    content: "1"
                }

            },
            {
                $: {
                    name: "dtb:maxPageNumber",
                    content: numPages
                }

            },
        )

        var counter = 0;

        options.content.forEach(element => {
            const fileName = this.#generateSectionFileName(counter, element.title);
            const point = {
                $: {
                    id: fileName.name,
                    playerOrder: counter + 1,
                    class: "chapter"
                },
                navLabel: {
                    text: `${counter + 1}. ${element.title}`,
                    content: {
                        $: {
                            src: 'SECTIONS/'+fileName.name_extension
                        }
                    }
                }

            }

            shell.ncx.navMap.navPoint.push(point);
            counter++;

        })

        this.#OEBPS.file('toc.ncx', builder.buildObject(shell));
    }

    

    #generateSectionFileName(id, str) {
        const name = `${id}_${str.toLocaleLowerCase().replace(" ", '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
        
        return {
            name: name,
            name_extension: name+'.xhtml'
        }

    }

    #generateUID(){
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    #getCoverMediaType(ext) {
        var mediaType;
        switch (ext) {
            case 'pdf':
                mediaType = "application/pdf"
                break;
            case 'png':
                mediaType = "image/png"
                break;
            case 'jpg':
                mediaType = "image/jpg"
                break;
            case 'svg':
                mediaType = "image/svg+xml"
                break;
        }

        return mediaType;
    }

    #calculeNumPage() {
        var totalOfContent = "";
        
        this.options.content.forEach(element => {
            totalOfContent += element.data+" ";
        })

        totalOfContent = totalOfContent.replace(/<\/?[a-zA-Z]+>/g, '').trim();
        totalOfContent = totalOfContent.replace(/\s+/g,' ');
        const numWords = totalOfContent.split(' ').length

        return Math.ceil(numWords / 250);
 

    }
    
}





