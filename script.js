document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const videoUrlInput = document.getElementById('video-url');
    const loader = document.getElementById('loader');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    
    // This is the Public API we use to get download links.
    // It's a free, open-source alternative to YouTube.
    const API_ENDPOINT = 'https://invidious.io.lol/api/v1/videos/';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const videoURL = videoUrlInput.value.trim();

        if (!videoURL) {
            showError("Please paste a YouTube URL.");
            return;
        }

        const videoId = extractVideoId(videoURL);
        if (!videoId) {
            showError("Invalid YouTube URL. Please check the link.");
            return;
        }

        clearUI();
        loader.classList.remove('hidden');

        try {
            const response = await fetch(`${API_ENDPOINT}${videoId}`);
            if (!response.ok) throw new Error('Video not found or API error.');
            
            const data = await response.json();
            displayDownloadButtons(data);

        } catch (err) {
            console.error(err);
            showError("Could not fetch video details. The video might be private or the service is temporarily down.");
        } finally {
            loader.classList.add('hidden');
        }
    });

    function displayDownloadButtons(data) {
        // Music (Audio Only) Section
        const audioStreams = data.adaptiveFormats.filter(f => f.type.startsWith('audio/'));
        if (audioStreams.length > 0) {
            resultsDiv.innerHTML += `<h3>Music Only</h3>`;
            const audioGrid = document.createElement('div');
            audioGrid.className = 'format-grid';
            // Get the best audio quality
            const bestAudio = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
            audioGrid.appendChild(createButton(bestAudio, 'Best Audio', 'M4A / MP3'));
            resultsDiv.appendChild(audioGrid);
        }

        // Video Section
        const videoStreams = data.adaptiveFormats.filter(f => f.type.startsWith('video/') && f.resolution);
        if (videoStreams.length > 0) {
            resultsDiv.innerHTML += `<h3>Video</h3>`;
            const videoGrid = document.createElement('div');
            videoGrid.className = 'format-grid';
            videoStreams
                .sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution)) // Sort by quality
                .forEach(format => {
                    videoGrid.appendChild(createButton(format, format.resolution, 'MP4 / WEBM'));
                });
            resultsDiv.appendChild(videoGrid);
        }
    }

    function createButton(format, qualityLabel, typeLabel) {
        const button = document.createElement('a');
        button.href = format.url;
        button.className = 'download-btn';
        button.target = '_blank'; // Opens in new tab, which triggers download
        button.download = 'download'; // Suggests to browser to download file
        
        button.innerHTML = `
            <span class="quality">${qualityLabel}</span>
            <span class="type">${typeLabel}</span>
        `;
        return button;
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