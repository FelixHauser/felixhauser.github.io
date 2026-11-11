# ipad-portal-accounts Specification

## Purpose

Creating or resetting the portal login account of an iPad (Edge Function `create-ipad-account`) works regardless of how many portal accounts exist, and failures are reported to the caller.

## Requirements

### Requirement: Portal account creation does not depend on account count
The `create-ipad-account` function SHALL create a new portal account, or reset the password of the existing one, for any number of existing portal accounts, including more than 1000.

#### Scenario: New iPad account
- **WHEN** an admin calls the function for a serial number that has no portal account
- **THEN** the account `{SERIAL}@schulasset.local` is created with the `student` role and the new password is returned

#### Scenario: Existing account on the first page
- **WHEN** an admin calls the function for a serial number whose account exists among the first 1000 accounts
- **THEN** that account's password is reset and the new password is returned

#### Scenario: Existing account beyond the first 1000 accounts
- **WHEN** more than 1000 portal accounts exist and an admin calls the function for a serial number whose account is not among the first 1000
- **THEN** that account's password is reset and the new password is returned, without an "already registered" error

### Requirement: Unrelated creation errors are reported
The function SHALL return an error response when account creation fails for a reason other than the account already existing.

#### Scenario: Other creation failure
- **WHEN** account creation fails for a reason other than the email already existing
- **THEN** the function responds with status 500 and the error message
