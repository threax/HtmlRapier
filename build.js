var ez = require('gulp-build-shortcuts');

var gulp = require("gulp"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    rename = require("gulp-rename"),
    sourcemaps = require("gulp-sourcemaps");
var less = require('gulp-less');
var uglifycss = require('gulp-uglifycss');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var ts = require('gulp-typescript');
var es = require('event-stream');
var path = require('path');

module.exports = function (rootDir, outDir) {
    return compileTs({
        libs: [
            __dirname + "/src/polyfill.js",
            __dirname + "/src/**/*.ts",
            "!**/*.intellisense.js"
        ],
        runners:[
            "polyfill",
            "hr.componentgatherer"
        ],
        output: "HtmlRapier",
        namespace: "",
        dest: outDir,
        sourceRoot: __dirname + "/src/"
    });
}

function compileTs(settings) {
    if (settings['moduleStart'] === undefined) {
        function moduleStart(file) {
            var parsed = path.parse(file);

            var moduleName = settings.namespace + parsed.name;

            var header;
            if (settings['runners'] !== undefined && settings.runners === true || settings.runners.includes(moduleName)) {
                header = 'jsns.runAmd(';
            }
            else {
                header = 'jsns.amd("' + moduleName + '", ';
            }

            header += 'function(define) {\n';
            return header;
        }
        settings.moduleStart = moduleStart;
    }

    if (settings['moduleEnd'] === undefined) {
        function moduleEnd(file) {
            return '});';
        }
        settings.moduleEnd = moduleEnd;
    }


    return gulp.src(settings.libs, { base: settings.base })
        .pipe(sourcemaps.init())
        .pipe(ts({
            noImplicitAny: false,
            out: settings.output + '.js',
            allowJs: true,
            isolatedModules: true,
            module: 'amd'
        }))
        .pipe(wrap(settings.moduleStart, settings.moduleEnd))
        .pipe(concat(settings.output + '.js'))
        //.pipe(uglify())
        .pipe(rename(settings.output + '.min.js'))
        .pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: settings.sourceRoot }))
        .pipe(gulp.dest(settings.dest));
};

var stream = function (injectMethod) {
    return es.map(function (file, cb) {
        try {
            file.contents = new Buffer(injectMethod(file, String(file.contents)));
        } catch (err) {
            return cb(new gutil.PluginError('gulp-inject-string', err));
        }
        cb(null, file);
    });
};

function wrap(start, end) {
    return stream(function (file, fileContents) {
        // assume start and end are strings
        return String(start(file.path)) + fileContents + String(end(file.path));
    });
};