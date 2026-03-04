const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    return await cache.addAll(resources);
}

const putInCache = async (request, response) => {
    const cache = await caches.open('v1');
    await cache.put(request, response);
};

const cacheLast = async (request) => {
    const cache = await caches.open('v1');

    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            await putInCache(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (_) {
        // network unavailable — fall through to cache
    }

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

const extractManifestResources = async () => {
    const manifestResponse = await fetch('/.vite/manifest.json');
    const manifest = await manifestResponse.json();

    const resourceObj = manifest['index.html'];
    const resources = []

    for (const key of Object.keys(resourceObj)) {
        if (key === 'file' ||key === 'css' || key === "assets") {
            const value = resourceObj[key];
            if (Array.isArray(value)) {
                for (const v of value) {
                resources.push(v);
                }
            } else {
                resources.push(value);
            }
        }
    }

    return resources;
}

const extractWebManifestIconResources = async () => {
    const manifestResponse = await fetch('/.vite/manifest.json');
    const manifest = await manifestResponse.json();

    const resourceObj = manifest['webmanifest.json'];

    const webManifestResponse = await fetch(resourceObj.file);
    const webManifest = await webManifestResponse.json();

    try {
        const icons = Array.isArray(webManifest.icons) ? webManifest.icons : [];
        return icons
            .map((icon) => icon.src)
            .filter(Boolean);
    } catch (error) {
        return [];
    }
}

const initialResourcesLoad = async () => {
    const [resources, iconResources] = await Promise.all([
        extractManifestResources(),
        extractWebManifestIconResources()
    ]);
    const cacheResources = ["/", "/index.html", "/logo.png", "/webmanifest.json", ...resources, ...iconResources];
    await addResourcesToCache(cacheResources);
}

self.addEventListener("install", (event) => {
    event.waitUntil(initialResourcesLoad());
});

self.addEventListener("activate", (event) => {
    // 
});

self.addEventListener("fetch", async (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(cacheLast(event.request));
});
