//****************************新闻热度信息****************************
import api from "./api";
//获取新闻热度列表
export const fetchAllEventNews = () => {
    return api.get('/all_event_news')
}
//
export const fetchEvents=(params: { page: number; per_page: number; search?: string })=>{
    return api.get('/events',{params})
}

//创建
export const createEvent=(
    data:{
        event_name:string,
        event_date:Date,
        event_type_id:number| null,
        influence_score:number,
        description:string,
        coin_id:[number]
        }

)=>{
        // 如果ecosystem_id为0，则设置为null
        if (data.event_type_id === 0) {
            data.event_type_id = null;
        }
        return api.post('/events',data)
}

//修改
export const updateEvent=(
    id:number,
    data:{
        event_name:string,
        event_date:Date,
        event_type_id:number,
        influence_score:number,
        description:string,
        coin_id:[number]

    }
)=>api.put(`/events/${id}`,data)

//删除
export const deleteEvent=(
    id:number
)=>api.delete(`/events/${id}`)


////****************************事件类型****************************
export const fetchEventTypes=()=>{
    return api.get('/event_types')
}

//创建
export const createEventType=(
    data:{
        name:string
        description:string
    }
)=>api.post('/event_types',data)

//修改
export const updateEventType=(
    id:number,
    data:{
        name:string
        description:string
    }
)=>api.put(`/event_types/${id}`,data)

//删除
export const deleteEventType=(
    id:number
)=>api.delete(`/event_types/${id}`)