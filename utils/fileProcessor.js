const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');
const matcher = require('./matcher');

module.exports = {
    processFiles: async (registryFiles, requestFiles) => {
        const registryDataPromises = registryFiles.map(file => readCsvFile(file.path));
        const requestDataPromises = requestFiles.map(file => readCsvFile(file.path));

        const [registryDataArray, requestDataArray] = await Promise.all([
            Promise.all(registryDataPromises),
            Promise.all(requestDataPromises)
        ]);

        let matched = [];
        let unmatched = [];

        registryDataArray.forEach(registryData => {
            requestDataArray.forEach(requestData => {
                const matchResult = matcher.matchOperations(requestData, registryData);
                matched.push(...matchResult.matched);
                unmatched.push(...matchResult.unmatched);
            });
        });

        return { matched, unmatched };
    }
};

function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        const readStream = fs.createReadStream(filePath)
            .pipe(iconv.decodeStream('win1251'))  
            .pipe(iconv.encodeStream('utf8'));

        readStream
            .pipe(csv({ separator: ';' })) 
            .on('data', (data) => {
                rows.push(data);
            })
            .on('end', () => {
                console.log("CSV Data read from file:", rows);
                resolve(rows);
            })
            .on('error', (error) => reject(new Error(`Ошибка чтения CSV файла: ${error.message}`)));
    });
}
