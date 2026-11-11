## ADDED Requirements

### Requirement: CDN libraries use exact versions
Every third-party library loaded from a CDN in `login.html`, `portal.html` and `admin.html` SHALL be referenced with an exact version (e.g. `1.2.3`), never with `latest`, a major-only range (e.g. `@2`) or no version.

#### Scenario: No floating version tags
- **WHEN** the `<script src>` tags of the three HTML files are inspected
- **THEN** none of the CDN URLs contains `@latest`, a major-only version such as `@2`, or lacks a version

#### Scenario: Supabase client version is consistent
- **WHEN** the supabase-js script tags in `login.html`, `portal.html` and `admin.html` are compared
- **THEN** all three reference the same exact version

### Requirement: Icon library failure does not stop the admin app
The admin interface SHALL start and be usable even if the Lucide icon library fails to load.

#### Scenario: Lucide unavailable
- **WHEN** the Lucide script cannot be loaded and `admin.html` is opened by a logged-in admin
- **THEN** `initAdmin()` still runs and the admin views render, without icons

#### Scenario: Lucide available
- **WHEN** the Lucide script loads normally
- **THEN** icons are rendered as before
