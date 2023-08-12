import process from 'process';

export type Mode = 'CLI' | 'AUTO' | 'HELP' | 'ERROR'; 

export interface SourceAndTargetPathObj {
    sourcePaths: string[];
    targetPath: string;
    errors: string[];
}

const getRelevantScriptArgs = () => {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('You did not specify any source paths or a target file. Entering CLI mode.');
        return null;
    }
    return args;
}

const selectMode = (allArgs: string[]): Mode => {
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

const extractSourceAndTargetPathsFromArgs = (allArgs: string[]): SourceAndTargetPathObj => {
    const resultObj: SourceAndTargetPathObj = {
        sourcePaths: [],
        targetPath: '',
        errors: []
    }

    let sourcePathsStartIndicator = allArgs.findIndex(arg => arg === '--source');
    let targetPathsStartIndicator = allArgs.findIndex(arg => arg === '--target');

    if (sourcePathsStartIndicator !== -1 && targetPathsStartIndicator !== -1) {
        resultObj.sourcePaths = allArgs.slice(sourcePathsStartIndicator + 1, targetPathsStartIndicator);
        resultObj.targetPath = allArgs[targetPathsStartIndicator + 1];
    } else if (sourcePathsStartIndicator !== -1 && targetPathsStartIndicator === -1) {
        resultObj.sourcePaths = allArgs.slice(sourcePathsStartIndicator + 1);
        resultObj.errors.push('missing target path');
    } else if (sourcePathsStartIndicator === -1 && targetPathsStartIndicator !== -1) {
        resultObj.targetPath = allArgs[targetPathsStartIndicator + 1];
        resultObj.errors.push('missing source paths');
    } else {
        resultObj.errors.push('missing source paths');
        resultObj.errors.push('missing target path');
    }

    return resultObj;
}
