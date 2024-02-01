import { 
  tap,
  of,
  from,
  map,
  switchMap,
  Subject,
  takeUntil,
  filter
} from "rxjs";

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
  sortCleanedIndexArr,
  SearchIndexEntryArr,
  FileContentObj,
  generateRawIndex,
  reformatIndex
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
      map((fileContentArr: FileContentObj[]): SearchIndexEntryArr[] => {
        printPreprocessingFilesMsg();
        return generateRawIndex(fileContentArr);
      }),
      map((preIndexObjArr): SearchIndexEntryArr[] => {
        printProcessingMsg();
        return reduceToUniqueKeys(preIndexObjArr, true);
      }),
      map((uniqueKeysArr): SearchIndexEntryArr[] => {
        printRemovingDuplicatesMsg();
        return removeDuplicateValueObjs(uniqueKeysArr);
      }),
      map((cleanedIndexArr: SearchIndexEntryArr[]): SearchIndexEntryArr[] => {
        return sortCleanedIndexArr(cleanedIndexArr)
      }),
      tap((cleanedAndSortedIndexArr: SearchIndexEntryArr[]): void => {
        const finalIndex = reformatIndex(cleanedAndSortedIndexArr);
        writeSearchIndexObjToJsonFile(finalIndex, targetPath);
        stopSignal$$.next("STOP");
      })
    )
    .subscribe();
};

main();
