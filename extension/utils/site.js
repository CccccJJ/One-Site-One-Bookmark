// 网站开关存在 sync 区域, 每个网站一个 key: 登录 Chrome 时随账号跨设备同步, 未登录时等同本机存储.
// 不用单个对象存所有网站: 多台设备各自「读-改-写」同一对象会互相覆盖.
function site_key(hostname) {
    return `site:${hostname}`
}

export async function is_site_enabled(hostname) {
    const key = site_key(hostname)

    return key in await chrome.storage.sync.get(key)
}

export async function enable_site(hostname) {
    await chrome.storage.sync.set({[site_key(hostname)]: new Date().toString()})
}

export async function disable_site(hostname) {
    await chrome.storage.sync.remove(site_key(hostname))
}
