document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const videoUrlInput = document.getElementById('video-url');
    const loader = document.getElementById('loader');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');

    // This is the final and most robust approach. We are switching to a
    // professional-grade, stable public API designed for this purpose.
    const API_ENDPOINT = 'https://api.cobalt.tools/api/json';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const videoURL = videoUrlInput.value.trim();

        if (!isValidYoutubeUrl(videoURL)) {
            showError("Invalid YouTube URL. Please use a full video link.");
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
                    url: encodeURI(videoURL)
                })
            });

            if (!response.ok) {
                throw new Error(`API returned an error: ${response.statusText}`);
            }

            const data = await response.json();

            // This API uses a "status" field to report success or errors.
            switch (data.status) {
                case 'success':
                    displayResults(data);
                    break;
                case 'redirect':
                    // If it's a simple redirect, just show one download button.
                    displayRedirect(data);
                    break;
                case 'error':
                    throw new Error(data.text || 'The API reported an error.');
                    break;
                case 'stream':
                     // If it's a stream, we can use the stream URL directly.
                    displayRedirect(data);
                    break;
                default:
                    throw new Error('An unknown error occurred with the API.');
            }

        } catch (err) {
            console.error(err);
            showError(err.message);
        } finally {
            loader.classList.add('hidden');
        }
    });

    // This function handles the new API response format.
    function displayResults(data) {
        // Since this API can return different types of responses,
        // we handle both simple URLs and "pickers" with multiple options.
        if (data.url) {
             displayRedirect(data);
             return;
        }
        
        if (!data.picker) {
             throw new Error("Could not find any download options.");
        }

        resultsDiv.innerHTML = `
            <div id="results-container">
                <div id="video-info">
                    <img src="${data.thumb}" alt="Video Thumbnail">
                    <h2>${data.title}</h2>
                </div>
                <div id="download-options">
                    <h3>Available Downloads</h3>
                    <div class="format-grid"></div>
                </div>
            </div>
        `;

        const grid = document.querySelector('.format-grid');

        // This API returns a "picker" with different formats.
        data.picker.forEach(format => {
            const button = document.createElement('a');
            button.href = format.url;
            button.className = 'download-btn';
            button.target = '_blank';
            button.download = '';
            
            // Handle audio-only formats
            let qualityLabel = format.quality || '';
            if (format.type === 'audio') {
                qualityLabel = 'Music Only';
            } else {
                 qualityLabel = format.quality ? `${format.quality}` : 'Video';
                 if(format.audio) qualityLabel += ' 🔊';
            }

            button.innerHTML = `
                <span class="quality">${qualityLabel}</span>
                <span class="type">${format.type.toUpperCase()} - ${format.ext.toUpperCase()}</span>
            `;
            grid.appendChild(button);
        });
    }

    // A simpler display for when the API just gives one direct link.
    function displayRedirect(data) {
        resultsDiv.innerHTML = `
            <div id="download-options">
                <h3>Download Ready</h3>
                <div class="format-grid">
                    <a href="${data.url}" class="download-btn" target="_blank">
                        <span class="quality">Click to Download</span>
                        <span class="type">Your file is ready</span>
                    </a>
                </div>
            </div>
        `;
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
