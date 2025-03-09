document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const initialIdeaInput = document.getElementById('initial-idea');
    const generateBtn = document.getElementById('generate-btn');
    const comicDisplay = document.getElementById('comic-display');
    const comicPanels = document.getElementById('comic-panels');
    const ideaInput = document.getElementById('idea-input');
    const loadingSection = document.getElementById('loading');
    const errorDisplay = document.getElementById('error-display');
    const errorText = document.getElementById('error-text');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const continuationIdea = document.getElementById('continuation-idea');
    const continueBtn = document.getElementById('continue-btn');
    const newComicBtn = document.getElementById('new-comic-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Current comic state
    let currentComicStory = '';
    let currentPanels = [];

    // Event Listeners
    generateBtn.addEventListener('click', generateComic);
    continueBtn.addEventListener('click', continueComic);
    tryAgainBtn.addEventListener('click', resetUI);
    newComicBtn.addEventListener('click', resetUI);
    downloadBtn.addEventListener('click', downloadComic);


    async function generateComic() {
        const initialIdea = initialIdeaInput.value.trim();
        
        if (!initialIdea) {
            showError('Please enter an idea for your comic strip.');
            return;
        }

        showLoading();

        try {
            const response = await fetch('/generate-comic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ initial_idea: initialIdea })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to generate comic');
            }

            currentPanels = data.panels;
            currentComicStory = initialIdea + '\n\n' + panelsToText(currentPanels);

            displayComicPanels(currentPanels);

            hideLoading();
            showComicDisplay();
        } catch (error) {
            console.error('Error generating comic:', error);
            showError(error.message || 'Failed to generate comic. Please try again.');
        }
    }

    // Continue the comic story
    async function continueComic() {
        const userChoice = continuationIdea.value.trim();
        
        if (!userChoice) {
            showError('Please enter what you want to happen next.');
            return;
        }

        showLoading();

        try {
            console.log('Sending continuation request with:', { 
                current_story: currentComicStory,
                user_choice: userChoice
            });
            
            const response = await fetch('/continue-comic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    current_story: currentComicStory,
                    user_choice: userChoice
                })
            });

            const data = await response.json();
            console.log('Received continuation data:', data);

            if (!data.success) {
                throw new Error(data.error || 'Failed to continue comic');
            }

            const newPanels = data.new_panels;
            console.log('New panels:', newPanels);
            
            if (!newPanels || newPanels.length === 0) {
                throw new Error('No new panels were generated');
            }
            
            currentPanels = [...currentPanels, ...newPanels];
            console.log('Updated panels array:', currentPanels);
            
            currentComicStory += '\n\nContinuation: ' + userChoice + '\n\n' + panelsToText(newPanels);

            displayComicPanels(currentPanels);

            continuationIdea.value = '';

            hideLoading();
            showComicDisplay();
        } catch (error) {
            console.error('Error continuing comic:', error);
            showError(error.message || 'Failed to continue the comic. Please try again.');
        }
    }

    function panelsToText(panels) {
        return panels.map((panel, index) => {
            return `Panel ${index + 1}:\nScene: ${panel.scene_description}\nDialogue: ${panel.dialogue}\nVisuals: ${panel.visual_elements}`;
        }).join('\n\n');
    }

    function displayComicPanels(panels) {
        const panelsContainer = document.getElementById('comic-panels');
        
        panelsContainer.innerHTML = '';
        

        panels.forEach((panel, index) => {
            const panelElement = document.createElement('div');
            panelElement.className = 'comic-panel';
            
            const imageContainer = document.createElement('div');
            imageContainer.className = 'panel-image';
            
            const img = document.createElement('img');
            img.src = panel.image || '/static/images/placeholder.png';
            img.alt = `Panel ${index + 1}`;
            img.loading = 'lazy';
            
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div>';
            imageContainer.appendChild(loadingIndicator);
            
            img.onload = function() {
                if (imageContainer.contains(loadingIndicator)) {
                    imageContainer.removeChild(loadingIndicator);
                }
            };
            
            img.onerror = function() {
                this.src = '/static/images/placeholder.png';
                if (imageContainer.contains(loadingIndicator)) {
                    imageContainer.removeChild(loadingIndicator);
                }
            };
            
            imageContainer.appendChild(img);
            panelElement.appendChild(imageContainer);
            
            const contentContainer = document.createElement('div');
            contentContainer.className = 'panel-content';
            
            const sceneElement = document.createElement('div');
            sceneElement.className = 'panel-scene';
            
            const panelNumber = document.createElement('span');
            panelNumber.className = 'panel-number';
            panelNumber.textContent = index + 1;
            sceneElement.appendChild(panelNumber);
            
            sceneElement.appendChild(document.createTextNode(' ' + panel.scene_description));
            
            contentContainer.appendChild(sceneElement);
            
            const dialogueElement = document.createElement('div');
            dialogueElement.className = 'panel-dialogue hidden';
            dialogueElement.innerHTML = formatDialogue(panel.dialogue);
            contentContainer.appendChild(dialogueElement);
            
            const moreButton = document.createElement('button');
            moreButton.className = 'more-details-btn';
            moreButton.textContent = 'Show Dialogue';
            moreButton.onclick = function() {
                dialogueElement.classList.toggle('hidden');
                this.textContent = dialogueElement.classList.contains('hidden') ? 'Show Dialogue' : 'Hide Dialogue';
            };
            
            contentContainer.appendChild(moreButton);
            panelElement.appendChild(contentContainer);
            
            panelsContainer.appendChild(panelElement);
        });
        
        if (panels.length > 0) {
            document.getElementById('download-btn').classList.remove('hidden');
        }
    }

    function formatDialogue(dialogue) {
        if (!dialogue) return '';
        
        const lines = dialogue.split('\n');
        let formattedDialogue = '';
        
        // Process each line
        for (let line of lines) {
            // Skip empty lines
            if (!line.trim()) continue;
            
            // Check if line starts with a character name (e.g., "Character:")
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0 && colonIndex < 20) {
                // Extract character name and dialogue
                const character = line.substring(0, colonIndex).trim();
                const speech = line.substring(colonIndex + 1).trim();
                
                // Format with character name in bold
                formattedDialogue += `<p><strong>${character}:</strong> ${speech}</p>`;
            } else {
                // Just a regular line
                formattedDialogue += `<p>${line}</p>`;
            }
        }
        
        return formattedDialogue;
    }

    async function downloadComic() {
        try {
            // Show loading indicator
            const loadingElement = document.getElementById('loading');
            loadingElement.classList.remove('hidden');
            
            // First, let's check if we have any panels
            const panels = document.querySelectorAll('.comic-panel');
            const panelCount = panels.length;
            
            // Create a container to hold all panels for download
            const container = document.createElement('div');
            container.style.backgroundColor = 'white';
            container.style.padding = '20px';
            container.style.width = '900px';
            container.className = 'for-download'; // Add class to hide buttons and show all dialogue
            
            // Add a title
            const title = document.createElement('h2');
            title.textContent = 'My AI Comic Strip';
            title.style.textAlign = 'center';
            title.style.fontFamily = 'Bangers, cursive';
            title.style.fontSize = '24px';
            title.style.marginBottom = '20px';
            container.appendChild(title);
            
            // Create a wrapper for panels with grid layout
            const panelsWrapper = document.createElement('div');
            panelsWrapper.style.display = 'grid';
            panelsWrapper.style.gridTemplateColumns = 'repeat(2, 1fr)';
            panelsWrapper.style.gap = '20px';
            
            // Process each panel
            for (let i = 0; i < panelCount; i++) {
                // Create a new panel element for the download
                const downloadPanel = document.createElement('div');
                downloadPanel.style.border = '2px solid black';
                downloadPanel.style.borderRadius = '8px';
                downloadPanel.style.overflow = 'hidden';
                downloadPanel.style.backgroundColor = '#fff';
                
                // Get the image from the original panel
                const originalImage = panels[i].querySelector('.panel-image img');
                if (originalImage) {
                    const imageContainer = document.createElement('div');
                    imageContainer.style.borderBottom = '2px solid black';
                    imageContainer.style.height = '300px';
                    imageContainer.style.overflow = 'hidden';
                    imageContainer.style.display = 'flex';
                    imageContainer.style.alignItems = 'center';
                    imageContainer.style.justifyContent = 'center';
                    imageContainer.style.backgroundColor = '#f5f5f5';
                    
                    // Create an image element to use the same source
                    const img = document.createElement('img');
                    img.src = originalImage.src;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'contain';
                    
                    // Add error handling
                    img.onerror = function() {
                        this.src = '/static/images/placeholder.png';
                    };
                    
                    imageContainer.appendChild(img);
                    downloadPanel.appendChild(imageContainer);
                }
                
                // Get content from the original panel
                const contentContainer = document.createElement('div');
                contentContainer.style.padding = '15px';
                
                // Panel number and scene description
                const originalScene = panels[i].querySelector('.panel-scene');
                if (originalScene) {
                    const sceneElement = document.createElement('div');
                    sceneElement.style.fontWeight = 'bold';
                    sceneElement.style.marginBottom = '10px';
                    sceneElement.style.color = '#333';
                    
                    // Get the panel number
                    const panelNumber = originalScene.querySelector('.panel-number');
                    if (panelNumber) {
                        const numberSpan = document.createElement('span');
                        numberSpan.textContent = panelNumber.textContent;
                        numberSpan.style.display = 'inline-block';
                        numberSpan.style.backgroundColor = '#4a6fa5';
                        numberSpan.style.color = 'white';
                        numberSpan.style.padding = '2px 8px';
                        numberSpan.style.borderRadius = '4px';
                        numberSpan.style.marginRight = '8px';
                        sceneElement.appendChild(numberSpan);
                    }
                    
                    // Get the scene text (excluding the panel number)
                    const sceneText = originalScene.textContent.replace(/^\d+/, '').trim();
                    sceneElement.appendChild(document.createTextNode(sceneText));
                    
                    contentContainer.appendChild(sceneElement);
                }
                
                // Dialogue (always visible in download)
                const originalDialogue = panels[i].querySelector('.panel-dialogue');
                if (originalDialogue) {
                    const dialogueElement = document.createElement('div');
                    dialogueElement.style.fontFamily = "'Comic Neue', cursive";
                    dialogueElement.style.borderTop = '1px dashed #ccc';
                    dialogueElement.style.paddingTop = '10px';
                    dialogueElement.style.marginTop = '10px';
                    dialogueElement.innerHTML = originalDialogue.innerHTML;
                    
                    contentContainer.appendChild(dialogueElement);
                }
                
                downloadPanel.appendChild(contentContainer);
                panelsWrapper.appendChild(downloadPanel);
            }
            
            container.appendChild(panelsWrapper);
            
            // Add to the document temporarily (off-screen)
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            document.body.appendChild(container);
            
            // Wait for a moment to ensure everything is rendered
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Use html2canvas to create an image
            const canvas = await html2canvas(container, {
                allowTaint: true,
                useCORS: true,
                scale: 2,
                logging: true
            });
            
            // Remove the temporary container
            document.body.removeChild(container);
            
            // Create download link
            const link = document.createElement('a');
            link.download = 'my-comic-strip.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Hide loading indicator
            loadingElement.classList.add('hidden');
            
        } catch (error) {
            console.error('Error downloading comic:', error);
            alert('There was an error downloading your comic. Please try again.');
            // Hide loading indicator
            document.getElementById('loading').classList.add('hidden');
        }
    }

    // UI State Management
    function showLoading() {
        loadingSection.classList.remove('hidden');
        comicDisplay.classList.add('hidden');
        ideaInput.classList.add('hidden');
        errorDisplay.classList.add('hidden');
    }

    function hideLoading() {
        loadingSection.classList.add('hidden');
    }

    function showComicDisplay() {
        comicDisplay.classList.remove('hidden');
    }

    function showError(message) {
        errorText.textContent = message;
        errorDisplay.classList.remove('hidden');
        loadingSection.classList.add('hidden');
    }

    function resetUI() {
        ideaInput.classList.remove('hidden');
        comicDisplay.classList.add('hidden');
        errorDisplay.classList.add('hidden');
        loadingSection.classList.add('hidden');
        initialIdeaInput.value = '';
        continuationIdea.value = '';
        comicPanels.innerHTML = '';
        currentPanels = [];
        currentComicStory = '';
    }
});
