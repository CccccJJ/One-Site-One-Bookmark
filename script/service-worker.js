import {is_site_enabled} from './utils/site.js'

async function process_new_bookmark(bookmark) {
    if(!bookmark.url){
        return
    }

    const domain = new URL(bookmark.url).hostname;

    if(!await is_site_enabled(domain)){
        return
    }

    const tree = await chrome.bookmarks.getTree();

    const existBookmarks = findBookMarksByDomain(tree, domain);

    const otherBookmarks = existBookmarks.filter(bm => {
        return bm.id !== bookmark.id;
    });

    for(const bm of otherBookmarks) {
        try {
            await chrome.bookmarks.remove(bm.id);
        } catch(e) {
            console.log(`${bm.url} 删除书签出错. ${e}`)
        }
    }
}
function findBookMarksByDomain(bookmarkNodes, domain) {
    const result = [];
    function traverse(nodes) {
        for(const node of nodes) {            
            if(node.url){
                try {
                    const url = new URL(node.url);
                    if (url.hostname === domain){
                        result.push(node);
                    }
                } catch(e) {
                    console.log(`${node.url} 实例化 URL 出错. ${e}`)
                }
            }else if(node.children) {
                traverse(node.children)
            }
        }
    }

    traverse(bookmarkNodes);

    return result;
}


chrome.bookmarks.onCreated.addListener((_, bookmark) => {
    process_new_bookmark(bookmark);
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.remove("recorded_datetime");
});