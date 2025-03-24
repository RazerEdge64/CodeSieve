require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
const { fetchPRDiff } = require('./githubClient');
const { parseUnifiedDiff } = require('./diffParser');

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    const { action, pull_request, repository } = req.body;
  
    if (action && pull_request && (action === 'opened' || action === 'synchronize')) {
      console.log(`🔔 PR ${action} event received for: ${pull_request.title}`);
  
      const owner = repository.owner.login;
      const repo = repository.name;
      const prNumber = pull_request.number;
  
      const diff = await fetchPRDiff(owner, repo, prNumber);
  
      if (diff) {
        const parsed = parseUnifiedDiff(diff);
        console.log('🧩 Parsed diff structure:\n');
        console.dir(parsed, { depth: null, maxArrayLength: 10 });
      }
    } else {
      console.log('⚠️ Ignored event or unsupported action:', action);
    }
  
    res.status(200).send('✅ Webhook processed');
  });

app.listen(PORT, () => {
    console.log(`🚀 CodeSieve Webhook Server running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    res.send('👋 Welcome to CodeSieve Webhook Server!');
});

