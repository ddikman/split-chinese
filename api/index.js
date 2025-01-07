const express = require("express");
const cors = require("cors");
const app = express();

const { splitChineseTextRow } = require("./split-chinese");

const splitFunctions = {
  chinese: splitChineseTextRow,
};

// Enable CORS for all routes
app.use(cors());

app.get("/", async (req, res) => {
  try {
    const text = req.query.text;

    const lang = req.query.lang ?? "chinese";

    const splitFunction = splitFunctions[lang];

    if (!splitFunction) {
      return res.status(400).json({ error: "Unsupported language: " + lang, supported: Object.keys(splitFunctions) });
    }

    const rows = text.split("\n");
    const results = await Promise.all(rows.map(splitFunction));

    return res.json({
      words: results.map((r) => r.words),
      segmented: results.map((r) => r.segmented).join("\n"),
      text,
    });

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
