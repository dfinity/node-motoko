const textDecoder = new TextDecoder();

/// Convert an ASCII string from `js_of_ocaml` to a UTF-8 string.
export const asciiToUtf8 = (text: string): string => {
    return textDecoder.decode(
        Uint8Array.from({ length: text.length }).map((_, i) =>
            text.charCodeAt(i),
        ),
    );
};
