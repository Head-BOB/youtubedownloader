document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const videoUrlInput = document.getElementById('video-url');
    const loader = document.getElementById('loader');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    
    
    const API_INSTANCES = [
        'https://invidious.namazso.eu',
        'https://iv.ggtyler.dev',
        'https://vid.puffyan.us',
        'https://inv.id.is',
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
        for (const instance of API_INSTANCES) {
            try {
                const response = await fetch(`${instance}/api/v1/videos/${videoId}`);
                if (!response.ok) {
                    throw new Error(`Instance ${instance} failed with status ${response.status}`);
                }
                console.log(`Successfully fetched from: ${instance}`);
                return await response.json(); 
            } catch (error) {
                console.warn(`Failed to fetch from ${instance}. Trying next...`, error);
            }
        }
       
        throw new Error("All API instances failed to respond.");
    }

    function displayResults(data) {
        
        resultsDiv.innerHTML = `
            <div id="results-container">
                <div id="video-info">
                    <img src="${data.videoThumbnails.find(t => t.quality === 'medium').url}" alt="Video Thumbnail">
                    <h2>${data.title}</h2>
                </div>
                <div id="download-options">
                    <!-- Download buttons will be added here -->
                </div>
            </div>
        `;

        const downloadOptions = document.getElementById('download-options');

        // Audio Section
        const audioStreams = data.adaptiveFormats.filter(f => f.type.startsWith('audio/'));
        if (audioStreams.length > 0) {
            const bestAudio = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
            const audioSection = createDownloadSection('Music (Audio Only)', [bestAudio], (format) => 'Best Quality', (format) => 'M4A');
            downloadOptions.appendChild(audioSection);
        }

        // Video Section
        const videoStreams = data.adaptiveFormats
            .filter(f => f.type.startsWith('video/') && f.resolution)
            .sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution));
        if (videoStreams.length > 0) {
            const videoSection = createDownloadSection('Video', videoStreams, (format) => format.resolution, (format) => format.container.toUpperCase());
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
            
            button.innerHTML = `
                <span class="quality">${getQualityLabel(format)}</span>
                <span class="type">${getTypeLabel(format)}</span>
            `;
            grid.appendChild(button);
        });

        sectionDiv.appendChild(grid);
        return sectionDiv;
    }

    function extractVideoId(url) {
        const regex = /(?:v=|\/|embed\/|youtu.be\/)([a-zA-Z0-9_-]{11})/;
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
