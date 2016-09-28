var ez = require('gulp-build-shortcuts');

module.exports = function (rootDir, outDir) {
    ez.minifyConcat({
        libs: [
            __dirname + "/src/jsns.js",
            __dirname + "/src/polyfill.js",
            __dirname + "/src/**/*.js",
            "!**/*.intellisense.js"
        ],
        output: "HtmlRapier",
        dest: outDir,
        sourceRoot: __dirname + "/custom_components/HtmlRapier/src/"
    });
}