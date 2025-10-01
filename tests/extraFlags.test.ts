import mo from '../src/versions/moc';

const sourceWithDeprecation = `
module A {
    /// @deprecated do not use foo anymore
    public let foo = 5;
};

ignore A.foo;
`;

describe('extra moc flags', () => {
    beforeAll(() => {
        mo.loadPackage(require('../packages/latest/base.json'));
        mo.loadPackage(require('../packages/latest/core.json'));
    });

    function testDeprecation(flags: string[], expectedSeverity: number) {
        const file = mo.file('deprecated.mo');
        file.write(sourceWithDeprecation);

        mo.setExtraFlags(flags);

        const diagnostics = file.check();
        expect(diagnostics.length).toBe(1);
        expect(diagnostics[0].code).toBe('M0154');
        expect(diagnostics[0].severity).toBe(expectedSeverity);
    }

    test('should show M0154 as warning without extra flags', async () => {
        testDeprecation([], 2);
    });

    test('should have no M0154 warnings with -E=M0154 (converted to errors)', async () => {
        testDeprecation(['-E=M0154'], 1);
    });
});
