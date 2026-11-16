import {createHmac,timingSafeEqual} from 'node:crypto';
export const MAX_VIDEO=100*1024*1024;
export const CHUNK=2*1024*1024;
export const MIME=['video/mp4','video/webm','video/quicktime'];
export function youtubeURL(value){
 try {const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
 const host=u.hostname.toLowerCase();let id;
 if(host==='youtu.be')id=u.pathname.slice(1);
 else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(host)){
 if(u.pathname==='/watch')id=u.searchParams.get('v');else id=u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1];}
 return /^[\w-]{11}$/.test(id||'')?`https://www.youtube.com/watch?v=${id}`:null;
 }catch{return null}
}
export function signVideo(data){const payload=Buffer.from(JSON.stringify({...data,expires:Date.now()+3600000})).toString('base64url');return payload+'.'+createHmac('sha256',process.env.GEMINI_API_KEY).update(payload).digest('base64url');}
export function readVideo(token,kind){try{if(typeof token!=='string'||token.length>12000)return null;const [payload,signature,...extra]=token.split('.');if(extra.length)return null;const expected=createHmac('sha256',process.env.GEMINI_API_KEY).update(payload).digest();const supplied=Buffer.from(signature,'base64url');if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return null;const data=JSON.parse(Buffer.from(payload,'base64url'));return data.kind===kind&&data.expires>Date.now()?data:null;}catch{return null}}
