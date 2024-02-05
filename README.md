# naive-search-preprocessor
The Naive Search Preprocessor is little side project - A Node.js script I wrote to read out the markdown files that constitute the content on my website and create a simple search index of the words with references to all of their locations (the path to the source files and the corresponding line numbers).

This project was conceived of as a learning opportunity to tinker with indexing and search in a rather unconventional way. I intended to use this project as a point of entry into the domain of search and I intentionally ignored existing solutions and best practices in a first phase to actually make room for some of the same mistakes as generations of programmers before me stumbled upon. I was well aware that it would be just a very simple solution to a complex problem addressed by experts in Math and Computer Science for decades. But I chose this way because I believe that (sometimes!) actually making some of those 'obvious' mistakes allows for a deeper understanding of the problems and the solutions these experts came up with than reading a textbook or someone elses code. 

Standing on the shoulders of giants is great, but the bugs on the ground might seem conveniently tiny from up there and who would want to miss out on a good fight with a humongous monster bug to level up?

This intentional ignorance or naivité is, why I called the project: '(The) Naive Search Preprocessor' or 'TNSP' in short.

So, the scrip is not primarily inteded for use by other people, but if you are interested in the code or the concept, feel free to take a look at it and use it as you like. I would be happy to hear from you if you have any questions or suggestions.

## Current state of the project
TNSP is a Node script that is run from the command line and it generates the index as a local json file in a specified location which can then be used in another place like your website as a search index. The script takes multiple arguments that specify the source paths and the output path + file name.

## How to use TNSP
A full command to run the script could look like this: `node index.js --source ./dir-one ./dir-two --target ./index.json`.

The short form flags `-s` instead of `--source` and `-t` instead of `--target` do work as well and you can change the order of appearance.

If you don't specify the source and target paths as arguments to the command, or if invalid paths are detected, the script will enter a CLI mode where you are prompted to enter the missing or invalid paths.