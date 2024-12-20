const express = require("express");
const cors = require("cors");
const app = express();
const cheerio = require('cheerio');

const FormData = require("form-data");

// Enable CORS for all routes
app.use(cors());

const cache = {};

app.get("/", async (req, res) => {
  const text = req.query.text;

  // Create form data
  const formData = new FormData();
  formData.append("e", "utf-8");
  formData.append("show", "both");
  formData.append("spaces", "on");
  formData.append("vocab", "3");
  formData.append("sort", "ord");
  formData.append("text", text);
  formData.append("phs", "pinyin");

  if (cache[text]) {
    console.log("returning from cache");
    return res.json(cache[text]);
  }

  try {
    // Make POST request
    const response = await fetch("https://api.mandarinspot.com/annotate", {
      method: "POST",
      body: formData.getBuffer(),
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();

    // Extract words from the HTML response using cheerio

    const $ = cheerio.load(data);

    if ($('#annotated').length === 0) {
      console.log(data)
      return res.status(400).json({
        error: "No annotated text found",
      });
    }

    const words = [];
    $('#annotated .zh').each((i, el) => {
      words.push($(el).text());
    });

    const result = {
      words: words,
      segmented: words.join(" "),
      text,
    };

    cache[text] = result;

    return res.json(result);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed to process text" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
