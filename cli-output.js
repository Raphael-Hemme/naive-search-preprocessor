export const printFrontMatter = () => {
    console.log('\n');
    console.log('-- NAIVE SEARCH PREPROCESSOR --');
    console.log('\n');
};
export const printFilePaths = (filePathArr) => {
    console.log('Found the following', filePathArr.length, 'files: ');
    for (const filePath of filePathArr) {
        console.log('\t', filePath);
    }
    console.log('\n');
};
export const printHelp = () => {
    console.log('To run the program in auto mode, use the following command:\n\n');
    console.log('\tnode index.js --source <source path> --target <target path>\n\n');
    console.log(`where <source path> is the path or a space separated list of paths to the directory / directories containing the files you want to index \nand <target path> is the path to the file you want to write the index to.\n`);
    console.log('To run the program in interactive mode / CLI mode, use the following command:\n\n');
    console.log('\tnode index.js\n');
    console.log('You will then be prompted to enter the paths to the source files and the target file.\n');
    console.log('To see this help text, use the following command:\n\n');
    console.log('\tnode index.js --help\n');
};
export const printError = (err) => {
    console.log('There has been an error: ', err);
    console.log('\n');
};
export const printPreprocessingFilesMsg = () => {
    console.log('\n\nProcessing content of files...');
};
export const printProcessingMsg = () => {
    console.log('\n\nProcessing full indexes and collecting sources...');
    console.log('This might take a while. Thanks for your patience.');
};
export const printRemovingDuplicatesMsg = () => {
    console.log('\n\nRemoving duplicate matches...');
    console.log('Almost done now.\n\n');
};
export const printResultOfWritingFile = (err) => {
    if (err) {
        console.log('There has been an error while writing the index to the file: ', err);
        console.log('\n');
    }
    else {
        console.log('Content has been written to file.\n');
    }
};
