import { existsSync, readFileSync, readdirSync, writeFile } from 'fs';
import { printResultOfWritingFile } from './cli-io.js';
/**
 * Generates an array of paths to all the files in each of the directories
 * the provided array of directory paths points to.
 * @param dirArr - An array of directory paths.
 * @returns An array of file paths.
 */
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
/**
 * Generates an array of FileContentObj based on an array of file paths.
 * Each FileContentObj contains the content of the file and its corresponding file path.
 * @param filePathArr - An array of file paths.
 * @returns An array of FileContentObj.
 */
export const generateFileContentObjArr = (filePathArr) => {
    const fileContentArr = [];
    console.log('Reading files...');
    for (const filePath of filePathArr) {
        fileContentArr.push({
            fileContent: readFileSync(filePath, 'utf8'),
            filePath
        });
    }
    return fileContentArr;
};
/**
 * Writes the search index object array to a JSON file.
 * @param searchIndexArr The search index object array to be written.
 * @param trgtP The target path of the JSON file.
 */
export const writeSearchIndexObjToJsonFile = (searchIndexArr, trgtP) => {
    const cleanedTrgtP = trgtP
        .replace(/\.(?!\/|\.)[^/]*$/, '') // remove file extension if present but don't remove relative paths like ./ or ../
        .concat('.json'); // add .json file extension
    const jsonObj = JSON.stringify(searchIndexArr);
    writeFile(cleanedTrgtP, jsonObj, 'utf8', (err) => printResultOfWritingFile(cleanedTrgtP, err));
};
export const checkIfPathIsValid = (path, isSourceFlag) => {
    // early return if path is empty
    if (path === '') {
        return false;
    }
    // if source path is checked, check if the directory exists.
    if (isSourceFlag) {
        return existsSync(path);
    }
    else {
        // if target path is checked, check if the directory exists - not the target file.
        let dirPath = path
            .split('/')
            .slice(0, -1)
            .join('/');
        dirPath = dirPath
            ? dirPath
            : './';
        return existsSync(dirPath);
    }
};
