require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('.'));

const TO_EMAIL = 'dee@qualifiedmachineshop.com';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

app.post('/submit', upload.single('file'), async (req, res) => {
    const { name, company, email, phone, jobType, description } = req.body;

    if (!name || !email || !jobType || !description) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    const attachments = req.file
        ? [{ filename: req.file.originalname, content: req.file.buffer }]
        : [];

    const html = `
        <h2>New Quote Request</h2>
        <table cellpadding="6">
            <tr><td><strong>Name</strong></td><td>${esc(name)}</td></tr>
            <tr><td><strong>Company</strong></td><td>${esc(company) || '—'}</td></tr>
            <tr><td><strong>Email</strong></td><td>${esc(email)}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${esc(phone) || '—'}</td></tr>
            <tr><td><strong>Job Type</strong></td><td>${esc(jobType)}</td></tr>
        </table>
        <h3>Project Description</h3>
        <p>${esc(description).replace(/\n/g, '<br>')}</p>
    `;

    try {
        await transporter.sendMail({
            from: `"QMS Website" <${process.env.SMTP_USER}>`,
            to: TO_EMAIL,
            replyTo: email,
            subject: `Quote Request [${esc(jobType)}] — ${esc(name)}`,
            html,
            attachments,
        });
        res.json({ ok: true });
    } catch (err) {
        console.error('Mail error:', err.message);
        res.status(500).json({ error: 'Failed to send. Please try again.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
