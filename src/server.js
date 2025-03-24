const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  console.log('🔔 Received GitHub Webhook Event:', req.body.action);
  res.status(200).send('✅ Webhook received');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CodeSieve Webhook Server running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    res.send('👋 Welcome to CodeSieve Webhook Server!');
  });