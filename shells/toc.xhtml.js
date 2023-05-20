export const tocHTML = {
    html: {
        $:{
            xmlns: "http://www.w3.org/1999/xhtml",
            "xmlns:epub": "http://www.idpf.org/2007/ops",
            "xml:lang": "en",
            lang: "en"

        },
        head: {
            title: "",
            meta: [
                {
                    $: {
                        charset: "UTF-8"
                    }

                }
            ],

            link: [
                {
                    $: {
                        rel: "stylesheet",
                        type: "text/css",
                        href: "style.css"
                    }
                }
            ]

        },
        body: {
            h1: {
                $: {
                    class: 'h1'
                },
                _: "Table Of Contents"
            },
            nav : {
                $: {
                    id:"toc",
                    "epub:type": "toc"
                },
                ol: {
                    li: []
                }
            }
        }
    }
}
