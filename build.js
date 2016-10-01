﻿var ez = require('gulp-build-shortcuts');

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
var jsnsAmdWrapper = require('./jsns-amd-wrapper.js');

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

function compileJsnsTs(settings) {

    var piped = gulp.src(settings.libs, { base: settings.base })
        .pipe(sourcemaps.init())
        .pipe(ts({
            noImplicitAny: false,
            allowJs: true,
            isolatedModules: true,
            module: 'amd'
        }))
        .pipe(jsnsAmdWrapper(settings));

    if (settings.concat === true) {
        piped = piped.pipe(concat(settings.output + '.js'))
            .pipe(rename(settings.output + '.min.js'));
    }

    //.pipe(uglify())
    piped = piped
        .pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: settings.sourceRoot }))
        .pipe(gulp.dest(settings.dest));

    return piped;
};
module.exports.prototype.compileJsnsTs = compileJsnsTs;