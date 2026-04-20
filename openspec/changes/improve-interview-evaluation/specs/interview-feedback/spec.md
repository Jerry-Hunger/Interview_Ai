## ADDED Requirements

### Requirement: Streaming Response Fix
The interview feedback streaming SHALL use proper fetch API with ReadableStream for consistent implementation across the codebase.

#### Scenario: Feedback Streams Correctly
- **WHEN** user requests interview feedback after completing interview
- **THEN** the system SHALL stream feedback using text/event-stream content type
- **AND** the client SHALL parse SSE markers correctly using fetch API

## MODIFIED Requirements

### Requirement: Concise Summary After Interview
The post-interview summary displayed immediately after interview ends SHALL be concise (2-3 sentences max).

#### Scenario: Summary is Concise
- **WHEN** interview concludes and user sees final summary
- **THEN** the summary SHALL be brief (2-3 sentences)
- **AND** detailed feedback SHALL be available on the dedicated feedback interface

### Requirement: Detailed Feedback on Feedback Interface
The interview feedback interface SHALL display comprehensive evaluation content.

#### Scenario: Full Feedback Displayed
- **WHEN** user navigates to interview feedback interface
- **THEN** the interface SHALL show detailed evaluation of all answers
- **AND** the content SHALL include strengths, areas for improvement, and specific feedback per question
