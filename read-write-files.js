import { readFileSync, readdirSync, writeFile } from 'fs';
import { printResultOfWritingFile } from './cli-output.js';
export const generateFilePathArr = (dirArr) => {
    const fileNameArr = [];
    for (const dir of dirArr) {
        const filesOfDirArrEntryArr = readdirSync(dir);
        for (const fileName of filesOfDirArrEntryArr) {
            fileNameArr.push([dir, fileName]);
        }
    }
    return fileNameArr.map(([dir, fileName]) => `${dir}/${fileName}`);
};
export const generateFileContentObjArr = (filePathArr) => {
    const fileContentArr = [];
    console.log('Reading files:');
    for (const filePath of filePathArr) {
        fileContentArr.push({
            fileContent: readFileSync(filePath, 'utf8'),
            filePath
        });
    }
    return fileContentArr;
};
export const writeSearchIndexObjToJsonFile = (searchIndexArr, trgtP) => {
    const jsonObj = JSON.stringify(searchIndexArr);
    writeFile(trgtP, jsonObj, 'utf8', (err) => printResultOfWritingFile(err));
};
