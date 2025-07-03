document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const videoUrlInput = document.getElementById('video-url');
    const loader = document.getElementById('loader');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    
    // Correct API endpoint
    const API_ENDPOINT = 'https://co.wuk.sh/api/json';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const videoURL = videoUrlInput.value.trim();

        if (!isValidYoutubeUrl(videoURL)) {
            showError("Invalid YouTube URL. Please use a full video link (e.g., https://www.youtube.com/watch?v=...).");
            return;
        }

        clearUI();
        loader.classList.remove('hidden');

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: videoURL,
                    isAudioOnly: false // We want video and audio options
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status !== 'success') {
                throw new Error(data.text || "The API returned an error. The video may be region-locked or private.");
            }
            
            displayResults(data);

        } catch (err) {
            console.error(err);
            showError(err.message);
        } finally {
            loader.classList.add('hidden');
        }
    });

    function displayResults(data) {
        resultsDiv.innerHTML = `
            <div id="results-container">
                <div id="video-info">
                    <img src="${data.thumb}" alt="Video Thumbnail">
                    <h2>${data.title}</h2>
                </div>
                <div id="download-options"></div>
            </div>
        `;

        const downloadOptions = document.getElementById('download-options');

        if (data.audio) {
            const audioSection = createDownloadSection('Music (Audio Only)', [data.audio], (format) => `${format.quality} (${format.ext.toUpperCase()})`, (format) => `${format.size || ''}`);
            downloadOptions.appendChild(audioSection);
        }

        if (data.videos && data.videos.length > 0) {
            const videoSection = createDownloadSection('Video', data.videos, (format) => `${format.quality} (${format.ext.toUpperCase()})`, (format) => `${format.size || ''}`);
            downloadOptions.appendChild(videoSection);
        }
    }

    function createDownloadSection(title, formats, getQualityLabel, getSizeLabel) {
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
                <span class="type">${getSizeLabel(format)}</span>
            `;
            grid.appendChild(button);
        });

        sectionDiv.appendChild(grid);
        return sectionDiv;
    }

    function isValidYoutubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(url);
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
