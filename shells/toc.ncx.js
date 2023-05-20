export const tocNCX = {
    ncx: {
        $:{
            xmlns: "http://www.daisy.org/z3986/2005/ncx/",
            version: "2005-1"
        },
        head: {
            meta: []
        },
        docTitle: {},
        docAuthor: {},
        navMap: {
            navPoint: [
                {
                    $: {
                        id: "toc",
                        playOrder: "0",
                        class: "chapter"
                    },
                    navLabel: {
                        text: "Table Of Contents ",
                        content: {
                            $: {
                                src: "toc.xhtml"
                            }
                        }

                    }
                }

            ]

        }
    }

}
