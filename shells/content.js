export const contentShell = {
    package: {
        $: {
            xmlns: "http://www.idpf.org/2007/opf",      
            version: "3.0",
            'unique-identifier': "BookId",
            'xmlns:dc': "http://purl.org/dc/elements/1.1/",
            'xmlns:dcterms': "http://purl.org/dc/terms/",
            'xml:lang': "en",
            'xmlns:media': "http://www.idpf.org/epub/vocab/overlays/#",
            'prefix': "ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/"
        },
        metadata: {
            $: {
                'xmlns:dc': "http://purl.org/dc/elements/1.1/",
                'xmlns:opf': "http://www.idpf.org/2007/opf"
            }

        },
        manifest: {
            item:[
                {
                    $: {
                        href: "toc.ncx",
                        id: "ncx",
                        "media-type": "application/x-dtbncx+xml"
                    }
                },
                {
                    $: {
                        href: "toc.xhtml",
                        id: "toc",
                        "media-type": "application/xhtml+xml",
                        properties: "nav"
                    }
                },
                {
                    $: {
                        href: "style.css",
                        id: "css",
                        "media-type": "text/css"
                    }
                }

            ]
        },
        spine: {
            itemref:[]
        },
        guide: {
            reference: [
                {
                    $:{
                        type: "toc",
                        title: "Table of Contents",
                        href:"toc.xhtml"
                    }
                }
            ]

        }

    }

}


