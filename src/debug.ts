export interface DebugConfig {
    onStdout?(data: string): void;
}

export async function debugWASI(
    wasm: Uint8Array,
    config: DebugConfig = undefined,
) {
    let module = await WebAssembly.compile(wasm);
    const wasiPolyfill = createWasiPolyfill(config || {});
    const instance = await runWasmModule(module, wasiPolyfill);

    return {
        hexdump(offset?: number, length?: number): string {
            return hexdump(
                (instance.exports.memory as WebAssembly.Memory).buffer,
                offset,
                length,
            );
        },
        show(offset: number) {
            const memory = instance.exports.memory as WebAssembly.Memory;
            const view = new DataView(memory.buffer);
            return decode(view, offset);
        },
    };
}

function createWasiPolyfill(config: DebugConfig) {
    let moduleInstance: WebAssembly.Instance | undefined;
    let memory: WebAssembly.Memory | undefined;

    const WASI_ESUCCESS = 0;
    const WASI_EBADF = 8;
    const WASI_EINVAL = 28;
    const WASI_ENOSYS = 52;

    const WASI_STDOUT_FILENO = 1;

    function setModuleInstance(instance: WebAssembly.Instance) {
        moduleInstance = instance;
        memory = moduleInstance.exports.memory as WebAssembly.Memory;
    }

    function getModuleMemoryDataView() {
        // call this any time you'll be reading or writing to a module's memory
        // the returned DataView tends to be dissaociated with the module's memory buffer at the will of the WebAssembly engine
        // cache the returned DataView at your own peril!!

        return new DataView(memory.buffer);
    }

    function fd_prestat_get(fd: number, bufPtr: number) {
        return WASI_EBADF;
    }

    function fd_prestat_dir_name(fd: number, pathPtr: number, pathLen: number) {
        return WASI_EINVAL;
    }

    function environ_sizes_get(environCount: number, environBufSize: number) {
        const view = getModuleMemoryDataView();

        view.setUint32(environCount, 0, !0);
        view.setUint32(environBufSize, 0, !0);

        return WASI_ESUCCESS;
    }

    function environ_get(environ: number, environBuf: any) {
        return WASI_ESUCCESS;
    }

    function args_sizes_get(argc: number, argvBufSize: number) {
        const view = getModuleMemoryDataView();

        view.setUint32(argc, 0, !0);
        view.setUint32(argvBufSize, 0, !0);

        return WASI_ESUCCESS;
    }

    function args_get(argv: any, argvBuf: any) {
        return WASI_ESUCCESS;
    }

    function fd_fdstat_get(fd: number, bufPtr: number) {
        const view = getModuleMemoryDataView();

        view.setUint8(bufPtr, fd);
        view.setUint16(bufPtr + 2, 0, !0);
        view.setUint16(bufPtr + 4, 0, !0);

        function setBigUint64(
            byteOffset: any,
            value: number,
            littleEndian: boolean,
        ) {
            const lowWord = value;
            const highWord = 0;

            view.setUint32(littleEndian ? 0 : 4, lowWord, littleEndian);
            view.setUint32(littleEndian ? 4 : 0, highWord, littleEndian);
        }

        setBigUint64(bufPtr + 8, 0, !0);
        setBigUint64(bufPtr + 8 + 8, 0, !0);

        return WASI_ESUCCESS;
    }

    function fd_write(
        fd: number,
        iovs: number,
        iovsLen: number,
        nwritten: number,
    ) {
        const view = getModuleMemoryDataView();

        let written = 0;
        const bufferBytes: number[] = [];

        function getiovs(iovs: number, iovsLen: number) {
            // iovs* -> [iov, iov, ...]
            // __wasi_ciovec_t {
            //   void* buf,
            //   size_t buf_len,
            // }
            const buffers = Array.from(
                {
                    length: iovsLen,
                },
                function (_, i) {
                    const ptr = iovs + i * 8;
                    const buf = view.getUint32(ptr, !0);
                    const bufLen = view.getUint32(ptr + 4, !0);

                    return new Uint8Array(memory.buffer, buf, bufLen);
                },
            );

            return buffers;
        }

        const buffers = getiovs(iovs, iovsLen);

        function writev(iov: any) {
            let b;
            for (b = 0; b < iov.byteLength; b++) {
                bufferBytes.push(iov[b]);
            }
            written += b;
        }

        buffers.forEach(writev);

        // if (fd === WASI_STDOUT_FILENO) {
        //     document.getElementById('output').value +=
        //         String.fromCharCode.apply(null, bufferBytes);
        // }
        // console.log('[output]', String.fromCharCode(...bufferBytes));

        const output = String.fromCharCode(...bufferBytes);
        config.onStdout?.(output);

        view.setUint32(nwritten, written, true);

        return WASI_ESUCCESS;
    }

    function poll_oneoff(
        sin: any,
        sout: any,
        nsubscriptions: any,
        nevents: any,
    ) {
        return WASI_ENOSYS;
    }

    function proc_exit(rval: any) {
        return WASI_ENOSYS;
    }

    function fd_close(fd: number) {
        return WASI_ENOSYS;
    }

    function fd_seek(
        fd: number,
        offset: number,
        whence: any,
        newOffsetPtr: number,
    ) {}

    return {
        setModuleInstance,
        environ_sizes_get,
        args_sizes_get,
        fd_prestat_get,
        fd_fdstat_get,
        fd_write,
        fd_prestat_dir_name,
        environ_get,
        args_get,
        poll_oneoff,
        proc_exit,
        fd_close,
        fd_seek,
    };
}

let motokoSections = null;
let motokoHashMap: Record<string | number, any> = null;

async function runWasmModule(
    module: WebAssembly.Module,
    wasiPolyfill: {
        setModuleInstance: (instance: WebAssembly.Instance) => void;
    },
) {
    const moduleImports = {
        wasi_unstable: wasiPolyfill,
        env: {},
    };

    motokoSections = WebAssembly.Module.customSections(module, 'motoko');
    motokoHashMap =
        motokoSections.length > 0 ? decodeMotokoSection(motokoSections) : null;

    const instance = await WebAssembly.instantiate(module, moduleImports);
    wasiPolyfill.setModuleInstance(instance);

    (instance.exports._start as () => void)();

    return instance;
}

// From https://github.com/bma73/hexdump-js, with fixes
const hexdump = (() => {
    const _fillUp = (
        value: string | any[],
        count: number,
        fillWith: string,
    ) => {
        let l = count - value.length;
        let ret = '';
        while (--l > -1) ret += fillWith;
        return ret + value;
    };
    return (arrayBuffer: ArrayBufferLike, offset?: number, length?: number) => {
        offset = offset || 0;
        length = length || arrayBuffer.byteLength;

        const view = new DataView(arrayBuffer);
        let out =
            _fillUp('Offset', 8, ' ') +
            '  00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n';
        let row = '';
        for (let i = 0; i < length; i += 16) {
            row += _fillUp(offset.toString(16).toUpperCase(), 8, '0') + '  ';
            const n = Math.min(16, length - offset);
            let string = '';
            for (let j = 0; j < 16; ++j) {
                if (j < n) {
                    const value = view.getUint8(offset);
                    string +=
                        value >= 32 && value < 0x7f
                            ? String.fromCharCode(value)
                            : '.';
                    row +=
                        _fillUp(value.toString(16).toUpperCase(), 2, '0') + ' ';
                    offset++;
                } else {
                    row += '   ';
                    string += ' ';
                }
            }
            row += ' ' + string + '\n';
        }
        out += row;
        return out;
    };
})();

// function updateHexDump() {
//     document.getElementById('memory').value = 'Loading…';
//     if (memory) {
//         document.getElementById('memory').value = hexdump(memory.buffer);
//     } else {
//         document.getElementById('memory').value = 'No memory yet';
//     }
// }

// Decoding Motoko heap objects

function getUint32(
    view: { getUint32: (arg0: any, arg1: boolean) => any },
    p: any,
) {
    return view.getUint32(p, true);
}

function decodeLabel(hash: string | number) {
    return motokoHashMap?.[hash] ?? hash;
}

function decodeOBJ(view: any, p: number) {
    const size = getUint32(view, p + 4);
    const m: Record<any, any> = {};
    let h = getUint32(view, p + 8) + 1; //unskew
    let q = p + 12;
    for (let i = 0; i < size; i++) {
        const hash = getUint32(view, h);
        const lab = decodeLabel(hash);
        m[lab] = decode(view, getUint32(view, q));
        q += 4;
        h += 4;
    }
    return m;
}

function decodeVARIANT(view: any, p: number) {
    const m: Record<any, any> = {};
    const hash = getUint32(view, p + 4);
    const lab = '#' + decodeLabel(hash);
    m[lab] = decode(view, getUint32(view, p + 8));
    return m;
}

// stolen from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
const bigThirtyTwo = BigInt(32),
    bigZero = BigInt(0);
function getUint64BigInt(
    dataview: { getUint32: (arg0: number, arg1: boolean) => number },
    byteOffset: number,
    littleEndian: boolean = false,
) {
    // split 64-bit number into two 32-bit (4-byte) parts
    const left = BigInt(
        dataview.getUint32(byteOffset | 0, !!littleEndian) >>> 0,
    );
    const right = BigInt(
        dataview.getUint32(((byteOffset | 0) + 4) | 0, !!littleEndian) >>> 0,
    );

    // combine the two 32-bit values and return
    return littleEndian
        ? (right << bigThirtyTwo) | left
        : (left << bigThirtyTwo) | right;
}

function decodeBITS64(
    view: DataView,
    p: number,
    littleEndian: boolean = false,
) {
    return getUint64BigInt(view, p + 4, littleEndian);
}

function decodeBITS32(view: DataView, p: number) {
    return getUint32(view, p + 4);
}

function decodeARRAY(view: DataView, p: number) {
    const size = getUint32(view, p + 4);
    const a = new Array(size);
    let q = p + 8;
    for (let i = 0; i < size; i++) {
        a[i] = decode(view, getUint32(view, q));
        q += 4;
    }
    return a;
}

function decodeSOME(view: DataView, p: number): { '?': any } {
    return { '?': decode(view, getUint32(view, p + 4)) };
}

function decodeNULL(view: DataView, p: any): null {
    return null; // Symbol(`null`)?
}

function decodeMUTBOX(view: DataView, p: number): { mut: any } {
    return { mut: decode(view, getUint32(view, p + 4)) };
}

function decodeOBJ_IND(view: DataView, p: number): { ind: any } {
    return { ind: decode(view, getUint32(view, p + 4)) };
}

function decodeCONCAT(view: DataView, p: number): [any, any] {
    const q = p + 8; // skip n_bytes
    return [
        decode(view, getUint32(view, q)),
        decode(view, getUint32(view, q + 4)),
    ];
}

function decodeBLOB(view: DataView, p: number) {
    const size = getUint32(view, p + 4);
    const a = new Uint8Array(view.buffer, p + 8, size);
    try {
        const textDecoder = new TextDecoder('utf-8', { fatal: true }); // hoist and reuse?
        return textDecoder.decode(a);
    } catch (err) {
        return a;
    }
}

const bigInt28 = BigInt(28);
const mask = 2 ** 28 - 1;
function decodeBIGINT(view: DataView, p: number) {
    const size = getUint32(view, p + 4);
    const sign = getUint32(view, p + 12);
    let a = BigInt(0);
    const q = p + 20;
    for (let r = q + 4 * (size - 1); r >= q; r -= 4) {
        a = a << bigInt28;
        a += BigInt(getUint32(view, r) & mask);
    }
    if (sign > 0) {
        return -a;
    }
    return a;
}

// https://en.wikipedia.org/wiki/LEB128
function getULEB128(view: DataView, p: number) {
    let result = 0;
    let shift = 0;
    while (true) {
        const byte = view.getUint8(p);
        p += 1;
        result |= (byte & 127) << shift;
        if ((byte & 128) === 0) break;
        shift += 7;
    }
    return [result, p];
}

function hashLabel(label: string) {
    // assumes label is ascii
    let s = 0;
    for (let i = 0; i < label.length; i++) {
        const c = label.charCodeAt(i);
        // console.assert('non-ascii label', c < 128);
        if (c < 128) {
        }
        s = s * 223 + label.charCodeAt(i);
    }
    return (2 ** 31 - 1) & s;
}

function decodeMotokoSection(customSections: string | any[]) {
    const m: Record<number, string> = {};
    if (customSections.length === 0) return m;
    const view = new DataView(customSections[0]);
    if (view.byteLength === 0) return m;
    const id = view.getUint8(0);
    if (!(id === 0)) {
        return m;
    }
    const [_sec_size, p] = getULEB128(view, 1); // always 5 bytes as back patched
    let [cnt, p1] = getULEB128(view, 6);
    while (cnt > 0) {
        const [size, p2] = getULEB128(view, p1);
        const a = new Uint8Array(view.buffer, p2, size);
        p1 = p2 + size;
        const textDecoder = new TextDecoder('utf-8', { fatal: true }); // hoist and reuse?
        const id = textDecoder.decode(a);
        const hash = hashLabel(id);
        m[hash] = id;
        cnt -= 1;
    }
    return m;
}

function decode(view: DataView, v: number) {
    if ((v & 1) === 0) return v >> 1;
    const p = v + 1;
    const tag = getUint32(view, p);
    switch (tag) {
        case 1:
            return decodeOBJ(view, p);
        case 2:
            return decodeOBJ_IND(view, p);
        case 3:
            return decodeARRAY(view, p);
        //    case 4 : unused?
        case 5:
            return decodeBITS64(view, p);
        case 6:
            return decodeMUTBOX(view, p);
        case 7:
            return '<CLOSURE>';
        case 8:
            return decodeSOME(view, p);
        case 9:
            return decodeVARIANT(view, p);
        case 10:
            return decodeBLOB(view, p);
        case 11:
            return '<FWD_PTR>';
        case 12:
            return decodeBITS32(view, p);
        case 13:
            return decodeBIGINT(view, p);
        case 14:
            return decodeCONCAT(view, p);
        case 15:
            return decodeNULL(view, p);
        default:
            return { address: p, tag: tag };
    }
}
