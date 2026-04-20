## Context

The interview system currently accepts user answers without evaluating quality before proceeding. This allows candidates to give perfunctory (敷衍) answers and still advance. Additionally, the interview feedback streaming implementation has bugs:
- Uses XMLHttpRequest instead of fetch API
- Incorrect SSE marker parsing
- Content-Type is `text/plain` instead of `text/event-stream`

## Goals / Non-Goals

**Goals:**
- Detect perfunctory answers (敷衍) before proceeding to next question
- Prompt user to expand when answer is敷衍
- Fix streaming response bug in interview feedback
- Keep post-interview summary concise while showing detailed feedback on dedicated interface

**Non-Goals:**
- Changing the AI model or LLM provider
- Modifying the interview prompt templates beyond 敷衍 detection
- Adding new API endpoints

## Decisions

### 1. Answer Evaluation Approach

**Decision**: Use a lightweight evaluation step after each answer, integrated into existing `respondNormal()` prompt.

**Rationale**: Adding a separate API call would add latency. Including evaluation in the existing response flow is more efficient.

**Implementation**: Modify `respondNormal()` and `respondLastQuestion()` in `interviewController.js` to:
1. First generate the next question normally
2. Also evaluate if the current answer is 敷衍
3. If 敷衍, return a re-prompt instead of the next question

### 2. 敷衍 Detection Criteria

**Decision**: Define 敷衍 as answers that:
- Are too short (< 20 characters for non-knowledge questions)
- Contain only acknowledgments without substance ("好的", "是的", "OK", etc.)
- Repeat the question without adding detail
- Are completely off-topic

**Rationale**: These patterns are reliably detectable without complex NLP.

### 3. Streaming Bug Fix

**Decision**: Refactor `handleEndInterview()` to use fetch API with `response.body?.getReader()` like `handleAnswerSubmit()`.

**Rationale**: Consistent with existing streaming implementation in the codebase. Proper SSE parsing.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| AI may misidentify 敷衍 answers | Allow user to skip re-prompt and proceed |
| Re-prompt interrupts interview flow | Keep re-prompt brief and encouraging |
| Breaking existing interview flow | Add evaluation as optional enhancement |

## Migration Plan

1. First deploy server changes with 敷衍 evaluation
2. Deploy client changes with streaming fix
3. Monitor for issues

## Open Questions

- Should we track 敷衍 responses for analytics?
- Should we allow companies to customize 敷衍 detection sensitivity?