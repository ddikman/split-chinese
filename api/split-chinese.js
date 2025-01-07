const cheerio = require("cheerio");
const FormData = require("form-data");

// In memory cache
const cache = {};

const splitChineseTextRow = async (text) => {
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
    return cache[text];
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
    throw new Error("BadRequest: No annotated text found");
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

module.exports = {
  splitChineseTextRow,
};
