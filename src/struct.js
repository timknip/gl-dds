/*
 * Started life as : http://code.google.com/p/jspack/
 *                   Copyright � 2008 Fair Oaks Labs, Inc.
 *                   All rights reserved.
 */
// XXX No bounds checking - caller should catch exceptions
// XXX If this needs to go faster, specialized code generation for each Struct - would fit very well with
//     v8 external buffer codegen.
// XXX Would typed arrays help here?
//

export var struct = {};

// Raw bytes
// XXX if src is a Buffer, then the returned slice will reference the orignal memory
var decodeArray = function (a, p, l) {
    return a.slice(p,p+l);
};
var encodeArray = function (a, p, v, l) {
    for (var i = 0; i < l; i++)
        a[p+i] = v[i];
};

// ASCII character strings
var decodeString = function (a, p, l) {
    for (var rv = new Array(l), i = 0; i < l; rv[i] = String.fromCharCode(a[p+i]), i++);
    return rv.join('');
};
var encodeString = function (a, p, v, l) {
    for (var t, i = 0; i < l; i++)
        a[p+i] = (t=v.charCodeAt(i))?t:0
};

// ASCII characters
var decodeChar = function (a, p) { return String.fromCharCode(a[p]); };
var encodeChar = function (a, p, v) { a[p] = v.charCodeAt(0); };

// Unsigned/signed bytes
var decodeUByte   = function(a, p) { return a[p];};
var encodeUByte   = function(a, p, v) { a[p] = v & 0xff; }

var decodeSByte   = function(a, p) { var r = a[p]; return (r & 0x80)?(r-0x100):r; };
var encodeSByte   = function(a, p, v) { if (v < 0) v += 0x100; a[p] = v & 0xff; }

// Little-endian (un)signed N-byte integers
var decodeUHalfLE = function(a, p) { return a[p] + a[p+1]*256; };
var decodeUWordLE = function(a, p) { return a[p] + a[p+1]*256 + a[p+2]*65536 + a[p+3]*16777216; };
var decodeSHalfLE = function(a, p) { var r = a[p] + a[p+1]*256; return (r & 0x8000)?(r-0x10000):r; };
var decodeSWordLE = function(a, p) { var r = a[p] + a[p+1]*256 + a[p+2]*65536 + a[p+3]*16777216; return (r & 0x80000000)?(r-0x100000000):r; };

var encodeUHalfLE = function(a, p, v) { a[p] = v & 0xff; a[p+1] = (v >> 8) & 0xff; }
var encodeUWordLE = function(a, p, v) { a[p] = v & 0xff; a[p+1] = (v >> 8) & 0xff; a[p+2] = (v >> 16) & 0xff;  a[p+3] = (v >> 24) & 0xff; }
var encodeSHalfLE = function(a, p, v) { if (v < 0) v += 0x10000; a[p] = v & 0xff; a[p+1] = (v >> 8) & 0xff; }
var encodeSWordLE = function(a, p, v) { if (v < 0) v += 0x100000000; a[p] = v & 0xff; a[p+1] = (v >> 8) & 0xff; a[p+2] = (v >> 16) & 0xff;  a[p+3] = (v >> 24) & 0xff; }

// Big-endian (un)signed N-byte integers
var decodeUHalfBE = function(a, p) { return a[p+1] + a[p]*256; };
var decodeUWordBE = function(a, p) { return a[p+3] + a[p+2]*256 + a[p+1]*65536 + a[p]*16777216; };
var decodeSHalfBE = function(a, p) { var r = a[p+1] + a[p]*256; return (r & 0x8000)?(r-0x10000):r; };
var decodeSWordBE = function(a, p) { var r = a[p+3] + a[p+2]*256 + a[p+1]*65536 + a[p]*16777216; return (r & 0x80000000)?(r-0x100000000):r; };

var encodeUHalfBE = function(a, p, v) { a[p+1] = v & 0xff; a[p] = (v >> 8) & 0xff; }
var encodeUWordBE = function(a, p, v) { a[p+3] = v & 0xff; a[p+2] = (v >> 8) & 0xff; a[p+1] = (v >> 16) & 0xff;  a[p] = (v >> 24) & 0xff; }
var encodeSHalfBE = function(a, p, v) { if (v < 0) v += 0x10000; a[p+1] = v & 0xff; a[p] = (v >> 8) & 0xff; }
var encodeSWordBE = function(a, p, v) { if (v < 0) v += 0x100000000; a[p+3] = v & 0xff; a[p+2] = (v >> 8) & 0xff; a[p+1] = (v >> 16) & 0xff;  a[p] = (v >> 24) & 0xff; }

// Little-endian N-bit IEEE 754 floating point
var decode754 = function (a, p) {
    var s, e, m, i, d, nBits, mLen, eLen, eBias, eMax;
    mLen = this.mLen, eLen = this.len*8-this.mLen-1, eMax = (1<<eLen)-1, eBias = eMax>>1;

    i = this.big?0:(this.len-1); d = this.big?1:-1; s = a[p+i]; i+=d; nBits = -7;
    for (e = s&((1<<(-nBits))-1), s>>=(-nBits), nBits += eLen; nBits > 0; e=e*256+a[p+i], i+=d, nBits-=8);
    for (m = e&((1<<(-nBits))-1), e>>=(-nBits), nBits += mLen; nBits > 0; m=m*256+a[p+i], i+=d, nBits-=8);

    switch (e) {
    case 0:
        // Zero, or denormalized number
        e = 1-eBias;
        break;
    case eMax:
        // NaN, or +/-Infinity
        return m?NaN:((s?-1:1)*Infinity);
    default:
        // Normalized number
        m = m + Math.pow(2, mLen);
        e = e - eBias;
        break;
    }
    return (s?-1:1) * m * Math.pow(2, e-mLen);
};
var encode754 = function (a, p, v) {
    var s, e, m, i, d, c, mLen, eLen, eBias, eMax;
    mLen = this.mLen, eLen = this.len*8-this.mLen-1, eMax = (1<<eLen)-1, eBias = eMax>>1;

    s = v<0?1:0;
    v = Math.abs(v);
    if (isNaN(v) || (v == Infinity)) {
        m = isNaN(v)?1:0;
        e = eMax;
    } else {
        e = Math.floor(Math.log(v)/Math.LN2);                   // Calculate log2 of the value
        if (v*(c = Math.pow(2, -e)) < 1) { e--; c*=2; }         // Math.log() isn't 100% reliable

        // Round by adding 1/2 the significand's LSD
        if (e+eBias >= 1) { v += this.rt/c; }                   // Normalized:  mLen significand digits
        else { v += this.rt*Math.pow(2, 1-eBias); }             // Denormalized:  <= mLen significand digits
        if (v*c >= 2) { e++; c/=2; }                            // Rounding can increment the exponent

        if (e+eBias >= eMax) {
            // Overflow
            m = 0;
            e = eMax;
        } else if (e+eBias >= 1) {
            // Normalized - term order matters, as Math.pow(2, 52-e) and v*Math.pow(2, 52) can overflow
            m = (v*c-1)*Math.pow(2, mLen);
            e = e + eBias;
        } else {
            // Denormalized - also catches the '0' case, somewhat by chance
            m = v*Math.pow(2, eBias-1)*Math.pow(2, mLen);
            e = 0;
        }
    }

    for (var i = this.big?(this.len-1):0, d=this.big?-1:1; mLen >= 8; a[p+i]=m&0xff, i+=d, m/=256, mLen-=8);
    for (e=(e<<mLen)|m, eLen+=mLen; eLen > 0; a[p+i]=e&0xff, i+=d, e/=256, eLen-=8);
    a[p+i-d] |= s*128;
};

// Descriptions of each format class

var val1c = function(c) { return c; };
var val2c = function(c) { return 2*c; };
var val4c = function(c) { return 4*c; };
var val8c = function(c) { return 8*c; };
var val0 = function(c) { return 0; };
var val1 = function(c) { return 1; };
var val2 = function(c) { return 2; };
var val4 = function(c) { return 4; };
var val8 = function(c) { return 8; };

var typesLE     = {
    'A': {encode:encodeArray,   decode:decodeArray,   bytes:val1c, totalBytes:val1c, elements:val1 },
    's': {encode:encodeString,  decode:decodeString,  bytes:val1c, totalBytes:val1c, elements:val1 },
    'c': {encode:encodeChar,    decode:decodeChar,    bytes:val1c, totalBytes:val1c, elements:val1c },
    'b': {encode:encodeSByte,   decode:decodeSByte,   bytes:val1, totalBytes:val1c, elements:val1c },
    'B': {encode:encodeUByte,   decode:decodeUByte,   bytes:val1, totalBytes:val1c, elements:val1c },
    'h': {encode:encodeSHalfLE, decode:decodeSHalfLE, bytes:val2, totalBytes:val2c, elements:val1c },
    'H': {encode:encodeUHalfLE, decode:decodeUHalfLE, bytes:val2, totalBytes:val2c, elements:val1c},
    'i': {encode:encodeSWordLE, decode:decodeSWordLE, bytes:val4, totalBytes:val4c, elements:val1c},
    'I': {encode:encodeUWordLE, decode:decodeUWordLE, bytes:val4, totalBytes:val4c, elements:val1c},
    'l': {encode:encodeSWordLE, decode:decodeSWordLE, bytes:val4, totalBytes:val4c, elements:val1c},
    'L': {encode:encodeUWordLE, decode:decodeUWordLE, bytes:val4, totalBytes:val4c, elements:val1c},
    'f': {encode:encode754,     decode:decode754,     bytes:val4, totalBytes:val4c, elements:val1c, big:false, len:4, mLen:23, rt:Math.pow(2, -24)-Math.pow(2, -77)},
    'd': {encode:encode754,     decode:decode754,     bytes:val8, totalBytes:val8c, elements:val1c, big:false, len:8, mLen:52, rt:0},
    'x': {                                            bytes:val1c, totalBytes:val1c, elements:val0 }};

var typesBE     = {
    'A': {encode:encodeArray,   decode:decodeArray,   bytes:val1c, totalBytes:val1c, elements:val1 },
    's': {encode:encodeString,  decode:decodeString,  bytes:val1c, totalBytes:val1c, elements:val1 },
    'c': {encode:encodeChar,    decode:decodeChar,    bytes:val1c, totalBytes:val1c, elements:val1c },
    'b': {encode:encodeSByte,   decode:decodeSByte,   bytes:val1, totalBytes:val1c, elements:val1c },
    'B': {encode:encodeUByte,   decode:decodeUByte,   bytes:val1, totalBytes:val1c, elements:val1c },
    'h': {encode:encodeSHalfBE, decode:decodeSHalfBE, bytes:val2, totalBytes:val2c, elements:val1c },
    'H': {encode:encodeUHalfBE, decode:decodeUHalfBE, bytes:val2, totalBytes:val2c, elements:val1c},
    'i': {encode:encodeSWordBE, decode:decodeSWordBE, bytes:val4, totalBytes:val4c, elements:val1c},
    'I': {encode:encodeUWordBE, decode:decodeUWordBE, bytes:val4, totalBytes:val4c, elements:val1c},
    'l': {encode:encodeSWordBE, decode:decodeSWordBE, bytes:val4, totalBytes:val4c, elements:val1c},
    'L': {encode:encodeUWordBE, decode:decodeUWordBE, bytes:val4, totalBytes:val4c, elements:val1c},
    'f': {encode:encode754,     decode:decode754,     bytes:val4, totalBytes:val4c, elements:val1c, big:true, len:4, mLen:23, rt:Math.pow(2, -24)-Math.pow(2, -77)},
    'd': {encode:encode754,     decode:decode754,     bytes:val8, totalBytes:val8c, elements:val1c, big:true, len:8, mLen:52, rt:0},
    'x': {                                            bytes:val1c, totalBytes:val1c, elements:val0 }};

var pattern     = new RegExp('(?:(\\w+):)?(\\d+)?([AxcbBhHsfdiIlL])', 'g'); // name-opt count-opt type

struct.Struct = function(fmt, endian) {
    // Can pass an array of strings - will be joined as one whitespace seperated string.
    if(Array.isArray(fmt))
        fmt = fmt.join(' ');
    this.fmt = fmt;

    if(endian == undefined)
        endian = fmt.charAt(0) == '>' || fmt.charAt(0) == '!';
    this.types =endian?typesBE:typesLE;

    // Figure raw an unpacked sizes
    this.bytes = 0;
    this.elements = 0;
    var m;
    while (m = pattern.exec(this.fmt)) {
        var type = this.types[m[3]];
        var count = (((m[2]==undefined)||(m[2]==''))?1:parseInt(m[2]));
        this.bytes += type.totalBytes(count);
        this.elements += type.elements(count);
    }
};

// Enumerate the parts of the format, using 'types' - calls a function with the details of each element
struct.Struct.prototype.enumerateFormat = function(fn) {
    var m, element = 0, offset = 0;
    while (m = pattern.exec(this.fmt)) {
        var type = this.types[m[3]];
        var c = (((m[2]==undefined)||(m[2]==''))?1:parseInt(m[2]));
        var l=type.elements(c), b = type.bytes(c);
        for(var i = 0; i < l; i++, element++)
            fn(type, offset + i*b, element, m[1], c);
        offset += type.totalBytes(c);
    }
    return offset;
};

// Pack/unpack arrays
struct.Struct.prototype.unpackTo = function (src, src_offset, dest) {
    src_offset = src_offset || 0;
    return this.enumerateFormat(function(type, offset, element, name, count) {
        dest[element] = type.decode.call(type, src, src_offset + offset, count);
    });
};

struct.Struct.prototype.packTo = function (dst, dst_offset, src) {
    dst_offset = dst_offset || 0;
    return this.enumerateFormat(function(type, offset, element, name, count) {
        type.encode.call(type, dst, dst_offset + offset, src[element], count);
    });
};

struct.Struct.prototype.unpack = function (a, p) {
    var r = new Array(this.elements);
    this.unpackTo(a,p,r);
    return r;
};

struct.Struct.prototype.pack = function (values) {
    var r = new Buffer(this.bytes)
    this.packTo(r, 0, values);
    return r;
};

// Pack/unpack objects
struct.Struct.prototype.unpackToObj = function (src, src_offset, dest) {
    src_offset = src_offset || 0;
    return this.enumerateFormat(function(type, offset, element, name, count) {
        if(name)
            dest[name] = type.decode.call(type, src, src_offset + offset, count);
    });
};

struct.Struct.prototype.packToObj = function (dst, dst_offset, src) {
    dst_offset = dst_offset || 0;
    return this.enumerateFormat(function(type, offset, element, name, count) {
        type.encode.call(type, dst, dst_offset + offset, (name in src)?src[name]:0, count);
    });
};

struct.Struct.prototype.unpackObj = function (src, src_offset) {
    var dst = {}
    this.unpackToObj(src, src_offset, dst);
    return dst;
};

struct.Struct.prototype.packObj = function (src) {
    var dst = new Buffer(this.bytes)
    this.packToObj(dst, 0, src);
    return dst;
};
