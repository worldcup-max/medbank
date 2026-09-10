
### Postscript — the review was fired and again cannot reach the repo

Fired `trig_01WDYyWaeB4uzeXjfVfvtDTN` ("MedBank · model3d review + correct (v2, folders attached)") at
13:47Z, session `cse_01AXLzGNXrSrx99KbubcnVjH`, with the item id and a list of the five things to look
at hardest — the `fit()` change first, because it touches every scene rather than only this item.

It came back **`no_signed_approval` — "run not approved for Claude Desktop (Windows) — this run uses the
cloud only"**, the third time in a row, exactly as §4 of `BUILD-TASK-PROMPT.md` predicts.

I confirmed the trigger id against `list_triggers` rather than trusting the document, as §4 now tells us
to. The id is right; the name is right; `derived_state.folders_state` is `FOLDERS_STATE_PRESENT` with the
medbank folder listed. **Nothing about the folder configuration is wrong.** What is missing is the signed
device approval a person gives when a run starts, and a task cannot sign for another task.

One detail that narrows it further, and that I checked this run: **the review task's `cron_expression` is
empty.** It is a fire-only task. The build task fires hourly (`5 * * * *`) and gets its folders every
time; the escalation desk fires daily (`0 6 * * *`) and gets them too. The review task is the only one of
the three with no schedule, and it is the only one that never gets its folders. That is consistent with
the prompt's first suggested fix, and it makes it the cheaper of the two:

> **Give `trig_01WDYyWaeB4uzeXjfVfvtDTN` a cron entry.** A scheduled firing carries the binding, which is
> how this build run got its folders. Something like `35 * * * *` would put it half an hour behind the
> build task. **I did not do this** — §4 says the fix is Frank's, and changing the schedule of another
> task on his account is his call, not a build run's.

**REVIEW FIRED BUT CANNOT REACH THE REPO — `engine__per-view-t` IS BUILT, NOT REVIEWED.**

That is now **three** items sitting at `built` behind the same broken link: `cardiac-looping`,
`refit-camera-on-isolate`, and this one. The build task will keep producing one an hour and none of them
will be reviewed until the binding is fixed, so the backlog grows by one per hour from here.
