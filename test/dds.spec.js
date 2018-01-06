import fs from 'fs';
import expect from 'expect.js';
import {parse} from '../src/dds';

describe ('dds', function () {

    it ('should parse a DDS texture', () => {

        let buffer = fs.readFileSync('test/white.dds'),
            [desc, data] = parse(buffer);

        expect(desc.width).to.be(4);
        expect(desc.height).to.be(4);
        expect(desc.levels).to.be(3);
        expect(desc.parts_count).to.be(3);
    });

    it ('should parse a DDS texture with mipmaps', () => {

        let buffer = fs.readFileSync('test/normal_map.dds'),
            [desc, data] = parse(buffer);

        expect(desc.width).to.be(512);
        expect(desc.height).to.be(512);
        expect(desc.levels).to.be(10);
        expect(desc.parts_count).to.be(10);
    });

    it ('should parse a DDS cubemap texture', () => {

        let buffer = fs.readFileSync('test/light_diff.dds'),
            [desc, data] = parse(buffer);

        expect(desc.width).to.be(16);
        expect(desc.height).to.be(16);
        expect(desc.levels).to.be(5);
        expect(desc.parts_count).to.be(30);
    });

});
