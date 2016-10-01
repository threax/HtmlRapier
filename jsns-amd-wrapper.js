'use strict';

//This was originally https://github.com/contra/gulp-concat
//Thanks to them I was able to figure out the sourcemaps and figured it was a good starting point.

var through = require('through2');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var Concat = require('concat-with-sourcemaps');
var es = require('event-stream');

// file can be a vinyl file object or a string
// when a string it will construct a new one
module.exports = function (opt) {
    opt = opt || {};

    // to preserve existing |undefined| behaviour and to introduce |newLine: ""| for binaries
    if (typeof opt.newLine !== 'string') {
        opt.newLine = gutil.linefeed;
    }

    var isUsingSourceMaps = false;
    var latestFile;
    var latestMod;
    var concat;

    if (opt['moduleStart'] === undefined) {
        opt.moduleStart = moduleStart;
    }

    if (opt['moduleEnd'] === undefined) {
        opt.moduleEnd = moduleEnd;
    }

    var stream = function (injectMethod) {
        return es.map(function (file, cb) {
            try {

                var usingSrc = false;
                if (file.sourceMap) {
                    usingSrc = true;
                }

                concat = new Concat(usingSrc, file.path + '.out', opt.newLine);

                var newContents = injectMethod(file, concat);
                //file.contents = new Buffer(newContents);
                file.contents = concat.content;

                if (usingSrc) {
                    file.sourceMap = JSON.parse(concat.sourceMap);
                }

            } catch (err) {
                return cb(new gutil.PluginError('gulp-inject-string', err));
            }
            cb(null, file);
        });
    };

    return stream(function (file, concat) {
        console.log('streaming ' + opt.moduleStart(file, opt));

        concat.add(null, opt.moduleStart(file, opt));
        concat.add(file.relative, file.contents, file.sourceMap);
        concat.add(null, opt.moduleEnd(file, opt));

        // assume start and end are strings
        //return String(opt.moduleStart(file, opt)) + fileContents + String(opt.moduleEnd(file, opt));
    });

    //function bufferContents(file, enc, cb) {
    //    // ignore empty files
    //    if (file.isNull()) {
    //        cb();
    //        return;
    //    }

    //    // we don't do streams (yet)
    //    if (file.isStream()) {
    //        this.emit('error', new PluginError('jsns-amd-wrapper', 'Streaming not supported'));
    //        cb();
    //        return;
    //    }

    //    // enable sourcemap support for concat
    //    // if a sourcemap initialized file comes in
    //    if (file.sourceMap && isUsingSourceMaps === false) {
    //        isUsingSourceMaps = true;
    //    }

    //    // set latest file if not already set,
    //    // or if the current file was modified more recently.
    //    if (!latestMod || file.stat && file.stat.mtime > latestMod) {
    //        latestFile = file;
    //        latestMod = file.stat && file.stat.mtime;
    //    }

    //    console.log('begin stream ' + file.path);

    //    // construct concat instance
    //    //if (!concat) {
    //        console.log('created concat ' + file.path);
    //        concat = new Concat(isUsingSourceMaps, file.path + '.out', opt.newLine);
    //    ///}

    //    // add file to concat instance

    //    concat.add(null, opt.moduleStart(file, opt));
    //    concat.add(file.relative, file.contents, file.sourceMap);
    //    concat.add(null, opt.moduleEnd(file, opt));

    //    file.contents = concat.content;


    //    if (concat.sourceMapping) {
    //        file.sourceMap = JSON.parse(concat.sourceMap);
    //    }

    //    //this.push(joinedFile);

    //    cb(null, file);
    //}

    //function endStream(cb) {
    //    // no files passed in, no file goes out
    //    if (!latestFile || !concat) {
    //        cb();
    //        return;
    //    }
    //}

    //return through.obj(bufferContents, endStream);
};

function moduleStart(file, settings) {
    var parsed = path.parse(file.path);

    var moduleName = parsed.name;

    var header;
    if (settings['runners'] !== undefined && settings.runners === true
        || (Array.isArray(settings.runners) && settings.runners.includes(moduleName))) {
        header = 'jsns.runAmd(';
    }
    else {
        header = 'jsns.amd("' + moduleName + '", ';
    }

    header += 'function(define) {\n';
    return header;
}

function moduleEnd(file, settings) {
    return '});';
}