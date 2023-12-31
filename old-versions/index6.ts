import {
    readFileSync,
    readdirSync,
    writeFile 
} from 'fs';
    
import { tap, of, map } from 'rxjs';


import { printFrontMatter, printFilePaths } from './../cli-output.js';
import {
    generatePreIndexObjArr,
    reduceToUniqueKeys,
    removeDuplicateValueObjs,
    sortFinalIndexArr,
    generateCleanedLineSplitArr,
    SearchIndexEntryArrFormat,
    SearchIndexObj
} from './../data-processing.js';

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


const writeSearchIndexObjToJsonFile = (searchIndexArr: SearchIndexObj[]) => {
  const jsonObj = JSON.stringify(searchIndexArr);
  writeFile('search-index.json', jsonObj, 'utf8', (err) => {
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
      map(() => generateFilePathArr(['./blog-posts', './io-garden-experiment-descriptions'])),
      tap((filePathArr) => printFilePaths(filePathArr)),
      map((filePathArr: string[]): {fileContent: string, filePath: string}[] => {
        const fileContentArr: {fileContent: string, filePath: string}[] = [];
        console.log('Reading files:')
        for (const filePath of filePathArr) {
          console.log('\t', filePath)
          fileContentArr.push({
            fileContent: readFileSync(filePath, 'utf8'),
            filePath
          })
        }
        return fileContentArr;
      }),
      map((fileContentArr): SearchIndexEntryArrFormat[] => {
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

        writeSearchIndexObjToJsonFile(indexArr);
      })
    )
    .subscribe();
}

main();
