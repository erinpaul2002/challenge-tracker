# UI Flow Structure - Challenge Tracker

## Authentication Pages (Separate from main app)

### Signup Page (`/signup`)
- **User Type**: Streamers only
- **Fields**:
  - Name (text input)
  - Email (email input)
  - Channel Name (text input, optional)
  - Password (password input)
  - Confirm Password (password input)
- **Actions**: Sign up button, link to login

### Login Page (`/login`)
- **Toggle**: Streamer vs Moderator login
- **Streamer Login**:
  - Email (email input)
  - Password (password input)
- **Moderator Login** (Updated):
  - Streamer Selection (dropdown with active streamers)
  - Password (password input)
- **Actions**: Login button, link to signup, forgot password

## Streamer Section (`/streamer/*`)

### Layout Structure
- **Sidebar**: Navigation menu
- **Top Navbar**: User info, notifications, logout
- **Main Content**: Page-specific content

### Pages
- `/streamer/dashboard` - Overview, recent challenges, stats
- `/streamer/challenges` - Challenge list, create new challenge
- `/streamer/challenges/[id]` - Challenge details, edit, manage sub-challenges
- `/streamer/overlay` - Overlay configuration, preview
- `/streamer/moderator` - Moderator management, create/delete moderators
- `/streamer/profile` - Profile settings, account info

## Moderator Section (`/moderator/*`)

### Layout Structure
- **Sidebar**: Navigation menu (limited options)
- **Top Navbar**: User info, logout
- **Main Content**: Page-specific content

### Pages
- `/moderator/dashboard` - Overview, assigned challenges
- `/moderator/challenges` - Challenge list (only for assigned streamer)
- `/moderator/challenges/[id]` - Challenge details, update progress

### Permissions
- **Can access**: Dashboard, Challenges
- **Cannot access**: Moderator management, Overlay settings, Profile

## Key Differences

| Feature | Streamer | Moderator |
|---------|----------|-----------|
| Signup | ✅ Can create account | ❌ Created by streamer |
| Login | Email + password | Streamer selection + password |
| Challenge Management | Full CRUD | Update only |
| Moderator Management | ✅ Create/manage | ❌ No access |
| Overlay Settings | ✅ Configure | ❌ No access |
| Profile | ✅ Personal settings | ❌ Shared credentials |

## Navigation Flow

```
Login/Signup (Public)
    ↓
Streamer Login → /streamer/dashboard
    ↓
/streamer/* pages

OR

Moderator Login → /moderator/dashboard
    ↓
/moderator/* pages (limited)
```

## Next Steps
- Design system (colors, typography, theme)
- Component library
- Responsive design
- Error states and loading
- Accessibility requirements</content>
<parameter name="filePath">c:\Users\user\OneDrive\Desktop\ERIN_PAUL_MANJALY\PersonalGithub\challenge-tracker\challenge-tracker\doc\UI_FLOW_STRUCTURE.md