import { readFile, readdirSync } from 'fs';


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
  let fileContent;
  readFile(filePath, 'utf8', (err, data) => {
    if (data) {
      fileContent = data;
      printFileContent(data, filePath);
    } else {
      console.error(err);
    }
  }) 
}

const printFileContent = (data, sourceFilePath) => {
  console.log('\n');
  console.log('Content of first file: ');
  console.log('\n');
  console.log(data); 
  console.log('\n');

  let i = 1;
  const newLineSplitArr = data.split('\n').map(l => {
    const result = {
      line: i,
      contentArr: l.split(' ')
    }

    i += 1;
    return result;
  });

  console.log(newLineSplitArr);

  const rawContentArr = [];
  for (const lineObj of newLineSplitArr) {
    for (const contentE of lineObj.contentArr) {
      if (contentE && /^(?=.*[A-Za-z0-9]).+$/.test(contentE)) {
        rawContentArr.push(
          {
            [contentE]: {
              file: sourceFilePath,
              line: lineObj.line 
            }
          }
        );
      }
    }
  }

  console.log('raw: ', rawContentArr);
  // const processedArr = newLineSplitArr.map(e => [`${e.cont.toString().toLowerCase()}`, sourceFilePath]);

  // console.log('-> searching for "let": ', stringifiedObj['let'])
}

getFileContent(mdFilePathArr[0]);
