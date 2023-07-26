import { readFileSync, readdirSync, writeFile } from 'fs';
import { tap, delay, of, map } from 'rxjs';

const matchSymbolsRegEx = /[^a-zA-Z0-9. ]/g;
const matchMultipleSpaceRegEx = /\s{2,}/g;


const generateFilePathArr = (dir) => {
  const fileNameArr = readdirSync(dir);
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
  console.log('...found the following files: ');
  console.log('\n')
  for (const filePath of filePathArr) {
    console.log(filePath);
  };
  console.log('\n')
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
    if (duplicateKeyEntrysArr.length > 0 ) {
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

const removeDuplicateValueObjs = (inputArr) => {
  return inputArr.map(el => {
    return [
      el[0],
      [...new Set(el[1])]
    ]
  })
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


const main = () => {
  
  of('start')
    .pipe(
      tap(() => printFrontMatter()),
      map(() => generateFilePathArr('./blog-posts')),
      tap((filePathArr) => console.log('Sum of files to process: ', filePathArr.length)),
      tap((filePathArr) => printFilePaths(filePathArr)),
      map((filePathArr) => {
        const fileContentArr = [];
        for (const filePath of filePathArr) {
          console.log('Reading file: ', filePath)
          fileContentArr.push({
            fileContent: readFileSync(filePath, 'utf8'),
            filePath
          })
        }
        return fileContentArr;
      }),
      map((fileContentArr) => {
        console.log('\n');
        const resultArr = [];
        for (const file of fileContentArr) {
          console.log('processing content of: ', file.filePath);
          const cleanedLineSplitArr = generateCleanedLineSplitArr(file.fileContent);
          resultArr.push(...generatePreIndexObjArr(cleanedLineSplitArr, file.filePath))
        }
        return resultArr;
      }),
      map((preIndexObjArr) => {
        console.log('\nProcessing full indexes and collecting sources...');
        console.log('This will take a while. Thansk for your patience.\n');
        const uniqueKeysArr = reduceToUniqueKeys(preIndexObjArr, true);
        return uniqueKeysArr;
      }),
      map((uniqueKeysArr) => {
        console.log('Removing duplicate matches...');
        console.log('Almost done now.\n');
        const cleanedPreObjArr = removeDuplicateValueObjs(uniqueKeysArr);
        return cleanedPreObjArr; 
      }),
      tap((cleanedPreObjArr) => {
        const indexObj = Object.fromEntries(cleanedPreObjArr)
        writeSearchIndexObjToJsonFile(indexObj);
      })
    )
    .subscribe();
}



main();
