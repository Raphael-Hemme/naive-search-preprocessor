export const printFrontMatter = (): void => {
    console.log('\n')
    console.log('-- NAIVE SEARCH PREPROCESSOR --')
    console.log('\n')
}

export const printFilePaths = (filePathArr: string[]): void => {
    console.log('Found the following', filePathArr.length, 'files: ');
    for (const filePath of filePathArr) {
        console.log('\t', filePath);
    }
    console.log('\n')
}

export const printHelp = (): void => {
    console.log('To run the program in auto mode, use the following command:\n\n');
    console.log('\tnode index.js --source <source path> --target <target path>\n\n');
    console.log(`where <source path> is the path or a space separated list of paths to the directory / directories containing the files you want to index \nand <target path> is the path to the file you want to write the index to.\n`);

    console.log('To run the program in interactive mode / CLI mode, use the following command:\n\n');
    console.log('\tnode index.js\n');
    console.log('You will then be prompted to enter the paths to the source files and the target file.\n');

    console.log('To see this help text, use the following command:\n\n');
    console.log('\tnode index.js --help\n');
}