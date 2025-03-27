const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
});

// Posts a single summary comment on the PR
async function postSummaryComment({ owner, repo, issue_number, body }) {
  try {
    const res = await githubAPI.post(
      `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
      { body }
    );
    console.log('💬 Posted PR summary comment');
    return res.data;
  } catch (err) {
    console.error('❌ Failed to post PR comment:', err.message);
    return null;
  }
}

module.exports = { postSummaryComment };