async function process_new_bookmark(bookmark) {
    const newUrl = new URL(bookmark.url);
    const domain = newUrl.hostname;

    const tree = await chrome.bookmarks.getTree();

    const existBookmarks = findBookMarksByDomain(tree, domain);

    const otherBookmarks = existBookmarks.filter(bm => {
        return bm.id !== bookmark.id;
    });

    otherBookmarks.forEach(async bm => {
        await chrome.bookmarks.remove(bm.id);
    })
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