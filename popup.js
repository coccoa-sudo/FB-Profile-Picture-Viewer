// popup.js - UI moderna con idioma EN/ESP, Dark Mode, Lanczos upscaling y modal

// ========== IDIOMA (EN/ESP) ==========
let currentLang = 'en';

const translations = {
    en: {
        brand: 'FB Profile Picture Viewer',
        assetProfile: 'ASSET 01',
        assetCover: 'ASSET 02',
        profileTitle: 'Profile Picture',
        coverTitle: 'Cover Photo',
        downloadOriginal: 'Download Original',
        upscale: 'Upscale x2',
        downloadCover: 'Download Cover',
        exportHD: 'Export HD (.png)',
        processing: 'PROCESSING CANVAS AI',
        consoleNote: 'Right-click on the native element allows "Open Full-Size Profile Picture" as an alternative.',
        loadingProfile: 'Getting profile picture...',
        loadingCover: 'Getting cover photo...',
        errorNoProfile: 'No profile detected on this Facebook page.',
        errorExtract: 'Could not extract image. Reload the page or open the profile directly.',
        errorCors: 'CORS error. Cannot process this URL in Canvas.',
        successUpscale: '✅ Local upscaling completed',
        modalPrefix: '// VIEWING:',
        modalZoom: '[Wheel: Zoom | Drag: Pan]',
        noImage: '[ NO IMAGE AVAILABLE ]'
    },
    es: {
        brand: 'FB Profile Picture Viewer',
        assetProfile: 'RECURSO 01',
        assetCover: 'RECURSO 02',
        profileTitle: 'Foto de Perfil',
        coverTitle: 'Foto de Portada',
        downloadOriginal: 'Descargar Original',
        upscale: 'Reescalar x2',
        downloadCover: 'Descargar Portada',
        exportHD: 'Exportar Flujo HD (.png)',
        processing: 'PROCESAMIENTO CANVAS IA',
        consoleNote: 'Clic derecho sobre el elemento nativo permite "Open Full-Size Profile Picture" como alternativa.',
        loadingProfile: 'Obteniendo foto de perfil...',
        loadingCover: 'Obteniendo foto de portada...',
        errorNoProfile: 'No se detectó un perfil de Facebook.',
        errorExtract: 'No se pudo extraer la foto. Recarga la página o abre el perfil directamente.',
        errorCors: 'Error de origen (CORS). No se permite procesar esta URL en Canvas.',
        successUpscale: '✅ Reescalado completado localmente',
        modalPrefix: '// VISUALIZANDO:',
        modalZoom: '[Rueda: Zoom | Arrastrar: Pan]',
        noImage: '[ NO HAY IMAGEN DISPONIBLE ]'
    }
};

const hasStorage = chrome.storage && chrome.storage.local;

async function loadLanguage() {
    if (!hasStorage) {
        applyLanguage('en');
        return;
    }
    return new Promise((resolve) => {
        chrome.storage.local.get(['lang'], (result) => {
            currentLang = result.lang || 'en';
            applyLanguage(currentLang);
            resolve();
        });
    });
}

function applyLanguage(lang) {
    const t = translations[lang];
    
    // Brand
    document.getElementById('brandTitle').innerHTML = t.brand;
    
    // Asset labels
    const assetProfile = document.querySelector('[data-i18n-asset="profile"]');
    if (assetProfile) assetProfile.textContent = t.assetProfile;
    const assetCover = document.querySelector('[data-i18n-asset="cover"]');
    if (assetCover) assetCover.textContent = t.assetCover;
    
    // Titles
    const titleProfile = document.querySelector('[data-i18n-title="profile"]');
    if (titleProfile) titleProfile.textContent = t.profileTitle;
    const titleCover = document.querySelector('[data-i18n-title="cover"]');
    if (titleCover) titleCover.textContent = t.coverTitle;
    
    // Buttons
    const downloadProfileBtn = document.getElementById('downloadProfileBtn');
    if (downloadProfileBtn) downloadProfileBtn.textContent = t.downloadOriginal;
    const upscaleProfileBtn = document.getElementById('upscaleProfileBtn');
    if (upscaleProfileBtn) upscaleProfileBtn.textContent = t.upscale;
    const downloadCoverBtn = document.getElementById('downloadCoverBtn');
    if (downloadCoverBtn) downloadCoverBtn.textContent = t.downloadCover;
    const downloadUpscaledBtn = document.getElementById('downloadUpscaledBtn');
    if (downloadUpscaledBtn) downloadUpscaledBtn.textContent = t.exportHD;
    
    // IA header
    const iaIndicator = document.querySelector('.ia-indicator');
    if (iaIndicator) iaIndicator.textContent = t.processing;
    
    // Console note
    // const consoleNoteText = document.getElementById('consoleNoteText');
    // if (consoleNoteText) consoleNoteText.textContent = t.consoleNote;
    
    // Lang toggle button title
    const langToggle = document.getElementById('langToggle');
    if (langToggle) langToggle.title = lang === 'en' ? 'Cambiar a español' : 'Switch to English';
}

async function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    await chrome.storage.local.set({ lang: currentLang });
    applyLanguage(currentLang);
    const langBtn = document.getElementById('langToggle');
    if (langBtn) langBtn.textContent = currentLang === 'en' ? 'EN' : 'ESP';
}

// ========== DARK MODE (SOLO CLARO / OSCURO) ==========
let currentTheme = 'light';

async function loadTheme() {
    if (!hasStorage) {
        applyTheme('light');
        return;
    }
    return new Promise((resolve) => {
        chrome.storage.local.get(['theme'], (result) => {
            let saved = result.theme;
            if (!saved || saved === 'system') saved = 'light';
            currentTheme = saved;
            applyTheme(currentTheme);
            resolve();
        });
    });
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.title = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }
}

async function toggleTheme() {
    if (!hasStorage) {
        const isDark = document.body.classList.contains('dark-mode');
        applyTheme(isDark ? 'light' : 'dark');
        return;
    }
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    await chrome.storage.local.set({ theme: currentTheme });
    applyTheme(currentTheme);
}

// ========== HELPERS VISUALES TRADUCIDOS ==========

function showError(keyOrMessage, isKey = true) {
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) return;
    let message = isKey ? (translations[currentLang][keyOrMessage] || keyOrMessage) : keyOrMessage;
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 4000);
}

function showSpinner(containerId, keyMessage) {
    const container = document.getElementById(containerId);
    if (container) {
        const msg = translations[currentLang][keyMessage] || keyMessage;
        container.innerHTML = `<div class="loading-spinner" title="${msg}"></div>`;
        container.classList.remove('empty-state');
    }
}

function renderImage(containerId, imageUrl, altText, infoText = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.classList.remove('empty-state');
    container.innerHTML = `<img src="${imageUrl}" alt="${altText}">`;
    if (infoText) {
        console.log(`[${altText}] ${infoText}`);
    }
}

// ========== REESCALADO LOCAL CON LANCZOS ==========

function lanczosKernel(x) {
    if (x === 0) return 1;
    if (Math.abs(x) >= 3) return 0;
    const pix = Math.PI * x;
    return (Math.sin(pix) / pix) * (Math.sin(pix / 3) / (pix / 3));
}

function lanczosResize(srcData, srcW, srcH, dstW, dstH) {
    const dstData = new ImageData(dstW, dstH);
    const srcPixels = srcData.data;
    const dstPixels = dstData.data;
    const scaleX = srcW / dstW;
    const scaleY = srcH / dstH;
    const radius = 3;

    for (let y = 0; y < dstH; y++) {
        for (let x = 0; x < dstW; x++) {
            const srcX = (x + 0.5) * scaleX - 0.5;
            const srcY = (y + 0.5) * scaleY - 0.5;
            const xStart = Math.max(0, Math.floor(srcX - radius));
            const xEnd = Math.min(srcW - 1, Math.ceil(srcX + radius));
            const yStart = Math.max(0, Math.floor(srcY - radius));
            const yEnd = Math.min(srcH - 1, Math.ceil(srcY + radius));

            let r = 0, g = 0, b = 0, a = 0;
            let weightSum = 0;

            for (let iy = yStart; iy <= yEnd; iy++) {
                const dy = srcY - iy;
                const wy = lanczosKernel(dy);
                for (let ix = xStart; ix <= xEnd; ix++) {
                    const dx = srcX - ix;
                    const wx = lanczosKernel(dx);
                    const weight = wx * wy;
                    if (weight === 0) continue;
                    const idx = (iy * srcW + ix) * 4;
                    r += srcPixels[idx] * weight;
                    g += srcPixels[idx + 1] * weight;
                    b += srcPixels[idx + 2] * weight;
                    a += srcPixels[idx + 3] * weight;
                    weightSum += weight;
                }
            }
            if (weightSum === 0) weightSum = 1;
            const dstIdx = (y * dstW + x) * 4;
            dstPixels[dstIdx] = Math.min(255, Math.max(0, r / weightSum));
            dstPixels[dstIdx + 1] = Math.min(255, Math.max(0, g / weightSum));
            dstPixels[dstIdx + 2] = Math.min(255, Math.max(0, b / weightSum));
            dstPixels[dstIdx + 3] = Math.min(255, Math.max(0, a / weightSum));
        }
    }
    return dstData;
}

async function upscaleImageLocally(imageUrl, scaleFactor = 2) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const srcW = img.width;
            const srcH = img.height;
            const dstW = srcW * scaleFactor;
            const dstH = srcH * scaleFactor;
            const offCanvas = new OffscreenCanvas(srcW, srcH);
            const ctx = offCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const srcImageData = ctx.getImageData(0, 0, srcW, srcH);
            try {
                const dstImageData = lanczosResize(srcImageData, srcW, srcH, dstW, dstH);
                const resultCanvas = new OffscreenCanvas(dstW, dstH);
                const resultCtx = resultCanvas.getContext('2d');
                resultCtx.putImageData(dstImageData, 0, 0);
                resultCanvas.convertToBlob({ type: 'image/png' }).then(blob => {
                    resolve(URL.createObjectURL(blob));
                }).catch(reject);
            } catch (err) {
                console.warn('Lanczos falló, usando método tradicional', err);
                const canvas = new OffscreenCanvas(dstW, dstH);
                const ctx2 = canvas.getContext('2d');
                ctx2.imageSmoothingEnabled = true;
                ctx2.imageSmoothingQuality = 'high';
                ctx2.drawImage(img, 0, 0, dstW, dstH);
                canvas.convertToBlob({ type: 'image/png' }).then(blob => {
                    resolve(URL.createObjectURL(blob));
                }).catch(reject);
            }
        };
        img.onerror = () => reject(new Error('CORS error'));
        img.src = imageUrl;
    });
}

// ========== POPUP PRINCIPAL ==========
document.addEventListener('DOMContentLoaded', async () => {
    await loadTheme();
    await loadLanguage();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.textContent = currentLang === 'en' ? 'EN' : 'ESP';
        langToggle.addEventListener('click', toggleLanguage);
    }
    
    const profileContainer = document.getElementById('profileImageContainer');
    const coverContainer = document.getElementById('coverImageContainer');
    const downloadProfileBtn = document.getElementById('downloadProfileBtn');
    const downloadCoverBtn = document.getElementById('downloadCoverBtn');
    const upscaleProfileBtn = document.getElementById('upscaleProfileBtn');
    const upscaledContainer = document.getElementById('upscaledContainer');
    const upscaledImageContainer = document.getElementById('upscaledImageContainer');
    const downloadUpscaledBtn = document.getElementById('downloadUpscaledBtn');
    const errorDiv = document.getElementById('errorMessage');
    
    let currentProfileUrl = null;
    let currentCoverUrl = null;
    let currentUpscaledUrl = null;
    
    showSpinner('profileImageContainer', 'loadingProfile');
    showSpinner('coverImageContainer', 'loadingCover');
    
    upscaleProfileBtn.disabled = true;
    downloadProfileBtn.disabled = true;
    downloadCoverBtn.disabled = true;
    
    chrome.runtime.sendMessage({ action: "getBothPhotos" }, (response) => {
        if (chrome.runtime.lastError) {
            showError(`Error: ${chrome.runtime.lastError.message}`, false);
            profileContainer.innerHTML = '';
            coverContainer.innerHTML = '';
            return;
        }
        if (response.error) {
            let errorKey = response.error.includes("No se detecto") ? 'errorNoProfile' : 'errorExtract';
            showError(errorKey, true);
            profileContainer.innerHTML = '';
            coverContainer.innerHTML = '';
            return;
        }
        
        if (response.profile && response.profile.url) {
            currentProfileUrl = response.profile.url;
            renderImage('profileImageContainer', currentProfileUrl, 'Profile Picture');
            downloadProfileBtn.disabled = false;
            upscaleProfileBtn.disabled = false;
        } else {
            profileContainer.innerHTML = '';
            profileContainer.classList.add('empty-state');
            const pseudoMsg = translations[currentLang].noImage;
            profileContainer.setAttribute('data-empty-msg', pseudoMsg);
        }
        
        if (response.cover && response.cover.url) {
            currentCoverUrl = response.cover.url;
            renderImage('coverImageContainer', currentCoverUrl, 'Cover Photo');
            downloadCoverBtn.disabled = false;
        } else {
            coverContainer.innerHTML = '';
            coverContainer.classList.add('empty-state');
            const pseudoMsg = translations[currentLang].noImage;
            coverContainer.setAttribute('data-empty-msg', pseudoMsg);
        }
    });
    
    downloadProfileBtn.addEventListener('click', () => {
        if (currentProfileUrl) {
            chrome.downloads.download({
                url: currentProfileUrl,
                filename: 'facebook_profile_picture.jpg',
                saveAs: true
            });
        }
    });
    
    downloadCoverBtn.addEventListener('click', () => {
        if (currentCoverUrl) {
            chrome.downloads.download({
                url: currentCoverUrl,
                filename: 'facebook_cover_photo.jpg',
                saveAs: true
            });
        }
    });
    
    upscaleProfileBtn.addEventListener('click', async () => {
        if (!currentProfileUrl) {
            showError('errorExtract', true);
            return;
        }
        upscaleProfileBtn.disabled = true;
        const originalText = upscaleProfileBtn.textContent;
        upscaleProfileBtn.textContent = "⏳ Procesando...";
        upscaledContainer.classList.add('hidden');
        if (errorDiv) errorDiv.classList.add('hidden');
        try {
            const upscaledUrl = await upscaleImageLocally(currentProfileUrl, 2);
            currentUpscaledUrl = upscaledUrl;
            upscaledImageContainer.innerHTML = `<img src="${currentUpscaledUrl}" alt="Upscaled Image">`;
            upscaledImageContainer.classList.remove('empty-state');
            downloadUpscaledBtn.disabled = false;
            upscaledContainer.classList.remove('hidden');
            showError('successUpscale', true);
        } catch (err) {
            console.error('Error al reescalar:', err);
            showError('errorCors', true);
        } finally {
            upscaleProfileBtn.disabled = false;
            upscaleProfileBtn.textContent = originalText;
        }
    });
    
    downloadUpscaledBtn.addEventListener('click', () => {
        if (currentUpscaledUrl) {
            chrome.downloads.download({
                url: currentUpscaledUrl,
                filename: 'facebook_profile_picture_hd.png',
                saveAs: true
            });
        }
    });
    
    // ========== MODAL CON ZOOM Y PAN ==========
    const modal = document.getElementById('imageViewerModal');
    const modalImg = document.getElementById('modalTargetImage');
    const modalClip = document.getElementById('modalImageClip');
    const modalCaption = document.getElementById('modalCaption');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    if (modal) modal.style.display = 'none';
    
    let scale = 1, panX = 0, panY = 0, isDragging = false, startX = 0, startY = 0;
    const MIN_SCALE = 1, MAX_SCALE = 6;
    
    function updateImageTransform(animated = false) {
        if (!modalImg) return;
        modalImg.style.transition = animated ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
        modalImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }
    
    function resetZoomState() {
        scale = 1; panX = 0; panY = 0; isDragging = false;
        updateImageTransform(true);
    }
    
    function openModalViewer(containerId, labelKey) {
        const container = document.getElementById(containerId);
        if (!container || container.classList.contains('empty-state')) return;
        const imgElement = container.querySelector('img');
        if (!imgElement || !imgElement.src) return;
        modalImg.src = imgElement.src;
        const label = translations[currentLang][labelKey] || labelKey;
        modalCaption.textContent = `${translations[currentLang].modalPrefix} ${label.toUpperCase()} ${translations[currentLang].modalZoom}`;
        modal.classList.add('modal-active');
        setTimeout(() => resetZoomState(), 50);
    }
    
    if (profileContainer) {
        profileContainer.addEventListener('click', () => openModalViewer('profileImageContainer', 'profileTitle'));
    }
    if (coverContainer) {
        coverContainer.addEventListener('click', () => openModalViewer('coverImageContainer', 'coverTitle'));
    }
    if (upscaledImageContainer) {
        upscaledImageContainer.addEventListener('click', () => openModalViewer('upscaledImageContainer', 'exportHD'));
    }
    
    if (modalClip) {
        modalClip.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomIntensity = 0.12;
            const previousScale = scale;
            scale = e.deltaY < 0 ? Math.min(scale + zoomIntensity, MAX_SCALE) : Math.max(scale - zoomIntensity, MIN_SCALE);
            if (scale === MIN_SCALE) {
                panX = 0; panY = 0;
                updateImageTransform(true);
                return;
            }
            const rect = modalClip.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;
            panX -= mouseX * (scale / previousScale - 1);
            panY -= mouseY * (scale / previousScale - 1);
            updateImageTransform(false);
        }, { passive: false });
        
        modalClip.addEventListener('mousedown', (e) => {
            if (scale <= 1) return;
            isDragging = true;
            modalClip.classList.add('dragging');
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            e.preventDefault();
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            const maxPan = 400 * scale;
            panX = Math.max(Math.min(panX, maxPan), -maxPan);
            panY = Math.max(Math.min(panY, maxPan), -maxPan);
            requestAnimationFrame(() => updateImageTransform(false));
        });
        
        window.addEventListener('mouseup', () => {
            isDragging = false;
            if (modalClip) modalClip.classList.remove('dragging');
        });
    }
    
    function closeModalViewer() {
        modal.classList.remove('modal-active');
        resetZoomState();
        setTimeout(() => { if (!modal.classList.contains('modal-active')) modalImg.src = ""; }, 200);
    }
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModalViewer);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('viewer-modal-content')) closeModalViewer();
        });
    }
});