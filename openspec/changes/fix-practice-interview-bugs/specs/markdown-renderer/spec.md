## ADDED Requirements

### Requirement: Markdown rendering in feedback

The system SHALL render markdown-formatted text in the interview feedback, including code blocks, lists, emphasis, and other GitHub Flavored Markdown elements.

#### Scenario: Code blocks rendered with syntax highlighting
- **WHEN** feedback contains a code block wrapped in triple backticks
- **THEN** the code SHALL be displayed in a styled code block
- **AND** line breaks and indentation SHALL be preserved

#### Scenario: Inline code rendered correctly
- **WHEN** feedback contains inline code wrapped in single backticks
- **THEN** the text SHALL be displayed with monospace font
- **AND** it SHALL be visually distinct from surrounding text

#### Scenario: Lists rendered as proper lists
- **WHEN** feedback contains ordered or unordered lists
- **THEN** the list SHALL be rendered with proper bullets or numbers
- **AND** nested lists SHALL be properly indented
