## gl-dds

Parse DDS images.

The library has a single method ```parse``` which takes a ArrayBuffer and
returns an object describing the DDS data.

Example of the returned object:

```javascript
{ width: 4,
  height: 4,
  depth: 0,
  levels: 3,
  faces: 0,
  format: 33777,
  internal_format: 33777,
  type: 33777,
  bytesPerElement: 8,
  compressed: true,
  parts:
   [ { offset: 128, size: 8 },
     { offset: 136, size: 8 },
     { offset: 144, size: 8 } ],
  parts_count: 3 }
```

### install

    npm i gl-dds

### usage

```javascript

import fs from 'fs';
import * as dds from 'gl-dds';

let buffer = fs.readFileSync('foo.dds');

let descriptor = dds.parse(buffer);

```
