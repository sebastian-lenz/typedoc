import { deepStrictEqual as equal, ok } from 'assert';
import { GitHubHost, BitbucketHost } from '../../lib/plugins/sources/hosts';

describe('Sources plugin', () => {
    describe('GitHubHost', () => {
        it('works with https remotes', () => {
            const remote = 'https://github.com/project/repository.git';
            ok(GitHubHost.supports(remote));
            const host = new GitHubHost('', remote, ['readme.md'], 'master');
            equal(host.createLink('readme.md', 10),
                'https://github.com/project/repository/blob/master/readme.md#L10');
        });

        it('works with ssh remotes', () => {
            const remote = 'git@github.acme.com:project/repository.git';
            ok(GitHubHost.supports(remote));
            const host = new GitHubHost('', remote, ['readme.md'], 'master');
            equal(host.createLink('readme.md', 10),
                'https://github.acme.com/project/repository/blob/master/readme.md#L10');
        });
    });

    describe('BitbucketHost', () => {
        it('works with https remotes', () => {
            const remote = 'https://user@bitbucket.org/project/repository.git';
            ok(BitbucketHost.supports(remote));
            const host = new BitbucketHost('', remote, ['readme.md'], 'master');
            equal(host.createLink('readme.md', 10),
                'https://bitbucket.org/project/repository/src/master/readme.md#lines-10');
        });

        it('works with ssh remotes', () => {
            const remote = 'git@bitbucket.org:project/repository.git';
            ok(BitbucketHost.supports(remote));
            const host = new BitbucketHost('', remote, ['readme.md'], 'master');
            equal(host.createLink('readme.md', 10),
                'https://bitbucket.org/project/repository/src/master/readme.md#lines-10');
        });
    });
});
