# mml-bookmark — product brief

Version 1.0 · 22 October 2026 · Personal pilot

This brief consolidates three discovery rounds. The first release is a personal tool tested with friends, with no fixed deadline. Confirmed requirements and recommended defaults are distinguished below. Source coverage, extraction quality, and demand still require validation.

## Product concept

mml-bookmark is a personal library for saving internet content and finding it later through automatically assigned, predefined categories.

The first audience is people saving recipes and ideas from social media. Launch enrichment focuses on YouTube, YouTube Shorts, and recipe websites. Recipes have a consistent presentation regardless of source: name, image, ingredients, and steps.

Proposed promise: “Save recipes and ideas in one place. Find them organized, and read recipes in the same clear format wherever they came from.”

## Problem and value hypothesis

Useful material is scattered across browser bookmarks, social-platform saves, messages, and notes. Users may struggle to find it again or use a recipe buried in a video or long webpage.

The hypothesis is that category browsing and consistent recipe cards make saved content easier to retrieve and use. This is not yet an established advantage over existing products.

Success means finding and using previously saved material with little organizational effort. Saved-item volume alone is insufficient evidence of value.

## Confirmed founder decisions

| Area | Requirement |
| --- | --- |
| Initial users | People saving recipes and ideas from social media |
| First release | A personal tool tested with friends |
| Timeline | No fixed deadline; iterate toward a usable pilot |
| Launch sources | YouTube and Shorts; recipe websites |
| Long-term coverage | Webpages, recipes, videos, reels, social posts, and other internet links |
| Capture | iOS share extension, one-click Chrome extension, and manual URL entry |
| Categories | The same predefined set for everyone, assigned automatically by a backend LLM |
| Recipe view | Name, image, ingredients, and ordered preparation steps in a consistent layout |
| Recipe evidence | Obtain details from webpage content, video descriptions, transcripts, or relevant comments where accessible and supported |
| Preservation | Readable copies or transcripts where supported; date added; YouTube thumbnails where applicable |
| Partial extraction | Show a partial recipe with missing information clearly marked |
| Extraction failure | Ask for no additional work; retain the link and available preview |

Platform direction: an iOS app and a browser-accessible library, with a desktop Chrome extension for quick capture. A commercial launch and monetization are not prerequisites for this personal pilot. Development capacity, spending limits, languages, and exact category labels remain open; there is no fixed release date.

## Launch support and boundaries

| Source | Intended launch behavior | What still needs verification |
| --- | --- | --- |
| Recipe websites | Capture the link and available metadata; extract a normalized recipe when sufficient evidence exists | Site coverage, blocked pages, incomplete or conflicting data |
| YouTube and Shorts | Capture the link and preview; build a recipe card from supported evidence when sufficient | Transcript acquisition, comment coverage, extraction quality, processing cost |
| Other links | Proposed: accept as ordinary bookmarks and categorize from available evidence | Whether generic capture should be advertised at launch |

Instagram and TikTok are outside the confirmed launch enrichment scope. Their later support must be evaluated separately.

Source-independent presentation does not imply identical extraction or preservation coverage across sources. Accepting a URL, extracting its content, categorizing it, and preserving it are separate capabilities.

## Main user journey

1. Discover a recipe or idea and share it to mml-bookmark, click the Chrome save action, or paste its URL.
2. Save the bookmark and its date immediately, with a clear success, queued, or retry result.
3. Process available content in the background; assign categories from the shared set.
4. Display a normalized recipe card when recipe information is obtained. If only part is recovered, show that partial recipe with explicit gaps. If no useful recipe information is recovered, keep the link and available preview without requesting text, screenshots, or uploads.
5. Later browse categories or search the library, recognize the item, and open its recipe card or original source.

Categorization, recipe extraction, and preservation have separate statuses. A categorized bookmark can still lack a recipe card or retained readable copy.

## Consistent recipe presentation

| Field | Expected behavior |
| --- | --- |
| Name | A dish name grounded in the source |
| Image | A relevant source image, or the YouTube thumbnail where appropriate; use a placeholder if unavailable |
| Ingredients | An organized list preserving the source’s ingredient names, quantities, units, and grouping where available |
| Steps | Ordered instructions preserving stated actions, times, and temperatures |
| Source | Original link and available creator attribution |
| Date added | When the user saved the bookmark, separate from source publication and processing dates |

The founder requires the first four fields as the common recipe layout and has chosen to retain partial recipes with missing information clearly marked. Source attribution and evidence tracking are recommended supporting rules.

Readable text and transcripts can support extraction and preservation, but they are not the main recipe presentation. An AI summary is not a substitute for a transcript or original text.

Recommended accuracy rules:

- Extract recipe facts from acquired evidence; never invent ingredients, amounts, temperatures, or steps.
- Distinguish an intentionally unspecified amount, such as “salt to taste,” from a value lost during extraction.
- Prefer creator-authored instructions and corrections. Viewer substitutions must not silently become part of the creator’s recipe.
- Track which description, comment, transcript segment, or webpage passage supports extracted details.
- Resolve conflicts explicitly; do not combine different recipe versions into an unsupported hybrid.
- Use a placeholder when no source image is available. Label missing ingredient amounts and preparation details explicitly; never fill gaps from general cooking knowledge.
- Preserve manually corrected information if later reprocessing is introduced.

Partial-recipe behavior:

- Keep the extracted facts in the standard layout and mark the card as incomplete when gaps are known.
- Use precise labels such as “Amount not found in captured source” or “Some preparation details could not be extracted.”
- Keep a stated “to taste” amount as written; do not mislabel intentional wording as an extraction failure.
- Keep the original source easy to open. Show the available ingredients and steps without requiring the user to correct them.
- Recommended threshold: an identifiable dish with useful ingredient or instruction content becomes a partial card; a title and image alone remain an ordinary bookmark.
- Treat a populated card as an automated extraction, not a guarantee that every source detail has been captured.

A video containing several recipes is an unresolved case. Do not assume one source always equals one recipe.

## Acquisition approach and feasibility

Recipe websites: inspect available Recipe structured data first, then relevant visible recipe content. Schema.org and Google document fields for recipe names, images, ingredients, and instructions. [10–11] This supports a parsing-first approach where structured data is present; it does not guarantee its completeness or accuracy.

YouTube and Shorts: use accessible creator descriptions and linked original recipes where relevant; combine them with supported transcripts and relevant comments when needed. This is an engineering hypothesis to test, not a guaranteed integration. The image must match the saved content; a general thumbnail may not depict the finished dish.

YouTube’s official caption-download API requires permission to edit the video. It is not a general transcript API for arbitrary saved videos; another supported acquisition method needs validation. [7] Comment retrieval can fail, including when comments are disabled. [12]

Proposed comment policy: prioritize creator-authored recipe details; identify viewer contributions and conflicts separately. Limit how many comments are processed, and measure the coverage lost by that limit. Do not promise that every relevant or pinned comment can be retrieved.

iOS capture receives the data supplied by the source app through its share extension. [1] Desktop Chrome can obtain active-page information after an explicit user action, with permitted extraction where configured. [2] A manually pasted URL may provide less evidence.

Backend LLM categorization chooses only approved categories. LLM recipe extraction organizes acquired evidence into the shared recipe format. These are separate operations; neither requires a user-facing chat feature.

## Category browsing

The shared predefined category model is confirmed. Users do not need to select a category before saving.

Recommended defaults: allow multiple relevant categories per item and let users correct assignments by choosing from the existing set. Personal category creation and automatic generation of new user categories are outside the proposed MVP.

Keep topic, content type, and source distinct. For example, a YouTube cooking video can have topic Cooking, item type Recipe, and source YouTube. Recipe-specific filters, such as cuisine or preparation time, are later scope choices rather than confirmed launch requirements.

Exact category labels, hierarchy, and treatment of empty categories remain to be decided. For pilot testing, start with a short common set. Candidate topics are Cooking, Home & DIY, Travel, Fitness, Technology & Learning, Shopping, and Entertainment. These labels are recommendations to test, not approved requirements. Recipe browsing may later need a fixed meal-type subdivision once the pilot library becomes large enough to expose retrieval problems.

## Preservation and fallback

Retain the original link, date added, and available preview. Where supported, preserve readable content or a transcript and the normalized recipe. Record when source content was captured, because this may differ from the save date.

A successful bookmark save must not imply that a readable copy or recipe was successfully captured. Preserve useful content while it is accessible; deletion before extraction may prevent recovery.

A thumbnail URL is an external reference, not proof that the image will remain available. YouTube exposes thumbnail URLs [8], and its API data has storage, refresh, and deletion requirements [9]. Permanent preservation of a deleted video’s thumbnail is not yet a validated promise.

Confirmed outcomes: useful but incomplete recipe data produces a partial recipe card with visible gaps; total extraction failure produces a bookmark with the available preview. Show concise states such as “Recipe incomplete” and “Recipe unavailable.” Neither outcome requires additional work from the user.

Original video-file archiving has not been requested. Frame analysis, OCR, and generated speech transcription are not automatically included simply because transcript-based extraction is desired; scope them against verified acquisition methods and cost.

## Proposed MVP scope

- One account and a library synchronized between iOS and the web.
- iOS sharing, a desktop Chrome save action, and manual URL capture.
- Reliable saving, duplicate detection, and background processing.
- Predefined category assignment and browsing.
- Normalized recipe cards for the two launch source groups, including partial recipes with known gaps clearly marked.
- Original source, date saved, and available previews.
- Basic text search, title/category correction, deletion, and a simple export.
- Clear extraction status and the confirmed link-and-preview fallback.

Normalize duplicate URLs carefully, retaining the original and meaningful parameters.

Shopping lists, meal planning, nutrition estimation, serving conversion, social feeds, collaboration, automatic translation, and other social-platform integrations are outside the proposed MVP unless the founder selects them later. General ideas remain ordinary bookmarks; no additional specialized item templates are committed.

## Competitive challenge

General bookmarking overlaps with mymind’s automatic organization and Raindrop’s AI suggestions. [3–6]

Recipes also introduce a direct competitor: ReciMe advertises website and YouTube importing, an iOS app, a web app, and a Chrome extension. [13] Its help page says recipe importing does not read comments and describes limitations with private content and posts containing multiple recipes. [14]

Consistent recipe presentation is therefore not an established unique advantage. Reliable creator-comment extraction may be a testable opportunity; category browsing across recipes and other ideas is another hypothesis. Neither is validated by the existence of a competitor limitation.

## Pilot plan and acceptance examples

Recommended sequence, with no calendar commitment:

1. Test extraction on representative recipe websites, YouTube videos, and Shorts before investing heavily in interface polish.
2. Build the common recipe format and web library with manual URL saving.
3. Add the Chrome save action, iOS app, and iOS share extension against the same backend.
4. Invite a small group of friends to save real content and return to it later. A group of 3–5 people is a suggested starting point, not a recruitment target already agreed with the founder.

The complete pilot still includes both the browser and iOS experiences. This sequence is a recommendation for reducing uncertainty, not a reduction of the requested platform scope.

| Scenario | Expected outcome |
| --- | --- |
| Website recipe and video recipe | Both use the same name, image, ingredients, and steps layout |
| Some amounts or instructions are missing | Retain useful extracted data and mark known gaps; invent no missing facts |
| Nothing useful can be extracted | Keep the source link and available preview without requesting more input |
| Categorization finishes later or fails | The saved bookmark remains accessible; show an appropriate processing state |
| Browse on iOS and in the web library | The same account sees the saved item, its categories, and original save date |
| Source later disappears | Successfully preserved content remains readable where its acquisition and retention support this |

For an early recipe extraction benchmark, treat every invented recipe fact as a defect. Set coverage and retrieval targets after collecting representative examples; a numeric target without that baseline would be arbitrary.

## Validation and risks

Before committing to broad support, test 30–50 representative links as a planning sample, covering both launch source groups, complete and incomplete recipes, description-only recipes, comment-based details, Shorts, and multiple recipes in one source.

Measure:

- Save success and time to usable result.
- Recipe-card coverage per source and capture method.
- Ingredient, quantity, and step accuracy against human-checked sources.
- Unsupported facts, missing information, and incorrectly merged variations.
- Category correction rate and delayed retrieval success.
- Frequency of link-only fallback.
- Processing cost per item, including comment scans, transcription, retries, and model calls.

Agree acceptable thresholds before evaluating the pilot. A cheap categorization pipeline can still be expensive if video acquisition or transcription dominates costs.

The central risks are insufficient extraction coverage, plausible but inaccurate recipes, a confusing category set, and weak reasons to switch from existing tools.

## Decisions retained for implementation planning

The core product brief is ready to guide a pilot. The following choices remain open and should not silently become confirmed requirements:

- The supported extraction method and measured coverage for YouTube transcripts and comments.
- Precise category labels and whether items can have multiple categories.
- Launch language or languages and handling of mixed-language sources.
- Multiple recipes in one source and contradictory creator instructions.
- Development capacity, running-cost limit, and first testers.
- Privacy expectations, any external model processing, and retention choices.

Recommended pilot defaults: keep each user’s library private, preserve source language, avoid automatic translation, prioritize creator-authored evidence, and separate viewer variations. These defaults are proposals for implementation planning.

There is no need to choose subscriptions, public launch infrastructure, or a commercial roadmap to begin validating the personal tool.

## Sources

Checked 22 October 2026. Product documentation establishes advertised behavior, not independently tested performance.

1. [Apple — Share extensions](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/Share.html).
2. [Chrome — activeTab permission](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab).
3. [mymind — How it works](https://mymind.helpscoutdocs.com/article/68-how-mymind-works).
4. [mymind — FAQ](https://mymind.com/faq).
5. [mymind — Browser extensions](https://mymind.com/browser-extensions).
6. [Raindrop — AI Suggestions](https://blog.raindrop.io/ai-suggestions-5a85762ae176/).
7. [YouTube — Captions: download](https://developers.google.com/youtube/data/reference/rest/v3/captions/download).
8. [YouTube — Video resource](https://developers.google.com/youtube/data/reference/rest/v3/videos).
9. [YouTube — Developer Policies](https://developers.google.com/youtube/terms/developer-policies).
10. [Schema.org — Recipe](https://schema.org/Recipe).
11. [Google — Recipe structured data](https://developers.google.com/search/docs/appearance/structured-data/recipe).
12. [YouTube — CommentThreads: list](https://developers.google.com/youtube/data/reference/rest/v3/commentThreads/list).
13. [ReciMe — Product and platform availability](https://www.recime.app/).
14. [ReciMe — Import limitations](https://www.recime.app/help/en/articles/14773584-why-didn-t-my-recipe-import-correctly).
