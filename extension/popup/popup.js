import {is_site_enabled, enable_site, disable_site} from '../utils/site.js'
import {find_bookmarks_by_domain, get_trash} from '../utils/bookmark.js'

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
const _TRASH_SECTION = document.querySelector("#trash-section");
const _TRASH_TOGGLE = document.querySelector("#trash-toggle");
const _TRASH_CLEAR = document.querySelector("#trash-clear");

// 清空按钮处于「确认清空？」状态时的超时计时器
let clear_timer = null;

(async function() {
    localize_page()

    const hostname = await get_curr_tab_hostname()

    render_trash(hostname)
    bind_trash_action(hostname)

    if(!hostname) {
        _HOSTNAME.textContent = t("unsupported_page")
        page_disabled_state()
        return
    }

    _HOSTNAME.textContent = hostname
    await is_site_enabled(hostname)? page_on_state() : page_off_state();
    render_count(hostname)

    bind_action(hostname)
})()

function t(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions)
}

function localize_page() {
    document.documentElement.lang = chrome.i18n.getUILanguage()
    for(const el of document.querySelectorAll("[data-i18n]")) {
        el.textContent = t(el.dataset.i18n)
    }
}

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
    _COUNT.textContent = t("site_bookmark_count", [String(await count_site_bookmarks(hostname))])
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
        _CONFIRM_TEXT.textContent = t("confirm_enable_text", [String(count)])
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

        const meta = document.createElement("div")
        meta.className = "item-meta"

        const url = document.createElement("span")
        url.className = "item-url"
        url.textContent = item.url.replace(/^https?:\/\//, "")

        const time = document.createElement("span")
        time.className = "item-time"
        time.textContent = format_time_ago(item.removed_at)

        meta.append(url, time)
        text.append(title, meta)

        const btn = document.createElement("button")
        btn.className = "btn-restore"
        btn.textContent = t("restore")

        const discard = document.createElement("button")
        discard.className = "btn-discard"
        discard.textContent = "×"
        discard.title = t("discard_title")

        btn.onclick = function() {
            btn.disabled = discard.disabled = true
            trash_action({type: "restore", id: item.id}, hostname)
        }
        discard.onclick = function() {
            btn.disabled = discard.disabled = true
            trash_action({type: "discard", id: item.id}, hostname)
        }

        li.append(text, btn, discard)
        return li
    }))
    _TRASH_COUNT.textContent = trash.length || ""
    _TRASH_CLEAR.hidden = trash.length === 0
}

function bind_trash_action(hostname) {
    _TRASH_TOGGLE.onclick = function() {
        _TRASH_SECTION.classList.toggle("expanded")
        reset_clear_button()
    }

    _TRASH_CLEAR.onclick = function() {
        if(!clear_timer) {
            _TRASH_CLEAR.textContent = t("confirm_clear")
            _TRASH_CLEAR.classList.add("danger")
            clear_timer = setTimeout(reset_clear_button, 3000)
            return
        }

        reset_clear_button()
        trash_action({type: "clear"}, hostname)
    }
}

function reset_clear_button() {
    clearTimeout(clear_timer)
    clear_timer = null
    _TRASH_CLEAR.textContent = t("clear")
    _TRASH_CLEAR.classList.remove("danger")
}

async function trash_action(message, hostname) {
    const response = await chrome.runtime.sendMessage(message)
    if(!response?.ok) {
        console.log(`${message.type} 出错. ${response?.error}`)
    }

    render_trash(hostname)
    if(hostname) {
        render_count(hostname)
    }
}

function format_time_ago(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 60000)
    if(minutes < 1) {
        return t("time_just_now")
    }
    if(minutes < 60) {
        return t("time_minutes_ago", [String(minutes)])
    }
    if(minutes < 60 * 24) {
        return t("time_hours_ago", [String(Math.floor(minutes / 60))])
    }

    return t("time_days_ago", [String(Math.floor(minutes / 60 / 24))])
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
