import api from './api'
//****************************AI信息添加调用****************************
export const fetchCoinSearch = (
    data:{
        coin_search:string
    }
) => api.get('/recommendations')
export const ecosystem_search = (
    data:{
        ecosystem_search:string
    }
) => api.get('/recommendations')
export const cointype_search= (
    data:{
        cointype_search:string
    }
) => api.get('/recommendations')
export const founder_search = (
    data:{
        founder_search:string
    }
) => api.get('/recommendations')
export const investment_search = (
    data:{
        investmentinstitution_search:string
    }
) => api.get('/recommendations')
export const coininvestment_search = (
    data:{
        coininvestment_search:string
    }
) => api.get('/recommendations')

export const coinmarket_top100 = (
) => api.get('/top100info')