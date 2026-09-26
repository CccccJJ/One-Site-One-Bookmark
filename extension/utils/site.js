const _KEY = "enabled_sites"

async function get_enabled_sites() {
    const result = await chrome.storage.local.get(_KEY)

    return result[_KEY] ?? {}
}

export async function is_site_enabled(hostname) {
    return hostname in await get_enabled_sites()
}

export async function enable_site(hostname) {
    const sites = await get_enabled_sites()
    sites[hostname] = new Date().toString()
    await chrome.storage.local.set({[_KEY]: sites})
}

export async function disable_site(hostname) {
    const sites = await get_enabled_sites()
    delete sites[hostname]
    await chrome.storage.local.set({[_KEY]: sites})
}
