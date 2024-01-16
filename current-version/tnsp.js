import { tap, of, from, map, switchMap, Subject, takeUntil, filter } from "rxjs";
import { printFrontMatter, printFilePaths, printHelp, printError, printPreprocessingFilesMsg, printProcessingMsg, printRemovingDuplicatesMsg, } from "./cli-io.js";
import { reduceToUniqueKeys, removeDuplicateValueObjs, sortFinalIndexArr, generateArrOfPreIndexObjsFromFilePathArr, } from "./data-processing.js";
import { generateFilePathArr, generateFileContentObjArr, writeSearchIndexObjToJsonFile, } from "./file-io.js";
import { processArgsAndExecuteMode } from "./cli-io.js";
let sourcePaths = [];
let targetPath = "";
const stopSignal$$ = new Subject();
const handleResultOfUserInput = (userInputResultObj) => {
    if (userInputResultObj.mode === "HELP") {
        printHelp();
        stopSignal$$.next("STOP");
    }
    else if (userInputResultObj.mode === "ERROR") {
        printError(userInputResultObj.errors.join("\n"));
        stopSignal$$.next("STOP");
    }
    else {
        sourcePaths = userInputResultObj.sourcePaths.slice();
        targetPath = userInputResultObj.targetPath;
    }
};
/**
 * Sorts the cleaned pre-object array and writes the resulting search index to a JSON file.
 * @param cleanedPreObjArr - The cleaned pre-object array to sort and write to a JSON file.
 */
const sortAndWriteIndex = (cleanedPreObjArr) => {
    const sortedCleanedPreObjArr = sortFinalIndexArr(cleanedPreObjArr);
    const indexArr = sortedCleanedPreObjArr.map((el) => {
        return {
            searchTerm: el[0],
            searchResults: el[1],
        };
    });
    writeSearchIndexObjToJsonFile(indexArr, targetPath);
    stopSignal$$.next("STOP");
};
const main = () => {
    of("START")
        .pipe(takeUntil(stopSignal$$), tap(() => printFrontMatter()), switchMap(() => from(processArgsAndExecuteMode())), tap((userInputResultObj) => handleResultOfUserInput(userInputResultObj)), filter((userInputResultObj) => {
        return userInputResultObj.mode === 'AUTO'
            || userInputResultObj.mode === 'CLI';
    }), map(() => generateFilePathArr(sourcePaths)), tap((filePathArr) => printFilePaths(filePathArr)), map((filePathArr) => generateFileContentObjArr(filePathArr)), map((fileContentArr) => {
        printPreprocessingFilesMsg();
        return generateArrOfPreIndexObjsFromFilePathArr(fileContentArr);
    }), map((preIndexObjArr) => {
        printProcessingMsg();
        return reduceToUniqueKeys(preIndexObjArr, true);
    }), map((uniqueKeysArr) => {
        printRemovingDuplicatesMsg();
        return removeDuplicateValueObjs(uniqueKeysArr);
    }), tap((cleanedPreObjArr) => sortAndWriteIndex(cleanedPreObjArr)))
        .subscribe();
};
main();
