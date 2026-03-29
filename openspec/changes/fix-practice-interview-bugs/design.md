## Context

The practice interview feature is used by students to practice interview skills with an AI interviewer. After completing an interview, the system generates feedback and displays results. Five bugs were identified that affect the user experience.

Current state:
- Interview flow managed in `client/src/pages/student/Practice.tsx`
- Interview UI in `client/src/components/practice/PracticeInterview.tsx`
- Results display in `client/src/components/practice/PracticeResults.tsx`

## Goals / Non-Goals

**Goals:**
- Fix AI termination when interview rounds are complete
- Add loading state and loading page during API calls when concluding interview
- Ensure pass/fail display matches actual feedback
- Render markdown formatting in feedback text
- Add color-coded progress indicator for rounds

**Non-Goals:**
- Changing the interview question logic
- Modifying the AI feedback generation algorithm
- Adding new interview features

## Decisions

1. **Use `react-markdown` with `remark-gfm` for markdown rendering**
   - Well-maintained and lightweight
   - Supports GitHub Flavored Markdown including code blocks
   - Tree-shaking handles unused features

2. **Add loading page component**
   - Full-screen loading overlay with spinner
   - Clear message: "正在生成面试反馈，请稍候..."
   - Display after last answer submission, before results page

3. **Fix AI termination with explicit end-of-interview signal**
   - Add flag to indicate interview has ended
   - Send explicit "interview complete" message to AI on final submission
   - Prevent AI from generating new questions when rounds exhausted

4. **Color-coded progress indicator**
   - Green: Completed rounds
   - Indigo/Blue: Current active round
   - Gray: Pending rounds
   - Use circles or dots with numbers inside

5. **Backend result consistency**
   - Verify backend's pass/fail determination logic matches frontend display
   - Ensure result field is set correctly based on actual performance

## Risks / Trade-offs

- **Risk**: Adding react-markdown increases bundle size
  - **Mitigation**: Tree-shaking handles unused features; impact is minimal

- **Risk**: Changing state logic might cause race conditions
  - **Mitigation**: Test thoroughly, especially the transition from last question to results
