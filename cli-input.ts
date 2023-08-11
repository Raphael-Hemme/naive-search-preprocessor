import process from 'process';

const getRelevantScriptArgs = () => {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('You did not specify any source paths or a target file. Entering CLI mode.');
        return null;
    }
    return args;
}

const getSourcePaths = ()