// ------ REGEX DEFINITIONS ------
const matchSymbolsRegEx = /[^a-zA-Z0-9. ]/g;
const matchMultipleSpaceRegEx = /\s{2,}/g;
const matchMultipleDotRegEx = /\.{2,}/g;
const cleanSearchEntryStrRegEx = /[^a-zA-Z0-9]/g;
// ------ FUNCTION DEFINITIONS ------
/**
 * Cleans up a string by replacing symbols with spaces, removing extra spaces, and trimming the result.
 * @param {string} lineStr - The string to clean up.
 * @returns {string} The cleaned up string.
 */
export const cleanUpLineStr = (lineStr) => {
    return lineStr
        .replace(matchSymbolsRegEx, " ")
        .replace(matchMultipleSpaceRegEx, " ")
        .trim();
};
/**
 * Generates an array of objects, each representing a line of text with its line number and the lines content split into an array of cleaned words.
 * @param {string} data - The input string to be processed.
 * @returns {LineSplitObj[]} An array of objects, each containing the line number and an array of cleaned words.
 */
export const generateCleanedLineSplitArr = (data) => {
    const newLineSplitArr = data.split("\n").map((l, i) => {
        const cleanedLineStr = cleanUpLineStr(l);
        const cleanedLineStrArr = cleanedLineStr.split(" ");
        const result = {
            line: i + 1,
            contentArr: cleanedLineStrArr,
        };
        return result;
    });
    return newLineSplitArr;
};
/**
 * Cleans a search entry string by replacing multiple dots with a single dot, removing any trailing or leading punctuation, and converting to lowercase.
 * @param {string} searchEntryStr - The search entry string to be cleaned.
 * @returns {string} The cleaned search entry string.
 */
export const cleanSearchEntryStr = (searchEntryStr) => {
    const strLen = searchEntryStr.length;
    let cleanedStr = searchEntryStr.replace(matchMultipleDotRegEx, ".");
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
export const generatePreIndexArr = (cleanedLineSplitArr, sourceFilePath) => {
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
                        line: lineObj.line,
                    },
                ],
            ]);
        }
    }
    // delete entries with empty strings (can happen when multiple space characters follow in a row and space is used as seperator)
    const cleanedIndexArr = indexArr.filter((el) => el[0]);
    const reducedArr = reduceToUniqueKeys(cleanedIndexArr);
    return reducedArr;
};
/**
 * Reduces an array of SearchIndexEntryArrFormat objects to an array of unique keys and their corresponding values.
 * @param {SearchIndexEntryArr[]} inputArr - The input array to be processed.
 * @param {boolean} [isFullArr=false] - A boolean indicating whether the input array contains full arrays or sub-arrays.
 * @returns {SearchIndexEntryArr[]} An array of unique keys and their corresponding values.
 */
export const reduceToUniqueKeys = (inputArr, isFullArr = false) => {
    let reducedArr = [];
    for (const preIndexArr of inputArr) {
        const duplicateKeyEntrysArr = inputArr.filter((el) => el[0] === preIndexArr[0]);
        const subArrToPush = duplicateKeyEntrysArr
            .map((el) => (isFullArr ? el[1] : el[1].flat()))
            .flat();
        if (duplicateKeyEntrysArr.length > 0) {
            reducedArr.push([preIndexArr[0], subArrToPush]);
        }
        else {
            reducedArr.push(preIndexArr);
        }
    }
    const stringifiedArr = reducedArr.map((el) => JSON.stringify(el));
    const reducedStringifiedArr = Array.from(new Set(stringifiedArr));
    reducedArr = reducedStringifiedArr.map((el) => JSON.parse(el));
    return reducedArr;
};
export const generateRawIndex = (fileContentArr) => {
    const resultArr = [];
    for (const file of fileContentArr) {
        const cleanedLineSplitArr = generateCleanedLineSplitArr(file.fileContent);
        resultArr.push(...generatePreIndexArr(cleanedLineSplitArr, file.filePath));
    }
    return resultArr;
};
/**
 * Removes duplicate objects from an array of SearchIndexEntryArrFormat objects.
 * @param {SearchIndexEntryArr[]} inputArr - The input array to be processed.
 * @returns {SearchIndexEntryArr[]} An array of SearchIndexEntryArrFormat objects with duplicate objects removed.
 */
export const removeDuplicateValueObjs = (inputArr) => {
    return inputArr.map((el) => {
        const stringifiedValueArr = el[1].map((e) => JSON.stringify(e));
        const filteredValueArr = [...new Set(stringifiedValueArr)].map((el) => JSON.parse(el));
        return [el[0], filteredValueArr];
    });
};
/**
 * Sorts an array of SearchIndexEntryArr arrays by the first element of each sub-array which is the key / search term.
 * @param {SearchIndexEntryArr[]} inputArr - The input array to be sorted.
 * @returns {SearchIndexEntryArr[]} A sorted array of SearchIndexEntryArrFormat objects.
 */
export const sortCleanedIndexArr = (inputArr) => {
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
export const reformatIndex = (cleanedAndSortedIndex) => {
    return cleanedAndSortedIndex
        .map((el) => {
        return {
            searchTerm: el[0],
            searchResults: el[1],
        };
    });
};
