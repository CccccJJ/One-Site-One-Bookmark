import {is_site_enabled, enable_site, disable_site} from './utils/site.js'
import {find_bookmarks_by_domain, get_trash} from './utils/bookmark.js'

const _BTN = document.querySelector("#btn");
const _CIRCLE = document.querySelector("#btn-circle");
const _TEXT = document.querySelector("#btn-text");
const _HOSTNAME = document.querySelector("#hostname");
const _COUNT = document.querySelector("#count");
const _CONFIRM = document.querySelector("#confirm");
const _CONFIRM_TEXT = document.querySelector("#confirm-text");
const _CONFIRM_OK = document.querySelector("#confirm-ok");
const _CONFIRM_CANCEL = document.querySelector("#confirm-cancel");
const _TRASH = document.querySelector("#trash");
const _TRASH_EMPTY = document.querySelector("#trash-empty");
const _TRASH_COUNT = document.querySelector("#trash-count");

(async function() {
    const hostname = await get_curr_tab_hostname()

    render_trash(hostname)

    if(!hostname) {
        _HOSTNAME.textContent = "当前页面不支持"
        page_disabled_state()
        return
    }

    _HOSTNAME.textContent = hostname
    await is_site_enabled(hostname)? page_on_state() : page_off_state();
    render_count(hostname)

    bind_action(hostname)
})()

async function get_curr_tab_hostname() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
    if(!tab?.url) {
        return null
    }

    const url = new URL(tab.url)

    return ["http:", "https:"].includes(url.protocol)? url.hostname : null
}

async function count_site_bookmarks(hostname) {
    const tree = await chrome.bookmarks.getTree()

    return find_bookmarks_by_domain(tree, hostname).length
}

async function render_count(hostname) {
    _COUNT.textContent = `本站已有 ${await count_site_bookmarks(hostname)} 个收藏`
}

function bind_action(hostname) {
    _BTN.onclick = async function(){
        turn_state(hostname)
    }

    _CONFIRM_OK.onclick = function() {
        _CONFIRM.hidden = true
        page_on_state()
        enable_site(hostname)
    }

    _CONFIRM_CANCEL.onclick = function() {
        _CONFIRM.hidden = true
    }
}

async function turn_state(hostname) {
    if(await is_site_enabled(hostname)) {
        page_off_state()
        disable_site(hostname)
        return
    }

    const count = await count_site_bookmarks(hostname)
    if(count > 1) {
        _CONFIRM_TEXT.textContent = `开启后，下次在本站收藏会删除现有的 ${count} 个收藏（可在「最近删除」中恢复）`
        _CONFIRM.hidden = false
        return
    }

    page_on_state()
    enable_site(hostname)
}

async function render_trash(hostname) {
    const trash = await get_trash()

    _TRASH_EMPTY.hidden = trash.length > 0
    _TRASH.replaceChildren(...trash.map(item => {
        const li = document.createElement("li")

        const text = document.createElement("div")
        text.className = "item-text"
        text.title = item.url

        const title = document.createElement("span")
        title.className = "item-title"
        title.textContent = item.title || item.url

        const url = document.createElement("span")
        url.className = "item-url"
        url.textContent = item.url.replace(/^https?:\/\//, "")

        text.append(title, url)

        const btn = document.createElement("button")
        btn.className = "btn-restore"
        btn.textContent = "恢复"
        btn.onclick = function() {
            restore(item.id, hostname)
        }

        li.append(text, btn)
        return li
    }))
    _TRASH_COUNT.textContent = trash.length || ""
}

async function restore(id, hostname) {
    const response = await chrome.runtime.sendMessage({type: "restore", id})
    if(!response?.ok) {
        console.log(`恢复书签出错. ${response?.error}`)
    }

    render_trash(hostname)
    if(hostname) {
        render_count(hostname)
    }
}

function page_on_state() {
    _BTN.className = "btn-on"
    _CIRCLE.className = "btn-on-circle"
    _TEXT.className = "btn-on-text"
    _TEXT.innerHTML = "ON"
}

function page_off_state() {
    _BTN.className = "btn-off"
    _CIRCLE.className = "btn-off-circle"
    _TEXT.className = "btn-off-text"
    _TEXT.innerHTML = "OFF"
}

function page_disabled_state() {
    page_off_state()
    _BTN.className = "btn-off btn-disabled"
}
