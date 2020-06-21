import { deepStrictEqual as equal } from 'assert';
import { EventEmitter } from '../../lib/utils/event';

describe('EventEmitter', () => {
    it('Works in simple cases', async () => {
        const emitter = new EventEmitter<{ a: [] }>();

        let calls = 0;
        emitter.on('a', () => { calls++; });
        equal(calls, 0);

        await emitter.emit('a');
        equal(calls, 1);
        await emitter.emit('a');
        equal(calls, 2);
    });

    it('Works with once', async () => {
        const emitter = new EventEmitter<{ a: [] }>();

        let calls = 0;
        emitter.once('a', () => { calls++; });
        equal(calls, 0);

        await emitter.emit('a');
        equal(calls, 1);
        await emitter.emit('a');
        equal(calls, 1);
    });

    it('Allows removing listeners', async () => {
        const emitter = new EventEmitter<{ a: [] }>();

        let calls = 0;
        const listener = () => { calls++; };
        emitter.once('a', listener);
        emitter.off('a', listener);
        equal(calls, 0);

        await emitter.emit('a');
        equal(calls, 0);
    });

    it('Works correctly with missing listeners', async () => {
        const emitter = new EventEmitter<{ a: [] }>();

        let calls = 0;
        const listener = () => { calls++; };
        emitter.on('a', () => { calls++; });
        emitter.off('a', listener);

        await emitter.emit('a');
        equal(calls, 1);
    });

    it('Works if a listener is removed while emitting', async () => {
        const emitter = new EventEmitter<{ a: [] }>();

        let calls = 0;
        emitter.on('a', function rem() {
            calls++;
            emitter.off('a', rem);
        });
        emitter.on('a', () => { calls++; });
        equal(calls, 0);

        await emitter.emit('a');
        equal(calls, 2);
        await emitter.emit('a');
        equal(calls, 3);
    });
});
