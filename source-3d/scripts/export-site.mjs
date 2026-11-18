import {cpSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const target=fileURLToPath(new URL('../../3d/',import.meta.url));
rmSync(target,{recursive:true,force:true});
cpSync(fileURLToPath(new URL('../dist/',import.meta.url)),target,{recursive:true});
