export async function curr_tab_site_is_recorded() {
    let site_setting =  await chrome.storage.local.get("recorded_datetime")

    return Object.keys(site_setting).length != 0
}
