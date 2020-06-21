import * as assert from 'assert';
import * as shell from 'shelljs';
import { dirname, join, posix } from 'path';

export abstract class Host {
    static HOST_REGEX = /^/;

    /**
     * Check if this host builder supports the given remote.
     * @param remote
     */
    static supports(remote: string): boolean {
        return this.HOST_REGEX.test(remote);
    }

    private _files: Set<string>;

    constructor(files: string[]) {
        this._files = new Set(files);
    }

    /**
     * Check if the given file is within this host.
     * @param file the absolute path to the file
     */
    containsFile(file: string): boolean {
        return this._files.has(file);
    }

    /**
     * Only called if {@link containsFile} returns true.
     * @param file the absolute path to the file
     */
    abstract createLink(file: string, line: number): string;
}

/**
 * Create links to files in GitHub repositories.
 *
 * Handles remotes in the format:
 * - https://github.com/project/repository.git
 * - git@github.company.com:project/repository.git
 */
export class GitHubHost extends Host {
    static HOST_REGEX = /(github(?:\.[a-z]+)*\.com)[:\/]([\w-]+)\/([\w-]+)/;

    private hostname: string;
    private project: string;
    private repository: string;

    constructor(private repoRoot: string, remote: string, files: string[], private gitRevision: string) {
        super(files);
        const match = remote.match(GitHubHost.HOST_REGEX);
        assert(match);
        this.hostname = match[1];
        this.project = match[2];
        this.repository = match[3];
    }

    createLink(file: string, line: number): string {
        return [
            `https://${this.hostname}`,
            this.project,
            this.repository,
            'blob',
            this.gitRevision,
            `${posix.relative(this.repoRoot, file)}#L${line}`
        ].join('/');
    }
}

/**
 * Create links to files in Bitbucket repositories.
 *
 * Handles remotes in the format:
 * - git@bitbucket.org:project/repository.git
 * - https://username@bitbucket.org/project/repository.git
 */
export class BitbucketHost extends Host {
    static HOST_REGEX = /@bitbucket.org[\/:]([\w-]+)\/([\w-]+)/;

    private repository: string;
    private project: string;

    constructor(private repoRoot: string, remote: string, files: string[], private gitRevision: string) {
        super(files);
        const match = remote.match(BitbucketHost.HOST_REGEX);
        assert(match);
        this.project = match[1];
        this.repository = match[2];
    }

    createLink(file: string, line: number): string {
        return [
            'https://bitbucket.org',
            this.project,
            this.repository,
            'src',
            this.gitRevision,
            `${posix.relative(this.repoRoot, file)}#lines-${line}`
        ].join('/');
    }
}

const HOST_BUILDERS: {
    new (repo: string, remote: string, files: string[], revision: string): Host
    supports(remote: string): boolean
}[] = [
    GitHubHost,
    BitbucketHost
];

export class HostLinkResolver {
    constructor(private gitRemote: string, private gitRevision: string) {}

    private hosts: Host[] = [];
    // Files known not to have a link
    private ignored = new Set<string>();

    tryGetUrl(file: string, line: number): string | undefined {
        if (this.ignored.has(file)) { return; }

        let host = this.hosts.find(host => host.containsFile(file));
        if (host) {
            return host.createLink(file, line);
        }

        host = this._tryCreateHost(file);
        if (host) {
            return host.createLink(file, line);
        }

        this.ignored.add(file);
    }

    private _tryCreateHost(file: string): Host | undefined {
        shell.pushd(dirname(file));
        const repoRoot = shell.exec(`git rev-parse --show-toplevel`);
        shell.popd();
        if (repoRoot.code !== 0) { return; } // Not a git repository

        shell.pushd(repoRoot);
        const remote = shell.exec(`git remote get-url ${this.gitRemote}`);
        if (remote.code !== 0) {
            shell.popd();
            return; // Remote does not exist.
        }
        // Shouldn't ever fail.
        const files = shell.exec('git ls-files').split('\n')
            .map(file => join(repoRoot.trim(), file));

        shell.popd();

        for (const builder of HOST_BUILDERS) {
            if (builder.supports(remote)) {
                return new builder(repoRoot.trim(), remote.trim(), files, this.gitRevision);
            }
        }
    }
}
