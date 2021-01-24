export const a = 1;

/**
 * Will not be included in mod2
 */
export default function () {}

export const gh1475 = {
    get getIt(): number {
        return 1;
    },
    set setIt(n: number) {},

    get both(): string {
        return "";
    },
    set both(x: string) {},
};
