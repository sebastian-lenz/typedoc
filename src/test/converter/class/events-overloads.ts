/**
 * Encapsulates some information for background http transfers.
 *
 * @see https://github.com/sebastian-lenz/typedoc/issues/136
 */
interface Test {
  /**
   * Subscribe for a general event by name.
   *
   * @event
   * @param event The name of the event to subscribe for.
   * @param handler The handler called when the event occurs.
   */
  on(event: string, handler: (e: any) => void): void;

  /**
   * Subscribe for error notifications.
   *
   * @event
   * @param event The name of the event to subscribe for.
   * @param handler A handler that will receive the error details
   */
  on(event: "error", handler: (e: any) => void): void;

  /**
   * Subscribe for progress notifications.
   *
   * @event
   * @param event The name of the event to subscribe for.
   * @param handler A handler that will receive a progress event with the current and expected total bytes
   */
  on(event: "progress", handler: (e: any) => void): void;

  /**
   * Subscribe for success notification.
   *
   * @event
   * @param event The name of the event to subscribe for.
   * @param handler A function that will be called with general event data upon successful completion
   */
  on(event: "complete", handler: (e: any) => void): void;
}

export {};
