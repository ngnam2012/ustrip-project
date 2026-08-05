Design for me a new feature shared trips

1. Core Feature Concept
"Shared Trips" transforms private trip itineraries into public or link-shared community guides. Users can discover trips created by others, leave ratings and comments, and clone/copy any trip plan directly into their personal account to customize for their own travels.

2. Key Functionalities Required
A. Public Sharing & Discovery
Visibility Toggle: Ability for a trip owner to change a trip's status between Private, Shared via Link, and Public (Community).

Community Trip Card / Preview: Showcase trip title, cover photo, total days, main destinations, average rating, total copies/clones, and author profile.

B. Clone / Copy Trip Flow
"Copy to My Trips" Action: Button on shared trips allowing viewers to duplicate the itinerary into their own account.

Duplication Logic: Copy all locations, daily activities, and notes, but reset user-specific data (e.g., booked ticket confirmations, personal budget items, or private notes).

Attribution: Maintain a line on the copied trip: "Cloned from [Author Name]'s [Original Trip Title]".

C. Community Engagement (Comments & Ratings)
Rating System: 1–5 star rating system with aggregate averages displayed on the trip header.

Discussion / Comments: Threaded comments section under the trip for questions, travel tips, and feedback.

Moderation Basics: Options to report inappropriate comments or delete owned comments/trips.

3. Requested Deliverables
Complete Step-by-Step User Flow: From sharing a trip to another user discovering, copying, and rating it.

Data Model / Database Schema: Tables for SharedTrips, TripCopies, TripRatings, and TripComments with foreign keys and indexes.

UI/UX Guidelines & Copy: Recommended copy for call-to-action buttons, empty states, and toast confirmation messages.

Edge Cases & Security: Handling of modified original trips after cloning, deleted author accounts, and permission management.