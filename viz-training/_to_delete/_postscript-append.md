
### Postscript — the review was fired and again cannot reach the repo

Fired `trig_01WDYyWaeB4uzeXjfVfvtDTN` ("MedBank · model3d review + correct (v2, folders attached)") at
13:05Z, session `cse_01RA61EYvbqPd9kqv8rtqiqi`, with the item id and a summary of what to look at.

It came back **`no_signed_approval` — "run not approved for Claude Desktop (Windows) — this run uses
the cloud only"**, exactly as §4 of `BUILD-TASK-PROMPT.md` predicts. So that session opens with no
connected folders, will say so as its first line, and will stop.

Worth recording precisely, because it narrows the fix: `list_triggers` shows the review task's
`derived_state.folders_state` as **`FOLDERS_STATE_PRESENT`**, with `C:\Users\domin\OneDrive\Documents\GitHub\medbank`
in its `folders` list — the same as the build task, which did get its folders this run. **The folders
are configured on the task. What is missing is the signed device approval that a person gives when a
run starts, and a task cannot sign for another task.** So this is not a matter of re-attaching the
folder; it is the binding, and the two fixes named in the prompt are still the two fixes: give the
review task its own cron entry (a scheduled firing carries the binding, which is how this build run
got its folders), or fire it from the desktop.

**REVIEW FIRED BUT CANNOT REACH THE REPO — `engine__refit-camera-on-isolate` IS BUILT, NOT REVIEWED.**

That is now two items sitting at `built` behind the same broken link.
