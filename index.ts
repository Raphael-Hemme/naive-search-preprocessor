import {
    readFileSync,
    readdirSync,
    writeFile 
} from 'fs';
    
import { tap, of, from, map, switchMap } from 'rxjs';


import { printFrontMatter, printFilePaths } from './cli-output.js';
import {
    generatePreIndexObjArr,
    reduceToUniqueKeys,
    removeDuplicateValueObjs,
    sortFinalIndexArr,
    generateCleanedLineSplitArr,
    SearchIndexEntryArrFormat,
    SearchIndexObj,
    FileContetntObj
} from './data-processing.js';

import { processArgsAndExecuteMode, SourceAndTargetPathObj } from './cli-input.js';

let sourcePaths: string[] = [];
let targetPath: string = '';

const generateFilePathArr = (dirArr: string[]): string[] => {
  const fileNameArr: string[][] = [];
  for (const dir of dirArr) {
    const filesOfDirArrEntryArr = readdirSync(dir);
    for (const fileName of filesOfDirArrEntryArr) {
      fileNameArr.push([dir, fileName]);
    }
  }
  return fileNameArr.map(([dir, fileName]) => `${dir}/${fileName}`);
}


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

const main = () => {
  of('start')
    .pipe(
      tap(() => printFrontMatter()),
      switchMap(() => from(processArgsAndExecuteMode())),
      tap((sourceAndTargetPathObj: SourceAndTargetPathObj) => {
        sourcePaths = sourceAndTargetPathObj.sourcePaths.slice();
        targetPath = sourceAndTargetPathObj.targetPath;
      }),
      map(() => generateFilePathArr(sourcePaths)),
      tap((filePathArr: string[]) => printFilePaths(filePathArr)),
      map((filePathArr: string[]): {fileContent: string, filePath: string}[] => {
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
      map((fileContentArr: FileContetntObj[]): SearchIndexEntryArrFormat[] => {
        console.log('\n');
        console.log('Processing content of files...');
        const resultArr: SearchIndexEntryArrFormat[] = [];
        for (const file of fileContentArr) {
          const cleanedLineSplitArr = generateCleanedLineSplitArr(file.fileContent);
          resultArr.push(...generatePreIndexObjArr(cleanedLineSplitArr, file.filePath))
        }
        return resultArr;
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
      })
    )
    .subscribe();
}

main();
