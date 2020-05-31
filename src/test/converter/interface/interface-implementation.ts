export module Forms {
    /**
     * Function signature of an event listener callback
     */
    export interface EventListener<T> {
        (parameter: T): any;
    }

    /**
     * Encapsulates a subscription to an event dispatcher, and allows for unsubscribing
     */
    export interface SubscriptionInt<T> {
        listener: EventListener<T>;
        priority: number;
        filter: any;

        /**
         * Remove this subscription from its dispatcher
         */
        unsubscribe(): void;
    }

    export class Subscription<V> implements SubscriptionInt<V> {
        constructor(public listener: EventListener<V>, public filter: any, public priority: number, public dispatcher: EventDispatcher<V>) { }

        unsubscribe(): void { }
    }

    /**
     * The main interface of the event system.
     * An IEventDispatcher is an object that keeps a list of listeners, and sends dispatches events of a certain type to them.
     * This might otherwise be known as a Signal.
     */
    export interface EventDispatcherInt<U> {
        add(listener: EventListener<U>, filter?: any, priority?: number): SubscriptionInt<U>;
        remove(subscription: SubscriptionInt<U>): void;
        dispatch(parameter: U): boolean;
        clear(): void;
        hasListeners(): boolean;
    }

    /**
     * Implementation of IEventDispatcher
     * @see IEventDispatcher
     */
    export class EventDispatcher<T> implements EventDispatcherInt<T> {
        private subscriptions: SubscriptionInt<T>[];

        add(listener: EventListener<T>, filter: any= null, priority: number = 0): SubscriptionInt<T> {
            return new Subscription<T>(listener, filter, priority, this);
        }

        remove(subscription: SubscriptionInt<T>): void { }

        dispatch(event: T): boolean {
            return false;
        }

        clear(): void { }

        hasListeners(): boolean {
            return false;
        }
    }
}
