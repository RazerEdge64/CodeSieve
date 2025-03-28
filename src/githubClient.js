const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3.diff',
  },
});

async function fetchPRDiff(owner, repo, pull_number) {
  try {
    const res = await githubAPI.get(`/repos/${owner}/${repo}/pulls/${pull_number}`);
    return res.data;
  } catch (err) {
    console.error('❌ Error fetching PR diff:', err.message);
    return null;
  }
}

async function fetchCommitDiff(owner, repo, sha) {
  try {
    const res = await githubAPI.get(`/repos/${owner}/${repo}/commits/${sha}`);
    const files = res.data.files || [];

    return files
      .filter(file => file.patch)
      .map(file => ({
        file: file.filename,
        patch: file.patch,
      }));

  } catch (err) {
    console.error('❌ Error fetching commit diff:', err.message);
    return null;
  }
}

module.exports = {
  fetchPRDiff,
  fetchCommitDiff
};