import { deepStrictEqual as equal } from "assert";
import { EventHooks } from "../../lib/utils/hooks";

describe("EventHooks", () => {
  it("Works in simple cases", () => {
    const emitter = new EventHooks<{ a: [] }, void>();

    let calls = 0;
    emitter.on("a", () => {
      calls++;
    });
    equal(calls, 0);

    emitter.emit("a");
    equal(calls, 1);
    emitter.emit("a");
    equal(calls, 2);
  });

  it("Works with once", () => {
    const emitter = new EventHooks<{ a: [] }, void>();

    let calls = 0;
    emitter.once("a", () => {
      calls++;
    });
    equal(calls, 0);

    emitter.emit("a");
    equal(calls, 1);
    emitter.emit("a");
    equal(calls, 1);
  });

  it("Allows removing listeners", () => {
    const emitter = new EventHooks<{ a: [] }, void>();

    let calls = 0;
    const listener = () => {
      calls++;
    };
    emitter.once("a", listener);
    emitter.off("a", listener);
    equal(calls, 0);

    emitter.emit("a");
    equal(calls, 0);
  });

  it("Works correctly with missing listeners", () => {
    const emitter = new EventHooks<{ a: [] }, void>();

    let calls = 0;
    const listener = () => {
      calls++;
    };
    emitter.on("a", () => {
      calls++;
    });
    emitter.off("a", listener);

    emitter.emit("a");
    equal(calls, 1);
  });

  it("Works if a listener is removed while emitting", () => {
    const emitter = new EventHooks<{ a: [] }, void>();

    let calls = 0;
    emitter.on("a", function rem() {
      calls++;
      emitter.off("a", rem);
    });
    emitter.on("a", () => {
      calls++;
    });
    equal(calls, 0);

    emitter.emit("a");
    equal(calls, 2);
    emitter.emit("a");
    equal(calls, 3);
  });

  it("Collects the results of listeners", () => {
    const emitter = new EventHooks<{ a: [] }, number>();

    emitter.on("a", () => 1, 1);
    emitter.on("a", () => 2, 2);

    equal(emitter.emit("a"), [1, 2]);
  });

  it("Calls listeners in order", () => {
    const emitter = new EventHooks<{ a: [] }, number>();

    emitter.on("a", () => 1, 100);
    emitter.on("a", () => 2);

    equal(emitter.emit("a"), [2, 1]);
  });

  it("Has a working momento mechanism", () => {
    const emitter = new EventHooks<{ a: [] }, number>();

    emitter.on("a", () => 1);
    const momento = emitter.saveMomento();
    emitter.on("a", () => 2);

    equal(emitter.emit("a"), [1, 2]);

    emitter.restoreMomento(momento);
    equal(emitter.emit("a"), [1]);
  });
});
