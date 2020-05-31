// import { deepStrictEqual as equal } from 'assert';
// import { LegendBuilder } from '../lib/output/plugins/LegendPlugin';

// describe('LegendBuilder', function () {
//     it('returns empty items when no css classes are registered', function () {
//         const builder = new LegendBuilder();
//         const results = builder.build().map(items => items.map(item => item.name));

//         equal(results, []);
//     });

//     it('returns single item list when common css classes are registered', function () {
//         const builder = new LegendBuilder();
//         builder.registerCssClasses(['tsd-kind-namespace']);
//         const results = builder.build().map(items => items.map(item => item.name));

//         equal(results, [['Namespace']]);
//     });

//     it('returns single item list with multiple items when common css classes are registered', function () {
//         const builder = new LegendBuilder();
//         builder.registerCssClasses(['tsd-kind-namespace']);
//         builder.registerCssClasses(['tsd-kind-function']);
//         const results = builder.build().map(items => items.map(item => item.name));

//         equal(results, [['Namespace', 'Function']]);
//     });

//     it('returns single item list with multiple items when multiple css classes are registered', function () {
//         const builder = new LegendBuilder();
//         builder.registerCssClasses(['tsd-kind-namespace']);
//         builder.registerCssClasses(['tsd-kind-function']);
//         builder.registerCssClasses(['tsd-kind-function', 'tsd-has-type-parameter']);
//         const results = builder.build().map(items => items.map(item => item.name));

//         equal(results, [['Namespace', 'Function', 'Function with type parameter']]);
//     });

//     it('returns multiple item list when common css classes are registered from different groups', function () {
//         const builder = new LegendBuilder();
//         builder.registerCssClasses(['tsd-kind-namespace']);
//         builder.registerCssClasses(['tsd-kind-accessor', 'tsd-parent-kind-class', 'tsd-is-inherited']);
//         builder.registerCssClasses(['tsd-kind-property', 'tsd-parent-kind-class', 'tsd-is-private']);
//         builder.registerCssClasses(['tsd-kind-accessor', 'tsd-parent-kind-class', 'tsd-is-private']);
//         const results = builder.build().map(items => items.map(item => item.name));

//         equal(results, [['Namespace'], ['Inherited accessor'], ['Private property', 'Private accessor']]);
//     });

//     it('returns single item when includes ignored classes', function () {
//         const builder = new LegendBuilder();
//         builder.registerCssClasses(['tsd-kind-class', 'tsd-parent-kind-module']);
//         const results = builder.build().map(items => items.map(item => item.name));

//         equal(results, [['Class']]);
//     });
// });
