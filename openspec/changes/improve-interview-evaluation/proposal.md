## Why

Currently, the interview system accepts user answers without evaluating their quality or depth before proceeding to the next question. This allows candidates to give perfunctory (敷衍) answers and still advance, reducing interview effectiveness. Additionally, the interview feedback streaming has bugs that need fixing.

## What Changes

1. **Answer Quality Evaluation**: Before advancing to the next question, evaluate if the current answer is perfunctory (敷衍). If the answer is deemed敷衍, prompt the user to expand or provide a more substantial response instead of proceeding.

2. **Concise Post-Interview Summary**: The final summary after interview should be brief - most detailed evaluation content should be displayed on the dedicated interview feedback interface, not in the summary.

3. **Fix Streaming Response Bug**: Fix the interview feedback streaming bug in `handleEndInterview()` that uses XMLHttpRequest and has issues with SSE marker parsing.

## Capabilities

### New Capabilities

- `answer-evaluation`: Evaluate whether interview answers are perfunctory (敷衍) before proceeding to next question. Includes:
  - Perfunctory answer detection criteria
  - Prompt to re-answer when answer is敷衍
  - Integration with existing interview flow

### Modified Capabilities

- `interview-feedback`: Change feedback generation to produce concise summary with detailed feedback on dedicated interface. Update streaming to use proper fetch API and SSE handling.

## Impact

- **Client**: Practice.tsx - modify `handleAnswerSubmit()` to add answer evaluation step; modify `handleEndInterview()` to fix streaming and reduce summary verbosity
- **Server**: interviewController.js - add answer evaluation prompt in `respondNormal()` and `respondLastQuestion()`; fix `concludeInterviewStream()` SSE handling
- **Prompts**: interview.js - add 敷衍 detection logic to response prompts