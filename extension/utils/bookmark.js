const _TRASH_KEY = "trash"
const _TRASH_LIMIT = 50
const _TRASH_TTL = 7 * 24 * 60 * 60 * 1000

export function find_bookmarks_by_domain(bookmarkNodes, domain) {
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

export async function get_trash() {
    const result = await chrome.storage.local.get(_TRASH_KEY)
    const now = Date.now()

    return (result[_TRASH_KEY] ?? []).filter(item => now - item.removed_at < _TRASH_TTL)
}

export async function add_to_trash(bookmarks) {
    const removed_at = Date.now()
    const items = bookmarks.map(bm => ({
        id: bm.id,
        title: bm.title,
        url: bm.url,
        parentId: bm.parentId,
        index: bm.index,
        removed_at,
    }))
    const trash = [...items, ...await get_trash()].slice(0, _TRASH_LIMIT)
    await chrome.storage.local.set({[_TRASH_KEY]: trash})
}

export async function remove_from_trash(id) {
    const trash = (await get_trash()).filter(item => item.id !== id)
    await chrome.storage.local.set({[_TRASH_KEY]: trash})
}

export async function clear_trash() {
    await chrome.storage.local.set({[_TRASH_KEY]: []})
}
