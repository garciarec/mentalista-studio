export default async()=>Response.json({ready:!!(process.env.GEMINI_API_KEY&&process.env.GEMINI_MODEL&&process.env.BETA_ACCESS_CODE)},{headers:{'Cache-Control':'no-store'}});
