const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

app.get('/config', (req, res) => {
    const configPath = path.join(__dirname, 'config.json');
        try {
            const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
            res.json(config);
        } catch (err) {
            res.status(500).json({ error: 'Error leyendo config.json', details: err.message });
        }
});

app.listen(PORT, () => {
    console.log(`🚀 Space Journey running at http://localhost:${PORT}`);
});

process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection:', err);
});
