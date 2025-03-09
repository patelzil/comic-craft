import os
import requests
from flask import Flask, render_template, request, jsonify
import openai
from dotenv import load_dotenv
import time
import glob

load_dotenv()

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = Flask(__name__)

IMAGES_DIR = os.path.join(app.static_folder, 'images')
os.makedirs(IMAGES_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate-comic', methods=['POST'])
def generate_comic():
    data = request.json
    initial_idea = data.get('initial_idea', '')
    
    try:
        clear_old_images()
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a creative comic strip writer. Create a 3-panel comic strip based on the given idea."},
                {"role": "user", "content": f"Create a 3-panel comic strip based on this idea: {initial_idea}. For each panel, provide: 1) Scene description, 2) Character dialogue, 3) Visual elements to include"}
            ]
        )
        
        comic_content = response.choices[0].message.content
        
        panels = process_comic_content(comic_content)
        
        for i, panel in enumerate(panels):
            scene = panel.get('scene_description', '')
            image_prompt = f"Create a comic panel illustration for: {scene}"
            
            image_response = client.images.generate(
                model="dall-e-3",
                prompt=image_prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            
            image_url = image_response.data[0].url

            image_filename = f"panel_{i+1}_{int(time.time())}.png"
            image_path = os.path.join(IMAGES_DIR, image_filename)

            image_response = requests.get(image_url)
            with open(image_path, 'wb') as f:
                f.write(image_response.content)
            
            panels[i]['image'] = f"/static/images/{image_filename}"
        
        return jsonify({
            "success": True,
            "panels": panels
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route('/continue-comic', methods=['POST'])
def continue_comic():
    data = request.json
    current_story = data.get('current_story', '')
    user_choice = data.get('user_choice', '')
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a creative comic strip writer. Continue the comic strip based on the user's choice."},
                {"role": "user", "content": f"Here's the current comic strip: {current_story}\n\nThe reader wants the story to continue with: {user_choice}\n\nCreate 2 more panels for the comic strip. For each panel, provide: 1) Scene description, 2) Character dialogue, 3) Visual elements to include"}
            ]
        )
        
        continuation = response.choices[0].message.content

        new_panels = process_comic_content(continuation)

        for i, panel in enumerate(new_panels):
            scene = panel.get('scene_description', '')
            image_prompt = f"Create a comic panel illustration for: {scene}"
            
            image_response = client.images.generate(
                model="dall-e-3",
                prompt=image_prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            
            image_url = image_response.data[0].url
            
            image_filename = f"panel_cont_{i+1}_{int(time.time())}.png"
            image_path = os.path.join(IMAGES_DIR, image_filename)
            
            image_response = requests.get(image_url)
            with open(image_path, 'wb') as f:
                f.write(image_response.content)
            
            new_panels[i]['image'] = f"/static/images/{image_filename}"
        
        return jsonify({
            "success": True,
            "new_panels": new_panels
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

def process_comic_content(content):
    """Process the AI-generated content into structured panels"""
    panels = []
    

    raw_panels = content.split("Panel")
    if len(raw_panels) <= 1:
        import re
        raw_panels = re.split(r'\d+[\.\):]', content)
    
    raw_panels = [p.strip() for p in raw_panels if p.strip()]

    
    for panel in raw_panels:
        scene_desc = ""
        dialogue = ""
        visuals = ""
        
        lines = panel.split('\n')
        for i, line in enumerate(lines):
            line = line.strip()
            if "scene" in line.lower() or "setting" in line.lower() or "description" in line.lower():
                scene_desc = line
            elif "dialogue" in line.lower() or ":" in line:
                dialogue += line + "\n"
            elif "visual" in line.lower() or "element" in line.lower():
                visuals = line
        
        if not scene_desc and not dialogue and not visuals:
            scene_desc = panel
        
        panel_data = {
            "scene_description": scene_desc or panel, 
            "dialogue": dialogue.strip(),
            "visual_elements": visuals
        }
        
        panels.append(panel_data)
    
    return panels

def clear_old_images():
    try:
        placeholder_path = os.path.join(IMAGES_DIR, 'placeholder.png')
        
        panel_images = glob.glob(os.path.join(IMAGES_DIR, 'panel_*.png'))
        
        for image_path in panel_images:
            if os.path.basename(image_path) != 'placeholder.png':
                try:
                    os.remove(image_path)
                    print(f"Deleted old image: {image_path}")
                except Exception as e:
                    print(f"Error deleting {image_path}: {e}")
                
        print(f"Cleared {len(panel_images)} old panel images")
    except Exception as e:
        print(f"Error clearing old images: {e}")

if __name__ == '__main__':
    app.run(debug=True)
