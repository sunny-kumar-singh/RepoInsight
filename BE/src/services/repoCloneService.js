const simpleGit = require('simple-git');
const fs = require('fs/promises');
const path = require('path');

class RepoCloneService {
    constructor(baseClonePath = 'temp/repos') {
        this.baseClonePath = baseClonePath;
    }

    async cloneRepository(repoUrl) {
        try {
            const repoName = this.extractRepoName(repoUrl);
            const clonePath = path.join(this.baseClonePath, repoName);

            // Ensure the directory exists
            await fs.mkdir(this.baseClonePath, { recursive: true });

            // Check if directory already exists and remove it
            await this.cleanupExistingRepo(clonePath);

            // Initialize simple-git
            const git = simpleGit();

            // Perform shallow clone (depth=1) for faster cloning
            await git.clone(repoUrl, clonePath, ['--depth', '1']);

            return clonePath;
        } catch (error) {
            throw new Error(`Failed to clone repository: ${error.message}`);
        }
    }

    async cleanupExistingRepo(clonePath) {
        try {
            await fs.rm(clonePath, { recursive: true, force: true });
        } catch (error) {
            // Ignore if directory doesn't exist
        }
    }

    extractRepoName(repoUrl) {
        // Remove .git extension if present
        const withoutGit = repoUrl.replace(/\.git$/, '');
        // Get the last part of the URL
        return withoutGit.split('/').pop() || 'repository';
    }
}

module.exports = RepoCloneService;
