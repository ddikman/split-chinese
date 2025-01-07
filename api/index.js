const express = require("express");
const cors = require("cors");
const app = express();
const cheerio = require("cheerio");

const FormData = require("form-data");

// Enable CORS for all routes
app.use(cors());

const cache = {};

const splitTextRow = async (text) => {
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

  if ($("#annotated").length === 0) {
    console.log(data);
    return res.status(400).json({
      error: "No annotated text found",
    });
  }

  const words = [];
  $("#annotated .zh").each((i, el) => {
    words.push($(el).text());
  });

  // Create an array that includes both words and punctuation
  let remainingText = text;
  const allSegments = [];

  words.forEach((word) => {
    const wordIndex = remainingText.indexOf(word);
    if (wordIndex > 0) {
      // Add any characters before the word (punctuation/spaces)
      allSegments.push(remainingText.substring(0, wordIndex));
    }
    // Add the word itself
    allSegments.push(word);
    // Update remaining text to continue search
    remainingText = remainingText.substring(wordIndex + word.length);
  });

  // Add any remaining characters at the end
  if (remainingText.length > 0) {
    allSegments.push(remainingText);
  }

  const result = {
    words: words,
    segmented: allSegments.join(" "),
    text,
  };

  cache[text] = result;

  return result;
};

app.get("/", async (req, res) => {
  try {
    const text = req.query.text;

    const rows = text.split("\n");
    const results = await Promise.all(rows.map(splitTextRow));

    return res.json({
      words: results.map((r) => r.words),
      segmented: results.map((r) => r.segmented).join("\n"),
      text,
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed to process text" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
