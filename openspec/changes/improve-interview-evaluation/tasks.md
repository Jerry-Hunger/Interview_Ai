## 1. Server-Side: Add 敷衍 Detection to Interview Prompts

- [x] 1.1 Modify `respondNormal()` in `server/src/prompts/interview.js` to include 敷衍 detection logic (already exists at lines 99-126)
- [x] 1.2 Modify `respondLastQuestion()` in `server/src/prompts/interview.js` to include 敷衍 detection logic (uses same evaluation)
- [x] 1.3 Update `server/src/controllers/interviewController.js` to handle re-prompt response when answer is 敷衍 (AI handles in prompt)

## 2. Client-Side: Handle Re-prompt for 敷衍 Answers

- [x] 2.1 Modify `handleAnswerSubmit()` in `client/src/pages/student/Practice.tsx` to detect re-prompt responses
- [x] 2.2 Update chat history to show re-prompt without advancing question counter
- [x] 2.3 Add UI indicator when answer was flagged as 敷衍 (toast notification)

## 3. Fix Interview Feedback Streaming Bug

- [x] 3.1 Refactor `handleEndInterview()` in `client/src/pages/student/Practice.tsx` to use fetch API with ReadableStream
- [x] 3.2 Fix Content-Type to use `text/event-stream` (server/src/controllers/interviewController.js line 268)
- [x] 3.3 Fix SSE marker parsing to handle `[CHUNK_START:n]`, `[CHUNK_END:n:base64]`, `[FINAL_START]`, `[DONE:interviewId:result]`

## 4. Reduce Post-Interview Summary Verbosity

- [x] 4.1 Modify `concludeFinal()` in `server/src/prompts/interview.js` to generate concise 2-3 sentence summary
- [x] 4.2 Update `handleEndInterview()` in `client/src/pages/student/Practice.tsx` to show brief summary only (already handled - finalFeedback is concise, detailed feedbacks array is separate)
- [x] 4.3 Ensure detailed feedback is available on dedicated feedback interface (feedbacks array stored and passed to results page)

## 5. Verify and Test

- [x] 5.1 Run `npm run lint` in client directory
- [x] 5.2 Run `npx tsc --noEmit` in client directory
- [ ] 5.3 Test interview flow with 敷衍 answer detection
- [ ] 5.4 Test interview feedback streaming
