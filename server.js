const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    // Load base event image
    const eventImage = await Jimp.read(path.join(__dirname, 'public', 'event.jpg'));

    // Load user upload from buffer
    const userImg = await Jimp.read(req.file.buffer);
    userImg.resize(100, 100);

    // Composite user image onto event image at (50,50)
    eventImage.composite(userImg, 50, 50);

    // Load font and add text
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    eventImage.print(font, 160, 50, "j'y serai");

    // Get the combined image buffer
    const buffer = await eventImage.getBufferAsync(Jimp.MIME_JPEG);

    // Send image as base64 URL for preview
    res.json({
      image: `data:image/jpeg;base64,${buffer.toString('base64')}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Processing error');
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));