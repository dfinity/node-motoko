// Temporary: browser debugging environment

'use strict';
const exports = {};
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : adopt(result.value).then(fulfilled, rejected);
            }
            step(
                (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
        });
    };
var __generator =
    (this && this.__generator) ||
    function (thisArg, body) {
        var _ = {
                label: 0,
                sent: function () {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: [],
            },
            f,
            y,
            t,
            g;
        return (
            (g = {
                next: verb(0),
                throw: verb(1),
                return: verb(2),
            }),
            typeof Symbol === 'function' &&
                (g[Symbol.iterator] = function () {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function (v) {
                return step([n, v]);
            };
        }
        function step(op) {
            if (f) throw new TypeError('Generator is already executing.');
            while (_)
                try {
                    if (
                        ((f = 1),
                        y &&
                            (t =
                                op[0] & 2
                                    ? y['return']
                                    : op[0]
                                    ? y['throw'] ||
                                      ((t = y['return']) && t.call(y), 0)
                                    : y.next) &&
                            !(t = t.call(y, op[1])).done)
                    )
                        return t;
                    if (((y = 0), t)) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (
                                !((t = _.trys),
                                (t = t.length > 0 && t[t.length - 1])) &&
                                (op[0] === 6 || op[0] === 2)
                            ) {
                                _ = 0;
                                continue;
                            }
                            if (
                                op[0] === 3 &&
                                (!t || (op[1] > t[0] && op[1] < t[3]))
                            ) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports.debugWASI = void 0;
function debugWASI(module, config) {
    if (config === void 0) {
        config = undefined;
    }
    return __awaiter(this, void 0, void 0, function () {
        var wasiPolyfill, instance;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!(module instanceof WebAssembly.Module))
                        return [3 /*break*/, 2];
                    return [4 /*yield*/, WebAssembly.compile(module)];
                case 1:
                    // Convert `BufferSource` to `Module`
                    module = _a.sent();
                    _a.label = 2;
                case 2:
                    wasiPolyfill = createWasiPolyfill(config || {});
                    return [4 /*yield*/, runWasmModule(module, wasiPolyfill)];
                case 3:
                    instance = _a.sent();
                    return [
                        2 /*return*/,
                        {
                            hexdump: function (offset, length) {
                                return hexdump(
                                    instance.exports.memory.buffer,
                                    offset,
                                    length,
                                );
                            },
                            show: function (offset) {
                                var memory = instance.exports.memory;
                                var view = new DataView(memory.buffer);
                                return decode(view, offset);
                            },
                        },
                    ];
            }
        });
    });
}
exports.debugWASI = debugWASI;
function createWasiPolyfill(config) {
    var moduleInstance;
    var memory;
    var WASI_ESUCCESS = 0;
    var WASI_EBADF = 8;
    var WASI_EINVAL = 28;
    var WASI_ENOSYS = 52;
    var WASI_STDOUT_FILENO = 1;
    function setModuleInstance(instance) {
        moduleInstance = instance;
        memory = moduleInstance.exports.memory;
    }
    function getModuleMemoryDataView() {
        // call this any time you'll be reading or writing to a module's memory
        // the returned DataView tends to be dissaociated with the module's memory buffer at the will of the WebAssembly engine
        // cache the returned DataView at your own peril!!
        return new DataView(memory.buffer);
    }
    function fd_prestat_get(fd, bufPtr) {
        return WASI_EBADF;
    }
    function fd_prestat_dir_name(fd, pathPtr, pathLen) {
        return WASI_EINVAL;
    }
    function environ_sizes_get(environCount, environBufSize) {
        var view = getModuleMemoryDataView();
        view.setUint32(environCount, 0, !0);
        view.setUint32(environBufSize, 0, !0);
        return WASI_ESUCCESS;
    }
    function environ_get(environ, environBuf) {
        return WASI_ESUCCESS;
    }
    function args_sizes_get(argc, argvBufSize) {
        var view = getModuleMemoryDataView();
        view.setUint32(argc, 0, !0);
        view.setUint32(argvBufSize, 0, !0);
        return WASI_ESUCCESS;
    }
    function args_get(argv, argvBuf) {
        return WASI_ESUCCESS;
    }
    function fd_fdstat_get(fd, bufPtr) {
        var view = getModuleMemoryDataView();
        view.setUint8(bufPtr, fd);
        view.setUint16(bufPtr + 2, 0, !0);
        view.setUint16(bufPtr + 4, 0, !0);
        function setBigUint64(byteOffset, value, littleEndian) {
            var lowWord = value;
            var highWord = 0;
            view.setUint32(littleEndian ? 0 : 4, lowWord, littleEndian);
            view.setUint32(littleEndian ? 4 : 0, highWord, littleEndian);
        }
        setBigUint64(bufPtr + 8, 0, !0);
        setBigUint64(bufPtr + 8 + 8, 0, !0);
        return WASI_ESUCCESS;
    }
    function fd_write(fd, iovs, iovsLen, nwritten) {
        var _a;
        var view = getModuleMemoryDataView();
        var written = 0;
        var bufferBytes = [];
        function getiovs(iovs, iovsLen) {
            // iovs* -> [iov, iov, ...]
            // __wasi_ciovec_t {
            //   void* buf,
            //   size_t buf_len,
            // }
            var buffers = Array.from(
                {
                    length: iovsLen,
                },
                function (_, i) {
                    var ptr = iovs + i * 8;
                    var buf = view.getUint32(ptr, !0);
                    var bufLen = view.getUint32(ptr + 4, !0);
                    return new Uint8Array(memory.buffer, buf, bufLen);
                },
            );
            return buffers;
        }
        var buffers = getiovs(iovs, iovsLen);
        function writev(iov) {
            var b;
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
        var output = String.fromCharCode.apply(String, bufferBytes);
        (_a = config.onStdout) === null || _a === void 0
            ? void 0
            : _a.call(config, output);
        view.setUint32(nwritten, written, true);
        return WASI_ESUCCESS;
    }
    function poll_oneoff(sin, sout, nsubscriptions, nevents) {
        return WASI_ENOSYS;
    }
    function proc_exit(rval) {
        return WASI_ENOSYS;
    }
    function fd_close(fd) {
        return WASI_ENOSYS;
    }
    function fd_seek(fd, offset, whence, newOffsetPtr) {}
    return {
        setModuleInstance: setModuleInstance,
        environ_sizes_get: environ_sizes_get,
        args_sizes_get: args_sizes_get,
        fd_prestat_get: fd_prestat_get,
        fd_fdstat_get: fd_fdstat_get,
        fd_write: fd_write,
        fd_prestat_dir_name: fd_prestat_dir_name,
        environ_get: environ_get,
        args_get: args_get,
        poll_oneoff: poll_oneoff,
        proc_exit: proc_exit,
        fd_close: fd_close,
        fd_seek: fd_seek,
    };
}
var motokoSections = null;
var motokoHashMap = null;
function runWasmModule(module, wasiPolyfill) {
    return __awaiter(this, void 0, void 0, function () {
        var moduleImports, instance;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    moduleImports = {
                        wasi_unstable: wasiPolyfill,
                        env: {},
                    };
                    motokoSections = WebAssembly.Module.customSections(
                        module,
                        'motoko',
                    );
                    motokoHashMap =
                        motokoSections.length > 0
                            ? decodeMotokoSection(motokoSections)
                            : null;
                    return [
                        4 /*yield*/,
                        WebAssembly.instantiate(module, moduleImports),
                    ];
                case 1:
                    instance = _a.sent();
                    wasiPolyfill.setModuleInstance(instance);
                    instance.exports._start();
                    return [2 /*return*/, instance];
            }
        });
    });
}
// From https://github.com/bma73/hexdump-js, with fixes
var hexdump = (function () {
    var _fillUp = function (value, count, fillWith) {
        var l = count - value.length;
        var ret = '';
        while (--l > -1) ret += fillWith;
        return ret + value;
    };
    return function (arrayBuffer, offset, length) {
        offset = offset || 0;
        length = length || arrayBuffer.byteLength;
        var view = new DataView(arrayBuffer);
        var out =
            _fillUp('Offset', 8, ' ') +
            '  00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n';
        var row = '';
        for (var i = 0; i < length; i += 16) {
            row += _fillUp(offset.toString(16).toUpperCase(), 8, '0') + '  ';
            var n = Math.min(16, length - offset);
            var string = '';
            for (var j = 0; j < 16; ++j) {
                if (j < n) {
                    var value = view.getUint8(offset);
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
function getUint32(view, p) {
    return view.getUint32(p, true);
}
function decodeLabel(hash) {
    var _a;
    return (_a =
        motokoHashMap === null || motokoHashMap === void 0
            ? void 0
            : motokoHashMap[hash]) !== null && _a !== void 0
        ? _a
        : hash;
}
function decodeOBJ(view, p) {
    var size = getUint32(view, p + 4);
    var m = {};
    var h = getUint32(view, p + 8) + 1; //unskew
    var q = p + 12;
    for (var i = 0; i < size; i++) {
        var hash = getUint32(view, h);
        var lab = decodeLabel(hash);
        m[lab] = decode(view, getUint32(view, q));
        q += 4;
        h += 4;
    }
    return m;
}
function decodeVARIANT(view, p) {
    var m = {};
    var hash = getUint32(view, p + 4);
    var lab = '#' + decodeLabel(hash);
    m[lab] = decode(view, getUint32(view, p + 8));
    return m;
}
// stolen from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
var bigThirtyTwo = BigInt(32),
    bigZero = BigInt(0);
function getUint64BigInt(dataview, byteOffset, littleEndian) {
    if (littleEndian === void 0) {
        littleEndian = false;
    }
    // split 64-bit number into two 32-bit (4-byte) parts
    var left = BigInt(dataview.getUint32(byteOffset | 0, !!littleEndian) >>> 0);
    var right = BigInt(
        dataview.getUint32(((byteOffset | 0) + 4) | 0, !!littleEndian) >>> 0,
    );
    // combine the two 32-bit values and return
    return littleEndian
        ? (right << bigThirtyTwo) | left
        : (left << bigThirtyTwo) | right;
}
function decodeBITS64(view, p, littleEndian) {
    if (littleEndian === void 0) {
        littleEndian = false;
    }
    return getUint64BigInt(view, p + 4, littleEndian);
}
function decodeBITS32(view, p) {
    return getUint32(view, p + 4);
}
function decodeARRAY(view, p) {
    var size = getUint32(view, p + 4);
    var a = new Array(size);
    var q = p + 8;
    for (var i = 0; i < size; i++) {
        a[i] = decode(view, getUint32(view, q));
        q += 4;
    }
    return a;
}
function decodeSOME(view, p) {
    return { '?': decode(view, getUint32(view, p + 4)) };
}
function decodeNULL(view, p) {
    return null; // Symbol(`null`)?
}
function decodeMUTBOX(view, p) {
    return { mut: decode(view, getUint32(view, p + 4)) };
}
function decodeOBJ_IND(view, p) {
    return { ind: decode(view, getUint32(view, p + 4)) };
}
function decodeCONCAT(view, p) {
    var q = p + 8; // skip n_bytes
    return [
        decode(view, getUint32(view, q)),
        decode(view, getUint32(view, q + 4)),
    ];
}
function decodeBLOB(view, p) {
    var size = getUint32(view, p + 4);
    var a = new Uint8Array(view.buffer, p + 8, size);
    try {
        var textDecoder = new TextDecoder('utf-8', { fatal: true }); // hoist and reuse?
        return textDecoder.decode(a);
    } catch (err) {
        return a;
    }
}
var bigInt28 = BigInt(28);
var mask = Math.pow(2, 28) - 1;
function decodeBIGINT(view, p) {
    var size = getUint32(view, p + 4);
    var sign = getUint32(view, p + 12);
    var a = BigInt(0);
    var q = p + 20;
    for (var r = q + 4 * (size - 1); r >= q; r -= 4) {
        a = a << bigInt28;
        a += BigInt(getUint32(view, r) & mask);
    }
    if (sign > 0) {
        return -a;
    }
    return a;
}
// https://en.wikipedia.org/wiki/LEB128
function getULEB128(view, p) {
    var result = 0;
    var shift = 0;
    while (true) {
        var byte = view.getUint8(p);
        p += 1;
        result |= (byte & 127) << shift;
        if ((byte & 128) === 0) break;
        shift += 7;
    }
    return [result, p];
}
function hashLabel(label) {
    // assumes label is ascii
    var s = 0;
    for (var i = 0; i < label.length; i++) {
        var c = label.charCodeAt(i);
        // console.assert('non-ascii label', c < 128);
        if (c < 128) {
        }
        s = s * 223 + label.charCodeAt(i);
    }
    return (Math.pow(2, 31) - 1) & s;
}
function decodeMotokoSection(customSections) {
    var m = {};
    if (customSections.length === 0) return m;
    var view = new DataView(customSections[0]);
    if (view.byteLength === 0) return m;
    var id = view.getUint8(0);
    if (!(id === 0)) {
        return m;
    }
    var _a = getULEB128(view, 1),
        _sec_size = _a[0],
        p = _a[1]; // always 5 bytes as back patched
    var _b = getULEB128(view, 6),
        cnt = _b[0],
        p1 = _b[1];
    while (cnt > 0) {
        var _c = getULEB128(view, p1),
            size = _c[0],
            p2 = _c[1];
        var a = new Uint8Array(view.buffer, p2, size);
        p1 = p2 + size;
        var textDecoder = new TextDecoder('utf-8', { fatal: true }); // hoist and reuse?
        var id_1 = textDecoder.decode(a);
        var hash = hashLabel(id_1);
        m[hash] = id_1;
        cnt -= 1;
    }
    return m;
}
function decode(view, v) {
    if ((v & 1) === 0) return v >> 1;
    var p = v + 1;
    var tag = getUint32(view, p);
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

WebAssembly.compileStreaming(fetch('Debug.test.wasm'), {})
    .then((module) => debugWASI(module, {}))
    .then((results) => console.log('DONE', results))
    .catch((err) => console.error(err));
