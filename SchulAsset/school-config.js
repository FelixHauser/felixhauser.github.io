// school-config.js — the school's identity (name, Schulträger, logo).
//
// THE INSTALLING SCHOOL EDITS THIS FILE ONCE. Nothing here is secret.
//
//   name       Short name. Goes into the Leihvertrag PDF (field "school_name").
//   fullName   Long name. Used for the printed access card and the logo's alt text.
//   authority  Schulträger (owner of the iPads), e.g. "Stadt Marl".
//   logo       Path of the logo file, relative to this folder. Replace the file or
//              change the path. PNG or JPEG, square-ish, about 300 px is plenty.
//
// After changing the logo file, reload the page with Cmd+Shift+R (the browser may
// keep showing the old image). After changing this file, run ./bump-version.sh
// before pushing, so visitors do not get an old copy.
//
// The legal pages (datenschutz.html, impressum.html) load no scripts on purpose;
// edit their logo and text by hand.
//
// If this file is missing or broken, the pages still work: the HTML keeps the same
// defaults as written below.

window.SCHOOL = {
  name:      'Martin Luther King Schule',
  fullName:  'Martin-Luther-King-Schule Marl',
  authority: 'Stadt Marl',
  logo:      'mlks_logo.png',
};

// Fills every <img data-school-logo> with the logo (and its alt text, if it has one)
// and every [data-school-name] with the long name. Text is inserted with textContent,
// never as HTML. Safe to call more than once.
function applySchoolBranding() {
  try {
    const s = window.SCHOOL || {};
    document.querySelectorAll('img[data-school-logo]').forEach(img => {
      if (s.logo) img.src = s.logo;
      if (s.fullName && img.getAttribute('alt')) img.alt = s.fullName;
    });
    document.querySelectorAll('[data-school-name]').forEach(el => {
      if (s.fullName) el.textContent = s.fullName;
    });
  } catch (e) {
    console.error('School branding could not be applied:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySchoolBranding);
} else {
  applySchoolBranding();
}
