export const baseURL_dev: string = 'http://127.0.0.1:18888/api/v1/'
export const baseURL_pro: string = 'https://valueapi.sanaoll.com/api/v1/'
export const customPort: number = 28888

export const baseURL: string = process.env.NODE_ENV === 'production' ? baseURL_pro : baseURL_dev;

console.log('Current Environment:', process.env.NODE_ENV);
console.log('Base URL:', baseURL);
console.log('Custom Port:', customPort);