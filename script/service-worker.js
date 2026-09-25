import {is_site_enabled} from './utils/site.js'
import {find_bookmarks_by_domain, get_trash, add_to_trash, remove_from_trash} from './utils/bookmark.js'

let importing = false;

// 正在恢复的书签 URL, 其 onCreated 不触发删除
const restoring_urls = new Set();

// 正在恢复的 trash 条目 id, 防止连点重复恢复
const restoring_ids = new Set();

async function process_new_bookmark(bookmark) {
    if(!bookmark.url || importing){
        return
    }

    if(restoring_urls.delete(bookmark.url)){
        return
    }

    const domain = new URL(bookmark.url).hostname;

    if(!await is_site_enabled(domain)){
        return
    }

    const tree = await chrome.bookmarks.getTree();

    const existBookmarks = find_bookmarks_by_domain(tree, domain);

    const otherBookmarks = existBookmarks.filter(bm => {
        return bm.id !== bookmark.id;
    });

    await add_to_trash(otherBookmarks);

    for(const bm of otherBookmarks) {
        try {
            await chrome.bookmarks.remove(bm.id);
        } catch(e) {
            console.log(`${bm.url} 删除书签出错. ${e}`)
            await remove_from_trash(bm.id);
        }
    }
}

async function restore_bookmark(id) {
    if(restoring_ids.has(id)){
        return
    }

    restoring_ids.add(id);
    try {
        await restore_from_trash(id);
    } finally {
        restoring_ids.delete(id);
    }
}

async function restore_from_trash(id) {
    const item = (await get_trash()).find(bm => bm.id === id);
    if(!item){
        return
    }

    let position = {};
    try {
        const siblings = await chrome.bookmarks.getChildren(item.parentId);
        position = {parentId: item.parentId, index: Math.min(item.index, siblings.length)};
    } catch(e) {
        console.log(`${item.url} 原文件夹已不存在, 恢复到默认位置. ${e}`)
    }

    restoring_urls.add(item.url);
    try {
        await chrome.bookmarks.create({...position, title: item.title, url: item.url});
    } catch(e) {
        restoring_urls.delete(item.url);
        throw e;
    }

    await remove_from_trash(id);
}


chrome.bookmarks.onCreated.addListener((_, bookmark) => {
    process_new_bookmark(bookmark);
});

chrome.bookmarks.onImportBegan.addListener(() => {
    importing = true;
});

chrome.bookmarks.onImportEnded.addListener(() => {
    importing = false;
});

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if(message.type !== "restore"){
        return
    }

    restore_bookmark(message.id).then(
        () => sendResponse({ok: true}),
        e => sendResponse({ok: false, error: String(e)})
    );

    return true;
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.remove("recorded_datetime");
});
