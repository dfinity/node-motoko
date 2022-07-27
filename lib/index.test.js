const Motoko = require('.');

const actorMo = ```
actor Main {
    public func test() : async Nat {
        123
    }
}
```;

test('moc.js', () => {
    expect(true).toEqual(true);

    console.log(Motoko.parseSyntaxTree(actorMo));
});
