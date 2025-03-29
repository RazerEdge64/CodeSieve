require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const { fetchPRDiff, fetchCommitDiff } = require('./githubClient');
const { parseUnifiedDiff } = require('./diffParser');
const { generatePRSummary, generateCommitMessage } = require('./llmHandler');
const { postSummaryComment } = require('./commentManager');

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const githubEvent = req.headers['x-github-event'];
  const { action, pull_request, repository, commits } = req.body;

  const owner = repository?.owner?.login;
  const repo = repository?.name;

  if (githubEvent === 'pull_request' && (action === 'opened' || action === 'synchronize')) {
    console.log(`🔔 PR ${action} event received for: ${pull_request.title}`);

    const prNumber = pull_request.number;
    const diff = await fetchPRDiff(owner, repo, prNumber);

    if (diff) {
      const parsed = parseUnifiedDiff(diff);
      const summary = await generatePRSummary(parsed);
      console.log('📝 LLM Summary:\n', summary);

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

      if (mode === 'summary') {
        await postSummaryComment({
          owner,
          repo,
          issue_number: prNumber,
          body: `🧠 **CodeSieve PR Summary**\n\n${summary}`,
        });
      }
    }

  } else if (githubEvent === 'push' && commits && Array.isArray(commits)) {
    console.log(`🔁 Push event with ${commits.length} commit(s)`);

    for (const commit of commits) {
      const sha = commit.id;
      console.log(`📦 Processing commit: ${sha}`);

      const diff = await fetchCommitDiff(owner, repo, sha); // This now returns array [{file, patch}, ...]

      // Add a check here
      if (diff && Array.isArray(diff) && diff.length > 0) {
        // Construct the unified diff text from the patches
        const unifiedDiffText = diff.map(f =>
            `diff --git a/${f.file} b/${f.file}\n--- a/${f.file}\n+++ b/${f.file}\n${f.patch}` // Reconstruct a basic unified diff header
        ).join('\n\n'); // Add extra newline between file patches for clarity

        // Optional: Limit diff size if it's too large for the LLM prompt
        const MAX_DIFF_LENGTH = 10000; // Adjust as needed (consider OpenAI token limits)
        const truncatedDiffText = unifiedDiffText.length > MAX_DIFF_LENGTH
            ? unifiedDiffText.substring(0, MAX_DIFF_LENGTH) + "\n... (diff truncated)"
            : unifiedDiffText;

        // console.log('🧾 Diff Preview:\n', truncatedDiffText.slice(0, 1000)); // Log truncated version

        const suggestedMessage = await generateCommitMessage(truncatedDiffText); // Pass truncated version

        console.log(`✍️ Suggested commit message for ${sha}:\n${suggestedMessage}\n`);
      } else {
        console.log(`⚠️ No diff data found or failed to fetch for commit: ${sha}`);
      }

    }

  } else {
    console.log('⚠️ Ignored event or unsupported action:', action || githubEvent);
  }

  res.status(200).send('✅ Webhook processed');
});

app.listen(PORT, () => {
  console.log(`🚀 CodeSieve Webhook Server running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('👋 Welcome to CodeSieve Webhook Server!');
});