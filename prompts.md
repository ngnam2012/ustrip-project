Please process this prompts and create an implematation plan before doing this tasks. 
> **Task:**
> Redesign the user invitation flow for a trip-planning feature to change automatic acceptance into a pending invitation state with explicit user consent (Accept/Deny).
> ---
> 
> 
> ### 1. Current vs. Target Behavior
> 
> 
> * **Current Flow:**
> User A invites User B via email $\rightarrow$ User B is automatically added to the trip.
> * **New Target Flow:**
> User A invites User B via email $\rightarrow$ Invitation status set to `PENDING` $\rightarrow$ User B receives a notification $\rightarrow$ User B explicitly chooses to **Accept** or **Deny** the invitation.
> 
> 
> ---
> 
> 
> ### 2. Technical & UX Requirements
> 
> 
> #### A. Database & State Changes
> 
> 
> * Add or update the trip membership status field: `PENDING`, `ACCEPTED`, `DECLINED`.
> * Trips with `PENDING` status should **not** appear in the user's primary trip list until accepted (or should be placed in an "Invites / Pending" tab).
> 
> 
> #### B. Notification & UI Experience
> 
> 
> * **In-App Notification:** Create a notification entry for User B (e.g., *"User A invited you to join [Trip Name]"*).
> * **Actionable UI:** Provide clear, immediate action buttons directly within the notification or pending view: **[Accept]** and **[Decline]**.
> * **Email Update:** Update the invitation email to direct the user to the in-app notification or a direct link/landing page to confirm/deny.
> 
> 
> #### C. Inviter View (User A)
> 
> 
> * In the trip's member list, display invited users with a **"Pending"** badge until they act.
> * Provide an option to **Resend Invite** or **Cancel Invite**.
> 
> 
> ---
> 
> 
> ### 3. Deliverables Requested
> 
> 
> Please provide:
> 1. **User Flow Diagram / Step-by-Step Logic:** Outline each screen, button click, and status transition.
> 2. **UI/UX Copy:** Write the exact copy for the in-app notification, email, and button labels.
> 3. **Edge Case Handling:** Detail how to handle expired invites, existing/non-existing users, and duplicate invites.
> 4. **API / Backend Changes:** List the endpoint modifications or new endpoints needed to process `Accept` and `Decline` actions.
> 
>

Ask me on the go if you're concern with anything and notify me what you changed. Don't change the whole architecture just need to fix the needed part