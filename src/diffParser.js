function parseUnifiedDiff(diffText) {
    const files = [];
    const lines = diffText.split('\n');
  
    let currentFile = null;
    let currentHunk = null;
  
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        // Start of a new file
        if (currentFile) files.push(currentFile);
  
        const fileNameMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
        if (!fileNameMatch) continue;
  
        currentFile = {
          file: fileNameMatch[2],
          hunks: [],
        };
      } else if (line.startsWith('@@')) {
        // Start of a new hunk
        currentHunk = {
          header: line,
          added: [],
          removed: [],
          context: [],
        };
        currentFile.hunks.push(currentHunk);
      } else if (currentHunk) {
        // Hunk lines
        if (line.startsWith('+')) {
          currentHunk.added.push(line.substring(1));
        } else if (line.startsWith('-')) {
          currentHunk.removed.push(line.substring(1));
        } else {
          currentHunk.context.push(line.startsWith(' ') ? line.substring(1) : line);
        }
      }
    }
  
    // Push the final file if exists
    if (currentFile) files.push(currentFile);
  
    return files;
  }
  
  module.exports = { parseUnifiedDiff };