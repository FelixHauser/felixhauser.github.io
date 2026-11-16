// Pure functions for the Lehrkräfte list: access state and sorting.
// No page access, so they can be tested in Node (see the check at the bottom).
// (OpenSpec change `manage-logins`.)

// State of a Lehrkraft's login: 'none' (no login), 'active', 'locked', or 'unknown'
// (has a login but its state could not be read, e.g. the function is not deployed).
// `loginsById` = Map(user_id → { locked }) from listStaffLogins(), or null if it could not be loaded.
function staffAccessState(staff, loginsById) {
  if (!staff.user_id) return 'none';
  const login = loginsById && loginsById.get(staff.user_id);
  if (!login) return 'unknown';
  return login.locked ? 'locked' : 'active';
}

// Rank used when sorting by "Zugang" (ascending): active, locked, unknown, none.
const _ACCESS_RANK = { active: 0, locked: 1, unknown: 2, none: 3 };

// Compares two texts the German way (umlauts, case). Empty / missing texts sort last.
function _compareText(a, b) {
  const x = (a ?? '').trim(), y = (b ?? '').trim();
  if (!x && !y) return 0;
  if (!x) return 1;
  if (!y) return -1;
  return x.localeCompare(y, 'de', { sensitivity: 'base' });
}

// Returns a NEW sorted array. key: 'name' | 'kuerzel' | 'access' | 'status'; dir: 1 or -1.
// Ties are always broken by name (last, first), so the order is stable and predictable.
// 'status' ascending puts active people first.
function sortStaff(list, key, dir, loginsById) {
  const byName = (a, b) => _compareText(a.last_name, b.last_name) || _compareText(a.first_name, b.first_name);
  const primary = {
    name:    byName,
    kuerzel: (a, b) => _compareText(a.kuerzel, b.kuerzel),
    access:  (a, b) => _ACCESS_RANK[staffAccessState(a, loginsById)] - _ACCESS_RANK[staffAccessState(b, loginsById)],
    status:  (a, b) => (a.is_active === false ? 1 : 0) - (b.is_active === false ? 1 : 0),
  }[key] || byName;

  return [...list].sort((a, b) => {
    const c = primary(a, b);
    // Empty Kürzel stay last in both directions; every other column simply reverses.
    if (key === 'kuerzel' && (!(a.kuerzel ?? '').trim() || !(b.kuerzel ?? '').trim()) && c !== 0) return c;
    return (c * dir) || byName(a, b);
  });
}

// Lets Node load this file for tests; in the browser `module` does not exist.
if (typeof module !== 'undefined') module.exports = { staffAccessState, sortStaff };
