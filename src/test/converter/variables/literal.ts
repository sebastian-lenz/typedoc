const x = "literal";
/**
 * An object literal.
 */
const objectLiteral = {
    valueZ: "foo",
    valueY: function () {
        return "foo";
    },
    valueX: {
        valueZ: "foo",
        valueY: (z: string) => {
            return { a: "test", b: z };
        },
        valueA: [100, 200, 300],
    },
    valueA: 100,
    valueB: true,
    [Symbol.toStringTag]: "computed",
    [x]: true,
    ["literal2"]: true,
};

/**
 * A typed literal without an initializer.
 */
export let typeLiteral: {
    valueZ: string;
    valueY: { (): string };
    valueX: {
        valueZ: string;
        valueY: { (z: string): { a: string; b: string } };
        valueA: number[];
    };
    valueA?: number;
    valueB?: boolean;
};

let onSuccess: any = function () {};
let onError: any = function () {};
let onFinally: any = function () {};

export const callbackReturn = {
    success: (successCallback: () => any) => {
        onSuccess = successCallback;
        return callbackReturn;
    },
    error: (errorCallback: () => any) => {
        onError = errorCallback;
        return callbackReturn;
    },
    finally: (finallyCallback: () => any) => {
        onFinally = finallyCallback;
        return callbackReturn;
    },
};

export { objectLiteral };

export const gh1475 = {
    get getIt(): number {
        return 1;
    },
    set setIt(n: number) {},
};
