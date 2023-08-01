import { readFileSync, readdirSync, writeFile } from 'fs';
import { tap, of, map } from 'rxjs';

const matchSymbolsRegEx = /[^a-zA-Z0-9. ]/g;
const matchMultipleSpaceRegEx = /\s{2,}/g;
const matchMultipleDotRegEx = /\.{2,}/g;
const cleanSearchEntryStrRegEx = /[^a-zA-Z0-9]/g;


const generateFilePathArr = (dirArr) => {
  const fileNameArr = [];
  for (const dir of dirArr) {
    fileNameArr.push(readdirSync(dir));
  }
  return fileNameArr.map(fileName => `${dir}/${fileName}`);
}



const printFrontMatter = () => {
  console.log('\n')
  console.log('-- NAIVE SEARCH PREPROCESSOR --')
  console.log('\n')
  console.log('... collecting files') 
  console.log('\n')
}

const printFilePaths = (filePathArr) => {
  console.log('Found the following', filePathArr.length, 'files: ');
  for (const filePath of filePathArr) {
    console.log('\t', filePath);
  }
  console.log('\n')
}

const generateCleanedLineSplitArr = (data) => {
  let i = 1;
  const newLineSplitArr = data.split('\n').map(l => {
    const cleanedLineStr = cleanUpLineStr(l);
    const cleanedLineStrArr = cleanedLineStr.split(' ');

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


const cleanSearchEntryStr = (searchEntryStr) => {
  const strLen = searchEntryStr.length;
  let cleanedStr = searchEntryStr.replaceAll(matchMultipleDotRegEx, '.');

  if (cleanSearchEntryStrRegEx.test(searchEntryStr[strLen - 1])) {
    cleanedStr = searchEntryStr.slice(0, strLen - 2);
  } else if (cleanSearchEntryStrRegEx.test(searchEntryStr[0])) {
    cleanedStr = searchEntryStr.slice(1);
  } else {
    cleanedStr = searchEntryStr;
  }

  return cleanedStr;
}

const generatePreIndexObjArr = (cleanedLineSplitArr, sourceFilePath) => {
  const indexArr = [];
  for (const lineObj of cleanedLineSplitArr) {
    for (const contentE of lineObj.contentArr) {
      /*
       * Push the content entry into the index array - itself formatted as an array of the string (the key) and an array
       * with one object as its only entry that contains the source file and line number. Putting this source object
       * into an arry will help later when filtering for duplicate string entries (keys) - which will become the search keys
       * in an index object. Because we can't have identical keys, we need to reduce all identical keys over all file
       * arrays and push the source objects into an array so each key can have multiple matching sources. 
       */
      indexArr.push(
        [
          cleanSearchEntryStr(contentE),
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

  // delete entries with emty strings (can happen when multiple space characters follow in a row and space is used as seperator)
  const cleanedIndexArr = indexArr.filter(el => el[0]);
  const reducedArr = reduceToUniqueKeys(cleanedIndexArr);

  return reducedArr;
}

const reduceToUniqueKeys = (inputArr, isFullArr = false) => {
  let reducedArr = [];
  for (const potReoccuringE of inputArr) {
    const duplicateKeyEntrysArr = inputArr.filter(el => el[0] === potReoccuringE[0]);
    const subArrToPush = duplicateKeyEntrysArr.map(el => isFullArr ? el[1] : el[1].flat()).flat();
    if (duplicateKeyEntrysArr.length > 0 ) {
      reducedArr.push([
        potReoccuringE[0],
        subArrToPush
      ]);
    } else {
      reducedArr.push(potReoccuringE);
    }
  }
  
  if (isFullArr) {
    const stringifiedArr = reducedArr.map(el => JSON.stringify(el))
    const reducedStringifiedArr = [...new Set(stringifiedArr)]
    reducedArr = reducedStringifiedArr.map(el => JSON.parse(el));
    console.log(reducedArr.length);
  }

  return reducedArr;
};

const removeDuplicateValueObjs = (inputArr) => {
  return inputArr.map(el => {
    const stringifiedValueArr = el[1].map(e => JSON.stringify(e));
    const filteredValueArr = [...new Set(stringifiedValueArr)].map(el => JSON.parse(el));
    return [
      el[0],
      filteredValueArr
    ];
  });
}; 

const writeSearchIndexObjToJsonFile = (searchIndexObj) => {
  const jsonObj = JSON.stringify(searchIndexObj);
  writeFile('search-index.json', jsonObj, 'utf8', (err) => {
    if (err) {
      console.log('There has been an error: ', err);
      console.log('\n');
    } else {
      console.log('Content has been written to file.\n');
    }
  });
};

const main = () => {
  of('start')
    .pipe(
      tap(() => printFrontMatter()),
      map(() => generateFilePathArr(['./blog-posts', './io-garden-expermiment-descriptions'])),
      tap((filePathArr) => printFilePaths(filePathArr)),
      map((filePathArr) => {
        const fileContentArr = [];
        console.log('Reading files:')
        for (const filePath of filePathArr) {
          console.log('\t', filePath)
          fileContentArr.push({
            fileContent: readFileSync(filePath, 'utf8'),
            filePath
          })
        }
        return fileContentArr;
      }),
      map((fileContentArr) => {
        console.log('\n');
        console.log('Processing content of: ');
        const resultArr = [];
        for (const file of fileContentArr) {
          console.log('\t', file.filePath);
          const cleanedLineSplitArr = generateCleanedLineSplitArr(file.fileContent);
          resultArr.push(...generatePreIndexObjArr(cleanedLineSplitArr, file.filePath))
        }
        return resultArr;
      }),
      map((preIndexObjArr) => {
        console.log('\n\nProcessing full indexes and collecting sources...');
        console.log('This will take a while. Thanks for your patience.\n');
        const uniqueKeysArr = reduceToUniqueKeys(preIndexObjArr, true);
        return uniqueKeysArr;
      }),
      map((uniqueKeysArr) => {
        console.log('\nRemoving duplicate matches...');
        console.log('Almost done now.\n\n');
        const cleanedPreObjArr = removeDuplicateValueObjs(uniqueKeysArr);
        return cleanedPreObjArr; 
      }),
      tap((cleanedPreObjArr) => {
        const indexArr = cleanedPreObjArr.map((el) => {
          return {
            searchTerm: el[0],
            searchResults: el[1]
          };
        });

        writeSearchIndexObjToJsonFile(indexArr);
      })
    )
    .subscribe();
}

main();
