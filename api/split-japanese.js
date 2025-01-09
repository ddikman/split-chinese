const cheerio = require("cheerio");

// In memory cache
const cache = {};

const splitJapaneseTextRow = async (text) => {

  if (cache[text]) {
    console.log("returning from cache");
    return cache[text];
  }

  const encodedText = encodeURIComponent(text);
  const response = await fetch(`https://ichi.moe/cl/qr/?q=${encodedText}&r=htr`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.text();

  // Extract words from the HTML response using cheerio

  const $ = cheerio.load(data);

  const wordMatches = $(".gloss-content")
  if (wordMatches.length === 0) {
    console.log(data);
    throw new Error("BadRequest: No annotated text found");
  }

  const words = wordMatches
    .map((_, el) => extractWordFromBox($, el))
    .toArray()
    .filter(Boolean);

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

  const segmented = allSegments.join(" ").replace(/\s+([.,!?;:。，！？；：])/g, "$1");

  const result = {
    words: words,
    segmented,
    text,
  };

  cache[text] = result;

  return result;
};

const extractWordFromBox = ($, box) => {
  // The text here might look like
  // "1. ある" or "猫 【ねこ】" so we need to remove those things and leave only the japanese text
  return $('.alternatives dt', box).first().text()
    .replace(/【.*?】/g, '') // Remove 【...】
    .replace(/^\d+\.\s*/, '') // Remove leading numbers and dots
    .trim();
};

module.exports = {
  splitJapaneseTextRow,
};