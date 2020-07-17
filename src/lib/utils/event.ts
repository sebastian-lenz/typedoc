/**
 * Simple, type safe, async event emitter class.
 *
 * @example
 * ```ts
 * const x = new EventEmitter<{ a: [string] }>()
 * x.on('a', a => a.repeat(123)) // ok
 * x.on('b', console.log) // error, 'b' is not assignable to 'a'
 * const y = new EventEmitter<{ a: [string]; [k: string]: unknown[] }>()
 * y.on('a', a => a.repeat(123)) // ok
 * // ok, any unknown events will contain an unknown number of arguments.
 * y.on('b', (...args: unknown[]) => console.log(...args))
 * ```
 */
export class EventEmitter<T extends Record<keyof T, unknown[]>> {
  // Function is *usually* not a good type to use, but here it lets us specify stricter
  // contracts in the methods while not casting everywhere this is used.
  private _listeners: Map<
    keyof T,
    { listener: Function; once?: boolean }[]
  > = new Map();

  /**
   * Starts listening to an event.
   * @param event the event to listen to.
   * @param listener function to be called when an this event is emitted.
   */
  on<K extends keyof T>(
    event: K,
    listener: (...args: T[K]) => void | Promise<void>
  ): void {
    const list = (this._listeners.get(event) || []).slice();
    list.push({ listener });
    this._listeners.set(event, list);
  }

  /**
   * Listens to a single occurrence of an event.
   * @param event the event to listen to.
   * @param listener function to be called when an this event is emitted.
   */
  once<K extends keyof T>(
    event: K,
    listener: (...args: T[K]) => void | Promise<void>
  ): void {
    const list = (this._listeners.get(event) || []).slice();
    list.push({ listener, once: true });
    this._listeners.set(event, list);
  }

  /**
   * Stops listening to an event.
   * @param event the event to stop listening to.
   * @param listener the function to remove from the listener array.
   */
  off<K extends keyof T>(
    event: K,
    listener: (...args: T[K]) => void | Promise<void>
  ): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      const index = listeners.findIndex((lo) => lo.listener === listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emits an event to all currently subscribed listeners.
   * @param event the event to emit.
   * @param args any arguments required for the event.
   */
  async emit<K extends keyof T>(event: K, ...args: T[K]): Promise<void> {
    const listeners = this._listeners.get(event)?.slice() || [];
    this._listeners.set(
      event,
      listeners.filter(({ once }) => !once)
    );
    await Promise.all(listeners.map(({ listener }) => listener(...args)));
  }
}
