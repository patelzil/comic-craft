# AI-Powered Interactive Comic Strip Generator

An interactive web application that generates comic strips based on user ideas and allows for dynamic story continuation with AI-generated images.

## Features

- Generate comic strips from a text prompt using GPT-4 for text generation
- Create high-quality comic panel illustrations using DALL-E 3
- Continue the story by adding new panels based on user input
- View comic panels with AI-generated scene descriptions and dialogue
- Download your completed comic as a PNG image
- Responsive UI with comic-inspired design

## Technology Stack

- **Backend**: Python with Flask
- **Frontend**: Pure HTML, CSS, and vanilla JavaScript - deliberately framework-free for simplicity and performance.
- **AI Integration**: OpenAI GPT-4 for text generation
- **Image Generation**: OpenAI DALL-E 3 for creating comic panel illustrations

## Important Cost Considerations ⚠️

**Please be aware that this application uses OpenAI's API services which incur costs:**

- DALL-E 3 image generation is particularly expensive (approximately $0.04-$0.12 per image)
- Each comic strip generates 3 images initially, with additional images for continuations
- GPT-4 text generation also has associated costs

Before setting up this project, consider:
- Setting up API usage limits in your OpenAI account
- Monitoring your usage regularly
- Potentially modifying the code to use more cost-effective models for testing

## Setup Instructions

### Prerequisites

- Python 3.7 or higher
- OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/patelzil/comic_craft.git
   cd comic_craft
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the project root and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Run the application:
   ```
   python app.py
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

1. Enter your comic idea in the text box (e.g., "A time-traveling cat in a cyberpunk city")
2. Click "Generate Comic" to create your initial 4-panel comic strip
3. Wait while the AI generates text and images for each panel
4. Click "Show Dialogue" on any panel to view the detailed dialogue and descriptions
5. To continue the story, enter what you want to happen next and click "Continue the Story"
6. Click "Download Comic" to save your comic as a PNG image
