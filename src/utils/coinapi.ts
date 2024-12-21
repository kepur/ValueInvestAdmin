import api from "./api";

//****************************币种类型****************************
export const fetchAllCoinTypes =()=>{
    return api.get('/cointypes')
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
export const fetchAllFounders=()=>{
    return api.get('/founders')
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
export const fetchAllEcosystems=()=>{
    return api.get('/ecosystems')
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
export const fetchAllInvestmentInstitutions=()=>{
    return api.get('/investmentinstitutions')
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

export const fetchAllCoinInvestment=()=>{
    return api.get('/coininvestment')
}
//创建
export const createCoinInvestment=(
    data:{
        coin_id:number,
        institution_id:number,
        holding_amount:number,
        holding_percentage:number
    }
)=>api.post('/coininvestment',data)

//修改
export const updateCoinInvestment=(
    id:number,
    data:{
        coin_id:number,
        institution_id:number,
        holding_amount:number,
        holding_percentage:number
    }
)=>api.put(`/coininvestment/${id}`,data)

//删除
export const deleteCoinInvestment=(
    id:number
)=>api.delete(`/coininvestment/${id}`)

//****************************币种基本信息****************************