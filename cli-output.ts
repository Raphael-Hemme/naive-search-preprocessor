export const printFrontMatter = (): void => {
    console.log('\n')
    console.log('-- NAIVE SEARCH PREPROCESSOR --')
    console.log('\n')
    console.log('... collecting files')
    console.log('\n')
}

export const printFilePaths = (filePathArr: string[]): void => {
    console.log('Found the following', filePathArr.length, 'files: ');
    for (const filePath of filePathArr) {
        console.log('\t', filePath);
    }
    console.log('\n')
}