const fs = require('fs');

const mdFilePathArr = []

const generateFilePathArr = (dir) => {
  const fileNameArr = fs.readdirSync(dir);
  return fileNameArr.map(fileName => `${dir}/${fileName}`);
}

mdFilePathArr.push(generateFilePathArr('./blog-posts'));

console.log(mdFilePathArr);
