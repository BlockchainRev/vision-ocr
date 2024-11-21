# vision-ocr

Convert images to markdown using Llama 3.2 Vision model powered by Groq AI.

## Features

- 📸 Convert images to clean, formatted markdown
- 🌐 Support for both local and remote images
- 🎯 Accurate text extraction and formatting
- 📝 Preserves document structure and formatting
- ⚡ Fast processing using Groq AI

## Installation

```bash
npm install vision-ocr
```

## Setup

1. Get your Groq API key from [Groq Console](https://console.groq.com)
2. Set up your API key either:
   - As an environment variable: `GROQ_API_KEY=your_api_key`
   - Or pass it directly in the code

## Usage

```typescript
import { ocr } from 'vision-ocr';

// Using a remote image
const markdown = await ocr({
  filePath: 'https://example.com/image.jpg',
  apiKey: 'your_groq_api_key' // Optional if env variable is set
});

// Using a local image
const markdown = await ocr({
  filePath: './path/to/local/image.jpg'
});

console.log(markdown);
```

## API Reference

### ocr(options)

Main function to convert images to markdown.

#### Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| filePath | string | Yes | - | Path to local image or URL of remote image |
| apiKey | string | No | process.env.GROQ_API_KEY | Your Groq API key |
| model | string | No | "llama-3.2-11b-vision-preview" | Model to use for OCR |

#### Supported Models

- `llama-3.2-11b-vision-preview`
- `llama-3.2-90b-vision-preview`

## Error Handling

The package throws errors in these cases:
- Missing file path
- Invalid image file
- API errors
- No content extracted from image

```typescript
try {
  const markdown = await ocr({
    filePath: 'path/to/image'
  });
} catch (error) {
  console.error('OCR failed:', error.message);
}
```

## Limitations

- Images must be in a supported format (JPEG, PNG)
- Maximum image size depends on Groq API limits
- API key required for operation

## License

MIT © Saurabh Udupi (@0xSaurabhx)

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/0xSaurabhx/vision-ocr/issues).

## Credit
This project was inspired by [nutlope](https://github.com/Nutlope/llama-ocr.git). Go check it out!