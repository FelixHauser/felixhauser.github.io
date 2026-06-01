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
      leihvertrag: {
        downloadBtn:    'Leihvertrag herunterladen',
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
        descPlaceholder:        'Bitte beschreibe den Schaden genau…',
        datumEingetretenLabel:  'Schaden eingetreten am',
        datumEntdecktLabel:     'Entdeckt am (falls abweichend)',
        perpetratorLabel:       'Schadensverursacher/in (falls abweichend)',
        perpetratorPlaceholder: 'Name der Person, falls nicht du selbst',
        submit:                 'Meldung abschicken',
        submitting:             'Wird gesendet…',
        success:                'Die Schadenmeldung wurde erfolgreich eingereicht.',
        downloadBtn:            'Schadenmeldung herunterladen',
      },
      verlust: {
        title:               'Verlust- / Diebstahlmeldung',
        dateLabel:           'Datum des Vorfalls',
        circLabel:           'Wie ist es passiert?',
        circPlaceholder:     'Bitte beschreibe die Umstände genau…',
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
      uebergabe: {
        title:       'Übergabeprotokoll',
        pendingMsg:  'Bitte bestätigen Sie den Erhalt des iPads.',
        acceptBtn:   'Erhalt bestätigen',
        acceptedOn:  'Bestätigt am',
        downloadBtn: 'Übergabeprotokoll herunterladen',
      },
      rueckgabe: {
        title:       'Rückgabeprotokoll',
        pendingMsg:  'Bitte bestätigen Sie die Rückgabe des iPads.',
        acceptBtn:   'Rückgabe bestätigen',
        acceptedOn:  'Bestätigt am',
        downloadBtn: 'Rückgabeprotokoll herunterladen',
      },
      protocol: {
        issuedBy:    'Ausgestellt von',
        condition:   'Zustand',
        defects:     'Mängel',
        defectDesc:  'Defektbeschreibung',
        accessories: 'Weiteres Zubehör',
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
      leihvertrag: {
        downloadBtn:    'Download loan agreement',
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
      uebergabe: {
        title:       'Handover Protocol',
        pendingMsg:  'Please confirm receipt of the iPad.',
        acceptBtn:   'Confirm receipt',
        acceptedOn:  'Confirmed on',
        downloadBtn: 'Download handover protocol',
      },
      rueckgabe: {
        title:       'Return Protocol',
        pendingMsg:  'Please confirm the return of the iPad.',
        acceptBtn:   'Confirm return',
        acceptedOn:  'Confirmed on',
        downloadBtn: 'Download return protocol',
      },
      protocol: {
        issuedBy:    'Issued by',
        condition:   'Condition',
        defects:     'Defects',
        defectDesc:  'Defect description',
        accessories: 'Additional accessories',
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
      leihvertrag: {
        downloadBtn:    'Ödünç sözleşmesini indir',
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
      uebergabe: {
        title:       'Teslim Tutanağı',
        pendingMsg:  'Lütfen iPad\'in teslim alındığını onaylayın.',
        acceptBtn:   'Teslimi onayla',
        acceptedOn:  'Onay tarihi',
        downloadBtn: 'Teslim tutanağını indir',
      },
      rueckgabe: {
        title:       'İade Tutanağı',
        pendingMsg:  'Lütfen iPad\'in iade edildiğini onaylayın.',
        acceptBtn:   'İadeyi onayla',
        acceptedOn:  'Onay tarihi',
        downloadBtn: 'İade tutanağını indir',
      },
      protocol: {
        issuedBy:    'Düzenleyen',
        condition:   'Durum',
        defects:     'Kusurlar',
        defectDesc:  'Arıza açıklaması',
        accessories: 'Ek aksesuar',
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
