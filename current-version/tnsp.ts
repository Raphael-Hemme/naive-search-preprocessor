import { tap, of, from, map, switchMap, Subject, takeUntil, filter } from "rxjs";

import {
  printFrontMatter,
  printFilePaths,
  printHelp,
  printError,
  printPreprocessingFilesMsg,
  printProcessingMsg,
  printRemovingDuplicatesMsg,
} from "./cli-io.js";

import {
  reduceToUniqueKeys,
  removeDuplicateValueObjs,
  sortFinalIndexArr,
  SearchIndexEntryArr,
  SearchIndexEntryObj,
  FileContentObj,
  generateArrOfPreIndexObjsFromFilePathArr,
} from "./data-processing.js";

import {
  generateFilePathArr,
  generateFileContentObjArr,
  writeSearchIndexObjToJsonFile,
} from "./file-io.js";

import { processArgsAndExecuteMode, UserInputResultObj } from "./cli-io.js";

let sourcePaths: string[] = [];
let targetPath: string = "";

const stopSignal$$ = new Subject();

const handleResultOfUserInput = (userInputResultObj: UserInputResultObj) => {
  if (userInputResultObj.mode === "HELP") {
    printHelp();
    stopSignal$$.next("STOP");
  } else if (userInputResultObj.mode === "ERROR") {
    printError(userInputResultObj.errors.join("\n"));
    stopSignal$$.next("STOP");
  } else {
    sourcePaths = userInputResultObj.sourcePaths.slice();
    targetPath = userInputResultObj.targetPath;
  }
};

/**
 * Sorts the cleaned pre-object array and writes the resulting search index to a JSON file.
 * @param cleanedPreObjArr - The cleaned pre-object array to sort and write to a JSON file.
 */
const sortAndWriteIndex = (cleanedPreObjArr: SearchIndexEntryArr[]) => {
  const sortedCleanedPreObjArr: SearchIndexEntryArr[] =
    sortFinalIndexArr(cleanedPreObjArr);

  const indexArr: SearchIndexEntryObj[] = sortedCleanedPreObjArr.map(
    (el: SearchIndexEntryArr) => {
      return {
        searchTerm: el[0],
        searchResults: el[1],
      };
    }
  );

  writeSearchIndexObjToJsonFile(indexArr, targetPath);
  stopSignal$$.next("STOP");
};

const main = () => {
  of("START")
    .pipe(
      takeUntil(stopSignal$$),
      tap(() => printFrontMatter()),
      switchMap(() => from(processArgsAndExecuteMode())),
      tap((userInputResultObj: UserInputResultObj) =>
        handleResultOfUserInput(userInputResultObj)
      ),
      filter((userInputResultObj: UserInputResultObj) => {
        return userInputResultObj.mode === 'AUTO' 
          || userInputResultObj.mode === 'CLI'
      }),
      map(() => generateFilePathArr(sourcePaths)),
      tap((filePathArr: string[]) => printFilePaths(filePathArr)),
      map((filePathArr: string[]): FileContentObj[] =>
        generateFileContentObjArr(filePathArr)
      ),
      map((fileContentArr: FileContentObj[]) => {
        printPreprocessingFilesMsg();
        return generateArrOfPreIndexObjsFromFilePathArr(fileContentArr);
      }),
      map((preIndexObjArr) => {
        printProcessingMsg();
        return reduceToUniqueKeys(preIndexObjArr, true);
      }),
      map((uniqueKeysArr) => {
        printRemovingDuplicatesMsg();
        return removeDuplicateValueObjs(uniqueKeysArr);
      }),
      tap((cleanedPreObjArr: SearchIndexEntryArr[]): void =>
        sortAndWriteIndex(cleanedPreObjArr)
      )
    )
    .subscribe();
};

main();
