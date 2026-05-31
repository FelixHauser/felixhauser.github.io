// i18n system — all UI strings live here.
// Add new keys to all three languages whenever you add new UI text.

const TRANSLATIONS = {
  de: {
    login: {
      subtitle:            'iPad-Verwaltung',
      usernameLabel:       'E-Mail oder Seriennummer',
      usernamePlaceholder: 'E-Mail oder Seriennummer',
      usernameHint:        'Lehrkräfte: E-Mail-Adresse  ·  Schüler / Eltern: Seriennummer',
      passwordLabel:       'Passwort',
      loginButton:         'Anmelden',
      loggingIn:           'Wird angemeldet…',
      errorInvalidCredentials: 'E-Mail / Seriennummer oder Passwort falsch.',
      errorNoRole:         'Diesem Konto ist keine Rolle zugewiesen. Bitte Administrator kontaktieren.',
      errorGeneric:        'Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
    }
  },
  en: {
    login: {
      subtitle:            'iPad Management',
      usernameLabel:       'Email or Serial Number',
      usernamePlaceholder: 'Email or Serial Number',
      usernameHint:        'Staff: email address  ·  Students / Parents: serial number',
      passwordLabel:       'Password',
      loginButton:         'Log in',
      loggingIn:           'Logging in…',
      errorInvalidCredentials: 'Incorrect email / serial number or password.',
      errorNoRole:         'No role is assigned to this account. Please contact the administrator.',
      errorGeneric:        'Login failed. Please try again.',
    }
  },
  tr: {
    login: {
      subtitle:            'iPad Yönetimi',
      usernameLabel:       'E-posta veya Seri Numarası',
      usernamePlaceholder: 'E-posta veya Seri Numarası',
      usernameHint:        'Öğretmenler: e-posta adresi  ·  Öğrenciler / Veliler: seri numarası',
      passwordLabel:       'Şifre',
      loginButton:         'Giriş Yap',
      loggingIn:           'Giriş yapılıyor…',
      errorInvalidCredentials: 'E-posta / seri numarası veya şifre yanlış.',
      errorNoRole:         'Bu hesaba herhangi bir rol atanmamış. Lütfen yönetici ile iletişime geçin.',
      errorGeneric:        'Giriş başarısız. Lütfen tekrar deneyin.',
    }
  }
};

// The currently active language code ('de' | 'en' | 'tr').
let currentLang = localStorage.getItem('lang') || 'de';

// Returns the translation for a dot-separated key like 'login.loginButton'.
function t(key) {
  const parts = key.split('.');
  let node = TRANSLATIONS[currentLang];
  for (const part of parts) {
    node = node?.[part];
  }
  // Fall back to German if a key is missing in the chosen language.
  if (node === undefined) {
    node = TRANSLATIONS['de'];
    for (const part of parts) { node = node?.[part]; }
  }
  return node ?? key;
}

// Walks the DOM and fills in every element that has a data-i18n attribute.
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Mark the active language button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
  document.documentElement.lang = currentLang;
}

// Switches the active language, saves it to localStorage, and refreshes the UI.
function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
}
