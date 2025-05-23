# Form Configuration System

This directory contains configuration files for Google Form submissions.

## Files

- `taste-test-form.json` - Configuration for the coffee taste test form
- `preference-survey-form.json` - Configuration for the coffee preference survey form

## Configuration Format

Each configuration file follows this structure:

```json
{
  "formUrl": "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse",
  "fieldMappings": {
    "fieldName1": "entry.ENTRY_ID_1",
    "fieldName2": "entry.ENTRY_ID_2",
    ...
  }
}
```

## How to Update

When you need to update or change the Google Form:

1. Create or modify your Google Form
2. For each form field, get the entry ID:
   - Create a test form submission
   - Inspect the form HTML to find the input name (e.g., `entry.1234567890`)
   - Map this entry ID to the corresponding field name in the app
3. Update the appropriate JSON configuration file
4. No code changes are needed to update field mappings!

## Getting Entry IDs

To find entry IDs from an existing Google Form:

1. Open the Google Form in edit mode
2. Click on a field to edit it
3. In your browser's developer tools, inspect the selected field
4. Look for an element with an attribute `data-params` containing `entry.XXXXXXXXX`
5. This is the entry ID to use in your configuration file 