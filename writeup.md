## Here are the skills I ran with the prompts:

Before refining the spec
/speckit-constitution Create principles focused on code quality, testing, and maintainability.
/speckit-specify A quote-of-the-day page: one random quote from a built-in list, a "New quote" button, and favoriting that persists across reloads.
/speckit-plan Use plain HTML/CSS/JavaScript, no backend; persist favorites in localStorage.
/speckit-tasks
/speckit-implement
/speckit-converge

It converged, but I then refined the spec. I updated how the removing from favorites list should work. I specified that when the user removes a quote from their favorites, it should be removed from the list but still appear there in case the user wants to refavorite it, until the page is reloaded.

## I then ran these after refining the spec.

/speckit-plan Use plain HTML/CSS/JavaScript, no backend; persist favorites in localStorage. I updated the spec to say that when you unfavorite something from the favorites list, while it is removed from the favorites list it should still be shown on the page list (until reloaded) so the user can refavorite it

/speckit-tasks
/speckit-implement
/speckit-converge
/speckit-implement
/speckit-converge
/speckit-implement
/speckit-converge

It converged!

## What I learned:
I learned that by using SDD, it is a lot easier to develop software: I can specify what I want and just let the agent do its thing and get very good results. It paid off pay off, as it implemented the plan and my modifications very nicely. However, sometimes it felt like a bit of overhead, having to run these skills at at times I feel like I could have just asked the agent directly. I also think it used up more of my usage by using this, as I hit my usage limits and it took time trying to work around it with different models.