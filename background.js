// background.js - Unifica menú contextual y popup con extracción de ID desde la página actual

importScripts("facebook.js");

const ACCESS_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";


// ========== MANEJO DEL MENÚ CONTEXTUAL ==========
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "openFullSizeProfilePicture") {
        const url = tab.url || await get_current_tab_url();
        
        if (url.includes("facebook.com") || url.includes("messenger.com")) {
            try {
                const username = await get_current_username(url);
                let finalUrl = null;

                const profileId = await resolveProfileIdFromPage(tab.id, username);
                if (profileId) {
                    finalUrl = await getProfilePictureUrlFromAPI(profileId);
                }

                // Fallback DOM si API falla
                if (!finalUrl) {
                    const domPic = await getProfilePhotoFromDOM(tab.id);
                    finalUrl = optimizeFbImageUrl(domPic);
                }

                if (finalUrl) {
                    chrome.tabs.create({ url: finalUrl });
                } else {
                    console.error("[Context Menu] No se pudo obtener la foto.");
                }
            } catch (error) {
                console.error("[Context Menu] Error:", error);
            }
        }
    }
});

function get_current_tab_url() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            const tab = tabs[0];
            if (tab && tab.url) resolve(tab.url);
            else reject(new Error("No active tab found"));
        });
    });
}

// ========== ESCUCHA DE MENSAJES DEL POPUP ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getBothPhotos") {
        procesarFotosDelPopup(sendResponse);
        return true;
    }
});

async function procesarFotosDelPopup(sendResponse) {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) throw new Error("No se encontró una pestaña activa");
        
        const tab = tabs[0];
        if (!tab.url || !tab.url.includes('facebook.com')) throw new Error("Solo funciona en Facebook");

        const username = await get_current_username(tab.url);
        if (!username) throw new Error("No se detecto un perfil de Facebook.");

        let profilePicUrl = null;

        // 1. Resolver ID desde la página actual
        const profileId = await resolveProfileIdFromPage(tab.id, username);

        // 2. Intentar Graph API con el ID
        if (profileId) {
            try {
                profilePicUrl = await getProfilePictureUrlFromAPI(profileId);
            } catch (apiErr) {
                console.warn('[Popup] Graph API falló, usando DOM...');
            }
        }

        // 3. Fallback visual mejorado
        if (!profilePicUrl) {
            const domPicUrl = await getProfilePhotoFromDOM(tab.id);
            if (domPicUrl) profilePicUrl = optimizeFbImageUrl(domPicUrl);
        }

        if (!profilePicUrl) {
            throw new Error("No se pudo extraer la foto. Recarga la página o abre el perfil directamente.");
        }
        
        const coverPic = await getCoverPhotoFromDOM(tab.id);
        
        sendResponse({
            profile: { url: profilePicUrl, size: 240 },
            cover: coverPic
        });
    } catch (err) {
        console.error('[Popup] Error:', err);
        sendResponse({ error: err.message });
    }
}

/**
 * Resuelve el ID numérico del perfil extrayéndolo del HTML de la página actual (sin CORS)
 * @param {number} tabId - ID de la pestaña
 * @param {string} username - username o ID textual
 * @returns {Promise<string|null>}
 */
async function resolveProfileIdFromPage(tabId, username) {
    // Si ya es numérico, devolver tal cual
    if (/^\d+$/.test(username)) {
        return username;
    }

    // Extraer ID desde el HTML de la página actual (evita CORS)
    const idFromPage = await extractUserIdFromPageHTML(tabId, username);
    if (idFromPage) return idFromPage;

    return null;
}

/**
 * Extrae el userID del HTML de la página actual mediante scripting
 */
function extractUserIdFromPageHTML(tabId, targetUsername) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (username) => {
                // Función que se ejecuta dentro de la página de Facebook
                const scripts = document.querySelectorAll('script');
                let loggedInId = null;
                
                // Primero encontrar el ID del usuario logueado para filtrarlo
                for (const script of scripts) {
                    const text = script.textContent;
                    if (text) {
                        const matchLog = text.match(/"ACCOUNT_ID"\s*:\s*"(\d+)"/) || 
                                       text.match(/"userID"\s*:\s*"(\d+)"/);
                        if (matchLog) {
                            loggedInId = matchLog[1];
                            break;
                        }
                    }
                }

                // Buscar en todos los scripts algún patrón que contenga el username
                for (const script of scripts) {
                    const content = script.textContent;
                    if (content && content.includes(username)) {
                        // Buscar cualquier ID numérico largo que no sea el loggedInId
                        const allIds = content.match(/"userID":"(\d+)"/g) ||
                                      content.match(/"profile_id":"(\d+)"/g) ||
                                      content.match(/"owner_id":"(\d+)"/g) ||
                                      content.match(/"id":"(\d+)"/g);
                        if (allIds) {
                            for (const match of allIds) {
                                const idMatch = match.match(/(\d+)/);
                                if (idMatch && idMatch[1] !== loggedInId) {
                                    return idMatch[1];
                                }
                            }
                        }
                    }
                }

                // Método alternativo: buscar en meta etiquetas
                const metaAndroid = document.querySelector('meta[property="al:android:url"]');
                if (metaAndroid && metaAndroid.content) {
                    const match = metaAndroid.content.match(/fb:\/\/profile\/(\d+)/);
                    if (match && match[1] !== loggedInId) return match[1];
                }

                // Último recurso: buscar en enlaces dentro de la página
                const links = document.querySelectorAll('a[href*="/profile.php?id="]');
                for (const link of links) {
                    const href = link.getAttribute('href');
                    const match = href.match(/[?&]id=(\d+)/);
                    if (match && match[1] !== loggedInId) return match[1];
                }

                return null;
            },
            args: [targetUsername]
        }, (results) => {
            resolve(results?.[0]?.result || null);
        });
    });
}

// ========== EXTRACTOR DE FOTO DE PERFIL DESDE DOM ==========
function getProfilePhotoFromDOM(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                const banner = document.querySelector('div[role="banner"]');
                const mainContent = document.querySelector('div[role="main"]');
                const searchRoots = mainContent ? [mainContent] : [document.body];
                
                const selectors = [
                    'svg image[xlink:href*="fbcdn.net"]',
                    'svg image[href*="fbcdn.net"]',
                    'div[data-pagelet="ProfileTimelineHeaderAvatar"] image',
                    'div[data-pagelet="ProfileTimelineHeaderAvatar"] img',
                    'img[alt*="Profile picture" i]',
                    'img[alt*="Foto de perfil" i]',
                    'img[data-image-type="profile"]',
                    'img[class*="avatar"]',
                    'img[class*="profile"]'
                ];

                for (const root of searchRoots) {
                    for (const selector of selectors) {
                        const el = root.querySelector(selector);
                        if (el) {
                            let src = el.getAttribute('xlink:href') || el.getAttribute('href') || el.src;
                            if (src && src.includes('fbcdn.net') && !src.includes('/rsrc.php')) {
                                return src;
                            }
                        }
                    }
                }

                // Barrido global excluyendo banner
                const allImages = document.querySelectorAll('image, img');
                for (const img of allImages) {
                    if (banner && banner.contains(img)) continue;
                    let src = img.getAttribute('xlink:href') || img.getAttribute('href') || img.src;
                    if (src && src.includes('fbcdn.net') && 
                        (src.includes('/t39.30808-1/') || src.includes('/t51.2885-15/'))) {
                        return src;
                    }
                }
                return null;
            }
        }, (results) => resolve(results?.[0]?.result || null));
    });
}

function optimizeFbImageUrl(url) {
    if (!url) return url;
    return url.replace(/_s\d+x\d+_/i, '_s640x640_').replace(/_n\.jpg/i, '_o.jpg');
}

async function getProfilePictureUrlFromAPI(profileId) {
    const apiUrl = `https://graph.facebook.com/${profileId}/picture?width=5000&access_token=${ACCESS_TOKEN}`;
    const response = await fetch(apiUrl, { redirect: 'follow' });
    if (!response.ok) throw new Error("Graph API error");
    return response.url;
}

function getCoverPhotoFromDOM(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                const mainContent = document.querySelector('div[role="main"]');
                const searchRoot = mainContent || document.body;
                const banner = document.querySelector('div[role="banner"]');
                
                let bestCover = { url: null, size: 0 };
                const coverSelectors = [
                    'img[data-image-type="cover"]',
                    'div[data-pagelet="ProfileCover"] img',
                    'img[alt*="Cover photo" i]',
                    'img[src*="cover"][src*="fbcdn"]',
                    'img[data-imgperflogname="profileCoverPhoto"]'
                ];
                for (const selector of coverSelectors) {
                    const img = searchRoot.querySelector(selector);
                    if (img && img.src && img.src.includes('fbcdn.net') && !img.src.includes('/rsrc.php')) {
                        let size = parseInt(img.src.match(/[ps](\d+)x(\d+)/i)?.[1] || 0);
                        size = Math.max(size, img.naturalWidth || img.width, img.naturalHeight || img.height);
                        if (size > bestCover.size) bestCover = { url: img.src, size: size };
                    }
                }
                if (!bestCover.url) {
                    const allImages = document.querySelectorAll('img[src*="fbcdn.net"]');
                    for (const img of allImages) {
                        if (img.src.includes('/rsrc.php')) continue;
                        if (banner && banner.contains(img)) continue;
                        let size = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
                        if (size > bestCover.size && size > 150) bestCover = { url: img.src, size: size };
                    }
                }
                return bestCover;
            }
        }, (results) => resolve(results?.[0]?.result || { url: null, size: 0 }));
    });
}