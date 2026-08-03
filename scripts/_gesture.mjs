import { chromium } from "playwright-core";
const { getTestById } = await import("../lib/test/tests/index.ts");
const B="http://localhost:3000"; const test=getTestById("adult");
const answers={}; test.items.forEach((it,i)=>{ if(i%5!==4) answers[it.id]= i%3===0?it.answer:it.options.find(o=>o.id!==it.answer).id; });
const {token}=await (await fetch(`${B}/api/test-results`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({testId:"adult",grade:null,answers,elapsedSeconds:900,timedOut:false})})).json();
const b=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"});
const p=await b.newPage({viewport:{width:1440,height:900}});
const cdp = await p.context().newCDPSession(p);
await p.goto(`${B}/results/${token}`,{waitUntil:"networkidle"});
await p.waitForTimeout(500);
await p.evaluate(()=>document.querySelector("article").closest("div[class*='shadow-hard-sm']").scrollIntoView({block:"center"}));
await p.waitForTimeout(500);
const state = () => p.evaluate(()=>{
  const ol=document.querySelector("ol"); const pan=document.querySelector("article").parentElement;
  return { list: ol.scrollTop, panel: pan.scrollTop, page: Math.round(window.scrollY) };
});
console.log("start:", JSON.stringify(await state()));
for (const [sel,label] of [["ol","list"],["article","panel"]]) {
  const box = await p.locator(sel).first().boundingBox();
  // A real trackpad gesture: hit-tested by the compositor, unlike mouse.wheel.
  await cdp.send("Input.synthesizeScrollGesture", {
    x: Math.round(box.x+box.width/2), y: Math.round(box.y+80),
    yDistance: -260, gestureSourceType: "mouse", speed: 3000,
  });
  await p.waitForTimeout(600);
  console.log(`gesture over ${label}:`, JSON.stringify(await state()));
}
await p.screenshot({path:"/tmp/gesture-after.png"});
await b.close();
