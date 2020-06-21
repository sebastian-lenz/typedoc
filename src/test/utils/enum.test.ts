import { deepStrictEqual as equal, throws } from 'assert';
import { makeToKindArray, makeToKindString } from '../../lib/utils/enum';

enum TestEnum {
    Foo = 1,
    Bar = 2,
    FooBar = 4
}

describe('Enum utils', () => {
    describe('makeToKindArray', () => {
        const toKindArray = makeToKindArray(TestEnum.FooBar);

        it('works with no values', () => {
            equal(toKindArray(0), []);
        });

        it('works with a single value', () => {
            equal(toKindArray(TestEnum.Bar), TestEnum.Bar);
        });

        it('works with multiple values', () => {
            equal(toKindArray(TestEnum.Bar | TestEnum.FooBar), [TestEnum.Bar, TestEnum.FooBar]);
        });
    });

    describe('makeToKindString', () => {
        const toKindString = makeToKindString(TestEnum);

        it('works when given a real kind', () => {
            equal(toKindString(TestEnum.Foo), 'foo');
        });

        it('lower cases only the first character', () => {
            equal(toKindString(TestEnum.FooBar), 'fooBar');
        });

        it('throws if a non-exact kind is provided', () => {
            throws(() => toKindString(TestEnum.Foo | TestEnum.Bar));
        });

        it('throws if a kind out of bounds is provided', () => {
            throws(() => toKindString(TestEnum.FooBar * 2));
        });
    });
});
