const matchSymbolsRegEx = /[^a-zA-Z0-9. ]/g;
const matchMultipleSpaceRegEx = /\s{2,}/g;
const matchMultipleDotRegEx = /\.{2,}/g;
const cleanSearchEntryStrRegEx = /[^a-zA-Z0-9]/g;
// currently not used - but might be useful later
const generatePartialEntries = (entry) => {
    const partialsArr = [];
    for (let strLen = entry.length; strLen > 0; strLen--) {
        partialsArr.push(entry.slice(0, strLen));
    }
    ;
    return (partialsArr);
};
export const cleanUpLineStr = (lineStr) => {
    return lineStr
        .replace(matchSymbolsRegEx, ' ')
        .replace(matchMultipleSpaceRegEx, ' ')
        .trim();
};
export const generateCleanedLineSplitArr = (data) => {
    let i = 1;
    const newLineSplitArr = data.split('\n').map(l => {
        const cleanedLineStr = cleanUpLineStr(l);
        const cleanedLineStrArr = cleanedLineStr.split(' ');
        const result = {
            line: i,
            contentArr: cleanedLineStrArr
        };
        i += 1;
        return result;
    });
    return newLineSplitArr;
};
export const cleanSearchEntryStr = (searchEntryStr) => {
    const strLen = searchEntryStr.length;
    let cleanedStr = searchEntryStr.replace(matchMultipleDotRegEx, '.');
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
export const generatePreIndexObjArr = (cleanedLineSplitArr, sourceFilePath) => {
    const indexArr = [];
    for (const lineObj of cleanedLineSplitArr) {
        for (const contentE of lineObj.contentArr) {
            /*
             * Push the content entry into the index array - itself formatted as an array of the string (the key) and an array
             * with one object as its only entry that contains the source file and line number. Putting this source object
             * into an arry will help later when filtering for duplicate string entries (keys) - which will become the search keys
             * in an index object. Because we can't have identical keys, we need to reduce all identical keys over all file
             * arrays and push the source objects into an array so each key can have multiple matching sources.
             */
            indexArr.push([
                cleanSearchEntryStr(contentE),
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
    const cleanedIndexArr = indexArr.filter(el => el[0]);
    const reducedArr = reduceToUniqueKeys(cleanedIndexArr);
    return reducedArr;
};
export const reduceToUniqueKeys = (inputArr, isFullArr = false) => {
    let reducedArr = [];
    for (const preIndexArr of inputArr) {
        const duplicateKeyEntrysArr = inputArr.filter(el => el[0] === preIndexArr[0]);
        const subArrToPush = duplicateKeyEntrysArr.map(el => isFullArr ? el[1] : el[1].flat()).flat();
        if (duplicateKeyEntrysArr.length > 0) {
            reducedArr.push([
                preIndexArr[0],
                subArrToPush
            ]);
        }
        else {
            reducedArr.push(preIndexArr);
        }
    }
    const stringifiedArr = reducedArr.map(el => JSON.stringify(el));
    const reducedStringifiedArr = Array.from(new Set(stringifiedArr));
    reducedArr = reducedStringifiedArr.map(el => JSON.parse(el));
    return reducedArr;
};
export const generateArrOfPreIndexObjsFromFilePathArr = (fileContentArr) => {
    console.log('\n');
    console.log('Processing content of files...');
    const resultArr = [];
    for (const file of fileContentArr) {
        const cleanedLineSplitArr = generateCleanedLineSplitArr(file.fileContent);
        resultArr.push(...generatePreIndexObjArr(cleanedLineSplitArr, file.filePath));
    }
    return resultArr;
};
export const removeDuplicateValueObjs = (inputArr) => {
    return inputArr.map(el => {
        const stringifiedValueArr = el[1].map(e => JSON.stringify(e));
        const filteredValueArr = Array.from(new Set(stringifiedValueArr)).map(el => JSON.parse(el));
        return [
            el[0],
            filteredValueArr
        ];
    });
};
export const sortFinalIndexArr = (inputArr) => {
    const sortedArr = inputArr.sort((a, b) => {
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
