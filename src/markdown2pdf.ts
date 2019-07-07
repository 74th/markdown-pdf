import * as path from "path";
import * as fs from 'fs'
const pfs = fs.promises;

interface config {
    articles: Array<string>;
    output: string;
}

class Markdown2PDF {

    showErrorMessage = (name: string, err: any) => {
        console.log(name, err);
    }

    convertImgPath = (src: string, filename: string) => {
        try {
            var href = decodeURIComponent(src);
            href = href.replace(/("|')/g, '')
                .replace(/\\/g, '/')
                .replace(/#/g, '%23');
            var protocol = 'file';
            if (protocol === 'file:' && href.indexOf('file:///') !== 0) {
                return href.replace(/^file:\/\//, 'file:///');
            } else if (protocol === 'file:') {
                return href;
            } else if (!protocol || path.isAbsolute(href)) {
                href = path.resolve(path.dirname(filename), href).replace(/\\/g, '/')
                    .replace(/#/g, '%23');
                if (href.indexOf('//') === 0) {
                    return 'file:' + href;
                } else if (href.indexOf('/') === 0) {
                    return 'file://' + href;
                } else {
                    return 'file:///' + href;
                }
            } else {
                return src;
            }
        } catch (error) {
            console.log('convertImgPath()', error);
        }
    }

    convertMarkdownToHtml = (filename: string, text: string) => {
        try {
            try {
                // var hljs = require('highlight.js');
                // var breaks = vscode.workspace.getConfiguration('markdown-pdf')['breaks'];
                var breaks = false;
                var md = require('markdown-it')({
                    html: true,
                    breaks: breaks,
                    // highlight: function (str, lang:string) {
                    //     if (lang && hljs.getLanguage(lang)) {
                    //         try {
                    //             str = hljs.highlight(lang, str, true).value;
                    //         } catch (error) {
                    //             str = md.utils.escapeHtml(str);

                    //             this.showErrorMessage('markdown-it:highlight', error);
                    //         }
                    //     } else {
                    //         str = md.utils.escapeHtml(str);
                    //     }
                    //     return '<pre class="hljs"><code><div>' + str + '</div></code></pre>';
                    // }
                });
            } catch (error) {
                this.showErrorMessage('require(\'markdown-it\')', error);
            }

            // convert the img src of the markdown
            var cheerio = require('cheerio');
            var defaultRender = md.renderer.rules.image;
            md.renderer.rules.image = function (tokens, idx, options, env, self) {
                var token = tokens[idx];
                var href = token.attrs[token.attrIndex('src')][1];
                // console.log("original href: " + href);
                href = convertImgPath(href, filename);
                // console.log("converted href: " + href);
                token.attrs[token.attrIndex('src')][1] = href;
                // // pass token to default renderer.
                return defaultRender(tokens, idx, options, env, self);
            };

            // convert the img src of the html
            md.renderer.rules.html_block = function (tokens, idx) {
                var html = tokens[idx].content;
                var $ = cheerio.load(html);
                $('img').each(function () {
                    var src = $(this).attr('src');
                    var href = convertImgPath(src, filename);
                    $(this).attr('src', href);
                });
                return $.html();
            };

            // checkbox
            // md.use(require('markdown-it-checkbox'));

            // emoji
            // var f = vscode.workspace.getConfiguration('markdown-pdf')['emoji'];
            // if (f) {
            //     var emojies_defs = require(path.join(__dirname, 'data', 'emoji.json'));
            //     try {
            //         var options = {
            //             defs: emojies_defs
            //         };
            //     } catch (error) {
            //         statusbarmessage.dispose();
            //         showErrorMessage('markdown-it-emoji:options', error);
            //     }
            //     md.use(require('markdown-it-emoji'), options);
            //     md.renderer.rules.emoji = function (token, idx) {
            //         var emoji = token[idx].markup;
            //         var emojipath = path.join(__dirname, 'node_modules', 'emoji-images', 'pngs', emoji + '.png');
            //         var emojidata = readFile(emojipath, null).toString('base64');
            //         if (emojidata) {
            //             return '<img class="emoji" alt="' + emoji + '" src="data:image/png;base64,' + emojidata + '" />';
            //         } else {
            //             return ':' + emoji + ':';
            //         }
            //     };
            // }

            // toc
            // https://github.com/leff/markdown-it-named-headers
            function Slug(string) {
                try {
                    var stg = encodeURI(string.trim()
                        .toLowerCase()
                        .replace(/[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/^\-+/, '')
                        .replace(/\-+$/, ''));
                    return stg;
                } catch (error) {
                    console('Slug()', error);
                }
            }
            var options = {
                slugify: Slug
            }
            md.use(require('markdown-it-named-headers'), options);

            // markdown-it-container
            // https://github.com/markdown-it/markdown-it-container
            md.use(require('markdown-it-container'), '', {
                validate: function (name) {
                    return name.trim().length;
                },
                render: function (tokens, idx) {
                    if (tokens[idx].info.trim() !== '') {
                        return `<div class="${tokens[idx].info.trim()}">\n`;
                    } else {
                        return `</div>\n`;
                    }
                }
            });

            // PlantUML
            // https://github.com/gmunguia/markdown-it-plantuml
            // md.use(require('markdown-it-plantuml'));

            return md.render(text);

        } catch (error) {
            console.log('convertMarkdownToHtml()', error);
        }
    }


    makeHtml = async (data, fs_path) => {
        try {
            // read styles
            var style = '';
            // style += readStyles(uri);

            // get title
            var title = path.basename(fs_path);

            // read template
            var filename = path.join(__dirname, 'template', 'template.html');
            var template = await fs.readFile(filename, { encoding: "utf-8" });

            // compile template
            var mustache = require('mustache');

            var view = {
                title: title,
                style: style,
                content: data
            };
            return mustache.render(template, view);
        } catch (error) {
            console.log('makeHtml()', error);
        }
    }

    exportHtml = async (data: string, filename: string) => {
        await fs.writeFile(filename, data, 'utf-8', function (error) {
            if (error) {
                console.log('exportHtml()', error);
                return;
            }
        });
    }

    exportPdf = async (data, filename, type, uri) => {


        var exportFilename = filename;

        // vscode.window.withProgress({
        //     location: vscode.ProgressLocation.Notification,
        //     title: '[Markdown PDF]: Exporting (' + type + ') ...'
        // }, async () => {
        try {
            // export html
            // if (type == 'html') {
            //     exportHtml(data, exportFilename);
            //     vscode.window.setStatusBarMessage('$(markdown) ' + exportFilename, StatusbarMessageTimeout);
            //     return;
            // }

            const puppeteer = require('puppeteer');
            // create temporary file
            var f = path.parse(filename);
            var tmpfilename = path.join(f.dir, f.name + '_tmp.html');
            exportHtml(data, tmpfilename);
            var options = {
                args: ['--lang=ja'],
                //     executablePath: vscode.workspace.getConfiguration('markdown-pdf')['executablePath'] || undefined
            }
            const browser = await puppeteer.launch(options).catch(error => {
                console.log('puppeteer.launch()', error);
            });
            const page = await browser.newPage().catch(error => {
                console.log('browser.newPage()', error);
            });;
            const uri = "file:///home/nnyn/Documents/markdown-book/image/" + tmpfilename;
            await page.goto(uri, { waitUntil: 'networkidle0' }).catch(error => {
                console.log('page.goto()', error);
            });;

            // generate pdf
            // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
            if (type == 'pdf') {
                // If width or height option is set, it overrides the format option.
                // In order to set the default value of page size to A4, we changed it from the specification of puppeteer.
                var width_option = "";
                var height_option = "";
                var format_option = '';
                if (!width_option && !height_option) {
                    format_option = "A4";
                }
                var landscape_option;
                if ("portrait" == 'landscape') {
                    landscape_option = true;
                } else {
                    landscape_option = false;
                }
                var options = {
                    path: exportFilename,
                    scale: 1,
                    displayHeaderFooter: true,
                    headerTemplate: "<div style=\"font-size: 9px; margin-left: 1cm;\"> <span class='title'></span></div> <div style=\"font-size: 9px; margin-left: auto; margin-right: 1cm; \"> <span class='date'></span></div>",
                    footerTemplate: "<div style=\"font-size: 9px; margin: 0 auto;\"> <span class='pageNumber'></span> / <span class='totalPages'></span></div>",
                    printBackground: true,
                    landscape: landscape_option,
                    pageRanges: "",
                    format: format_option,
                    width: "",
                    height: "",
                    margin: {
                        top: "1.5cm",
                        right: "1cm",
                        bottom: "1cm",
                        left: "1cm",
                    }
                }
                await page.pdf(options).catch(error => {
                    console.log('page.pdf', error);
                });
            }

            await browser.close();

        } catch (error) {
            console.log('exportPdf()', error);
        }
        // } // async
        // ); // vscode.window.withProgress
    }

    read_pdf = (pdf_path: string) => {
        return new Promise((resolve, reject) => {
            const PDFParser = require("pdf2json");
            let pdfParser = new PDFParser();
            pdfParser.on("pdfParser_dataError", (errData:any) => console.error(errData.parserError));
            pdfParser.on("pdfParser_dataReady", async (pdfData:any) => {
                await pfs.writeFile("./pdf2json.json", JSON.stringify(pdfData));
                resolve();
            });
            pdfParser.loadPDF(pdf_path);
        });
    };


    build = async (conf: config) => {
        const md_text = await pfs.readFile("./input.md", { encoding: "utf-8" });
        const content = this.convertMarkdownToHtml("./input.md", md_text);
        const html = await this.makeHtml(content, "./");
        await this.exportPdf(html, "./output.pdf", "pdf", "./");
        this.read_pdf("./output.pdf")
        console.log("done");
    }
}
