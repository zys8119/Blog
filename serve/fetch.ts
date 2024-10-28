import axios from "axios";
type Body = {
    [k:string]:any
    stream?:boolean
}
globalThis.fetch = async function (url: any, config: Record<any, any>) {
  let body:Body = {} as Body
  try{
    body = JSON.parse(config.body)
  }catch(e){
    body = {} as Body
  }
  const res = await axios({
    url,
    ...config,
    data: config.body,
    responseType: config.responseType || (body.stream ? 'stream' : null) as any || null,
  });
  const getBody = ()=>{
    if(body.stream){
        return {
            getReader(){
                return {
                    read:async function (){
                        return new Promise(resolve=>{
                            res.data.on("data", (e) => {
                                resolve({
                                    done:false,
                                    value:e
                                })
                            });
                            res.data.on("end", () => {
                                resolve({
                                    done:true,
                                    value:null
                                })
                            });
                        })
                    }
                }
            }
        }
    }
  }
  return Promise.resolve({
    ...res,
    ok:true,
    headers: res.headers,
    body:getBody() as any,
    async json(){
        return res.data
    },
    async text(){
        return res.data
    }
  } as unknown as Response);
};
