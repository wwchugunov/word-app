const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const archiver = require('archiver');

module.exports = {
    generateDocumentsWithTemplate: async (matchedData, templatePath) => {
        const templateBuffer = fs.readFileSync(templatePath);
        const generatedFiles = [];
        const processedTSLIds = new Set();

        for (const data of matchedData) {
            if (!data['Сума зарахування'] || processedTSLIds.has(data.TSL_ID)) continue;

            processedTSLIds.add(data.TSL_ID);
            const zip = new PizZip(templateBuffer);
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

            doc.render(generateTemplateData(data));

            const buffer = doc.getZip().generate({ type: 'nodebuffer' });
            const fileName = `${data.sender || 'default_name'}.docx`;

            generatedFiles.push({ fileName, buffer });
        }

        return generatedFiles;
    },

    createZipArchive: (generatedFiles, res) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=documents.zip');
        archive.pipe(res);

        generatedFiles.forEach(file => {
            archive.append(file.buffer, { name: file.fileName });
        });

        archive.finalize();
    }
};

function generateTemplateData(data) {
    return {
        "data": data['Дата операції'] || "Default value",
        "pan": data['Картка отримувача'] || "Default value",
        "summ": data['Сума зарахування'] || "Default value",
        "TSL_ID": data['TSL_ID'] || "Default value",
        "approval": data['Код авторизації'] || "Default value",
        "company": data.company || "Default value",
        "sender_list": data.sender_list || "Default value",
        "document": data.document || "Default value",
        "additional": data.additional || "Default value",
        "sender": data.sender || "Default value",
        "companyShort": data.companyShort || "Default value", 
        "contract": data.contract || "Default value",
    };
}
