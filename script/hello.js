import {curr_tab_site_is_recorded} from './utils/tab.js'

const _BTN = document.querySelector("#btn");
const _CIRCLE = document.querySelector("#btn-circle");
const _TEXT = document.querySelector("#btn-text");

(async function() {
    await curr_tab_site_is_recorded()? page_on_state() : page_off_state();

    bind_action()
})()

function bind_action() {
    _BTN.onclick = async function(){
        turn_state()
    }
}

async function turn_state() {
    if(await curr_tab_site_is_recorded()) {
        page_off_state()
        remove_site_setting()
    } else {
        page_on_state()
        record_site_setting()
    }
}

async function record_site_setting() {
    await chrome.storage.local.set({"recorded_datetime": new Date().toString()})
}

async function remove_site_setting() {
    await chrome.storage.local.remove("recorded_datetime")
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
