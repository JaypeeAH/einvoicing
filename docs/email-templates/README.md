# Email templates

Branded replacements for Supabase's default authentication emails. Paste each one into
**Supabase → Authentication → Emails → Templates**, together with the subject line below.

| File                  | Supabase template    | Subject line                                           |
| --------------------- | -------------------- | ------------------------------------------------------ |
| `invite-user.html`    | Invite user          | `You've been invited to {{ .Data.organization_name }}` |
| `confirm-signup.html` | Confirm signup       | `Confirm your email to start invoicing`                |
| `reset-password.html` | Reset password       | `Reset your SME e-Invoicing password`                  |
| `magic-link.html`     | Magic Link           | `Your sign-in link`                                    |
| `change-email.html`   | Change email address | `Confirm your new email address`                       |

> If you renamed the product, update the wordmark and footer text in each file. They are plain HTML — the
> only moving parts are the `{{ … }}` placeholders Supabase fills in.

---

## Why the links look the way they do

Every template links to **your app**, not to Supabase:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite&next=/set-password
```

Supabase's stock templates use `{{ .ConfirmationURL }}` instead. That address bounces through Supabase and
comes back with the session in the part of the URL after `#`, which browsers never send to a server. The app
can't see it, so the visitor lands on the homepage still signed out — and an invited person, who has no
password yet, then gets "Incorrect email or password" forever.

The `token_hash` form above is verified on the server, which is why it works. (The app also carries a
browser-side fallback for older links, so invitations sent before this change still work.)

`type` must match the template: `invite`, `signup`, `recovery`, `magiclink`, `email_change`.

---

## Before the links will work

**Authentication → URL Configuration**

- **Site URL** — the address the app runs on. This is what `{{ .SiteURL }}` becomes:
    - production: `https://jp-einvoicing.vercel.app`
    - a separate test project should point at its own URL
- **Redirect URLs** — add every origin that may receive a link:
    ```
    https://jp-einvoicing.vercel.app/**
    http://localhost:3000/**
    ```

If a redirect address isn't on that list, Supabase silently falls back to the Site URL and the link appears
to "do nothing but open the homepage".

**Authentication → Providers → Email**

- Enable **Confirm email** (new sign-ups verify their address).
- **Minimum password length: 10**, and require **letters and digits** — the standard for computerised
  accounting systems (RMC 5-2021 Annex B). The app enforces the same rule.

**Authentication → Emails → SMTP Settings** — set up your own sender before going live. The built-in
Supabase sender is rate-limited to a few messages per hour and is only meant for testing, so invitations to
a real team will silently stop arriving.

---

## Checking it works

1. Invite yourself at a second email address (**Administration → Users & Roles → Invite user**).
2. The email should arrive branded, addressed from your business, with a **Set my password** button.
3. The button should open `/set-password` with "Welcome aboard" and your email shown.
4. Set a password, and you should land in the app already signed in.

If a link says it expired, open **Users & Roles** and use the ✉️ button on that row to send a new one.
Invitations last 24 hours; password resets last 1 hour.
