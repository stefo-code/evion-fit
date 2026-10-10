<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use the shared ui-kit BereichNavigation for the nutrition and progress sections, preserving /supplements and /erfolge as their selected-section URLs so existing links keep working.
- Keep the five primary navigation entries shared between mobile and desktop; map supplementary section URLs to their parent active entry so navigation stays consistent.
- Workout is a guided step flow (warm-up, one exercise per screen, core) whose draft extends evion.workout.entwurf.v1 with optional fields; keeps old drafts and SatzLog compatible.
- Personal training plan is seeded once into PlanEinstellungen (flag persoenlichV1) as custom templates with per-exercise vorgaben and a rotation; all new fields are optional so old saved plans keep loading.
