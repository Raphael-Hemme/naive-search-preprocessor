import process from 'process';
import readline from 'readline';




export type Mode = 'CLI' | 'AUTO' | 'HELP' | 'ERROR'; 

export interface SourceAndTargetPathObj {
    sourcePaths: string[];
    targetPath: string;
    errors: string[];
    mode: Mode;
}




const getRelevantScriptArgs = (): string[] | null => {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('You did not specify any source paths or a target file. Entering CLI mode.');
        return null;
    }
    return args;
}

const selectMode = (allArgs: string[] | null): Mode => {
    if (!allArgs) {
        return 'CLI';
    } 
    
    if (allArgs.includes('--help')) {
        return 'HELP';
    }

    if (allArgs.includes('--source') && allArgs.includes('--target')) {
        return 'AUTO';
    } else if (allArgs.includes('--source') || allArgs.includes('--target')) {
        return 'CLI';
    } else {
        return 'ERROR';
    };
}

const extractSourceAndTargetPathsFromArgs = (allArgs: string[] | null, mode: Mode): SourceAndTargetPathObj => {
    const resultObj: SourceAndTargetPathObj = {
        sourcePaths: [],
        targetPath: '',
        errors: [],
        mode: mode,
    }

    if (!allArgs) {
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
        } else {
            resultObj.mode = 'CLI';
        }
    } else if (sourcePathsStartIndicator !== -1 && targetPathsStartIndicator === -1) {
        resultObj.sourcePaths = allArgs.slice(sourcePathsStartIndicator + 1);
        resultObj.errors.push('missing target path');
        resultObj.mode = 'CLI';
    } else if (sourcePathsStartIndicator === -1 && targetPathsStartIndicator !== -1) {
        resultObj.targetPath = allArgs[targetPathsStartIndicator + 1];
        resultObj.errors.push('missing source paths');
        resultObj.mode = 'CLI';
    } else {
        resultObj.errors.push('missing source paths');
        resultObj.errors.push('missing target path');
        resultObj.mode = 'CLI';
    }

    return resultObj;
}

const promptForSourcePaths = async (): Promise<string[]> => {
    const sourcePaths: string[] = [];
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('Please enter the paths to the source files you want to index. Enter "done" when you are finished.');
    while (true) {
        const answer = await new Promise<string>(resolve => rl.question('', resolve));
        if (answer === 'done') {
            rl.close();
            break;
        }
        sourcePaths.push(answer);
    }

    return sourcePaths;
}

const promptForTargetPath = async (): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('Please enter the path to the target file.');
    const answer = await new Promise<string>(resolve => rl.question('', resolve));
    rl.close();

    return answer;
}

export const processArgsAndExecuteMode = async (): Promise<SourceAndTargetPathObj> => {

    const args = getRelevantScriptArgs();
    const mode = selectMode(args);
    const resultObj: SourceAndTargetPathObj = extractSourceAndTargetPathsFromArgs(args, mode);

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
        console.log('Thanks for your input. Exiting CLI Mode. Starting indexing process now.');
    } else if (mode === 'AUTO') {
        console.log('Entering AUTO Mode. Starting indexing process now.');
    } else if (mode === 'HELP') {
        console.log('Entering HELP Mode.');
    } else {
        console.log('Entering ERROR Mode.');
        resultObj.errors.push('Something went wrong. Please check your input and try again.');
    }

    return resultObj;
}