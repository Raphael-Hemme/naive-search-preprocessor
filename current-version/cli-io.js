var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { argv, stdout, stdin } from 'process';
import readline from 'readline';
// ----------------- CLI-INPUT -----------------
const getRelevantScriptArgs = () => {
    const args = argv.slice(2);
    if (args.length < 1) {
        console.log('You did not specify any source paths or a target file. Entering CLI mode.');
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
const promptForSourcePaths = () => __awaiter(void 0, void 0, void 0, function* () {
    const sourcePaths = [];
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });
    console.log('Please enter the paths to the source files you want to index. Enter "done" when you are finished.');
    while (true) {
        const answer = yield new Promise(resolve => rl.question('', resolve));
        if (answer === 'done') {
            rl.close();
            break;
        }
        sourcePaths.push(answer);
    }
    if (sourcePaths.length < 1) {
        console.log('You did not specify any source paths.');
        return yield promptForSourcePaths();
    }
    else {
        return sourcePaths;
    }
});
const promptForTargetPath = () => __awaiter(void 0, void 0, void 0, function* () {
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });
    console.log('Please enter the path to the target file.');
    const answer = yield new Promise(resolve => rl.question('', resolve));
    rl.close();
    if (answer === '') {
        console.log('You did not specify a target path.');
        return yield promptForTargetPath();
    }
    else {
        return answer;
    }
});
export const processArgsAndExecuteMode = () => __awaiter(void 0, void 0, void 0, function* () {
    const args = getRelevantScriptArgs();
    const mode = selectMode(args);
    const resultObj = extractSourceAndTargetPathsFromArgs(args, mode);
    if (mode === 'CLI') {
        if (resultObj.sourcePaths.length < 1) {
            resultObj.sourcePaths = yield promptForSourcePaths();
            if (resultObj.sourcePaths) {
                resultObj.errors = resultObj.errors.filter(error => error !== 'missing source paths');
            }
        }
        if (resultObj.targetPath === '') {
            resultObj.targetPath = yield promptForTargetPath();
            if (resultObj.targetPath) {
                resultObj.errors = resultObj.errors.filter(error => error !== 'missing target path');
            }
        }
        console.log('Thanks for your input. Exiting CLI Mode. Starting indexing process now.');
        resultObj.mode = 'AUTO';
    }
    else if (mode === 'AUTO') {
        console.log('Entering AUTO Mode. Starting indexing process now.');
    }
    else if (mode === 'HELP') {
        console.log('Entering HELP Mode.');
    }
    else {
        console.log('Entering ERROR Mode.');
        resultObj.errors.push('Something went wrong. Please check your input and try again.');
    }
    return resultObj;
});
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
    stdout.write('Found the following' + filePathArr.length + 'files: ');
    for (const filePath of filePathArr) {
        stdout.write('\t' + filePath);
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
    stdout.write('\n\nProcessing full indexes and collecting sources...');
    stdout.write('This might take a while. Thanks for your patience.');
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
