import { argv, stdout, stdin } from 'process';
import readline from 'readline';
// ------------- ARGUMENT VARIABLES ------------
const SRC_FLAG_L = '--source';
const SRC_FLAG_S = '-s';
const TARGET_FLAG_L = '--target';
const TARGET_FLAG_S = '-t';
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
    let sourcePathsStartIndicator = allArgs.findIndex(arg => arg === '--source');
    let targetPathsStartIndicator = allArgs.findIndex(arg => arg === '--target');
    if (sourcePathsStartIndicator !== -1 && targetPathsStartIndicator !== -1) {
        resultObj.sourcePaths = allArgs.slice(sourcePathsStartIndicator + 1, targetPathsStartIndicator);
        resultObj.targetPath = allArgs[targetPathsStartIndicator + 1];
        if (resultObj.sourcePaths.length < 1) {
            resultObj.errors.push('missing source paths');
        }
        if (resultObj.targetPath === '') {
            resultObj.errors.push('missing target path');
        }
        if (resultObj.sourcePaths.length > 0 && resultObj.targetPath !== '') {
            resultObj.mode = 'AUTO';
        }
        else {
            resultObj.mode = 'CLI';
        }
    }
    else if (sourcePathsStartIndicator !== -1 && targetPathsStartIndicator === -1) {
        resultObj.sourcePaths = allArgs.slice(sourcePathsStartIndicator + 1);
        resultObj.errors.push('missing target path');
        resultObj.mode = 'CLI';
    }
    else if (sourcePathsStartIndicator === -1 && targetPathsStartIndicator !== -1) {
        resultObj.targetPath = allArgs[targetPathsStartIndicator + 1];
        resultObj.errors.push('missing source paths');
        resultObj.mode = 'CLI';
    }
    else {
        resultObj.errors.push('missing source paths');
        resultObj.errors.push('missing target path');
        resultObj.mode = 'CLI';
    }
    return resultObj;
};
const promptForSourcePaths = async () => {
    const sourcePaths = [];
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });
    stdout.write('Please enter the paths to the source files you want to index. Enter "done" when you are finished. \n');
    while (true) {
        const answer = await new Promise(resolve => rl.question('', resolve));
        if (answer === 'done') {
            rl.close();
            break;
        }
        sourcePaths.push(answer);
    }
    if (sourcePaths.length < 1) {
        stdout.write('You did not specify any source paths. \n');
        return await promptForSourcePaths();
    }
    else {
        return sourcePaths;
    }
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
    else {
        return answer;
    }
};
export const processArgsAndExecuteMode = async () => {
    const args = getRelevantScriptArgs();
    const mode = selectMode(args);
    const resultObj = extractSourceAndTargetPathsFromArgs(args, mode);
    if (mode === 'CLI') {
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
    else if (mode === 'AUTO') {
        stdout.write('Entering AUTO Mode. Starting indexing process now.\n');
    }
    else if (mode === 'HELP') {
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
export const printResultOfWritingFile = (err) => {
    if (err) {
        stdout.write('There has been an error while writing the index to the file: \n' + err + '\n');
    }
    else {
        stdout.write('Content has been written to file.\n');
    }
};
