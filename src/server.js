require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');

const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const { fetchPRDiff } = require('./githubClient');
const { parseUnifiedDiff } = require('./diffParser');
const { generatePRSummary } = require('./llmHandler');
const { postSummaryComment } = require('./commentManager');

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
        const summary = await generatePRSummary(parsed);
        console.log('📝 LLM Summary:\n', summary);
        
        // Load .codesieverc config (default to summary mode)
        const configPath = path.join(__dirname, '../.codesieverc');
        let mode = 'summary';
        
        if (fs.existsSync(configPath)) {
          try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            mode = config.mode || 'summary';
          } catch (e) {
            console.warn('⚠️ Failed to parse .codesieverc — using defaults');
          }
        }
        
        // If in summary mode, post the comment
        if (mode === 'summary') {
          await postSummaryComment({
            owner,
            repo,
            issue_number: prNumber,
            body: `🧠 **CodeSieve PR Summary**\n\n${summary}`,
          });
        }
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

