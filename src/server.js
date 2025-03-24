const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.post('/webhook', (req, res) => {
    const { action, pull_request } = req.body;
    if (action && pull_request) {
        console.log(`🔔 PR ${action} event received for: ${pull_request.title}`);
    } else {
        console.log('⚠️ Unexpected webhook payload:', JSON.stringify(req.body, null, 2));
    }

    res.status(200).send('✅ Webhook processed');
});

app.listen(PORT, () => {
    console.log(`🚀 CodeSieve Webhook Server running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    res.send('👋 Welcome to CodeSieve Webhook Server!');
});

