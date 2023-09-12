import {
    readFileSync,
    readdirSync,
    writeFile 
} from 'fs';

import { FileContentObj, SearchIndexObj } from './data-processing.js';

export const generateFilePathArr = (dirArr: string[]): string[] => {
    const fileNameArr: string[][] = [];
    for (const dir of dirArr) {
      const filesOfDirArrEntryArr = readdirSync(dir);
      for (const fileName of filesOfDirArrEntryArr) {
        fileNameArr.push([dir, fileName]);
      }
    }
    return fileNameArr.map(([dir, fileName]) => `${dir}/${fileName}`);
};

export const generateFileContentObjArr = (filePathArr: string[]): FileContentObj[] => {
    const fileContentArr: FileContentObj[] = [];
    console.log('Reading files:')
    for (const filePath of filePathArr) {
      fileContentArr.push({
        fileContent: readFileSync(filePath, 'utf8'),
        filePath
      })
    }
    return fileContentArr;
}

export const writeSearchIndexObjToJsonFile = (searchIndexArr: SearchIndexObj[], trgtP: string) => {
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