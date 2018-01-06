import {struct} from './struct';
import gl from './gl';

// surface description flags
const DDSF_CAPS           = 0x00000001;
const DDSF_HEIGHT         = 0x00000002;
const DDSF_WIDTH          = 0x00000004;
const DDSF_PITCH          = 0x00000008;
const DDSF_PIXELFORMAT    = 0x00001000;
const DDSF_MIPMAPCOUNT    = 0x00020000;
const DDSF_LINEARSIZE     = 0x00080000;
const DDSF_DEPTH          = 0x00800000;

// pixel format flags
const DDSF_ALPHAPIXELS    = 0x00000001;
const DDSF_FOURCC         = 0x00000004;
const DDSF_RGB            = 0x00000040;
const DDSF_RGBA           = 0x00000041;

// dwCaps1 flags
const DDSF_COMPLEX         = 0x00000008;
const DDSF_TEXTURE         = 0x00001000;
const DDSF_MIPMAP          = 0x00400000;

// dwCaps2 flags
const DDSF_CUBEMAP         = 0x00000200;
const DDSF_CUBEMAP_POSITIVEX  = 0x00000400;
const DDSF_CUBEMAP_NEGATIVEX  = 0x00000800;
const DDSF_CUBEMAP_POSITIVEY  = 0x00001000;
const DDSF_CUBEMAP_NEGATIVEY  = 0x00002000;
const DDSF_CUBEMAP_POSITIVEZ  = 0x00004000;
const DDSF_CUBEMAP_NEGATIVEZ  = 0x00008000;
const DDSF_CUBEMAP_ALL_FACES  = 0x0000FC00;
const DDSF_VOLUME          = 0x00200000;

// compressed texture types
const FOURCC_UNKNOWN       = 0;

const FOURCC_R8G8B8        = 20;
const FOURCC_A8R8G8B8      = 21;
const FOURCC_X8R8G8B8      = 22;
const FOURCC_R5G6B5        = 23;
const FOURCC_X1R5G5B5      = 24;
const FOURCC_A1R5G5B5      = 25;
const FOURCC_A4R4G4B4      = 26;
const FOURCC_R3G3B2        = 27;
const FOURCC_A8            = 28;
const FOURCC_A8R3G3B2      = 29;
const FOURCC_X4R4G4B4      = 30;
const FOURCC_A2B10G10R10   = 31;
const FOURCC_A8B8G8R8      = 32;
const FOURCC_X8B8G8R8      = 33;
const FOURCC_G16R16        = 34;
const FOURCC_A2R10G10B10   = 35;
const FOURCC_A16B16G16R16  = 36;

const FOURCC_L8            = 50;
const FOURCC_A8L8          = 51;
const FOURCC_A4L4          = 52;
const FOURCC_DXT1          = 0x31545844; //(MAKEFOURCC('D','X','T','1'))
const FOURCC_DXT2          = 0x32545844; //(MAKEFOURCC('D','X','T','1'))
const FOURCC_DXT3          = 0x33545844; //(MAKEFOURCC('D','X','T','3'))
const FOURCC_DXT4          = 0x34545844; //(MAKEFOURCC('D','X','T','3'))
const FOURCC_DXT5          = 0x35545844; //(MAKEFOURCC('D','X','T','5'))

const FOURCC_D16_LOCKABLE  = 70;
const FOURCC_D32           = 71;
const FOURCC_D24X8         = 77;
const FOURCC_D16           = 80;

const FOURCC_D32F_LOCKABLE = 82;

const FOURCC_L16           = 81;

// Floating point surface formats

// s10e5 formats (16-bits per channel)
const FOURCC_R16F          = 111;
const FOURCC_G16R16F       = 112;
const FOURCC_A16B16G16R16F = 113;

// IEEE s23e8 formats (32-bits per channel)
const FOURCC_R32F          = 114;
const FOURCC_G32R32F       = 115;
const FOURCC_A32B32G32R32F = 116;

const DDS_MAGIC = new struct.Struct('4s', true);

const DDS_HEADER = new struct.Struct([
    'size:I',
    'flags:I',
    'height:I',
    'width:I',
    'pitchOrLinearSize:I',
    'depth:I',
    'mipMapCount:I',
    '44x',
    'pf_size:I',
    'pf_flags:I',
    'pf_fourCC:I',
    'pf_rgbBitCount:I',
    'pf_rMask:I',
    'pf_gMask:I',
    'pf_bMask:I',
    'pf_aMask:I',
    'caps1:I',
    'caps2:I',
    '12x '
]);

// Description of each pixel format - sizes and the various gl formats needed
//
var compressedFormat = function(fmt, bpe) {
    return { format: fmt, internal_format:fmt, type:fmt, bytesPerElement:bpe, compressed: true};
};

var format = function(fmt, ifmt, type, bpe) {
    return { format: fmt, internal_format:ifmt, type:type, bytesPerElement:bpe, compressed: false};
};

var extend = function(a,b) {
    for(var prop in b) if(Object.prototype.hasOwnProperty.call(b,prop))
        a[prop] = b[prop] ;
    return a;
};

var fourcc_formats = [];
fourcc_formats[FOURCC_DXT1]= compressedFormat(gl.COMPRESSED_RGBA_S3TC_DXT1_EXT, 8);
fourcc_formats[FOURCC_DXT2] = compressedFormat(gl.COMPRESSED_RGBA_S3TC_DXT3_EXT, 16);
fourcc_formats[FOURCC_DXT3] = compressedFormat(gl.COMPRESSED_RGBA_S3TC_DXT3_EXT, 16);
fourcc_formats[FOURCC_DXT4] = compressedFormat(gl.COMPRESSED_RGBA_S3TC_DXT5_EXT, 16);
fourcc_formats[FOURCC_DXT5] = compressedFormat(gl.COMPRESSED_RGBA_S3TC_DXT5_EXT, 16);
fourcc_formats[FOURCC_R8G8B8] = format(gl.BGR, gl.RGB8, gl.UNSIGNED_BYTE, 3);
fourcc_formats[FOURCC_A8R8G8B8] = format(gl.BGRA, gl.RGBA8, gl.UNSIGNED_BYTE, 4);
fourcc_formats[FOURCC_X8R8G8B8] = format(gl.BGRA, gl.RGB8, gl.UNSIGNED_INT_8_8_8_8, 4);
fourcc_formats[FOURCC_R5G6B5] = format(gl.BGR, gl.RGB5, gl.UNSIGNED_SHORT_5_6_5, 2);
fourcc_formats[FOURCC_A8] = format( gl.ALPHA, gl.ALPHA8, gl.UNSIGNED_BYTE, 1);
fourcc_formats[FOURCC_A2B10G10R10] = format(gl.RGBA, gl.RGB10_A2, gl.UNSIGNED_INT_10_10_10_2, 4);
fourcc_formats[FOURCC_A8B8G8R8] = format(gl.RGBA, gl.RGBA8, gl.UNSIGNED_BYTE, 4);
fourcc_formats[FOURCC_X8B8G8R8] = format(gl.RGBA, gl.RGB8, gl.UNSIGNED_INT_8_8_8_8, 4);
fourcc_formats[FOURCC_A2R10G10B10] = format(gl.BGRA, gl.RGB10_A2, gl.UNSIGNED_INT_10_10_10_2, 4);
fourcc_formats[FOURCC_A16B16G16R16] = format(gl.RGBA, gl.RGBA16, gl.UNSIGNED_SHORT, 8);
fourcc_formats[FOURCC_L8] = format(gl.LUMINANCE, gl.LUMINANCE8, gl.UNSIGNED_BYTE, 1);
fourcc_formats[FOURCC_A8L8] = format(gl.LUMINANCE_ALPHA, gl.LUMINANCE8_ALPHA8, gl.UNSIGNED_BYTE, 2);
fourcc_formats[FOURCC_L16] = format(gl.LUMINANCE, gl.LUMINANCE16, gl.UNSIGNED_SHORT, 2);
fourcc_formats[FOURCC_R16F] = format(gl.LUMINANCE, gl.LUMINANCE16F_ARB,  gl.HALF_FLOAT_ARB, 2);
fourcc_formats[FOURCC_A16B16G16R16F] = format(gl.RGBA, gl.RGBA16F_ARB, gl.HALF_FLOAT_ARB, 8);
fourcc_formats[FOURCC_R32F] = format(gl.LUMINANCE, gl.LUMINANCE32F_ARB,  gl.FLOAT, 4);
fourcc_formats[FOURCC_A32B32G32R32F] = format(gl.RGBA, gl.RGBA32F_ARB, gl.FLOAT, 16);

var format_RGBA_32 =  format(gl.BGRA, gl.RGBA8, gl.UNSIGNED_BYTE, 4),
    format_RGB_32 =  format(gl.BGR, gl.RGBA8, gl.UNSIGNED_BYTE, 4),
    format_RGB_24 =  format(gl.BGR, gl.RGB8, gl.UNSIGNED_BYTE, 4);

export function parse (buffer) {

    let desc = {};

    if(!buffer) {
        throw new Error("Trying to load undefined buffer");
    }

    if (DDS_MAGIC.unpack(buffer)[0] !== 'DDS ') {
        throw new Error(`not a DDS file`);
    }

    let header = DDS_HEADER.unpackObj(buffer, 4);
    let dataOffset = 4 + DDS_HEADER.bytes;

    // Dimensions
    desc.width = header.width;
    desc.height = header.height;
    desc.depth = (header.caps2 & DDSF_VOLUME)?header.depth:0;
    desc.levels = (header.flags & DDSF_MIPMAPCOUNT)?header.mipMapCount:1;

    // Cubemapping
    if(header.caps2 & DDSF_CUBEMAP) {
        if(((header.caps2 & DDSF_CUBEMAP_ALL_FACES) !== DDSF_CUBEMAP_ALL_FACES) || desc.width !== desc.height) {
            throw new Error('Incomplete cubemap');
        }
        desc.faces = 6;
    } else {
        desc.faces = 0;
    }

    // Pixel format
    let format = null;
    if (header.pf_flags & DDSF_FOURCC)
        format = fourcc_formats[header.pf_fourCC];
    else if(header.pf_flags == DDSF_RGBA && header.pf_rgbBitCount == 32)
        format = format_RGBA_32;
    else if(header.pf_flags == DDSF_RGB && header.pf_rgbBitCount == 32)
        format = format_RGB_32;
    else if(header.pf_flags == DDSF_RGB && header.pf_rgbBitCount == 24)
        format = format_RGB_24;

    if(!format) {
        throw new Error('Unknown DDS format');
    }

    extend(desc, format);

    //
    let w,h, bw, bh, size;
    desc.parts = [];
    let d = desc.depth || 1;

    for(let f=0, fl=desc.faces||1; f < fl; f++) {
        w = desc.width;
        h = desc.height;
        for(let l=0; l < desc.levels; l++) {
            if(desc.compressed) {
                bw = (w+3)>>2;
                bh = (h+3)>>2;
            } else  {
                bw = w;
                bh = h;
            }

            size = bw * bh * d * desc.bytesPerElement;

            desc.parts.push({'offset':dataOffset, 'size':size});
            dataOffset += size;

            // Shrink dimension for next MIP level
            w = (w+1) >> 1;
            h = (h+1) >> 1;
            d = (d+1) >> 1;
        }
    }

    desc.parts_count = desc.parts.length;

    return desc;
}
