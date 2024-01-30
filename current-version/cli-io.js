import { argv, stdout, stdin } from 'process';
import readline from 'readline';
import { checkIfPathIsValid } from './file-io.js';
const argumentFlagToRegExMap = {
    source: /^(--source|-s)$/i,
    target: /^(--target|-t)$/i,
    help: /^(--help|-h)$/i
};
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
    const allArgsStr = allArgs.join(' ');
    if (argumentFlagToRegExMap.help.test(allArgsStr)) {
        return 'HELP';
    }
    if (argumentFlagToRegExMap.source.test(allArgsStr) && argumentFlagToRegExMap.target.test(allArgsStr)) {
        return 'AUTO';
    }
    else {
        return 'CLI';
    }
};
const extractSourceAndTargetPathsFromArgs = (allArgs, mode) => {
    const resultObj = {
        sourcePaths: [],
        targetPath: '',
        errors: [],
        mode: mode,
    };
    if (!allArgs) {
        resultObj.errors.push('missing source paths');
        resultObj.errors.push('missing target path');
        resultObj.mode = 'CLI';
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
        resultObj.errors.push('invalid source paths');
    }
    if (targetPathsArr.length === 0) {
        resultObj.errors.push('missing target path');
    }
    if (targetPathsArr.length > 0 && !targetPathsArr[0].isValid) {
        resultObj.errors.push('invalid target path');
    }
    if (resultObj.errors.length === 0) {
        // console.log('xxxxxx  entering AUTO mode  xxxxxx');
        resultObj.sourcePaths = sourcePathsArr.map(pathObj => pathObj.path);
        resultObj.targetPath = targetPathsArr[0].path;
        resultObj.mode = 'AUTO';
    }
    else {
        // console.log('xxxxxx  entering CLI mode  xxxxxx');
        resultObj.sourcePaths = sourcePathsArr.map(pathObj => pathObj.path);
        resultObj.targetPath = targetPathsArr[0]?.path ?? [];
        resultObj.mode = 'CLI';
    }
    return resultObj;
};
const extractAndCheckSourceOrTargetPathsFromArgs = (allArgs, flagA, flagB) => {
    const startIndicatorForA = allArgs.findIndex(arg => arg.match(argumentFlagToRegExMap[flagA]));
    const startIndicatorForB = allArgs.findIndex(arg => arg.match(argumentFlagToRegExMap[flagB]));
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
            isValid: checkIfPathIsValid(path, flagA === 'source'),
        };
    });
};
const promptForSourcePaths = async (storedSourcePaths = []) => {
    const sourcePaths = storedSourcePaths.slice();
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });
    stdout.write(getPromptTextForSourcePaths(storedSourcePaths));
    while (true) {
        const answer = await new Promise(resolve => rl.question('', resolve));
        if (answer.toLowerCase() === '') {
            rl.close();
            break;
        }
        sourcePaths.push(answer);
    }
    const invalidSourcePaths = sourcePaths.filter(path => !checkIfPathIsValid(path, true));
    const invalidSourcePathsExcludingEmptyStrings = invalidSourcePaths.filter(path => path !== '');
    const validSourcePaths = sourcePaths.filter(path => checkIfPathIsValid(path, true));
    if (sourcePaths.length === 0) {
        stdout.write('You did not specify any source paths. \n');
        return await promptForSourcePaths();
    }
    else if (invalidSourcePathsExcludingEmptyStrings.length > 0) {
        return await repromptForInvalidSourcePaths(validSourcePaths, invalidSourcePathsExcludingEmptyStrings);
    }
    else {
        return sourcePaths.filter(path => path !== '');
    }
};
const getPromptTextForSourcePaths = (storedSourcePaths) => {
    let basePrompt = 'Please enter the paths to the source files you want to index. Tap enter again on a new line to confirm your entry. \n';
    if (storedSourcePaths.length === 0) {
        return basePrompt;
    }
    else if (storedSourcePaths.length === 1 && storedSourcePaths[0] === '') {
        basePrompt = 'You did not specify any source paths. \n' + basePrompt;
        return basePrompt;
    }
    else {
        return 'You specified invalid source paths. \n' + basePrompt;
    }
};
const repromptForInvalidSourcePaths = async (validSourcePaths, invalidSourcePaths) => {
    stdout.write(`You specified ${invalidSourcePaths.length} invalid source paths. \n`);
    for (const path of invalidSourcePaths) {
        const outputStr = '   ' + path + '\n';
        stdout.write(colorizeText(outputStr, 'red'));
    }
    stdout.write('The following valid source paths are stored. Would you like to correct one of the invalid paths\n');
    for (const path of validSourcePaths) {
        const outputStr = '   ' + path + '\n';
        stdout.write(colorizeText(outputStr, 'green'));
    }
    return await promptForSourcePaths(validSourcePaths);
};
const promptForPaths = async (isRegularPrompt = true) => {
    if (isRegularPrompt) {
        stdout.write('\nPlease enter the paths to the source files you want to index.\n');
        stdout.write('Press enter again on a new line to confirm your entry. \n\n');
    }
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });
    const paths = [];
    while (true) {
        const answer = await new Promise(resolve => rl.question('', resolve));
        if (answer.toLowerCase() === '') {
            rl.close();
            break;
        }
        paths.push({
            path: answer,
            isValid: false, // set to false for now and validate later
        });
    }
    return paths;
};
const validatePaths = (paths) => {
    const validPaths = [];
    const invalidPaths = [];
    for (const pathObj of paths) {
        pathObj.isValid = checkIfPathIsValid(pathObj.path, true);
        if (pathObj.isValid) {
            validPaths.push(pathObj);
        }
        else {
            invalidPaths.push(pathObj);
        }
    }
    return [validPaths, invalidPaths];
};
const promptForSourcePathsNew = async (storedSourcePathArr = []) => {
    let paths = storedSourcePathArr.slice();
    if (paths.length === 0) {
        paths.push(...await promptForPaths());
    }
    const [validPaths, invalidPaths] = validatePaths(paths);
    if (invalidPaths.length > 0) {
        // Print invalid paths and reprompt
        printInvalidAndValidSourcePathsAndPrompt(invalidPaths, validPaths);
        return await promptForSourcePathsNew([...validPaths, ...await promptForPaths(false)]);
    }
    else {
        printValidSourcePaths(validPaths);
        return validPaths;
    }
};
const promptForTargetPath = async (invalidTargetPath = null) => {
    let prompt = getPromptTextForTargetPath(invalidTargetPath);
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });
    stdout.write(prompt);
    const answer = await new Promise(resolve => rl.question('', resolve));
    rl.close();
    if (answer === '' || !checkIfPathIsValid(answer, false)) {
        return await promptForTargetPath(answer);
    }
    else {
        return answer;
    }
};
const getPromptTextForTargetPath = (invalidTargetPath) => {
    switch (invalidTargetPath) {
        case null:
            return '\nPlease enter the path to the target file. \n';
        case '':
            return '\nYou did not specify a target path. \n';
        default:
            return '\nYou specified an invalid target path. \n'
                + `${colorizeText(invalidTargetPath, 'red')} does not exist. \n`
                + 'Please enter a valid target path. \n';
    }
};
const executeCLIMode = async (inputResultObj) => {
    const resultObj = { ...inputResultObj };
    if (resultObj.sourcePaths.length < 1) {
        resultObj.sourcePaths = (await promptForSourcePathsNew()).map(pathObj => pathObj.path);
        if (resultObj.sourcePaths.length > 0) {
            resultObj.errors = resultObj.errors.filter(error => error !== 'missing source paths');
        }
    }
    if (resultObj.errors.includes('invalid source paths')) {
        const sourcePathObjArr = resultObj.sourcePaths.map(path => {
            return {
                path: path,
                isValid: checkIfPathIsValid(path, true),
            };
        });
        resultObj.sourcePaths = (await promptForSourcePathsNew(sourcePathObjArr)).map(pathObj => pathObj.path);
        if (resultObj.sourcePaths.filter(path => !checkIfPathIsValid(path, true)).length === 0) {
            resultObj.errors = resultObj.errors.filter(error => error !== 'invalid source paths');
        }
    }
    if (resultObj.errors.includes('missing target path') ||
        resultObj.errors.includes('invalid target path')) {
        resultObj.targetPath = await promptForTargetPath(resultObj.targetPath);
        if (resultObj.targetPath && checkIfPathIsValid(resultObj.targetPath, false)) {
            resultObj.errors = resultObj.errors.filter(errMsg => {
                return errMsg !== 'missing target path' && errMsg !== 'invalid target path';
            });
        }
    }
    stdout.write('Thanks for your input. Exiting CLI Mode. Starting indexing process now.\n');
    resultObj.mode = 'AUTO';
    return resultObj;
};
export const processArgsAndExecuteMode = async () => {
    const args = getRelevantScriptArgs();
    const mode = selectMode(args);
    const resultObj = extractSourceAndTargetPathsFromArgs(args, mode);
    switch (resultObj.mode) {
        case 'CLI':
            stdout.write('--> Entering CLI mode.\n\n');
            return await executeCLIMode(resultObj);
        case 'AUTO':
            stdout.write('--> Entering AUTO mode. Starting indexing process now.\n\n');
            return resultObj;
        case 'HELP':
            stdout.write('--> Entering HELP mode.\n\n');
            return resultObj;
        case 'ERROR': // fallthrough
        default:
            stdout.write('--> Entering ERROR mode.\n\n');
            resultObj.errors.unshift('Something went wrong. Please check your input and try again.\n');
            return resultObj;
    }
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
        stdout.write(colorizeText('SUCCESS!', 'green') + '\n');
        stdout.write('Content has been written to the target file: ' + colorizeText(targetPath, 'green') + '\n\n');
    }
};
const printInvalidAndValidSourcePathsAndPrompt = (invalidPaths, validPaths) => {
    stdout.write(`You specified ${invalidPaths.length} invalid source paths. \n\n`);
    for (const pathObj of invalidPaths) {
        const outputStr = '   ' + pathObj.path + '\n';
        stdout.write(colorizeText(outputStr, 'red'));
    }
    if (validPaths.length > 0) {
        printValidSourcePaths(validPaths);
        stdout.write('\nWould you like to correct the invalid paths?\n');
        stdout.write('\nIf not just press enter to continue with the valid paths.\n');
    }
    else {
        stdout.write('\nYou did not specify valid source paths.\n');
        stdout.write('Please enter the paths to the source files you want to index.\n');
        stdout.write('Press enter again on a new line to confirm your entry. \n\n');
    }
};
const printValidSourcePaths = (validPaths) => {
    stdout.write('\nThe following valid source paths are stored.\n\n');
    for (const pathObj of validPaths) {
        const outputStr = '   ' + pathObj.path + '\n';
        stdout.write(colorizeText(outputStr, 'green'));
    }
};
// -------------- CLI COLORS --------------
export const colorizeText = (text, color) => {
    switch (color) {
        case 'red':
            return `\x1b[31m${text}\x1b[0m`;
            ;
        case 'green':
            return `\x1b[32m${text}\x1b[0m`;
        default:
            return text;
    }
};
