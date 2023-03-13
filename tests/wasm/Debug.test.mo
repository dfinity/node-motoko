import { debugPrint = print } "mo:⛔";

module Module {
    public let value = 123;
};

print("value = " # debug_show Module.value);
