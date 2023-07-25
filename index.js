import { readFile, readdirSync, writeFile } from 'fs';


const matchSymbolsRegEx = /[^a-zA-Z0-9. ]/g;
const matchMultipleSpaceRegEx = /\s{2,}/g;


const printFrontMatter = () => {
  console.log('\n')
  console.log('-- NAIVE SEARCH PREPROCESSOR --')
  console.log('\n')
  console.log('... collecting files') 
}

const generateFilePathArr = (dir) => {
  const fileNameArr = readdirSync(dir);
  return fileNameArr.map(fileName => `${dir}/${fileName}`);
}

const mdFilePathArr = generateFilePathArr('./blog-posts');
const preIndexObjArr = [];
let uniqueKeysArr = [];

console.log('...found the following files: ');
console.log('\n')

for (const filePath of mdFilePathArr) {
  console.log(filePath);
};


const getFileContent = (filePath) => {
  readFile(filePath, 'utf8', (err, data) => {
    if (data) {
      const cleanedLineSplitArr = generateCleanedLineSplitArr(data);
      console.log('processing content of: ', filePath);
      preIndexObjArr.push(...generatePreIndexObjArr(cleanedLineSplitArr, filePath))
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
    // const cleanedLineStrPartialsArr = cleanedLineStrArr.map(el => generatePartialEntries(el)).flat();

    const result = {
      line: i,
      contentArr: cleanedLineStrArr
    }

    i += 1;
    return result;
  });

  return newLineSplitArr;
}

const generatePartialEntries = (entry) => {
  const partialsArr = [];
  for (let strLen = entry.length; strLen > 0; strLen--) {
    partialsArr.push(entry.slice(0, strLen));
  };
  return(partialsArr);
}


const cleanUpLineStr = (lineStr) => {
  return lineStr
    .replaceAll(matchSymbolsRegEx, ' ')
    .replaceAll(matchMultipleSpaceRegEx, ' ')
    .trim();
}

const generatePreIndexObjArr = (cleanedLineSplitArr, sourceFilePath) => {
  const indexArr = [];
  for (const lineObj of cleanedLineSplitArr) {
    for (const contentE of lineObj.contentArr) {
      /*
       * Push the content entry into the index array - itself formatted as an array of the string and an array
       * with one object as its only entry that contains the source file and line number. Putting this source object
       * into an arry will help later when filtering for duplicate string entries - which will become the search keys
       * in an index object. Because we can't have identical keys, we need to reduce all identical keys over all file
       * arrays and push the source objects into an array so each key can have multiple matching sources. 
       */
      indexArr.push(
        [
          contentE,
          [
            {
              file: sourceFilePath,
              line: lineObj.line 
            }
          ]
        ]
      );
    }
  }

  const cleanedIndexArr = indexArr.filter(el => el[0]);
  const reducedArr = reduceToUniqueKeys(cleanedIndexArr);

  return reducedArr;
}

const reduceToUniqueKeys = (inputArr, isFullArr = false) => {
  const reducedArr = [];
  for (const potReoccuringE of inputArr) {
    const duplicateKeyEntrysArr = inputArr.filter(el => el[0] === potReoccuringE[0]);
    const subArrToPush = duplicateKeyEntrysArr.map(el => isFullArr ? el[1] : el[1].flat()).flat();
    if (duplicateKeyEntrysArr.length > 0) {
      reducedArr.push([
        potReoccuringE[0],
        subArrToPush
      ]);
    } else {
      reducedArr.push(potReoccuringE);
    }
  }
  return reducedArr;
}

const printFileContent = (data) => {
  console.log('\n');
  console.log('Content of first file: ');
  console.log('\n');
  console.log(data); 
  console.log('\n');
}

const writeSearchIndexObjToJsonFile = (searchIndexObj) => {
  const jsonObj = JSON.stringify(searchIndexObj);
  writeFile('search-index.json', jsonObj, 'utf8', (err) => {
    if (err) {
      console.log('There has been an error: ', err);
    } else {
      console.log('Contnet has been written to file.');
    }
  })
}


setTimeout(() => {
  let mdFilePathArrIterator = mdFilePathArr.length;
  console.log('-> Files to process: ', mdFilePathArrIterator)

  for (const path of mdFilePathArr) {
    getFileContent(path);
    mdFilePathArrIterator -= 1;
  }
  
  setTimeout(() => {
    if (mdFilePathArrIterator === 0 && preIndexObjArr.length > 0) {
      console.log('processing full indexes and collecting sources...');
      console.log('This will take a while. Thansk for your patience.');
      uniqueKeysArr = reduceToUniqueKeys(preIndexObjArr, true);
    }
  }, 5000);

  setTimeout(() => {
    writeSearchIndexObjToJsonFile(Object.fromEntries(uniqueKeysArr));
  }, 20000)

}, 100)

