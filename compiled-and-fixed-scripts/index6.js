"use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
import { readdirSync, writeFile, readFileSync } from "fs";
import { of, tap, map } from "rxjs";
import { printFrontMatter, printFilePaths } from "./cli-output.js";
import { generateCleanedLineSplitArr, generatePreIndexObjArr, reduceToUniqueKeys, removeDuplicateValueObjs, sortFinalIndexArr } from "./data-processing.js";
var generateFilePathArr = function (dirArr) {
    var fileNameArr = [];
    for (var _i = 0, dirArr_1 = dirArr; _i < dirArr_1.length; _i++) {
        var dir = dirArr_1[_i];
        var filesOfDirArrEntryArr = (0, readdirSync)(dir);
        for (var _a = 0, filesOfDirArrEntryArr_1 = filesOfDirArrEntryArr; _a < filesOfDirArrEntryArr_1.length; _a++) {
            var fileName = filesOfDirArrEntryArr_1[_a];
            fileNameArr.push([dir, fileName]);
        }
    }
    return fileNameArr.map(function (_a) {
        var dir = _a[0], fileName = _a[1];
        return "".concat(dir, "/").concat(fileName);
    });
};

var writeSearchIndexObjToJsonFile = function (searchIndexArr) {
    var jsonObj = JSON.stringify(searchIndexArr);
    (0, writeFile)('search-index-5.json', jsonObj, 'utf8', function (err) {
        if (err) {
            console.log('There has been an error: ', err);
            console.log('\n');
        }
        else {
            console.log('Content has been written to file.\n');
        }
    });
};

var main = function () {
    (0, of)('start')
        .pipe((0, tap)(function () { return (0, printFrontMatter)(); }), (0, map)(function () { return generateFilePathArr(['./blog-posts', './io-garden-experiment-descriptions']); }), (0, tap)(function (filePathArr) { return (0, printFilePaths)(filePathArr); }), (0, map)(function (filePathArr) {
        var fileContentArr = [];
        console.log('Reading files:');
        for (var _i = 0, filePathArr_1 = filePathArr; _i < filePathArr_1.length; _i++) {
            var filePath = filePathArr_1[_i];
            console.log('\t', filePath);
            fileContentArr.push({
                fileContent: (0, readFileSync)(filePath, 'utf8'),
                filePath: filePath
            });
        }
        return fileContentArr;
    }), (0, map)(function (fileContentArr) {
        console.log('\n');
        console.log('Processing content of files...');
        var resultArr = [];
        for (var _i = 0, fileContentArr_1 = fileContentArr; _i < fileContentArr_1.length; _i++) {
            var file = fileContentArr_1[_i];
            var cleanedLineSplitArr = (0, generateCleanedLineSplitArr)(file.fileContent);
            resultArr.push.apply(resultArr, (0, generatePreIndexObjArr)(cleanedLineSplitArr, file.filePath));
        }
        return resultArr;
    }), (0, map)(function (preIndexObjArr) {
        console.log('\n\nProcessing full indexes and collecting sources...');
        console.log('This will take a while. Thanks for your patience.\n');
        var uniqueKeysArr = (0, reduceToUniqueKeys)(preIndexObjArr, true);
        return uniqueKeysArr;
    }), (0, map)(function (uniqueKeysArr) {
        console.log('\nRemoving duplicate matches...');
        console.log('Almost done now.\n\n');
        var cleanedPreObjArr = (0, removeDuplicateValueObjs)(uniqueKeysArr);
        return cleanedPreObjArr;
    }), (0, tap)(function (cleanedPreObjArr) {
        var sortedCleanedPreObjArr = (0, sortFinalIndexArr)(cleanedPreObjArr);
        var indexArr = sortedCleanedPreObjArr.map(function (el) {
            return {
                searchTerm: el[0],
                searchResults: el[1]
            };
        });
        writeSearchIndexObjToJsonFile(indexArr);
    }))
        .subscribe();
};
main();
