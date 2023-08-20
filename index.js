import { readFileSync, readdirSync, writeFile } from 'fs';
import { tap, of, filter, from, map, switchMap, Subject, takeUntil } from 'rxjs';
import { printFrontMatter, printFilePaths, printHelp } from './cli-output.js';
import { reduceToUniqueKeys, removeDuplicateValueObjs, sortFinalIndexArr, generateArrOfPreIndexObjsFromFilePathArr } from './data-processing.js';
import { processArgsAndExecuteMode } from './cli-input.js';
let sourcePaths = [];
let targetPath = '';
const stopSignal$$ = new Subject();
const generateFilePathArr = (dirArr) => {
    const fileNameArr = [];
    for (const dir of dirArr) {
        const filesOfDirArrEntryArr = readdirSync(dir);
        for (const fileName of filesOfDirArrEntryArr) {
            fileNameArr.push([dir, fileName]);
        }
    }
    return fileNameArr.map(([dir, fileName]) => `${dir}/${fileName}`);
};
const writeSearchIndexObjToJsonFile = (searchIndexArr, trgtP) => {
    const jsonObj = JSON.stringify(searchIndexArr);
    writeFile(trgtP, jsonObj, 'utf8', (err) => {
        if (err) {
            console.log('There has been an error: ', err);
            console.log('\n');
        }
        else {
            console.log('Content has been written to file.\n');
        }
    });
};
const main = () => {
    of('start')
        .pipe(takeUntil(stopSignal$$), tap(() => printFrontMatter()), switchMap(() => from(processArgsAndExecuteMode())), tap((sourceAndTargetPathObj) => {
        if (sourceAndTargetPathObj.mode === 'HELP') {
            printHelp();
            stopSignal$$.next('STOP');
        }
        else {
            sourcePaths = sourceAndTargetPathObj.sourcePaths.slice();
            targetPath = sourceAndTargetPathObj.targetPath;
        }
    }), filter((sourceAndTargetPathObj) => {
        return sourceAndTargetPathObj.mode !== 'HELP' && sourceAndTargetPathObj.mode !== 'ERROR';
    }), map(() => generateFilePathArr(sourcePaths)), tap((filePathArr) => printFilePaths(filePathArr)), map((filePathArr) => {
        const fileContentArr = [];
        console.log('Reading files:');
        for (const filePath of filePathArr) {
            fileContentArr.push({
                fileContent: readFileSync(filePath, 'utf8'),
                filePath
            });
        }
        return fileContentArr;
    }), map((fileContentArr) => {
        return generateArrOfPreIndexObjsFromFilePathArr(fileContentArr);
    }), map((preIndexObjArr) => {
        console.log('\n\nProcessing full indexes and collecting sources...');
        console.log('This will take a while. Thanks for your patience.\n');
        const uniqueKeysArr = reduceToUniqueKeys(preIndexObjArr, true);
        return uniqueKeysArr;
    }), map((uniqueKeysArr) => {
        console.log('\nRemoving duplicate matches...');
        console.log('Almost done now.\n\n');
        const cleanedPreObjArr = removeDuplicateValueObjs(uniqueKeysArr);
        return cleanedPreObjArr;
    }), tap((cleanedPreObjArr) => {
        const sortedCleanedPreObjArr = sortFinalIndexArr(cleanedPreObjArr);
        const indexArr = sortedCleanedPreObjArr.map((el) => {
            return {
                searchTerm: el[0],
                searchResults: el[1]
            };
        });
        writeSearchIndexObjToJsonFile(indexArr, targetPath);
        stopSignal$$.next('STOP');
    }))
        .subscribe();
};
main();
