# Word Lists Configuration

This directory contains the configuration and word list files for the Spelling Bee Trainer application.

## Adding New Word Lists

To add a new word list to the application:

1. **Place your word list file** in the appropriate subdirectory under `word-lists/`
   - Example: `word-lists/your-competition/2025/word_list.txt`

2. **Update the configuration file** `available-word-lists.json`:
   ```json
   [
     {
       "id": "your-competition-2025",
       "name": "Your Competition 2025",
       "path": "/data/word-lists/your-competition/2025/word_list.txt",
       "description": "Description of your word list"
     }
   ]
   ```

3. **Word list format**:
   - One word per line
   - Only alphabetic characters (a-z, A-Z)
   - No numbers, special characters, or empty lines

## Configuration File Format

The `available-word-lists.json` file contains an array of word list objects with the following properties:

- `id`: Unique identifier for the word list (used internally)
- `name`: Display name shown to users
- `path`: Path to the word list file (relative to public directory)
- `description`: Optional description of the word list

## Default Word List

The first word list in the `available-word-lists.json` array will be used as the default word list when the application starts.

## File Structure Example

```
public/data/
├── available-word-lists.json
├── README.md
└── word-lists/
    ├── north-south-foundation/
    │   └── 2025/
    │       └── word_list.txt
    └── your-competition/
        └── 2025/
            └── word_list.txt
``` 