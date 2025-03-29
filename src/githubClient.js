const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Client for requests expecting JSON responses
const githubJsonClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json', // <--- Use JSON accept type
  },
});

// Client for requests expecting raw diff responses
const githubDiffClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3.diff', // <--- Use Diff accept type
  },
});


async function fetchPRDiff(owner, repo, pull_number) {
  try {
    // Use the client configured for raw diffs
    const res = await githubDiffClient.get(`/repos/${owner}/${repo}/pulls/${pull_number}`);
    return res.data; // This will be the raw diff string
  } catch (err) {
    console.error(`❌ Error fetching PR diff for PR #${pull_number}:`, err.response?.data || err.message);
    return null;
  }
}

async function fetchCommitDiff(owner, repo, sha) {
  try {
    // Use the client configured for JSON
    const res = await githubJsonClient.get(`/repos/${owner}/${repo}/commits/${sha}`);

    // Check if the response structure is as expected
    if (!res.data || !Array.isArray(res.data.files)) {
        console.error(`❌ Unexpected response structure for commit ${sha}:`, res.data);
        return null;
    }

    const files = res.data.files;

    // Filter files that have a patch and map to the desired structure
    return files
      .filter(file => file && typeof file.patch === 'string') // Ensure patch exists and is a string
      .map(file => ({
        file: file.filename,
        patch: file.patch, // The patch data is within the file object
      }));

  } catch (err) {
    console.error(`❌ Error fetching commit diff for SHA ${sha}:`, err.response?.data || err.message);
    return null;
  }
}

module.exports = {
  fetchPRDiff,
  fetchCommitDiff
};