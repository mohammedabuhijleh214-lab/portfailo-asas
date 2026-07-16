/**
 * Complete bilingual dictionary + content localization helpers
 * @module i18n
 */

'use strict';

import { CONFIG } from './config.js';

const DICT = Object.freeze({
  en: {
    dir: 'ltr',
    locale: 'en',
    skip: 'Skip to content',
    nav: { home: 'Home', services: 'Services', work: 'Work', contact: 'Contact' },
    hero: {
      sub: 'Mohammed Abu Hijleh',
      lead: 'Freelance web developer focused on clean code, solid security basics, and clear communication.',
      ctaWork: 'View work',
      ctaServices: 'See services',
    },
    about: {
      eyebrow: 'About',
      title: 'How I work with clients',
      lead: 'Straightforward process, secure defaults, and sites that stay maintainable.',
    },
    strengths: {
      speed: 'Fast, clear delivery',
      quality: 'Clean, maintainable code',
      secure: 'Security-minded builds',
      detail: 'Careful attention to detail',
    },
    services: {
      eyebrow: 'Services',
      title: 'What you can hire me for',
      lead: 'Practical packages for freelancers, creators, and small businesses. Prices are starting points and can be adjusted.',
      inquire: 'Inquire',
      empty: 'Services will appear here once published.',
      usd: 'USD',
      priceLabel: 'Starting price',
    },
    gift: {
      title: 'Client benefit',
      headline: 'Free monthly security and vulnerability scanning — for life',
      description:
        'After you purchase a website from me, you receive complimentary monthly vulnerability scanning for that site — ongoing, at no extra cost.',
      badge: 'Included after a website purchase',
    },
    projects: {
      eyebrow: 'Portfolio',
      title: 'Previous work and demos',
      lead: 'These projects demonstrate skills and coding ability. They are not products sold as packages.',
      open: 'Details',
      live: 'Live site',
      github: 'GitHub',
      demoNote: 'Skill demo — not a sales package.',
      demoLabel: 'Demo',
      empty: 'Portfolio items will appear here once published.',
      builtWith: 'Built with',
      securityNotes: 'Security notes',
      modalKicker: 'Portfolio demo',
      features: 'Features',
      security: 'Security',
      technologies: 'Technologies',
      notes: 'Notes',
      openLive: 'Open live site',
      mockups: 'Device previews',
      lightbox: 'Image preview',
    },
    terminal: {
      eyebrow: 'Terminal',
      title: 'Quick shell',
      lead: 'Try help, projects, contact, or services.',
      placeholder: 'Enter command…',
    },
    term: {
      boot: ['Initializing shell…', 'Ready. Type "help".'],
      unknown: 'Command not found: {cmd}. Type help.',
      error: 'Command failed.',
      helpDesc: 'List available commands',
      helpBody:
        'Available commands:\n  help       — show this menu\n  about      — profile\n  whoami     — identity\n  skills     — focus areas\n  projects   — portfolio demos\n  services   — hire packages\n  contact    — channels\n  social     — network\n  scan       — simulated scan\n  status     — health\n  security   — posture\n  clear      — clear buffer',
      aboutDesc: 'Profile',
      aboutExtra:
        'Builds websites for small businesses and personal brands\nwith clean code and security-minded defaults.',
      whoamiDesc: 'Identity',
      whoamiRole: 'role: Freelance web developer (security-focused)',
      skillsDesc: 'Focus areas',
      projectsDesc: 'Portfolio demos',
      projectsBody:
        'Portfolio demos (not sales packages):\n01  Cyber Portfolio & Tech Stack Showcase\n    → https://mohammedabuhijleh214-lab.github.io/portfolia/\n\n02  Aura Dental Luxury\n    → https://mohammedabuhijleh214-lab.github.io/aura-dental-luxury/',
      contactDesc: 'Channels',
      socialDesc: 'Network',
      scanDesc: 'Perimeter scan',
      scanLines: [
        'Starting simulated perimeter scan…',
        '[####............] 25%  ports',
        '[########........] 50%  headers',
        '[############....] 75%  xss surface',
        '[################] 100% complete',
        '',
        'Findings: 0 critical · 0 high · surface hardened',
        'CSP: active · Referrer-Policy: strict · Frame: denied',
      ],
      statusDesc: 'System health',
      statusBody: 'status: operational\nauth: Express + Argon2id + PostgreSQL\nsession: HTTP-only cookie',
      securityDesc: 'Security posture',
      securityBody:
        'XSS: escaped output · CSRF: double-submit\nClickjacking: frame-ancestors none\nUploads: MIME + size limited',
      clearDesc: 'Clear buffer',
      servicesDesc: 'Hire packages',
      servicesBody:
        'Services (starting prices):\n  Secure Landing Page — $180\n  Personal Brand / Portfolio — $320\n  Small Business Website — $480\n  Security Check & Hardening — $220',
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Let’s talk',
      lead: 'Share a short brief. I’ll reply by email.',
      name: 'Full name',
      email: 'Email',
      company: 'Company (optional)',
      budget: 'Budget range',
      message: 'Project brief',
      send: 'Send message',
      success: 'Message saved. I’ll get back to you by email.',
      error: 'Could not send. Please email me directly.',
      rateLimited: 'Too many messages. Please try again later.',
      asideTitle: 'Direct channels',
      asideCopy: 'Prefer email or phone? Use the links below.',
      budget150: '$150 – $300',
      budget300: '$300 – $500',
      budget500: '$500 – $800',
      budgetOther: 'Not sure',
    },
    auth: {
      title: 'Secure Admin Portal',
      sub: 'Server-side authentication · CSRF · HTTP-only session',
      username: 'Operator ID',
      password: 'Passphrase',
      submit: 'Sign in',
      close: 'Close',
      note: 'Sign-in requires the secure auth API. Credentials are verified on the server only — never in the browser.',
      success: 'Session established.',
      failed: 'Authentication failed.',
      unavailable: 'Auth service unavailable. Start the API server and try again.',
      rateLimited: 'Too many attempts. Please wait and retry.',
      csrfFailed: 'CSRF validation failed. Refresh and try again.',
      invalidFormat: 'Invalid credentials format.',
      sessionFailed: 'Session could not be confirmed.',
    },
    dash: {
      heading: 'Command Center',
      export: 'Export JSON',
      import: 'Import JSON',
      logout: 'Sign out',
      logoutDone: 'Session terminated.',
      views: 'Page Views',
      portfolio: 'Portfolio Items',
      services: 'Services',
      published: 'Published Services',
      analytics: 'Local analytics',
      analyticsNote: 'Counts from this browser only — not live production traffic.',
      audit: 'Audit Timeline',
      projectMgmt: 'Portfolio Management',
      serviceMgmt: 'Services Management',
      addProject: 'Add Portfolio Item',
      addService: 'Add Service',
      editProject: 'Edit Portfolio Item',
      editService: 'Edit Service',
      saveProject: 'Save Portfolio Item',
      saveService: 'Save Service',
      reset: 'Reset',
      exportServices: 'Export Services',
      search: 'Search…',
      allStatuses: 'All statuses',
      publishedStatus: 'Published',
      draft: 'Draft',
      archived: 'Archived',
      publish: 'Publish',
      sortUpdated: 'Sort: Updated',
      sortTitle: 'Sort: Title',
      colTitle: 'Title',
      status: 'Status',
      visibility: 'Visibility',
      actions: 'Actions',
      price: 'Price',
      hidden: 'Hidden',
      visible: 'Visible',
      featured: 'Featured',
      edit: 'Edit',
      show: 'Show',
      hide: 'Hide',
      delete: 'Delete',
      prev: 'Prev',
      next: 'Next',
      page: 'Page',
      undo: 'Undo',
      redo: 'Redo',
      preview: 'Preview',
      autosaved: 'Draft autosaved',
      uploadImage: 'Upload image',
      imageUrl: 'Image URL',
      liveUrl: 'Live URL',
      shortDesc: 'Short Description',
      fullDesc: 'Full Description',
      features: 'Features (one per line)',
      secFeatures: 'Security Features (one per line)',
      tech: 'Technologies (comma separated)',
      architecture: 'Architecture',
      challenges: 'Challenges',
      solutions: 'Solutions',
      deliverables: 'Deliverables (one per line)',
      accent: 'Accent',
      sortOrder: 'Sort Order',
      drag: 'Drag to reorder',
      dragHint: 'Drag rows to reorder services before publishing.',
      reordered: 'Order updated.',
      uploadOk: 'Image uploaded.',
      uploadLocal: 'Image attached locally.',
      exported: 'Backup exported.',
      exportedServices: 'Services exported.',
      imported: 'Import complete.',
      badJson: 'Malformed JSON.',
      nothingUndo: 'Nothing to undo.',
      nothingRedo: 'Nothing to redo.',
      undone: 'Undone.',
      redone: 'Redone.',
      updatedProject: 'Portfolio item updated.',
      createdProject: 'Portfolio item created.',
      updatedService: 'Service updated.',
      createdService: 'Service created.',
      opens: 'Opens',
      terminalCmds: 'Shell',
    },
    pwa: {
      install: 'Install Cyber Warden',
      installBtn: 'Install',
      dismiss: 'Not now',
      update: 'A new version is ready.',
      reload: 'Reload',
      offline: 'You are offline. Some features may be unavailable.',
    },
    a11y: { soundOn: 'Enable sound', soundOff: 'Mute sound', lang: 'العربية' },
    footer: 'All rights reserved.',
    admin: 'Admin',
    common: { loading: 'Loading…', ready: 'Ready.', close: 'Close' },
  },
  ar: {
    dir: 'rtl',
    locale: 'ar',
    skip: 'تخطّي إلى المحتوى',
    nav: { home: 'الرئيسية', services: 'الخدمات', work: 'الأعمال', contact: 'تواصل' },
    hero: {
      sub: 'محمد أبو حجلة',
      lead: 'مطوّر ويب مستقل يركّز على كود نظيف، وأساسيات أمنية سليمة، وتواصل واضح.',
      ctaWork: 'عرض الأعمال',
      ctaServices: 'الخدمات',
    },
    about: {
      eyebrow: 'نبذة',
      title: 'كيف أعمل مع العملاء',
      lead: 'عملية واضحة، إعدادات أمنية افتراضية، ومواقع تبقى قابلة للصيانة.',
    },
    strengths: {
      speed: 'تسليم سريع وواضح',
      quality: 'كود نظيف وقابل للصيانة',
      secure: 'بناء بمراعاة الأمن',
      detail: 'اهتمام دقيق بالتفاصيل',
    },
    services: {
      eyebrow: 'الخدمات',
      title: 'ما يمكنك التعاقد عليه',
      lead: 'باقات عملية للمستقلين والمبدعين والشركات الصغيرة. الأسعار نقاط بداية ويمكن تعديلها.',
      inquire: 'استفسار',
      empty: 'ستظهر الخدمات هنا بعد نشرها.',
      usd: 'دولار',
      priceLabel: 'السعر الابتدائي',
    },
    gift: {
      title: 'ميزة للعميل',
      headline: 'فحص أمني وثغرات شهري مجاني — مدى الحياة',
      description:
        'بعد شراء موقع مني، تحصل على فحص شهري مجاني للثغرات لهذا الموقع — بشكل مستمر ودون تكلفة إضافية.',
      badge: 'مُدرجة بعد شراء موقع',
    },
    projects: {
      eyebrow: 'معرض الأعمال',
      title: 'أعمال سابقة وعروض توضيحية',
      lead: 'هذه المشاريع تعرض المهارات والقدرة على البرمجة. وهي ليست منتجات تُباع كباقات.',
      open: 'التفاصيل',
      live: 'الموقع الحي',
      github: 'GitHub',
      demoNote: 'عرض مهارة — وليست باقة للبيع.',
      demoLabel: 'عرض',
      empty: 'ستظهر عناصر المعرض هنا بعد نشرها.',
      builtWith: 'بُني باستخدام',
      securityNotes: 'ملاحظات أمنية',
      modalKicker: 'عرض من المعرض',
      features: 'الميزات',
      security: 'الأمن',
      technologies: 'التقنيات',
      notes: 'ملاحظات',
      openLive: 'فتح الموقع الحي',
      mockups: 'معاينات الأجهزة',
      lightbox: 'معاينة الصورة',
    },
    terminal: {
      eyebrow: 'الطرفية',
      title: 'واجهة سريعة',
      lead: 'جرّب help أو projects أو contact.',
      placeholder: 'أدخل أمراً…',
    },
    term: {
      boot: ['تهيئة الطرفية…', 'جاهز. اكتب help.'],
      unknown: 'أمر غير معروف: {cmd}. اكتب help.',
      error: 'فشل تنفيذ الأمر.',
      helpDesc: 'قائمة الأوامر',
      helpBody:
        'الأوامر المتاحة:\n  help       — هذه القائمة\n  about      — نبذة\n  whoami     — الهوية\n  skills     — مجالات التركيز\n  projects   — عروض المعرض\n  services   — باقات التعاقد\n  contact    — قنوات التواصل\n  social     — الشبكة\n  scan       — فحص تجريبي\n  status     — الحالة\n  security   — الوضع الأمني\n  clear      — مسح الشاشة',
      aboutDesc: 'نبذة',
      aboutExtra:
        'أبني مواقع للشركات الصغيرة والعلامات الشخصية\nبكود نظيف وإعدادات بمراعاة الأمن.',
      whoamiDesc: 'الهوية',
      whoamiRole: 'الدور: مطوّر ويب مستقل (بمراعاة الأمن)',
      skillsDesc: 'مجالات التركيز',
      projectsDesc: 'عروض المعرض',
      projectsBody:
        'عروض المعرض (ليست باقات للبيع):\n01  معرض سيبراني وعرض التقنيات\n    → https://mohammedabuhijleh214-lab.github.io/portfolia/\n\n02  أورا دنتال الفاخر\n    → https://mohammedabuhijleh214-lab.github.io/aura-dental-luxury/',
      contactDesc: 'قنوات',
      socialDesc: 'شبكة',
      scanDesc: 'فحص المحيط',
      scanLines: [
        'بدء فحص محيط تجريبي…',
        '[####............] 25%  المنافذ',
        '[########........] 50%  الترويسات',
        '[############....] 75%  سطح XSS',
        '[################] 100% اكتمل',
        '',
        'النتائج: 0 حرج · 0 عالٍ · السطح مقوّى',
        'CSP: نشط · Referrer-Policy: صارم · الإطارات: مرفوضة',
      ],
      statusDesc: 'صحة النظام',
      statusBody: 'الحالة: تعمل\nالمصادقة: Express + Argon2id + PostgreSQL\nالجلسة: كوكي HttpOnly',
      securityDesc: 'الوضع الأمني',
      securityBody:
        'XSS: مخرجات مُهرَّبة · CSRF: إرسال مزدوج\nClickjacking: frame-ancestors none\nالرفع: نوع وحجم محدودان',
      clearDesc: 'مسح الشاشة',
      servicesDesc: 'باقات التعاقد',
      servicesBody:
        'الخدمات (أسعار بداية):\n  صفحة هبوط آمنة — ١٨٠$\n  علامة شخصية / معرض — ٣٢٠$\n  موقع عمل صغير — ٤٨٠$\n  فحص أمني وتقوية — ٢٢٠$',
    },
    contact: {
      eyebrow: 'تواصل',
      title: 'لنتحدّث',
      lead: 'أرسل موجزاً قصيراً. سأرد عبر البريد.',
      name: 'الاسم الكامل',
      email: 'البريد',
      company: 'الشركة (اختياري)',
      budget: 'نطاق الميزانية',
      message: 'موجز المشروع',
      send: 'إرسال',
      success: 'تم حفظ الرسالة. سأتواصل معك عبر البريد.',
      error: 'تعذّر الإرسال. راسلني مباشرة.',
      rateLimited: 'رسائل كثيرة. حاول لاحقاً.',
      asideTitle: 'قنوات مباشرة',
      asideCopy: 'تفضل البريد أو الهاتف؟ استخدم الروابط أدناه.',
      budget150: '١٥٠ – ٣٠٠ دولار',
      budget300: '٣٠٠ – ٥٠٠ دولار',
      budget500: '٥٠٠ – ٨٠٠ دولار',
      budgetOther: 'غير متأكد',
    },
    auth: {
      title: 'بوابة الإدارة الآمنة',
      sub: 'مصادقة من الخادم · CSRF · جلسة HttpOnly',
      username: 'معرّف المشغّل',
      password: 'عبارة المرور',
      submit: 'تسجيل الدخول',
      close: 'إغلاق',
      note: 'يتطلب تسجيل الدخول واجهة المصادقة الآمنة. تُتحقق بيانات الاعتماد على الخادم فقط — وليس في المتصفح.',
      success: 'تم إنشاء الجلسة.',
      failed: 'فشلت المصادقة.',
      unavailable: 'خدمة المصادقة غير متاحة. شغّل خادم الواجهة ثم أعد المحاولة.',
      rateLimited: 'محاولات كثيرة. انتظر ثم أعد المحاولة.',
      csrfFailed: 'فشل التحقق من CSRF. حدّث الصفحة وحاول مجدداً.',
      invalidFormat: 'صيغة بيانات الاعتماد غير صحيحة.',
      sessionFailed: 'تعذّر تأكيد الجلسة.',
    },
    dash: {
      heading: 'مركز التحكم',
      export: 'تصدير JSON',
      import: 'استيراد JSON',
      logout: 'تسجيل الخروج',
      logoutDone: 'تم إنهاء الجلسة.',
      views: 'مشاهدات الصفحة',
      portfolio: 'عناصر المعرض',
      services: 'الخدمات',
      published: 'خدمات منشورة',
      analytics: 'تحليلات محلية',
      analyticsNote: 'أرقام من هذا المتصفح فقط — وليست زيارات إنتاج حية.',
      audit: 'سجل النشاط',
      projectMgmt: 'إدارة المعرض',
      serviceMgmt: 'إدارة الخدمات',
      addProject: 'إضافة عنصر معرض',
      addService: 'إضافة خدمة',
      editProject: 'تعديل عنصر المعرض',
      editService: 'تعديل الخدمة',
      saveProject: 'حفظ عنصر المعرض',
      saveService: 'حفظ الخدمة',
      reset: 'إعادة تعيين',
      exportServices: 'تصدير الخدمات',
      search: 'بحث…',
      allStatuses: 'كل الحالات',
      publishedStatus: 'منشور',
      draft: 'مسودة',
      archived: 'مؤرشف',
      publish: 'نشر',
      sortUpdated: 'ترتيب: التحديث',
      sortTitle: 'ترتيب: العنوان',
      colTitle: 'العنوان',
      status: 'الحالة',
      visibility: 'الظهور',
      actions: 'إجراءات',
      price: 'السعر',
      hidden: 'مخفي',
      visible: 'ظاهر',
      featured: 'مميز',
      edit: 'تعديل',
      show: 'إظهار',
      hide: 'إخفاء',
      delete: 'حذف',
      prev: 'السابق',
      next: 'التالي',
      page: 'صفحة',
      undo: 'تراجع',
      redo: 'إعادة',
      preview: 'معاينة',
      autosaved: 'تم حفظ المسودة تلقائياً',
      uploadImage: 'رفع صورة',
      imageUrl: 'رابط الصورة',
      liveUrl: 'الرابط الحي',
      shortDesc: 'وصف مختصر',
      fullDesc: 'وصف كامل',
      features: 'الميزات (سطر لكل عنصر)',
      secFeatures: 'ميزات أمنية (سطر لكل عنصر)',
      tech: 'التقنيات (مفصولة بفواصل)',
      architecture: 'الهيكل',
      challenges: 'التحديات',
      solutions: 'الحلول',
      deliverables: 'المخرجات (سطر لكل عنصر)',
      accent: 'اللون المميز',
      sortOrder: 'ترتيب العرض',
      drag: 'اسحب لإعادة الترتيب',
      dragHint: 'اسحب الصفوف لإعادة ترتيب الخدمات قبل النشر.',
      reordered: 'تم تحديث الترتيب.',
      uploadOk: 'تم رفع الصورة.',
      uploadLocal: 'أُرفقت الصورة محلياً.',
      exported: 'تم تصدير النسخة الاحتياطية.',
      exportedServices: 'تم تصدير الخدمات.',
      imported: 'اكتمل الاستيراد.',
      badJson: 'JSON غير صالح.',
      nothingUndo: 'لا يوجد ما يُتراجع عنه.',
      nothingRedo: 'لا يوجد ما يُعاد.',
      undone: 'تم التراجع.',
      redone: 'تمت الإعادة.',
      updatedProject: 'تم تحديث عنصر المعرض.',
      createdProject: 'تم إنشاء عنصر المعرض.',
      updatedService: 'تم تحديث الخدمة.',
      createdService: 'تم إنشاء الخدمة.',
      opens: 'فتحات',
      terminalCmds: 'الطرفية',
    },
    pwa: {
      install: 'تثبيت Cyber Warden',
      installBtn: 'تثبيت',
      dismiss: 'لاحقاً',
      update: 'يتوفر إصدار جديد.',
      reload: 'إعادة تحميل',
      offline: 'أنت غير متصل. قد لا تتوفر بعض الميزات.',
    },
    a11y: { soundOn: 'تفعيل الصوت', soundOff: 'كتم الصوت', lang: 'English' },
    footer: 'جميع الحقوق محفوظة.',
    admin: 'الإدارة',
    common: { loading: 'جاري التحميل…', ready: 'جاهز.', close: 'إغلاق' },
  },
});

/** Arabic copies for seeded content (by id) */
export const CONTENT_AR = Object.freeze({
  services: {
    svc_landing: {
      title: 'صفحة هبوط آمنة',
      shortDescription: 'صفحة واحدة عالية التحويل لمنتج أو عرض أو تعريف شخصي — بأساسيات متينة وترويسات أمنية.',
      deliverables: ['صفحة هبوط متجاوبة', 'قسم تواصل أو دعوة لإجراء', 'وسوم SEO أساسية', 'ترميز بمراعاة الأمن'],
    },
    svc_portfolio: {
      title: 'موقع علامة شخصية / معرض أعمال',
      shortDescription: 'موقع متعدد الأقسام لعرض هويتك وأعمالك وطرق التواصل.',
      deliverables: ['موقع شخصي متعدد الأقسام', 'قسم أعمال / معرض', 'قنوات تواصل', 'تخطيط متجاوب'],
    },
    svc_business: {
      title: 'موقع عمل صغير',
      shortDescription: 'موقع عملي متعدد الصفحات لعمل محلي أو علامة شخصية (رئيسية، خدمات، نبذة، تواصل).',
      deliverables: ['حتى 5 صفحات', 'قسم خدمات / عروض', 'هيكل نموذج تواصل', 'تصميم متجاوب وSEO أساسي'],
    },
    svc_hardening: {
      title: 'فحص أمني وتقوية للموقع',
      shortDescription: 'مراجعة مركّزة لموقع قائم: الترويسات، المخاطر الشائعة، وإصلاحات عملية.',
      deliverables: ['ملاحظات مراجعة الواجهة', 'توصيات الترويسات / CSP', 'قائمة إصلاحات مرتبة', 'تطبيق إصلاحات اختياري'],
    },
  },
  projects: {
    proj_cyber_portfolio: {
      title: 'معرض سيبراني وعرض التقنيات',
      shortDescription: 'عرض لمحفظة شخصية يركز على هيكل واجهة حديث وأداء وواجهة بمراعاة الأمن.',
      fullDescription:
        'مشروع توضيحي يوضح تنظيم HTML/CSS/JavaScript لمحفظة شخصية: ملفات معيارية، هيكل سهل الوصول، وأساسيات أمن المتصفح. عمل سابق / عينة مهارة — وليست باقة للبيع.',
      features: ['هيكل واجهة معياري', 'تخطيط متجاوب', 'أقسام تفاعلية', 'ترميز دلالي مناسب لـ SEO'],
      securityFeatures: ['إعداد بمراعاة CSP', 'تعامل آمن مع المحتوى الديناميكي', 'سياسة إطارات ضد النقر الخادع'],
    },
    proj_aura_dental: {
      title: 'أورا دنتال الفاخر',
      shortDescription: 'موقع تجريبي لعيادة أسنان فاخرة مع واجهة تفاعلية (مفهوم محاكي الابتسامة) وتقوية بمراعاة CSP.',
      fullDescription:
        'عرض لموقع تسويقي بأسلوب العيادات: واجهة حديثة، تأثيرات ميل ثلاثي الأبعاد، وميزة محاكي الابتسامة. لإظهار مهارة التصميم والواجهة — وليس منتجاً يُباع هنا.',
      features: ['تفاعل محاكي الابتسامة', 'تأثيرات ميل ثلاثي الأبعاد', 'واجهة متجاوبة حديثة', 'تخطيط موجّه للتواصل'],
      securityFeatures: ['سياسة أمن المحتوى (CSP)', 'تحميل حذر للموارد الخارجية', 'أنماط تحقق لنماذج الإدخال'],
    },
  },
});

export class I18n {
  constructor() {
    const saved = localStorage.getItem(CONFIG.storage.localeKey);
    this.locale = saved === 'ar' || saved === 'en' ? saved : 'en';
    this.listeners = new Set();
  }

  get t() {
    return DICT[this.locale];
  }

  setLocale(locale) {
    if (!DICT[locale]) return;
    this.locale = locale;
    localStorage.setItem(CONFIG.storage.localeKey, locale);
    this.applyDocument();
    this.listeners.forEach((fn) => fn(this.t));
  }

  toggle() {
    this.setLocale(this.locale === 'en' ? 'ar' : 'en');
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  applyDocument() {
    document.documentElement.lang = this.t.locale;
    document.documentElement.dir = this.t.dir;
    document.documentElement.dataset.locale = this.t.locale;
  }

  /**
   * Pick localized field from an entity (supports titleAr or CONTENT_AR map by id).
   */
  field(item, field, collection) {
    if (!item) return '';
    if (this.locale === 'ar') {
      const arKey = `${field}Ar`;
      const local = item[arKey];
      if (Array.isArray(local) && local.length) return local;
      if (typeof local === 'string' && local.trim()) return local;
      const mapped = collection && item.id ? CONTENT_AR[collection]?.[item.id]?.[field] : null;
      if (Array.isArray(mapped) && mapped.length) return mapped;
      if (typeof mapped === 'string' && mapped.trim()) return mapped;
    }
    return item[field] ?? '';
  }

  hydrate(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = key.split('.').reduce((o, k) => (o == null ? o : o[k]), this.t);
      if (typeof value === 'string') el.textContent = value;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = key.split('.').reduce((o, k) => (o == null ? o : o[k]), this.t);
      if (typeof value === 'string') el.setAttribute('placeholder', value);
    });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      const value = key.split('.').reduce((o, k) => (o == null ? o : o[k]), this.t);
      if (typeof value === 'string') el.setAttribute('aria-label', value);
    });
  }
}

export const i18n = new I18n();
