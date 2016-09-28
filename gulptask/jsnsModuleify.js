var gulp = require("gulp"),
    rimraf = require("rimraf"),
    concat = require("gulp-concat"),
    cssmin = require("gulp-cssmin"),
    uglify = require("gulp-uglify"),
    rename = require("gulp-rename"),
    sourcemaps = require("gulp-sourcemaps");
var less = require('gulp-less');
var path = require('path');
var uglifycss = require('gulp-uglifycss');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var injectString = require('gulp-inject-string');

//Moduleify
function JsnsModule(settings) {
    if (settings['moduleStart'] === undefined) {
        function moduleStart() {
            if (this['operation'] === undefined) {
                this.operation = 'define';
            }

            var header = 'jsns.' + this.operation + '("' + this.moduleName + '", [';

            var autoDepArgs = '';
            if (this['dependencies'] !== undefined) {
                for (i = 0; i < this.dependencies.length; ++i) {
                    var dep = this.dependencies[i];
                    header += '"' + dep + '", '
                    autoDepArgs += ', ' + dep.replace('.', '_');
                }
            }

            header += '], function(exports, module ' + autoDepArgs + ') {';
            return header;
        }
        settings.moduleStart = moduleStart;
    }

    if (settings['moduleEnd'] === undefined) {
        function moduleEnd() {
            return '});';
        }
        settings.moduleEnd = moduleEnd;
    }

    return gulp.src(settings.libs, { base: settings.base })
        .pipe(sourcemaps.init())
        .pipe(concat(settings.output))
        .pipe(injectString.wrap(settings.moduleStart(), settings.moduleEnd()))
        .pipe(gulp.dest(settings.dest));
}

module.exports = JsnsModule;