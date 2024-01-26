import {
    existsSync,
    readFileSync,
    readdirSync,
    writeFile 
} from 'fs';

import { printResultOfWritingFile } from './cli-io.js';
import { FileContentObj, SearchIndexObj } from './data-processing.js';

/**
 * Generates an array of paths to all the files in each of the directories
 * the provided array of directory paths points to.
 * @param dirArr - An array of directory paths.
 * @returns An array of file paths.
 */
export const generateFilePathArr = (dirArr: string[]): string[] => {
    const fileNameArr: string[][] = [];
    for (const dir of dirArr) {
      // todo: check if dir is a directory --- not here bur in cli-io.ts
    
      const filesOfDirArrEntryArr = readdirSync(dir);
      for (const fileName of filesOfDirArrEntryArr) {
        fileNameArr.push([dir, fileName]);
      }
    }
    return fileNameArr.map(([dir, fileName]) => `${dir}/${fileName}`);
};

/**
 * Generates an array of FileContentObj based on an array of file paths.
 * Each FileContentObj contains the content of the file and its corresponding file path.
 * @param filePathArr - An array of file paths.
 * @returns An array of FileContentObj.
 */
export const generateFileContentObjArr = (filePathArr: string[]): FileContentObj[] => {
    const fileContentArr: FileContentObj[] = [];
    console.log('Reading files...')
    for (const filePath of filePathArr) {
      fileContentArr.push({
        fileContent: readFileSync(filePath, 'utf8'),
        filePath
      })
    }
    return fileContentArr;
}

/**
 * Writes the search index object array to a JSON file.
 * @param searchIndexArr The search index object array to be written.
 * @param trgtP The target path of the JSON file.
 */
export const writeSearchIndexObjToJsonFile = (searchIndexArr: SearchIndexObj[], trgtP: string) => {
    const cleanedTrgtP = trgtP
      .replace(/\.(?!\/|\.)[^/]*$/, '') // remove file extension if present but don't remove relative paths like ./ or ../
      .concat('.json'); // add .json file extension

    const jsonObj = JSON.stringify(searchIndexArr);
    writeFile(cleanedTrgtP, jsonObj, 'utf8', (err: Error | null): void => printResultOfWritingFile(cleanedTrgtP, err));
};