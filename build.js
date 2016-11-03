var compileJsnsTs = require('threax-gulp-tk/typescript.js');
var compileJavascript = require('threax-gulp-tk/javascript.js');

module.exports = function (rootDir, outDir, settings) {
    if(settings === undefined){
        settings = {};
    }

    var concat = true;
    if(settings.concat !== undefined){
        concat = settings.concat;
    }

    var minify = true;
    if(settings.minify !== undefined){
        minify = settings.minify;
    }

    compileJavascript({
        libs: [
            __dirname + "/src/polyfill.js",
            "!**/*.intellisense.js"
        ],
        output: "polyfill",
        dest: outDir,
        sourceRoot: __dirname + "/src/",
        concat: concat,
        minify: minify
    });

    return compileJsnsTs({
        libs: [
            __dirname + "/src/**/*.ts",
            "!**/*.intellisense.js"
        ],
        runners: [
            "hr.polyfill",
            "hr.componentgatherer"
        ],
        output: "HtmlRapier",
        dest: outDir,
        sourceRoot: __dirname + "/src/",
        namespace: "hr",
        concat: concat,
        minify: minify
    });
}