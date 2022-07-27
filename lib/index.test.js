'use strict'

const Motoko = require('.');

const actorMo = `
actor Main {
    public func test() : async Nat {
        123
    }
}
`;

test('placeholder', () => {
    expect(true).toEqual(true); // placeholder

    console.log(Motoko.parse(actorMo));
});
