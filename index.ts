import {
    readFileSync,
    readdirSync,
    writeFile 
} from 'fs';
    
import {
    tap,
    of,
    filter,
    from,
    map,
    switchMap,
    Subject,
    takeUntil
 } from 'rxjs';


import {
  printFrontMatter,
  printFilePaths,
  printHelp,
  printError
} from './cli-output.js';

import {
    reduceToUniqueKeys,
    removeDuplicateValueObjs,
    sortFinalIndexArr,
    generateCleanedLineSplitArr,
    SearchIndexEntryArrFormat,
    SearchIndexObj,
    FileContetntObj,
    generateArrOfPreIndexObjsFromFilePathArr
} from './data-processing.js';

import { processArgsAndExecuteMode, UserInputResultObj } from './cli-input.js';

let sourcePaths: string[] = [];
let targetPath: string = '';

const stopSignal$$ = new Subject();

const generateFilePathArr = (dirArr: string[]): string[] => {
  const fileNameArr: string[][] = [];
  for (const dir of dirArr) {
    const filesOfDirArrEntryArr = readdirSync(dir);
    for (const fileName of filesOfDirArrEntryArr) {
      fileNameArr.push([dir, fileName]);
    }
  }
  return fileNameArr.map(([dir, fileName]) => `${dir}/${fileName}`);
};


const writeSearchIndexObjToJsonFile = (searchIndexArr: SearchIndexObj[], trgtP: string) => {
  const jsonObj = JSON.stringify(searchIndexArr);
  writeFile(trgtP, jsonObj, 'utf8', (err) => {
    if (err) {
      console.log('There has been an error: ', err);
      console.log('\n');
    } else {
      console.log('Content has been written to file.\n');
    }
  });
};

const handleResultOfUserInput = (userInputResultObj: UserInputResultObj) => {
  if (userInputResultObj.mode === 'HELP') {
    printHelp();
    stopSignal$$.next('STOP');
  } else if (userInputResultObj.mode === 'ERROR') {
    printError(userInputResultObj.errors.join('\n'));
    stopSignal$$.next('STOP');
  } else {
    sourcePaths = userInputResultObj.sourcePaths.slice();
    targetPath = userInputResultObj.targetPath;
  }
}

const main = () => {
  of('start')
    .pipe(
      takeUntil(stopSignal$$),
      tap(() => printFrontMatter()),
      switchMap(() => from(processArgsAndExecuteMode())),
      tap((userInputResultObj: UserInputResultObj) => handleResultOfUserInput(userInputResultObj)),
      filter((userInputResultObj: UserInputResultObj) => {
        return userInputResultObj.mode !== 'HELP' && userInputResultObj.mode !== 'ERROR'
      }),
      map(() => generateFilePathArr(sourcePaths)),
      tap((filePathArr: string[]) => printFilePaths(filePathArr)),
      map((filePathArr: string[]): FileContetntObj[] => {
        const fileContentArr: FileContetntObj[] = [];
        console.log('Reading files:')
        for (const filePath of filePathArr) {
          fileContentArr.push({
            fileContent: readFileSync(filePath, 'utf8'),
            filePath
          })
        }
        return fileContentArr;
      }),
      map((fileContentArr: FileContetntObj[]) => {
        return generateArrOfPreIndexObjsFromFilePathArr(fileContentArr);
      }),
      map((preIndexObjArr) => {
        console.log('\n\nProcessing full indexes and collecting sources...');
        console.log('This will take a while. Thanks for your patience.\n');
        const uniqueKeysArr = reduceToUniqueKeys(preIndexObjArr, true);
        return uniqueKeysArr;
      }),
      map((uniqueKeysArr) => {
        console.log('\nRemoving duplicate matches...');
        console.log('Almost done now.\n\n');
        const cleanedPreObjArr = removeDuplicateValueObjs(uniqueKeysArr);
        return cleanedPreObjArr; 
      }),
      tap((cleanedPreObjArr: SearchIndexEntryArrFormat[]) => {
        const sortedCleanedPreObjArr = sortFinalIndexArr(cleanedPreObjArr);

        const indexArr: SearchIndexObj[] = sortedCleanedPreObjArr.map((el) => {
          return {
            searchTerm: el[0],
            searchResults: el[1]
          };
        });

        writeSearchIndexObjToJsonFile(indexArr, targetPath);
        stopSignal$$.next('STOP');
      })
    )
    .subscribe();
}

main();
