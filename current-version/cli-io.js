import { existsSync } from 'fs';
import { argv, stdout, stdin } from 'process';
import readline from 'readline';
// ----------------- CLI-INPUT -----------------
/**
 * Retrieves the relevant script arguments.
 * The first two arguments are the path to the node executable and the path to the script file.
 * These are irrelevant for the script therefore they are removed.
 * If no further arguments are specified, the function prints a message that the script will enter CLI mode
 * and return null which triggers this in a later step.
 * @returns An array of string arguments or null if no arguments were specified.
 */
const getRelevantScriptArgs = () => {
    const args = argv.slice(2);
    if (args.length < 1) {
        stdout.write('You did not specify any source paths or a target file. Entering CLI mode. \n');
        return null;
    }
    return args;
};
const selectMode = (allArgs) => {
    if (!allArgs) {
        return 'CLI';
    }
    if (allArgs.includes('--help')) {
        return 'HELP';
    }
    if (allArgs.includes('--source') && allArgs.includes('--target')) {
        return 'AUTO';
    }
    else if (allArgs.includes('--source') || allArgs.includes('--target')) {
        return 'CLI';
    }
    else {
        return 'ERROR';
    }
    ;
};
const extractSourceAndTargetPathsFromArgs = (allArgs, mode) => {
    const resultObj = {
        sourcePaths: [],
        targetPath: '',
        errors: [],
        mode: mode,
    };
    if (!allArgs) {
        return resultObj;
    }
    if (mode === 'HELP') {
        resultObj.mode = 'HELP';
        return resultObj;
    }
    let sourcePathsArr = extractAndCheckSourceOrTargetPathsFromArgs(allArgs, 'source', 'target');
    let invalidSourcePaths = sourcePathsArr.filter(pathObj => !pathObj.isValid);
    let targetPathsArr = extractAndCheckSourceOrTargetPathsFromArgs(allArgs, 'target', 'source');
    console.log('------sourcePathsArr: ', sourcePathsArr);
    console.log('------targetPathsArr: ', targetPathsArr);
    if (sourcePathsArr.length === 0) {
        resultObj.errors.push('missing source paths');
    }
    if (invalidSourcePaths.length > 0) {
        for (const pathObj of invalidSourcePaths) {
            resultObj.errors.push(`invalid source paths: ${pathObj.path}`);
        }
    }
    if (targetPathsArr.length === 0) {
        resultObj.errors.push('missing target path');
    }
    if (targetPathsArr.length > 0 && !targetPathsArr[0].isValid) {
        resultObj.errors.push(`invalid target path: ${targetPathsArr[0].path}`);
    }
    console.log('------resultObj: ', resultObj);
    if (resultObj.errors.length === 0) {
        console.log('xxxxxx  entering AUTO mode  xxxxxx');
        resultObj.sourcePaths = sourcePathsArr.map(pathObj => pathObj.path);
        resultObj.targetPath = targetPathsArr[0].path;
        resultObj.mode = 'AUTO';
    }
    else {
        console.log('xxxxxx  entering CLI mode  xxxxxx');
        resultObj.mode = 'CLI';
    }
    return resultObj;
};
const extractAndCheckSourceOrTargetPathsFromArgs = (allArgs, flagA, flagB) => {
    const flagToRegExMap = {
        source: /(--source|-s)/i,
        target: /(--target|-t)/i
    };
    const startIndicatorForA = allArgs.findIndex(arg => arg.match(flagToRegExMap[flagA]));
    const startIndicatorForB = allArgs.findIndex(arg => arg.match(flagToRegExMap[flagB]));
    const pathForAIsMissing = startIndicatorForA === -1;
    const pathForBIsMissing = startIndicatorForB === -1;
    const pathForAIsAfterPathForB = startIndicatorForA > startIndicatorForB;
    if (pathForAIsMissing) {
        return [{
                path: '',
                isValid: false,
            }];
    }
    const sliceEndIndex = pathForBIsMissing || pathForAIsAfterPathForB
        ? undefined
        : startIndicatorForB;
    const pathsArrForA = allArgs.slice(startIndicatorForA + 1, sliceEndIndex);
    return pathsArrForA.map(path => {
        return {
            path: path,
            isValid: checkIfPathIsValid(path, flagToRegExMap.source.test(flagA)),
        };
    });
};
const checkIfPathIsValid = (path, isSourceFlag) => {
    if (isSourceFlag) {
        return existsSync(path);
    }
    else {
        // if target paths array is returned, check if the directory exists- not the target file
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
const promptForSourcePaths = async (storedSourcePaths = []) => {
    const sourcePaths = storedSourcePaths.slice();
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });
    stdout.write('Please enter the paths to the source files you want to index. Enter "done" when you are finished. \n');
    while (true) {
        const answer = await new Promise(resolve => rl.question('', resolve));
        if (answer.toLowerCase() === 'done') {
            rl.close();
            break;
        }
        sourcePaths.push(answer);
    }
    const invalidSourcePaths = sourcePaths.filter(path => !checkIfPathIsValid(path, true));
    const validSourcePaths = sourcePaths.filter(path => checkIfPathIsValid(path, true));
    if (sourcePaths.length < 1) {
        stdout.write('You did not specify any source paths. \n');
        return await promptForSourcePaths();
    }
    else if (invalidSourcePaths.length > 0) {
        return await repromptForInvalidSourcePaths(validSourcePaths, invalidSourcePaths);
    }
    else {
        console.log('---------> sourcePaths: ', sourcePaths);
        return sourcePaths;
    }
};
const repromptForInvalidSourcePaths = async (validSourcePaths, invalidSourcePaths) => {
    stdout.write('You specified invalid source paths. \n');
    for (const path of invalidSourcePaths) {
        const outputStr = '   ' + path + '\n';
        stdout.write(generateTextRed(outputStr));
    }
    stdout.write('The following valid source paths are stored. Would you like to correct one of the invalid paths\n');
    for (const path of validSourcePaths) {
        const outputStr = '   ' + path + '\n';
        stdout.write(generateTextGreen(outputStr));
    }
    return await promptForSourcePaths(validSourcePaths);
};
const promptForTargetPath = async () => {
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });
    stdout.write('Please enter the path to the target file. \n');
    const answer = await new Promise(resolve => rl.question('', resolve));
    rl.close();
    if (answer === '') {
        stdout.write('You did not specify a target path. \n');
        return await promptForTargetPath();
    }
    else if (!checkIfPathIsValid(answer, false)) {
        stdout.write('You specified an invalid target path. \n');
        return await promptForTargetPath();
    }
    else {
        return answer;
    }
};
export const processArgsAndExecuteMode = async () => {
    const args = getRelevantScriptArgs();
    const mode = selectMode(args);
    const resultObj = extractSourceAndTargetPathsFromArgs(args, mode);
    if (resultObj.mode === 'CLI') {
        if (resultObj.sourcePaths.length < 1) {
            resultObj.sourcePaths = await promptForSourcePaths();
            if (resultObj.sourcePaths) {
                resultObj.errors = resultObj.errors.filter(error => error !== 'missing source paths');
            }
        }
        if (resultObj.targetPath === '') {
            resultObj.targetPath = await promptForTargetPath();
            if (resultObj.targetPath) {
                resultObj.errors = resultObj.errors.filter(error => error !== 'missing target path');
            }
        }
        stdout.write('Thanks for your input. Exiting CLI Mode. Starting indexing process now.\n');
        resultObj.mode = 'AUTO';
    }
    else if (resultObj.mode === 'AUTO') {
        stdout.write('Entering AUTO Mode. Starting indexing process now.\n');
    }
    else if (resultObj.mode === 'HELP') {
        stdout.write('Entering HELP Mode.\n');
    }
    else {
        stdout.write('Entering ERROR Mode.\n');
        resultObj.errors.push('Something went wrong. Please check your input and try again.\n');
    }
    return resultObj;
};
// ----------------- CLI-OUPUT -----------------
export const printFrontMatter = () => {
    const terminalColumns = stdout.columns;
    const bannerWidth = 35;
    // subtract 1 for the start of line character
    const bannerPaddingColumns = Math.floor((terminalColumns - bannerWidth) / 2 - 1);
    const bannerPadding = ' '.repeat(bannerPaddingColumns);
    stdout.write('\n');
    stdout.write(bannerPadding + '┌─────────────────────────────────┐' + '\n');
    stdout.write(bannerPadding + '│    NAIVE SEARCH PREPROCESSOR    │' + '\n');
    stdout.write(bannerPadding + '└─────────────────────────────────┘' + '\n');
    stdout.write('\n');
};
export const printFilePaths = (filePathArr) => {
    stdout.write('Found the following' + filePathArr.length + 'files: \n');
    for (const filePath of filePathArr) {
        stdout.write('\t' + filePath + '\n');
    }
    stdout.write('\n');
};
export const printHelp = () => {
    stdout.write('To run the script in auto mode, use the following command:\n\n');
    stdout.write('\tnode index.js --source <source path> --target <target path>\n\n');
    stdout.write(`where <source path> is the path or a space separated list of paths to the directory / directories containing the files you want to index and <target path> is the path to the file you want to write the index to.\n`);
    stdout.write('To run the script in interactive mode / CLI mode, use the following command:\n\n');
    stdout.write('\tnode index.js\n');
    stdout.write('You will then be prompted to enter the paths to the source files and the target file.\n');
    stdout.write('To see this help text, use the following command:\n\n');
    stdout.write('\tnode index.js --help\n');
};
export const printError = (err) => {
    stdout.write('There has been an error: \n' + err + '\n\n');
};
export const printPreprocessingFilesMsg = () => {
    stdout.write('\n\nProcessing content of files...');
};
export const printProcessingMsg = () => {
    stdout.write('\n\nProcessing full indexes and collecting sources... \n');
    stdout.write('This might take a while. Thanks for your patience.\n');
};
export const printRemovingDuplicatesMsg = () => {
    stdout.write('\n\nRemoving duplicate matches...');
    stdout.write('Almost done now.\n\n');
};
export const printResultOfWritingFile = (targetPath, err) => {
    if (err) {
        stdout.write('There has been an error while writing the index to the file: \n' + err + '\n');
    }
    else {
        stdout.write(`Content has been written to the target file: ${targetPath}\n`);
    }
};
// -------------- CLI COLORS --------------
export const generateTextRed = (text) => `\x1b[31m${text}\x1b[0m`;
export const generateTextGreen = (text) => `\x1b[32m${text}\x1b[0m`;
