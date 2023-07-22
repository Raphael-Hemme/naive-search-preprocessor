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
      printFileContent(data);
    } else {
      console.error(err);
    }
  })
  

  
}

const printFileContent = (data) => {
  console.log('\n');
  console.log('content of first file: ');
  console.log('\n');

  console.log(data);
}

getFileContent(mdFilePathArr[0]);
