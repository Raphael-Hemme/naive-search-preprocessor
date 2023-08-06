"use strict";
// Object.defineProperty(exports, "__esModule", { value: true });

var matchSymbolsRegEx = /[^a-zA-Z0-9. ]/g;
var matchMultipleSpaceRegEx = /\s{2,}/g;
var matchMultipleDotRegEx = /\.{2,}/g;
var cleanSearchEntryStrRegEx = /[^a-zA-Z0-9]/g;
// currently not used - but might be useful later
export const generatePartialEntries = function (entry) {
    var partialsArr = [];
    for (var strLen = entry.length; strLen > 0; strLen--) {
        partialsArr.push(entry.slice(0, strLen));
    }
    ;
    return (partialsArr);
};
export const cleanUpLineStr = function (lineStr) {
    return lineStr
        .replace(matchSymbolsRegEx, ' ')
        .replace(matchMultipleSpaceRegEx, ' ')
        .trim();
};

export const generateCleanedLineSplitArr = function (data) {
    var i = 1;
    var newLineSplitArr = data.split('\n').map(function (l) {
        var cleanedLineStr = (0, cleanUpLineStr)(l);
        var cleanedLineStrArr = cleanedLineStr.split(' ');
        var result = {
            line: i,
            contentArr: cleanedLineStrArr
        };
        i += 1;
        return result;
    });
    return newLineSplitArr;
};
export const cleanSearchEntryStr = function (searchEntryStr) {
    var strLen = searchEntryStr.length;
    var cleanedStr = searchEntryStr.replace(matchMultipleDotRegEx, '.');
    if (cleanSearchEntryStrRegEx.test(searchEntryStr[strLen - 1])) {
        cleanedStr = searchEntryStr.slice(0, strLen - 2);
    }
    else if (cleanSearchEntryStrRegEx.test(searchEntryStr[0])) {
        cleanedStr = searchEntryStr.slice(1);
    }
    else {
        cleanedStr = searchEntryStr;
    }
    return cleanedStr.toLowerCase();
};

export const generatePreIndexObjArr = function (cleanedLineSplitArr, sourceFilePath) {
    var indexArr = [];
    for (var _i = 0, cleanedLineSplitArr_1 = cleanedLineSplitArr; _i < cleanedLineSplitArr_1.length; _i++) {
        var lineObj = cleanedLineSplitArr_1[_i];
        for (var _a = 0, _b = lineObj.contentArr; _a < _b.length; _a++) {
            var contentE = _b[_a];
            /*
             * Push the content entry into the index array - itself formatted as an array of the string (the key) and an array
             * with one object as its only entry that contains the source file and line number. Putting this source object
             * into an arry will help later when filtering for duplicate string entries (keys) - which will become the search keys
             * in an index object. Because we can't have identical keys, we need to reduce all identical keys over all file
             * arrays and push the source objects into an array so each key can have multiple matching sources.
             */
            indexArr.push([
                (0, cleanSearchEntryStr)(contentE),
                [
                    {
                        file: sourceFilePath,
                        line: lineObj.line
                    }
                ]
            ]);
        }
    }
    // delete entries with emty strings (can happen when multiple space characters follow in a row and space is used as seperator)
    var cleanedIndexArr = indexArr.filter(function (el) { return el[0]; });
    var reducedArr = (0, reduceToUniqueKeys)(cleanedIndexArr);
    return reducedArr;
};

export const reduceToUniqueKeys = function (inputArr, isFullArr) {
    if (isFullArr === void 0) { isFullArr = false; }
    var reducedArr = [];
    var _loop_1 = function (preIndexArr) {
        var duplicateKeyEntrysArr = inputArr.filter(function (el) { return el[0] === preIndexArr[0]; });
        var subArrToPush = duplicateKeyEntrysArr.map(function (el) { return isFullArr ? el[1] : el[1].flat(); }).flat();
        if (duplicateKeyEntrysArr.length > 0) {
            reducedArr.push([
                preIndexArr[0],
                subArrToPush
            ]);
        }
        else {
            reducedArr.push(preIndexArr);
        }
    };
    for (var _i = 0, inputArr_1 = inputArr; _i < inputArr_1.length; _i++) {
        var preIndexArr = inputArr_1[_i];
        _loop_1(preIndexArr);
    }
    // Has this really been the bug that caused node to run out of memory and crash?
    // Because the per line arrays were not cleaned properly because of the condition below?
    // if (isFullArr) {
    var stringifiedArr = reducedArr.map(function (el) { return JSON.stringify(el); });
    var reducedStringifiedArr = Array.from(new Set(stringifiedArr));
    reducedArr = reducedStringifiedArr.map(function (el) { return JSON.parse(el); });
    // }
    return reducedArr;
};

export const removeDuplicateValueObjs = function (inputArr) {
    return inputArr.map(function (el) {
        var stringifiedValueArr = el[1].map(function (e) { return JSON.stringify(e); });
        var filteredValueArr = Array.from(new Set(stringifiedValueArr)).map(function (el) { return JSON.parse(el); });
        return [
            el[0],
            filteredValueArr
        ];
    });
};

export const sortFinalIndexArr = function (inputArr) {
    var sortedArr = inputArr.sort(function (a, b) {
        if (a[0] > b[0]) {
            return 1;
        }
        else if (a[0] < b[0]) {
            return -1;
        }
        else {
            return 0;
        }
    });
    return sortedArr;
};