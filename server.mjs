import express from 'express';
import cors from 'cors';
import { Client } from '@gradio/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5000;

// Enable CORS for frontend access
app.use(cors({
  origin: 'http://127.0.0.1:5500' // Adjust if your frontend is hosted elsewhere
}));

app.use(express.json());

// POST route to generate images
app.post('/generate', async (req, res) => {
  const {
    prompt,
    quantity = 2, // Default quantity set to 2
    negative_prompt = '',
    use_negative_prompt = false,
    style = '2560 x 1440',
    seed = 0,
    width = 512,
    height = 512,
    guidance_scale = 7.5,
    randomize_seed = true
  } = req.body;

  console.log(`Received request with prompt: ${prompt}, quantity: ${quantity}`);

  try {
    const client = await Client.connect('mukaist/Midjourney'); // Ensure this is the correct model/space
    console.log('Connected to Gradio API.');

    // Send the request to the Gradio API for image generation
    const result = await client.predict('/run', {
      prompt,
      negative_prompt,
      use_negative_prompt,
      style,
      seed,
      width,
      height,
      guidance_scale,
      randomize_seed
    });

    console.log('Gradio API response:', result); // Log the entire response for better debugging

    // Check if the response structure matches the expected format
    if (result.data && Array.isArray(result.data) && Array.isArray(result.data[0])) {
      const images = result.data[0].map((item, index) => {
        console.log(`Item ${index}:`, item); // Log each item to inspect its structure

        // Extract the URL from the 'image' object
        if (item.image && item.image.url) {
          return item.image.url;
        } else {
          console.error(`Item ${index} does not contain a valid URL.`);
          return null;
        }
      }).filter(url => url !== null); // Filter out invalid URLs

      console.log(`Generated ${images.length} images.`);

      if (images.length > 0) {
        res.json({ images });
      } else {
        console.error('No valid images found in response.');
        res.status(500).json({ error: 'No valid images found in response' });
      }
    } else {
      console.error('Invalid data from Gradio API: ', result);
      res.status(500).json({ error: 'Invalid data from Gradio API' });
    }
  } catch (error) {
    console.error('Error during image generation:', error);
    res.status(500).json({ error: 'Error during image generation' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
