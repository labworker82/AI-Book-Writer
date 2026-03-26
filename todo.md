# AI Book Writer App TODO

## Database & Backend
- [x] Schema: users, books, chapters, book_images, app_settings tables
- [x] Database migration pushed
- [x] server/db.ts: book CRUD helpers
- [x] server/routers.ts: settings, books, chapters, images procedures

## App Layout & Navigation
- [x] AppLayout with sidebar (My Books, New Book, Settings)
- [x] App.tsx routes: /dashboard, /books/new, /books/:id, /settings, /login
- [x] Dark Tech Premium design system (Blueprint Blue + Ghost Purple)
- [x] .dark CSS variables block (fixes black screen bug)

## Settings Page
- [x] OpenAI API key input (stored in DB, masked display)
- [x] Text model selector (GPT-5.4, GPT-5, o4-mini, GPT-4o, GPT-4.1 mini)
- [x] Image model selector (gpt-image-1, dall-e-3, dall-e-2)
- [x] Save settings button
- [x] API key warning in sidebar when not configured

## Book Dashboard
- [x] List all books with title, genre, status, word count, date
- [x] Delete book with confirmation
- [x] Open book editor
- [x] Empty state with CTA

## New Book Wizard (multi-step)
- [x] Step 1: Basic info (title, genre, subgenre, target audience)
- [x] Step 2: Writing style (tone, author voice, custom knowledge)
- [x] Step 3: Book structure (preface, dedication, epilogue, acknowledgements)

## AI Book Generation Engine
- [x] bookGenerator.ts with context-aware chapter generation
- [x] Generate full outline from book metadata
- [x] Generate each chapter sequentially with context continuity
- [x] Pass prior chapter summaries to each new chapter for coherence
- [x] Track generation progress per chapter
- [x] Auto-save each chapter to DB as it completes

## Book Editor
- [x] Chapter list sidebar with status indicators
- [x] Outline preview before starting to write
- [x] Chapter content editor (editable textarea)
- [x] Regenerate individual chapter button
- [x] Word count per chapter + total book word count

## AI Image Generation
- [x] Generate book cover from title/genre/description
- [x] Generate custom illustrations with prompt
- [x] View all generated images in sidebar
- [x] Save image URL to DB and S3

## Export
- [x] Export full book as plain text (.txt)
- [x] Export full book as Markdown (.md)
- [ ] Export full book as DOCX (future enhancement)

## Tests
- [x] Vitest tests for settings, books, chapters (7 tests passing)
- [x] Auth logout test (1 test passing)

## Bug Fixes & Improvements (Round 2)
- [ ] Fix max_tokens → max_completion_tokens for newer OpenAI models
- [ ] Add OpenRouter support as alternative API provider (with model list)
- [ ] Auto-save book immediately when created (no data loss on tab switch)
- [ ] Auto-save wizard form state to localStorage so it persists on refresh
- [ ] Fix image generation (use correct OpenAI images API endpoint)
- [ ] Show clear error messages when API calls fail
