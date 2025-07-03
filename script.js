document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const videoUrlInput = document.getElementById('video-url');
    const loader = document.getElementById('loader');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    
    // The previous API (co.wuk.sh) is down.
    // This new system uses a list of public servers and tries them
    // one-by-one until it finds one that works. This is much more reliable.
    const API_INSTANCES = [
        'https://vid.puffyan.us',
        'https://inv.id.is',
        'https://invidious.namazso.eu',
        'https://iv.ggtyler.dev',
        'https://invidious.lunar.icu'
    ];

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const videoURL = videoUrlInput.value.trim();
        const videoId = extractVideoId(videoURL);

        if (!videoId) {
            showError("Invalid YouTube URL. Please check the link and try again.");
            return;
        }

        clearUI();
        loader.classList.remove('hidden');

        try {
            const data = await fetchWithFallback(videoId);
            displayResults(data);
        } catch (err) {
            console.error(err);
            showError("Could not fetch video details. All services may be down or the video is private. Please try again later.");
        } finally {
            loader.classList.add('hidden');
        }
    });

    async function fetchWithFallback(videoId) {
        // Shuffle the array to distribute load and not always hit the first one
        const shuffledInstances = API_INSTANCES.sort(() => 0.5 - Math.random());

        for (const instance of shuffledInstances) {
            try {
                const response = await fetch(`${instance}/api/v1/videos/${videoId}`);
                if (!response.ok) {
                    throw new Error(`Instance ${instance} failed`);
                }
                console.log(`Successfully fetched from: ${instance}`);
                return await response.json(); // Success!
            } catch (error) {
                console.warn(`Failed to fetch from ${instance}. Trying next...`);
            }
        }
        throw new Error("All API instances failed.");
    }

    function displayResults(data) {
        resultsDiv.innerHTML = `
            <div id="results-container">
                <div id="video-info">
                    <img src="${data.videoThumbnails.find(t => t.quality === 'medium').url}" alt="Video Thumbnail">
                    <h2>${data.title}</h2>
                </div>
                <div id="download-options"></div>
            </div>
        `;

        const downloadOptions = document.getElementById('download-options');
        const audioStreams = data.adaptiveFormats.filter(f => f.type.startsWith('audio/'));
        const videoStreams = data.adaptiveFormats.filter(f => f.type.startsWith('video/')).filter(f => f.resolution);

        if (audioStreams.length > 0) {
            const bestAudio = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
            const audioSection = createDownloadSection('Music (Audio Only)', [bestAudio], () => 'Best Audio', (f) => f.container.toUpperCase());
            downloadOptions.appendChild(audioSection);
        }

        if (videoStreams.length > 0) {
            videoStreams.sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution));
            const videoSection = createDownloadSection('Video', videoStreams, (f) => f.resolution, (f) => f.container.toUpperCase());
            downloadOptions.appendChild(videoSection);
        }
    }

    function createDownloadSection(title, formats, getQualityLabel, getTypeLabel) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'download-section';
        const heading = document.createElement('h3');
        heading.textContent = title;
        sectionDiv.appendChild(heading);
        const grid = document.createElement('div');
        grid.className = 'format-grid';
        formats.forEach(format => {
            const button = document.createElement('a');
            button.href = format.url;
            button.className = 'download-btn';
            button.target = '_blank';
            button.download = '';
            button.innerHTML = `<span class="quality">${getQualityLabel(format)}</span><span class="type">${getTypeLabel(format)}</span>`;
            grid.appendChild(button);
        });
        sectionDiv.appendChild(grid);
        return sectionDiv;
    }

    function extractVideoId(url) {
        const regex = /(?:v=|\/|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    function clearUI() {
        resultsDiv.innerHTML = '';
        errorDiv.classList.add('hidden');
    }
});
