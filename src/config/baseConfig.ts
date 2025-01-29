export const baseURL_dev: string = 'http://127.0.0.1:18888/api/v1/'
export const chatSocketURL_dev: string = 'http://127.0.0.1:18888/chatbot'
export const RecommendationSocketURL_dev: string = 'http://127.0.0.1:18888/recommendation'


export const baseURL_pro: string = 'https://valueapi.sanaoll.com/api/v1/'
export const chatSocketURL_pro: string='https://valueapi.sanaoll.com/chatbot'
export const RecommendationSocketURL_pro: string ='https://valueapi.sanaoll.com/recommendation'

export const customPort: number = 28888
export const baseURL: string = process.env.NODE_ENV === 'production' ? baseURL_pro : baseURL_dev;
export const chatSocketURL:string = process.env.NODE_ENV == 'production' ? chatSocketURL_pro:chatSocketURL_dev;
export const RecommendationSocketURL = process.env.NODE_ENV == 'production' ? RecommendationSocketURL_pro:RecommendationSocketURL_dev;

console.log('Current Environment:', process.env.NODE_ENV);
console.log('Base URL:', baseURL);
console.log('Custom Port:', customPort);