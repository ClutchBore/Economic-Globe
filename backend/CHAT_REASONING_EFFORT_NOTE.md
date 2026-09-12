# Chat multi-turn bug — root cause + recommendation

## Symptom
Chat worked for one question, then failed (or, after the `stream_with_fallback`
change, silently forgot everything from earlier turns).

## Root cause
`chat_about_country` sends `reasoning_effort: "high"` (via `IFM_DEFAULT_PARAMS`)
on every chat request. IFM's reasoning models generate an internal "thinking"
block before their final answer, and per IFM's own contract, once a request has
reasoning enabled, **every prior assistant turn in the conversation must include
the thinking content that produced it** — not just the final answer text. We
only ever store `{role, content}` per turn, so as soon as history is non-empty,
IFM rejects the request outright:

```
400 — "Add a supported thinking field to each assistant message in the
multi-turn conversation history. See the multi-turn request guide:
https://docs.ifm.ai/#/multi-turn"
```

Confirmed by hitting `https://api.ifm.ai/v1/chat/completions` directly with a
hand-built payload, bypassing all of our FastAPI/validation code — same error,
verbatim.

This is why turn 1 always succeeds (empty history, nothing to check) and turn 2+
always hits it (first turn with a prior assistant message).

## Current fallback (`stream_with_fallback`)
Retries with `fallback_messages` (country data + current message, **no
history**) whenever the primary attempt raises before yielding text. This
avoids the crash, but means every multi-turn request silently loses
conversation memory — verified by asking a turn-3 follow-up referencing a prior
answer; the model replied "this is the first message in our conversation."

## Recommendation
Drop `reasoning_effort` (the `chat_template_kwargs` param) specifically for the
chat endpoint's request, and keep it for `summarize_country` / `compare_countries`
(both single-turn, unaffected by this constraint).

Why this fits: the chat system prompt already asks for short, data-grounded
answers ("2-4 short bullets... using only the supplied data") — retrieval and
formatting, not the kind of multi-step problem reasoning effort helps with. So
quality risk is low, and it removes the need for the history-dropping fallback
entirely — real multi-turn memory works again.

The alternative — capturing IFM's actual thinking blocks and resending them per
assistant turn — is the "more correct" fix, but needs: confirming which field
IFM streams reasoning under, extending `ChatTurn` with a thinking field, and
having the frontend store more than `{role, text}` per message. Given the time
constraints, that's more surface than this feature needs.

## Where to change it
`backend/services/ai.py` — give the chat request's payload a params dict
without `chat_template_kwargs`, separate from `IFM_DEFAULT_PARAMS` (which
`_generate_text` should keep using for summarize/compare).
