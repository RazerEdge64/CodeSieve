const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generatePRSummary(parsedDiff) {
  const prompt = buildPrompt(parsedDiff);

  try {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful code reviewer that summarizes pull request diffs.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Error calling OpenAI:', error.response?.data || error.message);
    return 'Failed to generate summary.';
  }
}

function buildPrompt(diff) {
  let prompt = 'Here is a pull request diff. Summarize the code changes and suggest any improvements:\n\n';

  for (const file of diff) {
    prompt += `\nFile: ${file.file}\n`;
    for (const hunk of file.hunks) {
      prompt += `--- Hunk: ${hunk.header} ---\n`;
      if (hunk.added.length) prompt += `+ Additions:\n${hunk.added.join('\n')}\n`;
      if (hunk.removed.length) prompt += `- Deletions:\n${hunk.removed.join('\n')}\n`;
    }
  }

  return prompt;
}

async function generateCommitMessage(diffText) {
  const prompt = `Here is a code diff. Suggest a single-line commit message using one of the conventional prefixes: feat:, fix:, docs:, refactor:, chore:, test:. Be concise and relevant.\n\n${diffText}`;

  console.log('🧠 Commit Prompt Sent to LLM:\n');

  try {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that generates conventional commit messages.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Error generating commit message:', error.response?.data || error.message);
    return 'Failed to generate commit message.';
  }
}

module.exports = {
  generatePRSummary,
  generateCommitMessage
};