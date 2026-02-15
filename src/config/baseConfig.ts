// 从 Vite 环境变量读取 API 地址 (构建时由 Docker 注入)
const envBaseURL = import.meta.env.VITE_API_BASE_URL;

export const baseURL_dev: string = envBaseURL || 'http://localhost:18888/api/v1/'
export const chatSocketURL_dev: string = baseURL_dev.replace('/api/v1/', '/chatbot')
export const RecommendationSocketURL_dev: string = baseURL_dev.replace('/api/v1/', '/recommendation')

export const baseURL_pro: string = envBaseURL || 'https://valueapi.sanaoll.com/api/v1/'
export const chatSocketURL_pro: string = baseURL_pro.replace('/api/v1/', '/chatbot')
export const RecommendationSocketURL_pro: string = baseURL_pro.replace('/api/v1/', '/recommendation')

export const customPort: number = 28888

// Cron 服务地址 (FastAPI, 端口 19999)
const envCronURL = import.meta.env.VITE_CRON_BASE_URL;
export const cronBaseURL_dev: string = envCronURL || 'http://localhost:19999/'
export const cronBaseURL_pro: string = envCronURL || 'https://valuecron.sanaoll.com/'

// 统一导出
export const baseURL: string = import.meta.env.PROD ? baseURL_pro : baseURL_dev;
export const chatSocketURL: string = import.meta.env.PROD ? chatSocketURL_pro : chatSocketURL_dev;
export const RecommendationSocketURL: string = import.meta.env.PROD ? RecommendationSocketURL_pro : RecommendationSocketURL_dev;
export const cronBaseURL: string = import.meta.env.PROD ? cronBaseURL_pro : cronBaseURL_dev;
export const cronWsURL: string = cronBaseURL.replace('http', 'ws');

console.log('Current Mode:', import.meta.env.MODE);
console.log('Base URL:', baseURL);