import process from 'process';
import readline from 'readline';


export type Mode = 'CLI' | 'AUTO' | 'HELP' | 'ERROR'; 

export interface UserInputResultObj {
  sourcePaths: string[];
  targetPath: string;
  errors: string[];
  mode: Mode;
}


// ----------------- CLI-INPUT -----------------

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

const extractSourceAndTargetPathsFromArgs = (allArgs: string[] | null, mode: Mode): UserInputResultObj => {
  const resultObj: UserInputResultObj = {
    sourcePaths: [],
    targetPath: '',
    errors: [],
    mode: mode,
  }

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

  if (sourcePaths.length < 1) {
    console.log('You did not specify any source paths.');
    return await promptForSourcePaths();
  } else {
    return sourcePaths;
  }
}

const promptForTargetPath = async (): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('Please enter the path to the target file.');
  const answer = await new Promise<string>(resolve => rl.question('', resolve));
  rl.close();

  if (answer === '') {
    console.log('You did not specify a target path.');
    return await promptForTargetPath();
  } else {
    return answer;
  }
}

export const processArgsAndExecuteMode = async (): Promise<UserInputResultObj> => {

  const args = getRelevantScriptArgs();
  const mode = selectMode(args);
  const resultObj: UserInputResultObj = extractSourceAndTargetPathsFromArgs(args, mode);

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
    resultObj.mode = 'AUTO';

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

// ----------------- CLI-OUPUT -----------------

export const printFrontMatter = (): void => {
  const terminalColumns = process.stdout.columns;
  const bannerWidth = 35;
  // subtract 1 for the start of line character
  const bannerPaddingColumns = Math.floor((terminalColumns - bannerWidth) / 2 - 1);
  const bannerPadding = ' '.repeat(bannerPaddingColumns);
  console.log('\n')
  console.log(bannerPadding + '┌─────────────────────────────────┐')
  console.log(bannerPadding + '│    NAIVE SEARCH PREPROCESSOR    │')
  console.log(bannerPadding + '└─────────────────────────────────┘')
  console.log('\n')
};

export const printFilePaths = (filePathArr: string[]): void => {
  console.log('Found the following', filePathArr.length, 'files: ');
  for (const filePath of filePathArr) {
    console.log('\t', filePath);
  }
  console.log('\n')
};

export const printHelp = (): void => {
  console.log('To run the script in auto mode, use the following command:\n\n');
  console.log('\tnode index.js --source <source path> --target <target path>\n\n');
  console.log(`where <source path> is the path or a space separated list of paths to the directory / directories containing the files you want to index \nand <target path> is the path to the file you want to write the index to.\n`);

  console.log('To run the script in interactive mode / CLI mode, use the following command:\n\n');
  console.log('\tnode index.js\n');
  console.log('You will then be prompted to enter the paths to the source files and the target file.\n');

  console.log('To see this help text, use the following command:\n\n');
  console.log('\tnode index.js --help\n');
};

export const printError = (err: string): void => {
  console.log('There has been an error: ', err);
  console.log('\n');
};

export const printPreprocessingFilesMsg = (): void => {
  console.log('\n\nProcessing content of files...');
};

export const printProcessingMsg = (): void => {
  console.log('\n\nProcessing full indexes and collecting sources...');
  console.log('This might take a while. Thanks for your patience.');
};

export const printRemovingDuplicatesMsg = (): void => {
  console.log('\n\nRemoving duplicate matches...');
  console.log('Almost done now.\n\n');
};

export const printResultOfWritingFile = (err?: Error | null): void => {
  if (err) {
    console.log('There has been an error while writing the index to the file: ', err);
    console.log('\n');
  } else {
    console.log('Content has been written to file.\n');
  }
}