// i18n system — all UI strings live here.
// Add new keys to all three languages whenever you add new UI text.

const TRANSLATIONS = {
  de: {
    portal: {
      greeting:         'Hallo, {name}!',
      myIpad:           'Mein iPad',
      serialNumber:     'Seriennummer',
      type:             'Typ',
      storage:          'Speicher',
      assignedSince:    'Zugewiesen seit',
      typeStudent:      'Schüler/in',
      typeStaff:        'Lehrkraft',
      termsModalTitle:  'Leihvertrag',
      termsAcceptBtn:   'Ich akzeptiere den Leihvertrag',
      reportDamage:     'Schaden melden',
      reportLoss:       'Verlust / Diebstahl melden',
      cancel:           'Abbrechen',
      close:            'Schließen',
      logout:           'Abmelden',
      loading:          'Wird geladen…',
      errorNoIpad:      'Diesem Konto ist kein iPad zugewiesen.',
      errorGeneric:     'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',
      downloadFailed:   'Download fehlgeschlagen:',
      // Main screen: top bar and problem block
      main: {
        details:  'iPad-Details',
        problem:  'Problem mit dem iPad?',
      },
      // Main screen: the four-step timeline
      steps: {
        leihvertrag: {
          title:       'Leihvertrag',
          activeTitle: 'Leihvertrag lesen & bestätigen',
          activeSub:   'Bitte lesen Sie den Leihvertrag und bestätigen Sie ihn.',
          open:        'Leihvertrag öffnen',
          acceptedOn:  'Akzeptiert am {date}',
          download:    'Leihvertrag herunterladen',
        },
        uebergabe: {
          title:       'iPad erhalten',
          waiting:     'Die Schule bereitet die Übergabe vor. Sie müssen hier nichts tun.',
          activeTitle: 'iPad erhalten bestätigen',
          activeSub:   'Bitte prüfen Sie den Zustand des iPads und bestätigen Sie den Erhalt.',
          confirm:     'Erhalt bestätigen',
          confirmedOn: 'Bestätigt am {date}',
          download:    'Übergabeprotokoll herunterladen',
        },
        inUse: {
          title:  'iPad in Verwendung',
          active: 'Das iPad wird aktiv genutzt.',
        },
        rueckgabe: {
          lockedTitle: 'iPad zurückgeben',
          doneTitle:   'iPad zurückgegeben',
          activeTitle: 'Rückgabe bestätigen',
          activeSub:   'Bitte prüfen Sie den Zustand des iPads und bestätigen Sie die Rückgabe.',
          confirm:     'Rückgabe bestätigen',
          confirmedOn: 'Bestätigt am {date}',
          download:    'Rückgabeprotokoll herunterladen',
        },
      },
      leihvertrag: {
        guardianSection:'Erziehungsberechtigte/r',
        guardianHint:   'Nur ausfüllen, falls abweichend vom Schüler / der Schülerin.',
        erzFirstName:   'Vorname',
        erzLastName:    'Nachname',
        erzAddress:     'Anschrift',
      },
      schaden: {
        title:                  'Schadenmeldung',
        typeLabel:              'Art des Schadens',
        screen:                 'Display',
        water:                  'Wasserschaden',
        other:                  'Sonstiges',
        descLabel:              'Beschreibung',
        descPlaceholder:        'Bitte beschreiben Sie den Schaden genau…',
        datumEingetretenLabel:  'Schaden eingetreten am',
        datumEntdecktLabel:     'Entdeckt am (falls abweichend)',
        perpetratorLabel:       'Schadensverursacher/in (falls abweichend)',
        perpetratorPlaceholder: 'Name der Person, falls nicht Sie selbst',
        submit:                 'Meldung abschicken',
        submitting:             'Wird gesendet…',
        success:                'Die Schadenmeldung wurde erfolgreich eingereicht.',
        downloadBtn:            'Schadenmeldung herunterladen',
      },
      verlust: {
        title:               'Verlust- / Diebstahlmeldung',
        dateLabel:           'Datum des Vorfalls',
        circLabel:           'Wie ist es passiert?',
        circPlaceholder:     'Bitte beschreiben Sie die Umstände genau…',
        ortLabel:            'Ort des letzten bekannten Verbleibs',
        ortPlaceholder:      'z. B. Schulhof, Schulweg, zu Hause',
        datumBemerktLabel:   'Verlust bemerkt am',
        policeLabel:         'Aktenzeichen (falls Anzeige erstattet)',
        policePlaceholder:   'z. B. AZ 2024/12345',
        notitzenLabel:       'Notizen (optional)',
        notitzenPlaceholder: 'Weitere Hinweise…',
        submit:              'Meldung abschicken',
        submitting:          'Wird gesendet…',
        success:             'Die Verlustmeldung wurde erfolgreich eingereicht.',
        downloadBtn:         'Verlustmeldung herunterladen',
      },
      protocol: {
        issuedBy:    'Ausgestellt von',
        condition:   'Zustand',
        defects:     'Mängel',
        defectDesc:  'Defektbeschreibung',
        accessories: 'Weiteres Zubehör',
      },
      sig: {
        label:          'Unterschrift',
        hint:           'Mit Maus oder Finger unterschreiben',
        clear:          'Löschen',
        required:       'Bitte zuerst unterschreiben.',
        confirm:        'Bestätigen',
        saving:         'Wird gespeichert…',
        uebergabeTitle: 'Erhalt bestätigen',
        uebergabeDesc:  'Bitte unterschreiben Sie, um den Erhalt des iPads zu bestätigen.',
        rueckgabeTitle: 'Rückgabe bestätigen',
        rueckgabeDesc:  'Bitte unterschreiben Sie, um die Rückgabe des iPads zu bestätigen.',
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
      forgotLink:          'Passwort vergessen?',
      forgotIntro:         'Geben Sie Ihre Admin-E-Mail-Adresse ein. Sie erhalten einen Reset-Link.',
      emailLabel:          'E-Mail-Adresse',
      sendResetLink:       'Reset-Link senden',
      backToLogin:         '← Zurück zum Login',
      newPasswordIntro:    'Wählen Sie ein neues Passwort für Ihren Admin-Account.',
      newPasswordLabel:    'Neues Passwort',
      savePassword:        'Passwort speichern',
      errorEmailRequired:  'Bitte eine E-Mail-Adresse eingeben.',
      errorPrefix:         'Fehler:',
      resetLinkSent:       'Reset-Link gesendet. Bitte prüfen Sie Ihr E-Mail-Postfach.',
      errorPasswordTooShort: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
      passwordSaved:       'Passwort gespeichert. Sie werden weitergeleitet…',
    },
    // Footer link labels only — the legal pages themselves are German only.
    legal: {
      footerDatenschutz: 'Datenschutz',
      footerImpressum:   'Impressum',
    }
  },
  en: {
    portal: {
      greeting:         'Hello, {name}!',
      myIpad:           'My iPad',
      serialNumber:     'Serial Number',
      type:             'Type',
      storage:          'Storage',
      assignedSince:    'Assigned since',
      typeStudent:      'Pupil',
      typeStaff:        'Staff',
      termsModalTitle:  'Loan agreement',
      termsAcceptBtn:   'I accept the loan agreement',
      reportDamage:     'Report Damage',
      reportLoss:       'Report Loss / Theft',
      cancel:           'Cancel',
      close:            'Close',
      logout:           'Log out',
      loading:          'Loading…',
      errorNoIpad:      'No iPad is assigned to this account.',
      errorGeneric:     'An error occurred. Please try again.',
      downloadFailed:   'Download failed:',
      // Main screen: top bar and problem block
      main: {
        details:  'iPad details',
        problem:  'Problem with the iPad?',
      },
      // Main screen: the four-step timeline
      steps: {
        leihvertrag: {
          title:       'Loan agreement',
          activeTitle: 'Read & confirm the loan agreement',
          activeSub:   'Please read the loan agreement and confirm it.',
          open:        'Open loan agreement',
          acceptedOn:  'Accepted on {date}',
          download:    'Download loan agreement',
        },
        uebergabe: {
          title:       'iPad received',
          waiting:     'The school is preparing the handover. You do not need to do anything here.',
          activeTitle: 'Confirm receipt of iPad',
          activeSub:   'Please check the condition of the iPad and confirm that you have received it.',
          confirm:     'Confirm receipt',
          confirmedOn: 'Confirmed on {date}',
          download:    'Download handover protocol',
        },
        inUse: {
          title:  'iPad in use',
          active: 'The iPad is in active use.',
        },
        rueckgabe: {
          lockedTitle: 'Return iPad',
          doneTitle:   'iPad returned',
          activeTitle: 'Confirm return',
          activeSub:   'Please check the condition of the iPad and confirm the return.',
          confirm:     'Confirm return',
          confirmedOn: 'Confirmed on {date}',
          download:    'Download return protocol',
        },
      },
      leihvertrag: {
        guardianSection:'Parent / Guardian',
        guardianHint:   'Only fill in if different from the pupil\'s details.',
        erzFirstName:   'First name',
        erzLastName:    'Last name',
        erzAddress:     'Address',
      },
      schaden: {
        title:                  'Damage Report',
        typeLabel:              'Type of Damage',
        screen:                 'Screen',
        water:                  'Water Damage',
        other:                  'Other',
        descLabel:              'Description',
        descPlaceholder:        'Please describe the damage in detail…',
        datumEingetretenLabel:  'Damage occurred on',
        datumEntdecktLabel:     'Discovered on (if different)',
        perpetratorLabel:       'Person responsible (if not yourself)',
        perpetratorPlaceholder: 'Name of the person, if not yourself',
        submit:                 'Submit Report',
        submitting:             'Sending…',
        success:                'Your damage report has been submitted.',
        downloadBtn:            'Download damage report',
      },
      verlust: {
        title:               'Loss / Theft Report',
        dateLabel:           'Date of Incident',
        circLabel:           'How did it happen?',
        circPlaceholder:     'Please describe the circumstances in detail…',
        ortLabel:            'Last known location',
        ortPlaceholder:      'e.g. school yard, on the way home',
        datumBemerktLabel:   'Loss noticed on',
        policeLabel:         'Police Report Number (if applicable)',
        policePlaceholder:   'e.g. AZ 2024/12345',
        notitzenLabel:       'Notes (optional)',
        notitzenPlaceholder: 'Any additional information…',
        submit:              'Submit Report',
        submitting:          'Sending…',
        success:             'Your loss report has been submitted.',
        downloadBtn:         'Download loss report',
      },
      protocol: {
        issuedBy:    'Issued by',
        condition:   'Condition',
        defects:     'Defects',
        defectDesc:  'Defect description',
        accessories: 'Additional accessories',
      },
      sig: {
        label:          'Signature',
        hint:           'Sign with mouse or finger',
        clear:          'Clear',
        required:       'Please sign first.',
        confirm:        'Confirm',
        saving:         'Saving…',
        uebergabeTitle: 'Confirm receipt',
        uebergabeDesc:  'Please sign to confirm receipt of the iPad.',
        rueckgabeTitle: 'Confirm return',
        rueckgabeDesc:  'Please sign to confirm the return of the iPad.',
      },
    },
    login: {
      subtitle:            'iPad Management',
      usernameLabel:       'Email or Serial Number',
      usernamePlaceholder: 'Email or Serial Number',
      usernameHint:        'Staff: email address  ·  Pupils / Parents: serial number',
      passwordLabel:       'Password',
      loginButton:         'Log in',
      loggingIn:           'Logging in…',
      errorInvalidCredentials: 'Incorrect email / serial number or password.',
      errorNoRole:         'No role is assigned to this account. Please contact the administrator.',
      errorGeneric:        'Login failed. Please try again.',
      forgotLink:          'Forgot password?',
      forgotIntro:         'Enter your admin email address. You will receive a reset link.',
      emailLabel:          'Email address',
      sendResetLink:       'Send reset link',
      backToLogin:         '← Back to login',
      newPasswordIntro:    'Choose a new password for your admin account.',
      newPasswordLabel:    'New password',
      savePassword:        'Save password',
      errorEmailRequired:  'Please enter an email address.',
      errorPrefix:         'Error:',
      resetLinkSent:       'Reset link sent. Please check your inbox.',
      errorPasswordTooShort: 'The password must be at least 6 characters long.',
      passwordSaved:       'Password saved. Redirecting…',
    },
    // Footer link labels only — the legal pages themselves are German only.
    legal: {
      footerDatenschutz: 'Privacy policy',
      footerImpressum:   'Legal notice',
    }
  },
  tr: {
    portal: {
      greeting:         'Merhaba, {name}!',
      myIpad:           'iPad\'im',
      serialNumber:     'Seri Numarası',
      type:             'Tür',
      storage:          'Depolama',
      assignedSince:    'Atanma tarihi',
      typeStudent:      'Öğrenci',
      typeStaff:        'Öğretmen',
      termsModalTitle:  'Ödünç sözleşmesi',
      termsAcceptBtn:   'Ödünç sözleşmesini kabul ediyorum',
      reportDamage:     'Hasar Bildir',
      reportLoss:       'Kayıp / Hırsızlık Bildir',
      cancel:           'İptal',
      close:            'Kapat',
      logout:           'Çıkış Yap',
      loading:          'Yükleniyor…',
      errorNoIpad:      'Bu hesaba atanmış bir iPad bulunamadı.',
      errorGeneric:     'Bir hata oluştu. Lütfen tekrar deneyin.',
      downloadFailed:   'İndirme başarısız:',
      // Main screen: top bar and problem block
      main: {
        details:  'iPad ayrıntıları',
        problem:  'iPad ile ilgili bir sorun mu var?',
      },
      // Main screen: the four-step timeline
      steps: {
        leihvertrag: {
          title:       'Ödünç sözleşmesi',
          activeTitle: 'Ödünç sözleşmesini oku ve onayla',
          activeSub:   'Lütfen ödünç sözleşmesini okuyun ve onaylayın.',
          open:        'Sözleşmeyi aç',
          acceptedOn:  'Kabul tarihi: {date}',
          download:    'Ödünç sözleşmesini indir',
        },
        uebergabe: {
          title:       'iPad\'i teslim alma',
          waiting:     'Okul teslimatı hazırlıyor. Burada yapmanız gereken bir şey yok.',
          activeTitle: 'iPad\'in teslim alındığını onayla',
          activeSub:   'Lütfen iPad\'in durumunu kontrol edin ve teslim aldığınızı onaylayın.',
          confirm:     'Teslimi onayla',
          confirmedOn: 'Onay tarihi: {date}',
          download:    'Teslim tutanağını indir',
        },
        inUse: {
          title:  'iPad kullanımda',
          active: 'iPad aktif olarak kullanılıyor.',
        },
        rueckgabe: {
          lockedTitle: 'iPad\'i iade et',
          doneTitle:   'iPad iade edildi',
          activeTitle: 'İadeyi onayla',
          activeSub:   'Lütfen iPad\'in durumunu kontrol edin ve iadeyi onaylayın.',
          confirm:     'İadeyi onayla',
          confirmedOn: 'Onay tarihi: {date}',
          download:    'İade tutanağını indir',
        },
      },
      leihvertrag: {
        guardianSection:'Veli / Yasal Temsilci',
        guardianHint:   'Yalnızca öğrenciden farklıysa doldurun.',
        erzFirstName:   'Ad',
        erzLastName:    'Soyad',
        erzAddress:     'Adres',
      },
      schaden: {
        title:                  'Hasar Raporu',
        typeLabel:              'Hasar Türü',
        screen:                 'Ekran',
        water:                  'Su Hasarı',
        other:                  'Diğer',
        descLabel:              'Açıklama',
        descPlaceholder:        'Lütfen hasarı ayrıntılı olarak açıklayın…',
        datumEingetretenLabel:  'Hasar oluşma tarihi',
        datumEntdecktLabel:     'Fark edilme tarihi (farklıysa)',
        perpetratorLabel:       'Hasara neden olan kişi (siz değilseniz)',
        perpetratorPlaceholder: 'Kişinin adı, eğer siz değilseniz',
        submit:                 'Raporu Gönder',
        submitting:             'Gönderiliyor…',
        success:                'Hasar raporunuz başarıyla iletildi.',
        downloadBtn:            'Hasar raporunu indir',
      },
      verlust: {
        title:               'Kayıp / Hırsızlık Raporu',
        dateLabel:           'Olay Tarihi',
        circLabel:           'Nasıl oldu?',
        circPlaceholder:     'Lütfen koşulları ayrıntılı olarak açıklayın…',
        ortLabel:            'Son bilinen konum',
        ortPlaceholder:      'Örn. okul bahçesi, eve giderken',
        datumBemerktLabel:   'Kaybın fark edildiği tarih',
        policeLabel:         'Polis Tutanak Numarası (varsa)',
        policePlaceholder:   'Örn. AZ 2024/12345',
        notitzenLabel:       'Notlar (isteğe bağlı)',
        notitzenPlaceholder: 'Ek bilgiler…',
        submit:              'Raporu Gönder',
        submitting:          'Gönderiliyor…',
        success:             'Kayıp raporunuz başarıyla iletildi.',
        downloadBtn:         'Kayıp raporunu indir',
      },
      protocol: {
        issuedBy:    'Düzenleyen',
        condition:   'Durum',
        defects:     'Kusurlar',
        defectDesc:  'Arıza açıklaması',
        accessories: 'Ek aksesuar',
      },
      sig: {
        label:          'İmza',
        hint:           'Fare veya parmakla imzalayın',
        clear:          'Temizle',
        required:       'Lütfen önce imzalayın.',
        confirm:        'Onayla',
        saving:         'Kaydediliyor…',
        uebergabeTitle: 'Teslimi Onayla',
        uebergabeDesc:  'iPad\'in teslimini onaylamak için lütfen imzalayın.',
        rueckgabeTitle: 'İadeyi Onayla',
        rueckgabeDesc:  'iPad\'in iadesini onaylamak için lütfen imzalayın.',
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
      forgotLink:          'Şifrenizi mi unuttunuz?',
      forgotIntro:         'Yönetici e-posta adresinizi girin. Bir sıfırlama bağlantısı alacaksınız.',
      emailLabel:          'E-posta adresi',
      sendResetLink:       'Sıfırlama bağlantısı gönder',
      backToLogin:         '← Girişe dön',
      newPasswordIntro:    'Yönetici hesabınız için yeni bir şifre seçin.',
      newPasswordLabel:    'Yeni şifre',
      savePassword:        'Şifreyi kaydet',
      errorEmailRequired:  'Lütfen bir e-posta adresi girin.',
      errorPrefix:         'Hata:',
      resetLinkSent:       'Sıfırlama bağlantısı gönderildi. Lütfen e-posta kutunuzu kontrol edin.',
      errorPasswordTooShort: 'Şifre en az 6 karakter uzunluğunda olmalıdır.',
      passwordSaved:       'Şifre kaydedildi. Yönlendiriliyorsunuz…',
    },
    // Footer link labels only — the legal pages themselves are German only.
    legal: {
      footerDatenschutz: 'Gizlilik politikası',
      footerImpressum:   'Yasal bilgiler',
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

// Like t(), but replaces {placeholders} in the text with the given values,
// e.g. tf('portal.greeting', { name: 'Anna' }) → 'Hallo, Anna!'.
function tf(key, params = {}) {
  return t(key).replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
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
  // Pages that build text in JavaScript (the portal) define window.onLangChange
  // to redraw themselves; pages without it are simply not affected.
  if (typeof window.onLangChange === 'function') window.onLangChange();
}
