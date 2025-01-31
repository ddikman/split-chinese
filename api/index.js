const express = require("express");
const cors = require("cors");
const app = express();

const { splitChineseTextRow } = require("./split-chinese");
const { splitJapaneseTextRow } = require("./split-japanese");

const splitFunctions = {
  chinese: splitChineseTextRow,
  japanese: splitJapaneseTextRow,
};

// Enable CORS for all routes
app.use(cors());

app.get("/", async (req, res) => {
  const startTime = Date.now();
  try {
    const text = req.query.text;
    const lang = req.query.lang ?? "chinese";

    if (!text) {
      return res.status(400).json({ error: "Please call this with ?text=<your text> and optionally ?lang=<language>." });
    }

    const splitFunction = splitFunctions[lang];

    if (!splitFunction) {
      return res.status(400).json({ error: "Unsupported language: " + lang, supported: Object.keys(splitFunctions) });
    }

    const rows = text.split("\n");
    const results = await Promise.all(rows.map(splitFunction));

    const response = {
      words: results.map((r) => r.words),
      segmented: results.map((r) => r.segmented).join("\n"),
      text,
    };

    const duration = Date.now() - startTime;
    console.log(`[${duration}ms] Completed (${lang}): ${text.replace(/\n/g, '\\n')}`);

    return res.json(response);

  } catch (error) {
    if (error.message.includes("BadRequest")) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Error:", error);
    return res.status(500).json({ error: "Failed to process text" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
