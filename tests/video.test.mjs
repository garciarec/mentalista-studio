import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeURL,signVideo,readVideo,CHUNK} from '../server/video.mjs';
import {validate,userParts} from '../server/engine.mjs';
import upload from '../netlify/functions/video.mjs';
const base={mode:'analisar',text:'',consent:true};
test('YouTube e Shorts sem transcrição; rejeita hosts falsos e páginas sem vídeo',()=>{
 for(const url of ['https://youtu.be/9hE5-98ZeCg?si=abc','https://www.youtube.com/shorts/9hE5-98ZeCg','https://m.youtube.com/watch?v=9hE5-98ZeCg']){assert.equal(youtubeURL(url),'https://www.youtube.com/watch?v=9hE5-98ZeCg');assert.equal(validate({...base,url,sourceType:'link'}),null);assert.equal(userParts({...base,url})[1].fileData.fileUri,youtubeURL(url));}
 for(const url of ['https://youtube.com.evil.test/watch?v=9hE5-98ZeCg','http://localhost/video','https://www.instagram.com/reel/test','https://youtube.com/@canal','https://evil@youtube.com/watch?v=9hE5-98ZeCg']){assert.equal(youtubeURL(url),null);assert.ok(validate({...base,url,sourceType:'link'}));}
});
test('Envio em partes, autenticação, token adulterado e status do vídeo',async()=>{
 process.env.GEMINI_API_KEY='test';process.env.BETA_ACCESS_CODE='beta';
 const token=signVideo({kind:'file',name:'files/abc',mimeType:'video/quicktime'});
 assert.ok(readVideo(token,'file'));assert.equal(readVideo(token+'x','file'),null);assert.equal(readVideo(token,'upload'),null);
 assert.equal(validate({...base,videoToken:token}),null);assert.ok(validate({...base,videoToken:'invalid'}));assert.equal(userParts({...base,videoToken:token})[1].fileData.mimeType,'video/quicktime');
 const request=(action,body,headers={})=>new Request('https://site.test/.netlify/functions/video?action='+action,{method:'POST',headers:{'x-beta-code':'beta',origin:'https://site.test',...headers},body});
 assert.equal((await upload(request('start','{}',{'x-beta-code':'wrong'}))).status,401);
 assert.equal((await upload(request('start',JSON.stringify({size:101*1024*1024,mimeType:'video/mp4',consent:true})))).status,400);
 const original=globalThis.fetch;let step=0;
 try{globalThis.fetch=async(url,options)=>{step++;if(step===1){assert.equal(options.headers['X-Goog-Upload-Header-Content-Length'],String(CHUNK+1));return new Response('',{headers:{'x-goog-upload-url':'https://generativelanguage.googleapis.com/upload/session'}});}if(step===2){assert.equal(options.headers['X-Goog-Upload-Command'],'upload');assert.equal(options.body.byteLength,CHUNK);return new Response('');}if(step===3){assert.equal(options.headers['X-Goog-Upload-Offset'],String(CHUNK));assert.equal(options.headers['X-Goog-Upload-Command'],'upload, finalize');return Response.json({file:{name:'files/abc'}});}return Response.json({state:'ACTIVE'});};
 const started=await (await upload(request('start',JSON.stringify({size:CHUNK+1,mimeType:'video/mp4',consent:true})))).json();assert.ok(started.token);
 assert.equal((await upload(request('chunk',new Uint8Array(1),{'x-video-token':started.token,'x-video-offset':'0'}))).status,400);
 assert.equal((await upload(request('chunk',new Uint8Array(CHUNK),{'x-video-token':started.token,'x-video-offset':'0'}))).status,200);
 const completed=await(await upload(request('chunk',new Uint8Array(1),{'x-video-token':started.token,'x-video-offset':String(CHUNK)}))).json();assert.ok(completed.fileToken);
 assert.equal((await(await upload(request('status',null,{'x-video-token':completed.fileToken}))).json()).state,'ACTIVE');
 }finally{globalThis.fetch=original}
});
