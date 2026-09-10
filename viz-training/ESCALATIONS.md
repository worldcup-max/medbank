# MedBank · model3d — ESCALATIONS

**This file is a desk for humans. Frank and the session working with him read it; the build and
review tasks only write to it.**

An item lands here when an automated loop has decided it cannot finish the job. That is a legitimate
outcome, not a failure — the whole point of a stopping condition is that something eventually reaches
a person instead of burning runs forever.

An item is escalated for exactly one of three reasons:

1. **Three review rounds without converging.** The build task fixed what the review asked for, the
   review still found it wrong, three times. Something about the item is not understood by either
   side, and a fourth round will not discover it.
2. **The structure should not be procedural.** Irregular organic form — anything a student is
   examined on recognising *exactly* — needs a mesh, not code. RENDER-STANDARD §5.
3. **A decision no task is allowed to make.** Curriculum scope, what counts as correct when sources
   disagree, anything that changes what a student is taught.

## How an entry must be written

Enough for a human to decide **without opening anything else**. A vague entry wastes the escalation.

```
## <UTC date> · <item id> · <reason 1, 2 or 3>

WHAT WAS ASKED FOR       one sentence
WHAT WAS BUILT           one sentence, and where the render is
WHAT KEEPS FAILING       the specific defect, in anatomical terms, not "it looks wrong"
WHY IT IS NOT CONVERGING what each round tried and why the next round would not do better
WHAT I WOULD DO          the recommendation, and what it costs
DECISION NEEDED          the actual question, phrased so it can be answered yes or no
```

Neither task touches an escalated item again. A human resolves it and sets the status back to `todo`
with a note saying what changed — otherwise it will simply escalate again for the same reason.

---

## Open

*(none yet)*

## Resolved

*(none yet)*
