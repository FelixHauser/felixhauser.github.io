// i18n system — all UI strings live here.
// Add new keys to all three languages whenever you add new UI text.

const TRANSLATIONS = {
  de: {
    portal: {
      greeting:         'Hallo,',
      myIpad:           'Mein iPad',
      serialNumber:     'Seriennummer',
      type:             'Gerätetyp',
      storage:          'Speicher',
      status:           'Status',
      assignedSince:    'Zugewiesen seit',
      typeStudent:      'Schüler-iPad',
      typeStaff:        'Lehrkraft-iPad',
      terms:            'Nutzungsbedingungen',
      termsNotAccepted: 'Noch nicht akzeptiert — bitte unten bestätigen.',
      termsAcceptedOn:  'Akzeptiert am',
      termsViewBtn:     'Bedingungen lesen & akzeptieren',
      termsModalTitle:  'Nutzungsbedingungen',
      termsAcceptBtn:   'Ich akzeptiere die Nutzungsbedingungen',
      reportDamage:     'Schaden melden',
      reportLoss:       'Verlust / Diebstahl melden',
      cancel:           'Abbrechen',
      logout:           'Abmelden',
      loading:          'Wird geladen…',
      errorNoIpad:      'Diesem Konto ist kein iPad zugewiesen.',
      errorGeneric:     'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',
      statuses: {
        available:           'Verfügbar',
        in_use:              'In Verwendung',
        prepared_for_repair: 'Reparatur vorbereitet',
        shipped_for_repair:  'Zur Reparatur',
        back_from_repair:    'Zurück aus Reparatur',
        to_be_erased:        'Wird gelöscht',
        lost:                'Verloren',
        stolen:              'Gestohlen',
        decommissioned:      'Ausgemustert',
      },
      schaden: {
        title:           'Schadenmeldung',
        typeLabel:       'Art des Schadens',
        screen:          'Display',
        water:           'Wasserschaden',
        other:           'Sonstiges',
        descLabel:       'Beschreibung',
        descPlaceholder: 'Bitte beschreibe den Schaden genau…',
        submit:          'Meldung abschicken',
        submitting:      'Wird gesendet…',
        success:         'Die Schadenmeldung wurde erfolgreich eingereicht.',
      },
      verlust: {
        title:            'Verlust- / Diebstahlmeldung',
        dateLabel:        'Datum des Vorfalls',
        circLabel:        'Wie ist es passiert?',
        circPlaceholder:  'Bitte beschreibe die Umstände genau…',
        policeLabel:      'Aktenzeichen (falls Anzeige erstattet)',
        policePlaceholder:'z. B. AZ 2024/12345',
        submit:           'Meldung abschicken',
        submitting:       'Wird gesendet…',
        success:          'Die Verlustmeldung wurde erfolgreich eingereicht.',
      },
    },
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
    portal: {
      greeting:         'Hello,',
      myIpad:           'My iPad',
      serialNumber:     'Serial Number',
      type:             'Device Type',
      storage:          'Storage',
      status:           'Status',
      assignedSince:    'Assigned since',
      typeStudent:      'Student iPad',
      typeStaff:        'Staff iPad',
      terms:            'Terms of Use',
      termsNotAccepted: 'Not yet accepted — please confirm below.',
      termsAcceptedOn:  'Accepted on',
      termsViewBtn:     'Read & accept terms',
      termsModalTitle:  'Terms of Use',
      termsAcceptBtn:   'I accept the Terms of Use',
      reportDamage:     'Report Damage',
      reportLoss:       'Report Loss / Theft',
      cancel:           'Cancel',
      logout:           'Log out',
      loading:          'Loading…',
      errorNoIpad:      'No iPad is assigned to this account.',
      errorGeneric:     'An error occurred. Please try again.',
      statuses: {
        available:           'Available',
        in_use:              'In Use',
        prepared_for_repair: 'Prepared for Repair',
        shipped_for_repair:  'Sent for Repair',
        back_from_repair:    'Back from Repair',
        to_be_erased:        'To Be Erased',
        lost:                'Lost',
        stolen:              'Stolen',
        decommissioned:      'Decommissioned',
      },
      schaden: {
        title:           'Damage Report',
        typeLabel:       'Type of Damage',
        screen:          'Screen',
        water:           'Water Damage',
        other:           'Other',
        descLabel:       'Description',
        descPlaceholder: 'Please describe the damage in detail…',
        submit:          'Submit Report',
        submitting:      'Sending…',
        success:         'Your damage report has been submitted.',
      },
      verlust: {
        title:            'Loss / Theft Report',
        dateLabel:        'Date of Incident',
        circLabel:        'How did it happen?',
        circPlaceholder:  'Please describe the circumstances in detail…',
        policeLabel:      'Police Report Number (if applicable)',
        policePlaceholder:'e.g. AZ 2024/12345',
        submit:           'Submit Report',
        submitting:       'Sending…',
        success:          'Your loss report has been submitted.',
      },
    },
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
    portal: {
      greeting:         'Merhaba,',
      myIpad:           'iPad\'im',
      serialNumber:     'Seri Numarası',
      type:             'Cihaz Türü',
      storage:          'Depolama',
      status:           'Durum',
      assignedSince:    'Atanma tarihi',
      typeStudent:      'Öğrenci iPad\'i',
      typeStaff:        'Öğretmen iPad\'i',
      terms:            'Kullanım Koşulları',
      termsNotAccepted: 'Henüz kabul edilmedi — lütfen aşağıda onaylayın.',
      termsAcceptedOn:  'Kabul tarihi',
      termsViewBtn:     'Koşulları oku ve kabul et',
      termsModalTitle:  'Kullanım Koşulları',
      termsAcceptBtn:   'Kullanım Koşullarını kabul ediyorum',
      reportDamage:     'Hasar Bildir',
      reportLoss:       'Kayıp / Hırsızlık Bildir',
      cancel:           'İptal',
      logout:           'Çıkış Yap',
      loading:          'Yükleniyor…',
      errorNoIpad:      'Bu hesaba atanmış bir iPad bulunamadı.',
      errorGeneric:     'Bir hata oluştu. Lütfen tekrar deneyin.',
      statuses: {
        available:           'Mevcut',
        in_use:              'Kullanımda',
        prepared_for_repair: 'Onarım Hazırlığı',
        shipped_for_repair:  'Onarıma Gönderildi',
        back_from_repair:    'Onarımdan Döndü',
        to_be_erased:        'Silinecek',
        lost:                'Kayıp',
        stolen:              'Çalındı',
        decommissioned:      'Hizmet Dışı',
      },
      schaden: {
        title:           'Hasar Raporu',
        typeLabel:       'Hasar Türü',
        screen:          'Ekran',
        water:           'Su Hasarı',
        other:           'Diğer',
        descLabel:       'Açıklama',
        descPlaceholder: 'Lütfen hasarı ayrıntılı olarak açıklayın…',
        submit:          'Raporu Gönder',
        submitting:      'Gönderiliyor…',
        success:         'Hasar raporunuz başarıyla iletildi.',
      },
      verlust: {
        title:            'Kayıp / Hırsızlık Raporu',
        dateLabel:        'Olay Tarihi',
        circLabel:        'Nasıl oldu?',
        circPlaceholder:  'Lütfen koşulları ayrıntılı olarak açıklayın…',
        policeLabel:      'Polis Tutanak Numarası (varsa)',
        policePlaceholder:'Örn. AZ 2024/12345',
        submit:           'Raporu Gönder',
        submitting:       'Gönderiliyor…',
        success:          'Kayıp raporunuz başarıyla iletildi.',
      },
    },
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
