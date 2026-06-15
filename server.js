import express from 'express';
import cors from 'cors';
import { fetchExtractData } from './extract.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/extract', async (req, res) => {
    const movieName = req.query.movie;
    if (!movieName) {
        return res.status(400).json({ error: 'Movie name is required' });
    }

    try {
        console.log(`Received request to extract movie: ${movieName}`);
        const data = await fetchExtractData(movieName);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Extraction error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
