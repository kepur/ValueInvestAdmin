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
const getRelativeBaseURL = (devURL: string, suffix: string) => {
    if (import.meta.env.PROD) {
        return suffix;
    }
    return devURL;
};

export const baseURL: string = getRelativeBaseURL(baseURL_dev, '/api/v1/');
export const cronBaseURL: string = getRelativeBaseURL(cronBaseURL_dev, '/cron/');

// WebSocket URL 处理 helper
const getWsBaseURL = (devURL: string) => {
    if (import.meta.env.PROD) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // 尝试从 devURL 中提取 namespace/路径
        let path = '/';
        try {
            path = new URL(devURL).pathname;
        } catch (e) {
            // 如果 devURL 不是完整 URL（例如只是个路径），则直接使用
            path = devURL;
        }
        return `${protocol}//${window.location.host}${path}`;
    }
    return devURL.startsWith('http') ? devURL.replace('http', 'ws') : devURL;
};

export const chatSocketURL: string = getWsBaseURL(chatSocketURL_dev);
export const RecommendationSocketURL: string = getWsBaseURL(RecommendationSocketURL_dev);
export const cronWsURL: string = getWsBaseURL(cronBaseURL_dev);

console.log('Current Mode:', import.meta.env.MODE);
console.log('Base URL:', baseURL);
console.log('Cron WS URL:', cronWsURL);