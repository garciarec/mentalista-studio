import {timingSafeEqual} from 'node:crypto';
import {MAX_VIDEO,CHUNK,MIME,signVideo,readVideo} from '../../server/video.mjs';
const reply=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
const ok=data=>Response.json(data,{headers:{'Cache-Control':'no-store'}});
export default async function handler(req){
 if(req.method!=='POST')return reply('Método não permitida.',405);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return reply('Origem não permitida.',403);
 const key=process.env.GEMINI_API_KEY,code=process.env.BETA_ACCESS_CODE;if(!key||!code)return reply('Configure a IA antes de enviar o vídeo.',503);
 const a=Buffer.from(req.headers.get('x-beta-code')||''),b=Buffer.from(code);if(a.length!==b.length||!timingSafeEqual(a,b))return reply('Código do beta inválido.',401);
 try{
 const action=new URL(req.url).searchParams.get('action');
 const headers={'x-goog-api-key':key};const signal=()=>AbortSignal.timeout(20000);
 if(action==='start'){
 const raw=await req.text();if(raw.length>1000)return reply('Pedido muito grande.',413);const data=JSON.parse(raw);
 if(data.consent!==true||!Number.isInteger(data.size)||data.size<1||data.size>MAX_VIDEO||!MIME.includes(data.mimeType))return reply('Envie MP4, MOV ou WebM de até 100 MB e confirme o envio.',400);
 const r=await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files',{method:'POST',headers:{...headers,'Content-Type':'application/json','X-Goog-Upload-Protocol':'resumable','X-Goog-Upload-Command':'start','X-Goog-Upload-Header-Content-Length':String(data.size),'X-Goog-Upload-Header-Content-Type':data.mimeType},body:JSON.stringify({file:{display_name:'Referencia Mentalista'}}),signal:signal()});
 if(!r.ok)return reply('Não foi possível iniciar o envio. Verifique a cota da IA.',502);
 const url=r.headers.get('x-goog-upload-url');if(!url||new URL(url).origin!=='https://generativelanguage.googleapis.com')return reply('Destino de envio inválido.',502);
 return ok({token:signVideo({kind:'upload',url,size:data.size,mimeType:data.mimeType}),chunkSize:CHUNK});
 }
 if(action==='chunk'){
 const session=readVideo(req.headers.get('x-video-token'),'upload');if(!session)return reply('Envio expirado. Selecione o vídeo novamente.',400);
 const offset=Number(req.headers.get('x-video-offset'));if(!Number.isInteger(offset)||offset<0||offset%CHUNK!==0||offset>=session.size)return reply('Parte do vídeo inválida.',400);
 if(Number(req.headers.get('content-length'))>CHUNK)return reply('Parte muito grande.',413);
 const bytes=await req.arrayBuffer();if(bytes.byteLength!==Math.min(CHUNK,session.size-offset))return reply('Parte incompleta. Reenvie o vídeo.',400);
 const final=offset+bytes.byteLength===session.size;
 const r=await fetch(session.url,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Goog-Upload-Offset':String(offset),'X-Goog-Upload-Command':final?'upload, finalize':'upload'},body:bytes,signal:signal()});
 if(!r.ok)return reply('O envio falhou. Tente novamente.',502);
 if(!final)return ok({received:offset+bytes.byteLength});
 const {file}=await r.json();if(!/^files\/[a-zA-Z0-9_-]+$/.test(file?.name||''))return reply('Arquivo não confirmado pelo provedor.',502);
 return ok({fileToken:signVideo({kind:'file',name:file.name,mimeType:session.mimeType})});
 }
 if(action==='status'){
 const file=readVideo(req.headers.get('x-video-token'),'file');if(!file)return reply('Vídeo expirado. Envie novamente.',400);
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/${file.name}`,{headers,signal:signal()});if(!r.ok)return reply('Não foi possível consultar o vídeo.',502);
 const data=await r.json();if(data.state==='FAILED')return reply('Não foi possível processar este formato. Tente exportar em MP4.',422);
 return ok({state:data.state});
 }
 return reply('Operação inválida.',400);
 }catch{return reply('O envio foi interrompido. Tente novamente com uma conexão estável.',502)}
}
export const config={rateLimit:{windowLimit:120,windowSize:60,aggregateBy:['ip','domain']}};
