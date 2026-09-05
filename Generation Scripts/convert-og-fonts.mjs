// Losslessly unpack the existing WOFF table data into an SFNT/TTF container.
import {readFileSync,writeFileSync} from "node:fs";
import {inflateSync} from "node:zlib";
for(const weight of [500,700]){
 const source=new URL(`../app/_fonts/DMSans-${weight}.woff`,import.meta.url);
 const b=readFileSync(source);
 if(b.toString("ascii",0,4)!=="wOFF")throw Error("Not WOFF");
 const n=b.readUInt16BE(12),out=Buffer.alloc(b.readUInt32BE(16));
 b.copy(out,0,4,8);out.writeUInt16BE(n,4);
 const power=Math.floor(Math.log2(n));
 out.writeUInt16BE(16*2**power,6);out.writeUInt16BE(power,8);out.writeUInt16BE(16*n-16*2**power,10);
 let pos=12+16*n;
 for(let i=0;i<n;i++){
  const p=44+20*i,offset=b.readUInt32BE(p+4),compressed=b.readUInt32BE(p+8),length=b.readUInt32BE(p+12),q=12+16*i;
  b.copy(out,q,p,p+4);out.writeUInt32BE(b.readUInt32BE(p+16),q+4);out.writeUInt32BE(pos,q+8);out.writeUInt32BE(length,q+12);
  const raw=b.subarray(offset,offset+compressed),data=compressed<length?inflateSync(raw):raw;
  if(data.length!==length)throw Error("Invalid table length");
  data.copy(out,pos);pos+=(length+3)&~3;
 }
 if(pos!==out.length)throw Error("Invalid SFNT size");
 writeFileSync(new URL(`../app/_fonts/DMSans-${weight}.ttf`,import.meta.url),out);
 console.log("Converted DM Sans "+weight+" without changing glyph data.");
}
