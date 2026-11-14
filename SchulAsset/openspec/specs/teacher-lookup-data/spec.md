# teacher-lookup-data Specification

## Purpose

The database side of the teacher lookup: the read-only role `teacher`, which has no access to any table, and the two functions `lookup_ipad` and `lookup_ipad_details` through which it reads exactly one iPad at a time. Callable by `teacher` and `admin` only.

## Requirements
### Requirement: The teacher role exists and is read-only
The `user_roles` table SHALL allow the role `teacher`. This role SHALL have no read or write policy on any table, so it cannot read or change table data directly.

#### Scenario: Direct table access
- **WHEN** a `teacher` queries `ipads`, `pupils`, `ipad_history` or any other table through the API
- **THEN** no rows are returned

#### Scenario: No writes
- **WHEN** a `teacher` tries to insert, update or delete in any table
- **THEN** the database refuses it

### Requirement: Lookup function returns the minimum
A function `lookup_ipad(p_serial)` SHALL find the iPad whose serial number equals the trimmed input, ignoring case, and SHALL return only its id, serial number and the owner's full name. It SHALL return nothing when no iPad matches, and it SHALL NOT do partial matching.

#### Scenario: Exact match
- **WHEN** `lookup_ipad('f9xy12abc')` is called and the serial `F9XY12ABC` exists
- **THEN** the id, the serial number and the owner's name are returned

#### Scenario: Partial input
- **WHEN** the input is only a part of a serial number
- **THEN** nothing is returned

#### Scenario: iPad without owner
- **WHEN** the iPad has no pupil and no staff member assigned
- **THEN** the owner's name is returned as null

### Requirement: Details function returns one iPad's data
A function `lookup_ipad_details(p_ipad_id)` SHALL return, for that one iPad: master data (serial number, type, storage, status, assigned date), the owner (kind, name, and address for pupils), the guardian from the current terms acceptance (only if entered), the current terms acceptance date and version, the latest Übergabeprotokoll created since the assignment date, all history rows newest first, and all Schadenmeldungen newest first. It SHALL NOT return signature images, IP addresses, portal password data or any other iPad's data.

#### Scenario: Complete iPad
- **WHEN** the function is called for an assigned iPad with accepted terms, a protocol, history and a damage report
- **THEN** all of these parts are in the result

#### Scenario: Invalidated terms
- **WHEN** the only terms acceptance of the iPad has been invalidated (iPad was freed)
- **THEN** the result contains no terms and no guardian

#### Scenario: Excluded fields
- **WHEN** the result is inspected
- **THEN** it contains no `signature_url`, no `ip_address` and no password hash

### Requirement: Only allowed roles can call the functions
Both functions SHALL check that the caller is logged in and has the role `teacher` or `admin`, and SHALL refuse everybody else. Execute permission SHALL NOT be granted to anonymous users.

#### Scenario: Teacher
- **WHEN** a `teacher` calls either function
- **THEN** it works

#### Scenario: Student
- **WHEN** a `student` calls either function
- **THEN** the call fails with a permission error and returns no data

#### Scenario: Not logged in
- **WHEN** a request without a login calls either function
- **THEN** the call is refused

### Requirement: Database changes are logged
Every change made by hand in Supabase for this feature (role value, functions, grants) SHALL be added to `supabase/db-changes.md`, including how to create a teacher account.

#### Scenario: Log entry
- **WHEN** the change is finished
- **THEN** `supabase/db-changes.md` contains the SQL and the account creation steps
