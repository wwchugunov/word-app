const express = require('express');
const multer = require('multer');
const path = require('path');
const fileProcessor = require('./utils/fileProcessor');
const documentGenerator = require('./utils/documentGenerator');
const matcher = require('./utils/matcher');

const app = express();
const upload = multer({ dest: './uploads' });

app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/processing/', (req, res) => {
    res.render('index');
});

app.post('/upload', upload.fields([
    { name: 'registryFiles', maxCount: 10 },
    { name: 'requestFile', maxCount: 10 }
]), async (req, res) => {
    try {
        if (!req.files['registryFiles'] || !req.files['requestFile']) {
            return res.status(400).json({ error: 'Не все файлы были загружены' });
        }

        const registryFiles = req.files['registryFiles'];
        const requestFiles = req.files['requestFile'];

        const { matched, unmatched } = await fileProcessor.processFiles(registryFiles, requestFiles);

        if (req.query.report === 'true') {
            const report = matcher.generateReport(matched, unmatched);
            return res.status(200).json(report);
        }

        if (matched.length === 0) {
            return res.status(404).json({ message: 'Совпадений не найдено' });
        }

        const templatePath = req.query.type === 'c2a'
            ? path.join(__dirname, 'template_c2a.docx')
            : req.query.type === 'a2c'
                ? path.join(__dirname, 'template_a2c.docx')
                : null;

        if (!templatePath) {
            return res.status(400).json({ error: 'Неверный тип запроса. Поддерживаются только c2a и a2c' });
        }

        const generatedFiles = await documentGenerator.generateDocumentsWithTemplate(matched, templatePath);

        documentGenerator.createZipArchive(generatedFiles, res);

    } catch (error) {
        console.error('Ошибка обработки файлов:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 1515;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
