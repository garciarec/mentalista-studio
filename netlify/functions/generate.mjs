import {timingSafeEqual} from 'node:crypto';
import {validate,prompt,userParts} from '../../server/engine.mjs';
const reply=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export default async function handler(req){
 if(req.method!=='POST')return reply('Método não permitido.',405);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return reply('Origem não permitida.',403);
 const {GEMINI_API_KEY:key,GEMINI_MODEL:model,BETA_ACCESS_CODE:code}=process.env;
 if(!key||!model||!code)return reply('A IA ainda não está configurada. Abra Conexão e privacidade para ver a ativação na Netlify.',503);
 const supplied=Buffer.from(req.headers.get('x-beta-code')||''),expected=Buffer.from(code);if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return reply('Código do beta inválido.',401);
 if(!/^[a-zA-Z0-9._-]+$/.test(model))return reply('Modelo configurado incorretamente.',503);
 if(!req.headers.get('content-type')?.includes('application/json'))return reply('Envie JSON.',415);
 if(Number(req.headers.get('content-length'))>3100000)return reply('Arquivo ou texto muito grande.',413);
 let b;try{const raw=await req.text();if(raw.length>3100000)return reply('Arquivo ou texto muito grande.',413);b=JSON.parse(raw)}catch{return reply('Solicitação inválida.',400)}
 const error=validate(b);if(error)return reply(error,400);
 if(JSON.stringify({...b,media:null}).length>40000)return reply('Reduza o contexto enviado.',413);
 try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:prompt(b)}]},contents:[{role:'user',parts:userParts(b)}],generationConfig:{maxOutputTokens:3500,temperature:.7}}),signal:AbortSignal.timeout(24000)});
 if(!r.ok)return reply(r.status===429?'A cota de IA está temporariamente indisponível. Tente mais tarde. Não há troca automática para um plano pago.':r.status===400||r.status===404?'O vídeo pode estar privado, indisponível ou ainda em processamento. Tente um vídeo público ou envie um arquivo. Confira também se o modelo configurado aceita vídeo.':'O provedor não respondeu corretamente. Confira a configuração e tente novamente.',r.status===429?429:502);
 const data=await r.json();const text=data.candidates?.[0]?.content?.parts?.filter(x=>!x.thought).map(x=>x.text||'').join('\n');if(!text)return reply('O provedor não retornou texto. Revise o pedido ou tente novamente.',502);
 return Response.json({text},{headers:{'Cache-Control':'no-store'}});
 }catch{return reply('A geração demorou demais ou a conexão falhou. Tente um texto ou vídeo menor.',504)}
}
export const config={rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
