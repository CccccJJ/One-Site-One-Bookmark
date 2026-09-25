import {is_site_enabled, enable_site, disable_site} from './utils/site.js'

const _BTN = document.querySelector("#btn");
const _CIRCLE = document.querySelector("#btn-circle");
const _TEXT = document.querySelector("#btn-text");

(async function() {
    const hostname = await get_curr_tab_hostname()
    if(!hostname) {
        page_disabled_state()
        return
    }

    await is_site_enabled(hostname)? page_on_state() : page_off_state();

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

function bind_action(hostname) {
    _BTN.onclick = async function(){
        turn_state(hostname)
    }
}

async function turn_state(hostname) {
    if(await is_site_enabled(hostname)) {
        page_off_state()
        disable_site(hostname)
    } else {
        page_on_state()
        enable_site(hostname)
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
