## CREATE AGENTs

```text
create a agent desctiprion into @AGENTS.md to describe a generate a ticket admin app that allow generate tickets, transfer ticket and checking in th event make it easy to mantein, use like base the gile @requirements.md
```

## CREATE CONSTITUTION

```text
let's create a "constitution" in a spects directory:
- mission.md
- tech-stack.md
- roadmap.md for high-level implementation order, in very samml pahses to work.

Important: You must use your AskUserQuestion tool, gropued on these 3, before wirtting to disk.
```

## CREATE SPECS (FOUNDATION)

```text
Find the next phase on specs/roadmap.md and make a branch, ask me about the feature spec. Create:

- A new directory YYYY-MM-DD-feature-name under specs for this feature work in there
- plan.md as a series of numered task groups.
- requirements.md for the scope, decisions, context.
- validation.md for how the implementation succeeded and can be merged.

Refer to specs/mission and specs/tech-stack.md for guidance.

Important: You must use your AskUserQuestion tool, gropued on these 3, before wirtting to disk.

```

## IMPLEMENTATION

```text
implement ONLY the taks 1 of @specs/2026-09-05-foundation-setup/plan.md, and mask as resolved in @specs/roadmap.md , write tests then the code, tell what you do, stop not init the task 2
```

## VALIDATION

```text
analyze the @specs/2026-09-05-foundation-setup/validation.md and validate if all tha task are done and update it
```

---

> I want a CHANGELOG.md int the root of the project use the changelog skill

## CONTINUE WITH NEW FEATURE OF THE NEXT PHASE

Use the feature-spec skill.

```text
Go to the roamp map and continue with the next phase

```

## RE-PLANING

```text
1. Update the spec/tech-stack.md to use zod for form validation, and add to spec/mision.md doit the app responsive for desktop, tablets and mobile.
2. update the @specs/2026-09-05-ticket-generation/ with the changes and update roadmap
```

```text
For ticket generation the fields checkoutSessionId (random uuid autogenerate), ticketTypeSale (NORMAL by default we dont need type in a field), ticketType (EARLY-BIRD by default we dont need to type in a field), paymenIntent (random uuid autogenerate), paymentId (random uuid autogenerate),please udate the specs
```

## CONTINUE WITH NEW FEATURE OF THE NEXT PHASE 3

**create a new spec**

```text
Go to the roadmap and continue with the next phase
```

## CONTINUE WITH NEW FEATURE OF THE NEXT PHASE 3

**create a new spec**

```text
Go to the roadmap and continue with the next phase
```

## UPDATE

```text
the checkin would be avalaible to scan a QR with the camera, I want a list of all tickets with his QR, add nav bar menu for routers, add to specs
```
