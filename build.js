var compileJsnsTs = require('threax-gulp-tk/typescript.js');

module.exports = function (rootDir, outDir) {
    return compileJsnsTs({
        libs: [
            __dirname + "/src/polyfill.js",
            __dirname + "/src/**/*.ts",
            "!**/*.intellisense.js"
        ],
        runners: [
            "polyfill",
            "hr.componentgatherer"
        ],
        output: "HtmlRapier",
        dest: outDir,
        sourceRoot: __dirname + "/src/",
        concat: true
    });
}