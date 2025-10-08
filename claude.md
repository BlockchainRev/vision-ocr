# Vision OCR - Document Processing with Confidence Scoring

## 🎯 Project Goal

Convert **unstructured documents** (PDFs, images) into **structured data** with confidence scoring for production-grade accuracy.

**Pipeline:**
1. Extract text from each page using vision LLMs (parallelized)
2. Run multiple models for consensus voting
3. Output structured JSON with confidence scores
4. Flag low-confidence fields for human review

## 🔍 Best Practice: Always Web Search First

**IMPORTANT**: Before using any tool or library, **search the internet** to find the best option.

Example from this project:
- ❌ Didn't search → Used `pdf-poppler` → Failed (missing system dependencies)
- ✅ Searched → Found `pdf-to-png-converter` → Works perfectly (no dependencies)

**Always research before implementing:**
```bash
# Search for: "best nodejs pdf to png converter 2025"
# Compare options, check compatibility, read reviews
# Then implement the winner
```

## 🚀 How to Run

### Setup
```bash
# Install dependencies
npm install

# Create .env file with your API key
echo "GROQ_API_KEY=your_key_here" > .env
```

### Build
```bash
npm run build
```

### Run OCR
```bash
npm test
```

### Output
- Results saved to `output/{filename}_{timestamp}.md`
- Each run creates a unique timestamped file

## 📁 Project Structure

```
vision-ocr/
├── src/
│   └── index.ts          # Core OCR logic with PDF support
├── test/
│   ├── index.ts          # Test runner
│   ├── image.png         # Test image
│   └── 106587.pdf        # Test PDF
├── output/               # Generated markdown files
└── .env                  # API keys (not in git)
```

## 🧠 How It Works

### Current Implementation
1. **PDF → PNG**: Converts PDF pages to images using `pdf-to-png-converter`
2. **Parallel Processing**: Processes all pages simultaneously
3. **Vision Model**: Uses `meta-llama/llama-4-scout-17b-16e-instruct` via Groq
4. **Markdown Output**: Extracts text and formats as clean markdown
5. **Merge**: Combines pages in order with `---` separators

### Upcoming: Multi-Model Confidence Scoring
- Run 3 vision models in parallel
- Compare outputs using consensus voting
- Calculate confidence scores per field
- Flag uncertain extractions for review

## 🔧 Models Used

- **Primary**: `meta-llama/llama-4-scout-17b-16e-instruct` (Groq)
- Vision model with 128K context window
- Supports multilingual, multi-turn conversations

## 📊 Confidence Thresholds (Planned)

- **High (≥0.85)**: Auto-approve
- **Medium (0.65-0.85)**: Flag for review
- **Low (<0.65)**: Reject or manual processing

## 💡 Tips

1. **Always search before coding** - Find the best tool/library first
2. **Use parallelization** - Process pages simultaneously for speed
3. **Structured output** - JSON enables better validation than raw text
4. **Confidence scoring** - Essential for production document processing
5. **Unique filenames** - Timestamp prevents overwriting results
