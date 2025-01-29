import type { dayjs } from "element-plus";
import api from "./api";

//****************************币种类型****************************
export const fetchCoinsTypes = (params:{
    page:number,
    pageSize:number,
    search?:string
})=>{
    return api.get('/cointypes',{params})
}
export const fetchAllCoinTypes =()=>{
    return api.get('/cointypes_all')
}
//创建
export const createCoinType=(
    data:{
        type_name:string,
        description:string
    }
)=>api.post('/cointypes',data)
//修改
export const updateCoinType=(
    id:number,
    data:{
        type_name:string,
        description:string
    }
)=>api.put(`/cointypes/${id}`,data)
//删除
export const DeleteCoinType=(
    id:number
)=>api.delete(`/cointypes/${id}`)

//****************************创始人获取列表****************************
export const fetchFounders=(params:{page:number,pageSize:number,search?:string})=>{
    return api.get('/founders',{params})
}
export const fetchAllFounders=()=>{
    return api.get('/founders_all')
}
//创建
export const createFounder=(
    data:{
        name:string,
        team_name:string
        reputation_score:number
    }
)=>api.post('/founders',data)
//修改
export const updateFounder=(
    id:number,
    data:{
        name:string,
        team_name:string
        reputation_score:number
    }
)=>api.put(`/founders/${id}`,data)
//删除
export const deleteFounder=(
    id:number
)=>api.delete(`/founders/${id}`)

//****************************生态系统获取列表****************************
export const fetchEcosystems=(params:{page:number,pageSize:number,search?:string})=>{
    return api.get('/ecosystems',{params})
}
export const fetchAllEcosystems=()=>{
    return api.get('/ecosystems_all')
}
//创建
export const createEcosystem=(
    data:{
        name:string,
        description:string
    }
)=>api.post('/ecosystems',data)
//修改
export const updateEcosystem=(
    id:number,
    data:{
        name:string,
        description:string
    }
)=>api.put(`/ecosystems/${id}`,data)
//删除
export const deleteEcosystem=(
    id:number
)=>api.delete(`/ecosystems/${id}`)

//****************************投资机构获取列表****************************
export const fetchInvestmentInstitutions=(params:{page:number,pageSize:number,search?:string})=>{
    return api.get('/investmentinstitutions',{params})
}
export const fetchAllInvestmentInstitutions=()=>{
    return api.get('/investmentinstitutions_all')
}
//创建
export const createInvestmentInstitution=(
    data:{
        name:string,
        description:string
    }
)=>api.post('/investmentinstitutions',data)
//修改
export const updateInvestmentInstitution=(
    id:number,
    data:{
        name:string,
        description:string
    }
)=>api.put(`/investmentinstitutions/${id}`,data)
//删除
export const DeleteInvestmentInstitution=(
    id:number
)=>api.delete(`/investmentinstitutions/${id}`)


//****************************投资机构基本信息获取列表****************************
export const fetchAllCoinInvestment=(params: { page: number; pageSize: number; search?: string }) => {
        return api.get('/coininvestments', { params });
    };

//创建
export const createCoinInvestment=(
    data:{
        coin_id:number,
        institution_id:number,
        holding_amount:number,
        holding_percentage:number
    }
)=>api.post('/coininvestments',data)

//修改
export const updateCoinInvestment=(
    id:number,
    data:{
        coin_id:number,
        institution_id:number,
        holding_amount:number,
        holding_percentage:number
    }
)=>api.put(`/coininvestments/${id}`,data)

//删除
export const deleteCoinInvestment=(
    id:number
)=>api.delete(`/coininvestments/${id}`)

//****************************币种基本信息****************************

// 获取币种列表，支持分页和搜索
export const fetchAllCoins = () => {
    return api.get('/coins_all');
  };

export const fetchCoins = (params: { page: number; pageSize: number; search?: string }) => {
    return api.get('/coins', { params });
};
//创建
export const createCoin = (
    data: {
        name: string,
        description: string,
        issuance_date: Date,
        is_active: boolean,
        ecosystems: string[],
        founders: string[],
        investment_institutions: string[],
        coin_types: string[]
    }
) => {
    // // 如果ecosystem_id为0，则设置为null
    // if (data.ecosystem_id === 0) {
    //     data.ecosystem_id = null;
    // }
    
    return api.post('/coins', data);
}

//修改
export const updateCoin = (
    id: number,
    data: {
        name: string,
        description: string,
        issuance_date: Date,
        is_active: boolean,
        ecosystem_id: number | null,
        founders: string[],
        investment_institutions: string[],
        coin_types: string[]
    }
) => {
    // 如果ecosystem_id为0，则设置为null
    if (data.ecosystem_id === 0) {
        data.ecosystem_id = null;
    }
    
    return api.put(`/coins/${id}`, data);
}


//删除
export const deleteCoin=(
    id:number
)=>api.delete(`/coins/${id}`)
//****************************币种基本信息****************************