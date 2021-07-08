document.getElementById("btn").onclick =()=>{
    chrome.bookmarks.getTree((e)=>{
        (async ()=>{
            const res = await (await fetch("http://localhost:81/Dome/Index/bookmarksSync", {
                method:"post",
                headers:{
                    "content-type":"application/json"
                },
                body:JSON.stringify({
                    bookmarks:e
                })
            })).json();
            console.log(res.data)
        })()

    })
}


