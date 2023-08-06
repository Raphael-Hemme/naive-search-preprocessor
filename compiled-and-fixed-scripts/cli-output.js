"use strict";
// Object.defineProperty(exports, "__esModule", { value: true });

export const printFrontMatter = function () {
    console.log('\n');
    console.log('-- NAIVE SEARCH PREPROCESSOR --');
    console.log('\n');
    console.log('... collecting files');
    console.log('\n');
};

export const printFilePaths = function (filePathArr) {
    console.log('Found the following', filePathArr.length, 'files: ');
    for (var _i = 0, filePathArr_1 = filePathArr; _i < filePathArr_1.length; _i++) {
        var filePath = filePathArr_1[_i];
        console.log('\t', filePath);
    }
    console.log('\n');
};
