import { readFile, readdirSync } from 'fs';


const matchSymbolsRegEx = /[^a-zA-Z0-9. ]/g;
const matchMultipleSpaceRegEx = /\s{2,}/g;


console.log('\n')
console.log('-- NAIVE SEARCH PREPROCESSOR --')
console.log('\n')
console.log('... collecting files')

const generateFilePathArr = (dir) => {
  const fileNameArr = readdirSync(dir);
  return fileNameArr.map(fileName => `${dir}/${fileName}`);
}

const mdFilePathArr = generateFilePathArr('./blog-posts');


console.log('...found the following files: ');
console.log('\n')

for (const filePath of mdFilePathArr) {
  console.log(filePath);
};


const getFileContent = (filePath) => {
  readFile(filePath, 'utf8', (err, data) => {
    if (data) {
      printFileContent(data, filePath);
      const cleanedLineSplitArr = generateCleanedLineSplitArr(data);
      // 
      const indexObj = generateIndexObj(cleanedLineSplitArr, filePath);
      console.log(indexObj);
    } else {
      console.error(err);
    }
  }) 
}

const generateCleanedLineSplitArr = (data) => {

  let i = 1;
  const newLineSplitArr = data.split('\n').map(l => {
    const cleanedLineStr = cleanUpLineStr(l);
    const cleanedLineStrArr = cleanedLineStr.split(' ');
    const cleanedLineStrPartialsArr = cleanedLineStrArr.map(el => generatePartialEntries(el)).flat();
    console.log(i, cleanedLineStr)

    const result = {
      line: i,
      contentArr: cleanedLineStrPartialsArr
    }

    i += 1;
    return result;
  });

  // console.log('newLineSplitArr: ', newLineSplitArr);
  return newLineSplitArr;
}

const generatePartialEntries = (entry) => {
  const partialsArr = [];
  for (let strLen = entry.length; strLen > 0; strLen--) {
    partialsArr.push(entry.slice(0, strLen));
  };
  // console.log(partialsArr);
  return(partialsArr);
}

// generatePartialEntries('test');

const cleanUpLineStr = (lineStr) => {
  return lineStr
    .replaceAll(matchSymbolsRegEx, ' ')
    .replaceAll(matchMultipleSpaceRegEx, ' ')
    .trim();
}

const generateIndexObj = (cleanedLineSplitArr, sourceFilePath) => {
  const indexArr = [];
  for (const lineObj of cleanedLineSplitArr) {
    for (const contentE of lineObj.contentArr) {
      if (contentE) {
        indexArr.push(
          [
            contentE,
            {
              file: sourceFilePath,
              line: lineObj.line 
            }
          ]
        );
      }
    }
  }

  return Object.fromEntries(indexArr);
}

const printFileContent = (data) => {
  console.log('\n');
  console.log('Content of first file: ');
  console.log('\n');
  console.log(data); 
  console.log('\n');
}

getFileContent(mdFilePathArr[0]);
