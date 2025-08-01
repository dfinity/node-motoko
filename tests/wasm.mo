import Int "mo:base/Int";
import OrderedSet "mo:base/OrderedSet";
import Iter "mo:base/Iter";

persistent actor {
    public func sortAndRemoveDuplicates(array : [Int]) : async [Int] {
        let Set = OrderedSet.Make<Int>(Int.compare);
        let set = Set.fromIter(Iter.fromArray(array));
        Iter.toArray(Set.vals(set));
    };

    public func run() : async () {
        assert ((await sortAndRemoveDuplicates([])) == []);
        assert ((await sortAndRemoveDuplicates([1])) == [1]);
        assert ((await sortAndRemoveDuplicates([1, 2, 3])) == [1, 2, 3]);
        assert ((await sortAndRemoveDuplicates([3, 2, 1])) == [1, 2, 3]);
        assert ((await sortAndRemoveDuplicates([2, 2, 1, 3, 3])) == [1, 2, 3]);
        assert ((await sortAndRemoveDuplicates([1, 1, 1, 1, 1])) == [1]);
        assert ((await sortAndRemoveDuplicates([1, -1, 1, -1, 1])) == [-1, 1]);
        assert ((await sortAndRemoveDuplicates([-2, -3, -2, -4, -1, -3, -3])) == [-4, -3, -2, -1]);
    };
};
