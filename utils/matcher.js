module.exports = {
    matchOperations: (requests, registry) => {
        const matched = [];
        const unmatched = [];

        requests.forEach(request => {
            const tranId = (request['TRANID'] || '').trim();
            const match = registry.find(row => {
                const tslId = (row['TSL_ID'] || '').trim();
                const regTranId = (row['TRANID'] || '').trim();

                return tranId === tslId || tranId === regTranId;
            });

            if (match && !matched.some(item => item.TSL_ID === match['TSL_ID'])) {
                const fullCompanyName = getCompanyName(request);

                const processedData = {
                    'Дата операції': match['TRAN_DATE_TIME'] || match['Час та датаоперації'] || 'Дата не указана',
                    'Картка отримувача': match['PAN'] || match['Номер картки'] || 'Номер не указан',
                    'Сума зарахування': match['TRAN_AMOUNT'] || match['Сумаоперації,грн.'] || 0,
                    TSL_ID: match['TSL_ID'] || match['Уникальныйномертранзакции в ПЦ'] || match['TRANID'],
                    'Код авторизації': match['APPROVAL'] || match['Кодавторизації'] || 'Не указан',
                    company: fullCompanyName,
                    companyShort: fullCompanyName.slice(0, -16).trim(),
                    sender_list: request['Номер вихідного листа'] || 'Не указан',
                    document: request['Додаткова інформація'] || 'Нет информации',
                    additional: request['Додаткова інформація'] || 'Нет дополнительной информации',
                    sender: request['ПІБ клієнта'] || 'Не указан',
                    name: request['ПІБ клієнта'],
                    contract: request['Договір'] || 'Не указан'
                };

                if (processedData['Сума зарахування'] && processedData.sender) {
                    matched.push(processedData);
                } else {
                    console.log(processedData);
                }
            } else {
                unmatched.push(request);
            }
        });

        return { matched, unmatched };
    },

    generateReport: (matched, unmatched) => {
        return {
            matched: matched.map(item => ({
                name: item.sender || "Не указано",
                status: "Найдено"
            })),
            unmatched: unmatched
                .filter(item => item['ПІБ клієнта'] && item['ПІБ клієнта'] !== "") 
                .map(item => ({
                    name: item['ПІБ клієнта'],
                    status: "Не найдено"
                }))
        };
    }
};

function getCompanyName(request) {
    return Object.keys(request).find(key => /Юридична\s+назва\s+ЄДРПОУ/i.test(key))
        ? request[Object.keys(request).find(key => /Юридична\s+назва\s+ЄДРПОУ/i.test(key))]
        : 'Default value';
}
