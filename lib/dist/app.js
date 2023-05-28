import { createRequire } from "module";
const require = createRequire(import.meta.url);
import * as cheerio from 'cheerio';
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
import { dirname} from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sizeOf = require("image-size");


export class EpubComposer {

    #zip = new JSZip();
    #mimetype = this.#zip.file('mimetype', 'application/epub+zip',{compression: "STORE"});
    #META_INF = this.#zip.folder("META-INF");
    #OEBPS = this.#zip.folder("OEBPS");
    #SECTIONS = this.#zip.folder("OEBPS/sections");
    #IMG = this.#zip.folder("OEBPS/img");
    #CSS = this.#zip.folder("OEBPS/css");
    #hasCover = false;

    constructor(options) {
        this.#validateOptions(options);

        this.options = options;
        this.UID = this.#generateUID();
        this.createdAt = new Date().toISOString().replace(/\.\d+/, "");

    }

    #validateOptions(options) {
        if(options.title === undefined || options.title === null || options.title === '') {
            throw new Error("No title has defined");
        }

        if(options.author === undefined || options.author === null || options.author === '') {
            throw new Error("No author has defined");
        }

        if(options.content === undefined) {
            throw new Error("No content has defined");
        }
        const content = options.content;

        var hasBeforeTocError = false;
        var counterBeforeToc = 0;

        for(var i = 0; i < content.length; i++) {

            if(content[i].hasOwnProperty('beforeToc') && content[i].beforeToc === true) {
                if(counterBeforeToc !== i) hasBeforeTocError = true;

                counterBeforeToc++;
            }

        }

        if(hasBeforeTocError) throw new Error("beforeToc content must be first");


    }

    async compose(filePath) {
        const hasEpubextension = filePath.match(/\.epub$/);
        if(hasEpubextension === null) {
            throw new Error('Not .epub extension');
        }
        const style = fs.readFileSync(path.join(__dirname, '../files/style.css'));
        this.#CSS.file('style.css', style);
        this.#setCover();
        this.#addCreditpage();             
        this.#createContainer();
        this.#generateSections();        
        this.#createContentFile(); 
        this.#createTocHTMLFile(); 
        this.#createTocNCXFile();      
        this.#generateZip(filePath);
        
    }

    #setCover() {
        const options = this.options;
        if(options.hasOwnProperty('cover') && options.cover.hasOwnProperty('path')) {
            this.#hasCover = true;

            const shell = fs.readFileSync(path.join(__dirname, "../shells/coverpage.xhtml"))
            const $ = cheerio.load(shell, {
                xml: {
                    normalizeWhitespace: true,
                }
            });

            var ext = this.options.cover.path.split('/').pop().split('.').pop();
            if(ext === 'jpg') ext = 'jpeg';
            const coverFile = fs.readFileSync(this.options.cover.path);
            this.#IMG.file('cover.'+ext, coverFile);
            const dimensions = sizeOf(this.options.cover.path);

            $('svg').append(`<image height="${dimensions.height}" width="${dimensions.width}" xlink:href="../img/cover.${ext}"/>`);
            $('svg').attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
            const lang = 'en';
            if(options.hasOwnProperty('lang')) 
                lang = options.lang;
            $('html').attr('xml:lang', lang);

            this.#SECTIONS.file("coverpage.xhtml", $.html());
        }

        
    }

    #addCreditpage() {
        const ecLogo = fs.readFileSync(path.join(__dirname,"../img/epub_composer_logo.svg"));
        
        this.#IMG.file("epub_composer_logo.svg", ecLogo);
        const creditpage = fs.readFileSync(path.join(__dirname, "../shells/creditpage.xhtml"));
        const $ = cheerio.load(creditpage, {
            xml: {
                normalizeWhitespace: true,
            }
        });
        const monthNames = ["january", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const date = new Date()
        $('body').append(`<h3>${monthNames[date.getMonth()]} ${date.getFullYear()}</h3>`);
        this.#SECTIONS.file("creditpage.xhtml", $.html());
    }

    #createContainer() {
       const data = fs.readFileSync(path.join(__dirname,'../shells/container.xml'));
       this.#META_INF.file('container.xml', data);
    }

    #generateSections() {
        const self = this;
        const content = this.options.content;
        const model = fs.readFileSync(path.join(__dirname, '../shells/section.xhtml'));
        var counter = 0;
        content.forEach(element => {
            
            const fileName = this.#generateSectionFileName(counter, element);
            element.id = fileName;
            const $ = cheerio.load(model, {
                xml: {
                    normalizeWhitespace: true,
                }
            });

            if(element.hasOwnProperty('title')) {
                $('head').append(`<title>${element.title}</title>`);
                $('body').append(`<h1>${element.title}</h1>`);
            } else {
                element.title = '';
            }

            if(element.hasOwnProperty('author')) {
                $('body').append(`<p class="sec-author">${element.author}</p>`);
            }

            const data = cheerio.load(element.data);
            /**geting subtitles */

            const subtitles = data(`[data-ec-role="subtitle"]`);

            if(subtitles.length > 0) {
                var subCounter = 0;
                data(`[data-ec-role="subtitle"]`).each(function(i,elm){
                if(data(this).attr('id') === undefined) {
                    data(this).attr('id', `${fileName}-sub-${subCounter}`);
                }
                subCounter++;
                });

                

            }
            /**geting imagea */
            const images = data(`img`);
            

            if(images.length > 0) {
                images.each(function(i,elm){
                    const path = data(this).attr(`src`);
                    const image = fs.readFileSync(path);
                    var imageExt = path.split('/').pop().split('.').pop();
                    if(imageExt === 'jpg') imageExt = 'jpeg'
                    
                    const imageNewName = self.#generateRandomString(6)+"."+imageExt;

                    const picture = `
                       \n<picture>
                            <img src="../img/${imageNewName}"/>\n
                        </picture>\n
                    `;

                    data(this).after(picture);


                    data(this).attr(`data-ec-marqued`, `die`);
                    self.#IMG.file(imageNewName, image);

                })
                
            }
            
            data(`[data-ec-marqued="die"]`).remove();


            element.data = data('body').html();

                
            $('body').append(data('body').html());            

            this.#SECTIONS.file(fileName+'.xhtml', $.html());
            counter++;

        })

    }


    #generateZip(filePath) {
        const tempZip = new Date().getTime()+".zip";
        const streamPath = path.join(__dirname, '../temp/'+tempZip);
        this.#zip.generateNodeStream({type:'nodebuffer', streamFiles:true, compression: "DEFLATE", compressionOptions:"1"})
            .pipe(fs.createWriteStream(streamPath))
            .on('finish', () =>{

                fs.readFile(streamPath, (err,data) => {
                    if(err) {
                        console.log(err);
                    }

                    fs.writeFile(filePath, data, (err) => {
                        if(err) {
                            console.log(err)
                        }else {
                            fs.unlinkSync(streamPath);
                            console.log('success');
                        }
                    })

                })  
            })
    }

    #createContentFile() {
        const options = this.options;
        const shell = fs.readFileSync(path.join(__dirname, '../shells/content.opf'));
        const $ = cheerio.load(shell, {
            xml: {
                normalizeWhitespace: true,
            }
        });
        /**metadata definitions */
        
        $('metadata').append(`\t<dc:title>${options.title}</dc:title>\n`);
        $('metadata').append(`\t<dc:creator id="creator">${options.author}</dc:creator>\n`);

        if(options.hasOwnProperty('subject'))
            $('metadata').append(`\t<dc:subject">${options.subject}</dc:subject>\n`);
        if(options.hasOwnProperty('description'))
            $('metadata').append(`\t<dc:description">${options.description}</dc:description>\n`);
        if(options.hasOwnProperty('publisher'))
            $('metadata').append(`\t<dc:publisher>${options.publisher}</dc:publisher>\n`);

        $('metadata').append(`\t<dc:date>${this.createdAt}</dc:date>\n`);
        $('metadata').append(`<meta property="dcterms:modified">${this.createdAt}</meta>`);
        
        $('metadata').append(`\t<dc:identifier id="BookId">${this.UID}</dc:identifier>\n`);
        $('metadata').append(`\t<dc:language>${options.hasOwnProperty('language') ? options.language : 'en'}</dc:language>\n`);
        if(options.hasOwnProperty('publisher'))
            $('metadata').append(`\t<dc:rights>Copyright &#x00A9; ${new Date().getFullYear()} by ${options.publisher}</dc:rights>\n`);

        /**manifest ad spine definitions  */

        var excludeTocFromSpine = false;

        if(options.hasOwnProperty('toc') && options.toc.hasOwnProperty('excludeFromSpine') && options.toc.excludeFromToc === true) {
            excludeTocFromSpine = true;
        }else {

        }

        const idrefToc = $(`[idref="toc"]`);
        const self = this;
        
        options.content.forEach(element => {
            const data = cheerio.load(element.data);
            const properties = [];
            const svg = data('svg');

            if(svg.length > 0) properties.push('svg');

            var propertiesStr = '';
            if(properties.length > 0) {
                propertiesStr = `properties="${properties.join()}"`;
            }


            $('manifest').append(`<item href="sections/${element.id}.xhtml" id="${element.id}" media-type="application/xhtml+xml" ${propertiesStr !== '' ? propertiesStr : '' } /> \n`);
            if(element.hasOwnProperty('beforeToc') && element.beforeToc === true) {
                idrefToc.before(`<itemref idref="${element.id}"/>\n`);
            }else{
                $('spine').append(`<itemref idref="${element.id}"/>\n`);
            }

            /**image manifest */

            
            const images = data(`img`);
            if(images.length > 0) {
                images.each(function(i, elm) {
                
                    const imageName = data(this).attr('src').split("/").pop();                    
                    const imagePreName = imageName.split(".").shift();
                    const imageExt = imageName.split(".").pop();
                    const coreMediaType = self.#getCoreMediaType(imageExt);
                    $('manifest').append(`\n<item href="img/${imageName}" id="${imagePreName}"  media-type="${coreMediaType}" />\n`);
    
                });

            }


        });

        /**Cover definitions  */

        if(this.#hasCover) {
            const ext = options.cover.path.split('/').pop().split('.').pop();
            $('manifest').prepend(`\n<item href="sections/coverpage.xhtml" id="coverpage" media-type="application/xhtml+xml" properties="svg"/>\n`);
            $('manifest').append(`<item href="img/cover.${ext}" id="cover" media-type="image/${ext}"/>\n`);
            $('spine').prepend(`\n<itemref idref="coverpage"/>\n`);            
        }

        

        /** declaring creditpage */

        $('manifest').append(`<item href="img/epub_composer_logo.svg" id="epub_composer_logo" media-type="image/svg+xml" />`);
        $('manifest').append(`<item href="sections/creditpage.xhtml" id="creditpage" media-type="application/xhtml+xml" />`);
        if(this.#hasCover) {
            $(`[idref="coverpage"]`).after(`<itemref idref="creditpage"/>`);
            
        }else if(!excludeTocFromSpine) {
            $(`[idref="toc"]`).after(`<itemref idref="creditpage"/>`);

        }else {
            $("spine").prepend(`<itemref idref="creditpage"/>`);
        }
            /** end declaring creditpage */

        
        this.#OEBPS.file('content.opf', $.html());
       
        
    }

    #createTocHTMLFile() {       
        const shell = fs.readFileSync(path.join(__dirname, "../shells/toc.xhtml"));
        const $ = cheerio.load(shell,{
            xml: {
                normalizeWhitespace: true,
            }
        });

        const options = this.options;
        var tocTitle = "Table of Contents"
        if(options.hasOwnProperty('toc') && options.toc.hasOwnProperty('title')) {
            tocTitle = options.toc.title;
        }
        $('head').children('title').text(tocTitle);
        $('#toc-title').text(tocTitle);

        

        if(options.hasOwnProperty('cover') && 
            options.cover.hasOwnProperty('includeInToc') && 
            options.cover.includeInToc === true) {
                $('nav > ol').append(`\n<li id="coverpage-li" class="table-of-content">
                    <a href="sections/coverpage.xhtml">Cover</a>
                </li>\n`);

                console.log('ok')

        }else {
            console.log(options.cover.includeInToc)
        }

        var counter = 0;

        options.content.forEach(element => {

            if(element.hasOwnProperty('excludeFromToc') && element.excludeFromToc) {

            }else {

            const data = cheerio.load(element.data);
            $('nav > ol').append(`\t\t<li id="${counter}-li" class="table-of-content">\n\t\t</li>\n`);
            const li = $(`#${counter}-li`);
            const a = `\t\t\t<a href="sections/${element.id}.xhtml">${element.title}</a>\n`;
            li.append(a);
            const subtitles = data(`[data-ec-role="subtitle"]`);

            if(subtitles.length > 0){
                li.append(`\t\t\t<ol class="subs">\n\t\t\t</ol>\n`);
                const childOl = li.children('.subs');

                subtitles.each(function(i, el) {
                    var subtitleId = data(this).attr('id');
                    
                    const childA = `<a href="sections/${element.id}.xhtml#${subtitleId}">${data(this).text()}</a>`
                    childOl.append(`\t\t\t\t<li class="table-of-content">\n\t\t\t\t\t${childA}\n\t\t\t\t</li>\n`);

                    
                });

                
            }
            
            counter++;
             
            }
            
        });
        

        this.#OEBPS.file('toc.xhtml', $.html());
        

    }

    #createTocNCXFile() {
        const options = this.options;
        const shell = fs.readFileSync(path.join(__dirname, '../shells/toc.ncx'));
        const $ = cheerio.load(shell, {
            xml: {
                normalizeWhitespace: true,
            }
        });

        $(`[name="dtb:uid"]`).attr('content', this.UID);
        $(`[name="dtb:totalPageCount"]`).attr('content', this.#calculeNumPage());
        $(`[name="dtb:maxPageNumber"]`).attr('content', this.#calculeNumPage());
        $(`head`).after(`\n<docAuthor><text>${options.author}</text></docAuthor>\n`);
        $(`head`).after(`\n<docTitle><text>${options.title}</text></docTitle>\n`);
        

        const tocNavPoint = $(`navMap > navPoint`);
        var counter = 0;
        
        options.content.forEach(element => {
            const data = cheerio.load(element.data);
            const self = this;

            const navPointId = `i`+self.#generateUID();
            const newNavPoint = `
                <navPoint id="${navPointId}" class="chapter">
                    <navLabel>
                        <text>${element.title}</text>
                    </navLabel>
                    <content src="sections/${element.id}.xhtml"/>
                </navPoint>\n`;
                
            if(element.hasOwnProperty('beforeToc') && element.beforeToc === true){
                tocNavPoint.before(newNavPoint);
            }else {
                $(`navMap`).append(newNavPoint);
            }

            const subtitles = data(`[data-ec-role="subtitle"]`);

            if(subtitles.length > 0) {
                const navPoint = $(`#${navPointId}`);
                $(`[name="dtb:depth"]`).attr('content', '2');

                subtitles.each(function(i,elm) {
                    
                    const subtitleId = data(this).attr('id');
                    navPoint.append(
                        `<navPoint id="i${self.#generateUID()}" class="chapter">
                            <navLabel>
                                <text>${data(this).text().trim()}</text>
                            </navLabel>
                            <content src="sections/${element.id}.xhtml#${subtitleId}"/>
                        </navPoint>\n`
                    )
                })

            }

        });

        counter = 0;

        $(`navPoint`).each(function(i,elm) {
            $(this).attr('playOrder', counter.toString());
            counter++;

        });

        this.#OEBPS.file('toc.ncx', $.html());

    }
    

    #generateSectionFileName(id, element) {

        var str = this.#generateRandomString(5);
        if(element.hasOwnProperty('title')) str = element.title;

        const name = "i_"+id+"_"+str.toLocaleLowerCase().replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        return name

    }

    #generateRandomString(length) {
        const char = 'abcdefghijklmnopqrstuvwxyz';
        let randomString = '';

        for (var i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * char.length);
            randomString += char.charAt(randomIndex);
        }

        return randomString;

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

    #getCoreMediaType(ext) {
        var coreMediaType;
        switch (ext) {
            case 'pdf':
                coreMediaType = "application/pdf";
                break;
            case 'png':
                coreMediaType = "image/png";
                break;
            case 'jpg':
            case 'jpeg':
                coreMediaType = "image/jpeg";
                break;
            case 'svg':
                coreMediaType = "image/svg+xml";
                break;
            case 'webp':
                coreMediaType = "image/webp";
                break;
        }

        return coreMediaType
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
        const wordsPerPage = 250;
        var totalPages = 1;

        if(this.#hasCover) totalPages++;
        
        this.options.content.forEach(element => {
            var data = element.data.replace(/<\/?[a-zA-Z]+>/g, '').trim();
            data = data.replace(/\s+/g,' ');
            const numOfWords = data.split(' ').length;
            totalPages += Math.ceil(numOfWords / wordsPerPage);
        })

        return totalPages;
 

    }
    
}


//if(typeof module !== "undefined" && typeof module.exports )





