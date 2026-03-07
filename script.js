(function () {
  const STORAGE_KEY = "taply_profile";
  const ANALYTICS_KEY = "taply_analytics";
  const TOKEN_KEY = "taply_token";
  const MAX_PLATFORMS = 5;

  let currentUser = null;

  const TEST_PREMIUM_KEY = "taply_test_premium";

  function isPremium() {
    try { if (sessionStorage.getItem(TEST_PREMIUM_KEY)) return true; } catch (e) {}
    return (currentUser && (currentUser.plan || "").toLowerCase() === "premium");
  }

  function getSupabase() {
    if (typeof window === "undefined") return null;
    var c = window.TaplySupabase;
    if (!c || !c.url || !c.anonKey || !window.supabase) return null;
    return window.supabase.createClient(c.url, c.anonKey);
  }

  function getCanonicalOrigin() {
    var host = (window.location && window.location.hostname) || "taply.ro";
    var proto = (window.location && window.location.protocol) || "https:";
    if (host === "localhost" || host === "127.0.0.1") return proto + "//" + host;
    if (!host.startsWith("www.") && host.indexOf(".") !== -1) host = "www." + host;
    return proto + "//" + host;
  }
  function getCanonicalHost() {
    var host = (window.location && window.location.hostname) || "taply.ro";
    if (host === "localhost" || host === "127.0.0.1") return host;
    return host.replace(/^www\./i, "");
  }
  function getDisplayHost() {
    var h = (window.location && window.location.hostname) || "taply.ro";
    if (h === "localhost" || h === "127.0.0.1") return h;
    return h.replace(/^www\./i, "");
  }
  function getSubdomainDomain() {
    var env = window.SUBDOMAIN_DOMAIN;
    if (env && env !== "localhost") return env;
    var h = (window.location && window.location.hostname) || "";
    if (h === "localhost" || h === "127.0.0.1") return "localhost";
    if (h.indexOf(".") !== -1 && h.startsWith("www.")) return h.replace(/^www\./i, "");
    if (h.indexOf(".") !== -1) return h;
    return "";
  }
  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  function apiHeaders() {
    const t = getToken();
    const h = { "Content-Type": "application/json" };
    if (t) h["Authorization"] = "Bearer " + t;
    return h;
  }

  const THEMES = [
    { id: "midnight", name: "Midnight", previewClass: "theme-midnight" },
    { id: "sunset", name: "Sunset", previewClass: "theme-sunset" },
    { id: "grid", name: "Grid", previewClass: "theme-grid-bg" },
    { id: "ivory", name: "Ivory", previewClass: "theme-ivory" },
    { id: "forest", name: "Forest", previewClass: "theme-forest" },
    { id: "minimal", name: "Minimal", previewClass: "theme-minimal" },
    { id: "leather", name: "Leather", previewClass: "theme-leather" },
    { id: "purple", name: "Purple", previewClass: "theme-purple" },
  ];

  const TITLE_FONTS = ["DM Sans", "Inter", "Playfair Display", "Poppins", "Roboto", "Roboto Slab", "Open Sans", "Lato", "Anton", "Domine", "Manrope", "Alfa Slab One", "Belanosima", "Chillax", "Oxanium", "IBM Plex Sans", "Kavivanar", "Old Standard TT", "Chango", "Black Ops One", "Fustat"];

  const PLATFORMS = [
    "instagram",
    "whatsapp",
    "tiktok",
    "youtube",
    "spotify",
    "threads",
    "facebook",
    "x",
    "soundcloud",
    "snapchat",
    "pinterest",
    "steam",
    "twitch",
    "discord",
    "telegram",
    "website",
    "email",
  ];
  const STRIP_ADD_PLATFORMS = ["instagram", "tiktok", "whatsapp", "email"];

  const platformLabels = {
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    tiktok: "TikTok",
    youtube: "YouTube",
    website: "Personal website",
    steam: "Steam",
    twitch: "Twitch",
    discord: "Discord",
    telegram: "Telegram",
    spotify: "Spotify",
    threads: "Threads",
    facebook: "Facebook",
    x: "X",
    soundcloud: "SoundCloud",
    snapchat: "Snapchat",
    pinterest: "Pinterest",
    email: "Email",
  };

  var SIMPLE_ICONS_CDN = "https://cdn.simpleicons.org";
  var platformLogoSlug = {
    instagram: "instagram",
    whatsapp: "whatsapp",
    tiktok: "tiktok",
    youtube: "youtube",
    website: "globe",
    spotify: "spotify",
    threads: "threads",
    facebook: "facebook",
    x: "x",
    soundcloud: "soundcloud",
    snapchat: "snapchat",
    pinterest: "pinterest",
    email: "gmail",
    steam: "steam",
    twitch: "twitch",
    discord: "discord",
    telegram: "telegram",
  };
  function platformLogoUrl(key) {
    var slug = platformLogoSlug[key];
    return slug ? SIMPLE_ICONS_CDN + "/" + slug : "";
  }
  var linkLogoSlug = {
    youtube: "youtube",
    instagram: "instagram",
    tiktok: "tiktok",
    website: "link",
    spotify: "spotify",
    steam: "steam",
    twitch: "twitch",
    discord: "discord",
    telegram: "telegram",
    link: "link",
    email: "gmail",
    whatsapp: "whatsapp",
    facebook: "facebook",
    x: "x",
    soundcloud: "soundcloud",
    snapchat: "snapchat",
    pinterest: "pinterest",
  };
  function linkLogoUrl(icon) {
    var slug = linkLogoSlug[icon];
    return slug ? SIMPLE_ICONS_CDN + "/" + slug : "";
  }

  const PENDING_EMAIL_KEY = "taply_pending_email";
  const PENDING_USERNAME_KEY = "taply_pending_username";

  var MAX_SOCIAL_LINKS = 15;
  function defaultProfile() {
    return {
      theme: "midnight",
      platforms: [],
      socialLinks: [],
      customBackgroundImage: null,
      customBackgroundPosition: "center center",
      customBackgroundZoom: 100,
      displayName: "",
      bio: "",
      avatar: null,
      links: [],
      socialUrls: {},
      email: "",
      username: "",
      design: {
        headerLayout: "classic",
        titleStyle: "text",
        titleSize: "small",
        alternativeTitleFont: false,
        wallpaperStyle: "gradient",
        gradientStyle: "premade",
        gradientPreset: 2,
        animateGradient: false,
        noise: false,
        buttonStyle: "solid",
        cornerRoundness: "full",
        buttonShadow: "soft",
        buttonsColor: "#FFFFFF",
        buttonTextColor: "#362630",
        pageFont: "DM Sans",
        pageTextColor: "#362630",
        titleColor: "#362630",
        titleLogoUrl: "",
        titleFont: "DM Sans",
      },
    };
  }

  function defaultAnalytics() {
    return { pageViews: 0, linkClicks: {} };
  }

  function getProfile() {
    var profile = null;
    if (currentUser && currentUser.profile) profile = currentUser.profile;
    else {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        profile = { ...defaultProfile(), ...JSON.parse(raw) };
      } catch {
        return null;
      }
    }
    if (profile && (!profile.socialLinks || profile.socialLinks.length === 0) && (profile.platforms || []).length > 0) {
      profile.socialLinks = (profile.platforms || []).map(function (key) { return { platform: key, url: (profile.socialUrls || {})[key] || "" }; });
    }
    if (profile && !profile.design) {
      profile.design = defaultProfile().design;
    }
    return profile;
  }

  function updatePlanPillDisplay() {
    var premium = isPremium();
    var text = premium ? "Premium" : "Free";
    var sidebarPill = document.getElementById("sidebarPlanPill");
    var dropdownPill = document.getElementById("dropdownProPill");
    if (sidebarPill) { sidebarPill.textContent = text; sidebarPill.classList.toggle("sidebar-plan-pill--premium", premium); }
    if (dropdownPill) { dropdownPill.textContent = text; dropdownPill.classList.toggle("dropdown-pro-pill--premium", premium); }
  }

  function setupTestPremiumTripleClick() {
    var lastClick = 0;
    var count = 0;
    function handlePillClick() {
      if (isPremium()) return;
      var now = Date.now();
      if (now - lastClick > 400) count = 0;
      lastClick = now;
      count++;
      if (count >= 3) {
        count = 0;
        try { sessionStorage.setItem(TEST_PREMIUM_KEY, "1"); } catch (e) {}
        if (currentUser) currentUser.plan = "premium";
        updatePlanPillDisplay();
        applyPremiumRestrictions();
        alert("Test Premium activat. Toate funcțiile Premium sunt deblocate în această sesiune.");
      }
    }
    var sidebarPill = document.getElementById("sidebarPlanPill");
    var dropdownPill = document.getElementById("dropdownProPill");
    if (sidebarPill) sidebarPill.addEventListener("click", handlePillClick);
    if (dropdownPill) dropdownPill.addEventListener("click", handlePillClick);
  }

  function applyPremiumRestrictions() {
    var premium = isPremium();
    var subRow = document.getElementById("profileSubdomainRow");
    if (subRow && !premium) subRow.hidden = true;
    var analyticsPanel = document.getElementById("panelAnalytics");
    if (analyticsPanel) {
      var overlay = document.getElementById("analyticsPremiumOverlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "analyticsPremiumOverlay";
        overlay.className = "premium-overlay";
        overlay.innerHTML = "<p>Insights – Premium</p><a href=\"/premium\">Upgrade</a>";
        overlay.style.cssText = "position:absolute;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#fff;";
        analyticsPanel.style.position = "relative";
        analyticsPanel.appendChild(overlay);
      }
      overlay.hidden = premium;
    }
    var qrActions = document.getElementById("qrcodeActions");
    var qrcodeBox = document.getElementById("qrcodeBox");
    if (qrcodeBox) {
      var qrOverlay = qrcodeBox.querySelector(".qrcode-premium-overlay");
      if (!qrOverlay) {
        qrOverlay = document.createElement("div");
        qrOverlay.className = "qrcode-premium-overlay";
        qrOverlay.innerHTML = "<p>QR download – Premium</p><a href=\"/premium\">Upgrade</a>";
        qrcodeBox.style.position = "relative";
        qrcodeBox.appendChild(qrOverlay);
      }
      qrOverlay.hidden = premium;
      if (qrActions) qrActions.hidden = !premium || qrActions.hidden;
    }
    var customCard = document.getElementById("customDesignCard");
    if (customCard) {
      customCard.dataset.premiumLock = premium ? "" : "1";
      if (!premium) customCard.classList.add("custom-design-card--locked"); else customCard.classList.remove("custom-design-card--locked");
    }
    var linkForm = document.getElementById("linkForm");
    if (linkForm) {
      linkForm.classList.toggle("link-form-card--premium-locked", !premium);
    }
    renderDashboardThemes();
  }

  function saveProfile(profile) {
    if (currentUser) {
      currentUser.profile = profile;
      var slug = (profile.username || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || (currentUser.username || "user");
      var supabase = getSupabase();
      if (supabase && currentUser.id) {
        return supabase.from("profiles").update({ profile: profile, username: slug }).eq("id", currentUser.id).then(function (r) { if (r.error) throw new Error(r.error.message); return r; }).catch(function () {});
      }
      const token = getToken();
      if (token) {
        return fetch(window.location.origin + "/api/me", {
          method: "PUT",
          headers: apiHeaders(),
          body: JSON.stringify({ profile: profile, username: slug }),
        }).then(function (r) { if (!r.ok) throw new Error(); return r; }).catch(function () {});
      }
      return Promise.resolve();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return Promise.resolve();
  }

  function getAnalytics() {
    if (currentUser && currentUser.analytics) return currentUser.analytics;
    try {
      const raw = localStorage.getItem(ANALYTICS_KEY);
      if (!raw) return defaultAnalytics();
      return { ...defaultAnalytics(), ...JSON.parse(raw) };
    } catch {
      return defaultAnalytics();
    }
  }

  function recordPageView() {
    const a = getAnalytics();
    a.pageViews += 1;
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a));
  }

  function recordLinkClick(linkId) {
    const a = getAnalytics();
    a.linkClicks[linkId] = (a.linkClicks[linkId] || 0) + 1;
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a));
  }

  function generateId() {
    return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  // --- UI state
  let currentOnboardingStep = 1;
  let selectedTheme = "midnight";
  let selectedPlatforms = [];
  let editingLinkId = null;

  const viewUsername = document.getElementById("viewUsername");
  const viewOnboarding = document.getElementById("viewOnboarding");
  const viewDashboard = document.getElementById("viewDashboard");
  const usernameInput = document.getElementById("usernameInput");
  const usernameContinue = document.getElementById("usernameContinue");
  const usernamePrefix = document.getElementById("usernamePrefix");
  const onboardingSteps = document.getElementById("onboardingSteps");
  const onboardingThemes = document.getElementById("onboardingThemes");
  const onboardingPlatforms = document.getElementById("onboardingPlatforms");
  const onboardingAvatar = document.getElementById("onboardingAvatar");
  const onboardingAvatarInput = document.getElementById("onboardingAvatarInput");
  const onboardingAvatarPreview = document.getElementById("onboardingAvatarPreview");
  const onboardingDisplayName = document.getElementById("onboardingDisplayName");
  const onboardingBio = document.getElementById("onboardingBio");
  const onboardingBioCounter = document.getElementById("onboardingBioCounter");
  const onboardingFinish = document.getElementById("onboardingFinish");

  const dashboardThemes = document.getElementById("dashboardThemes");
  const customDesignFile = document.getElementById("customDesignFile");
  const customDesignUrl = document.getElementById("customDesignUrl");
  const customDesignFileLabelText = document.getElementById("customDesignFileLabelText");
  const customDesignPreview = document.getElementById("customDesignPreview");
  const customDesignCutEditor = document.getElementById("customDesignCutEditor");
  const customDesignCutImage = document.getElementById("customDesignCutImage");
  const customDesignCutFrame = document.getElementById("customDesignCutFrame");
  const customDesignPreviewFrame = document.getElementById("customDesignPreviewFrame");
  const customDesignClear = document.getElementById("customDesignClear");
  const customDesignZoomWrap = document.getElementById("customDesignZoomWrap");
  const customDesignZoomIn = document.getElementById("customDesignZoomIn");
  const customDesignZoomOut = document.getElementById("customDesignZoomOut");
  const customDesignZoomValue = document.getElementById("customDesignZoomValue");
  const customDesignCard = document.getElementById("customDesignCard");
  const customDesignCardWrap = document.getElementById("customDesignCardWrap");
  const customDesignModal = document.getElementById("customDesignModal");
  const customDesignModalBox = document.getElementById("customDesignModalBox");
  const customDesignModalClose = document.getElementById("customDesignModalClose");
  const dashboardAvatar = document.getElementById("dashboardAvatar");
  const dashboardAvatarInput = document.getElementById("dashboardAvatarInput");
  const dashboardAvatarPreview = document.getElementById("dashboardAvatarPreview");
  const dashboardDisplayName = document.getElementById("dashboardDisplayName");
  const dashboardBio = document.getElementById("dashboardBio");
  const dashboardBioCounter = document.getElementById("dashboardBioCounter");
  const dashboardUsername = document.getElementById("dashboardUsername");
  const dashboardLinkUrl = document.getElementById("dashboardLinkUrl");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const sidebarLinkUrl = document.getElementById("sidebarLinkUrl");
  const sidebarCopyLink = document.getElementById("sidebarCopyLink");
  const profileSubdomainRow = document.getElementById("profileSubdomainRow");
  const dashboardLinkSubdomainUrl = document.getElementById("dashboardLinkSubdomainUrl");
  const copySubdomainLinkBtn = document.getElementById("copySubdomainLinkBtn");
  const saveProfileBtn = document.getElementById("saveProfile");
  const dashboardPlatforms = document.getElementById("dashboardPlatforms");
  const socialUrls = document.getElementById("socialUrls");
  const linkList = document.getElementById("linkList");
  const addLinkBtn = document.getElementById("addLink");
  const linkForm = document.getElementById("linkForm");
  const linkTitle = document.getElementById("linkTitle");
  const linkUrl = document.getElementById("linkUrl");
  const linkHighlight = document.getElementById("linkHighlight");
  const linkFormCancel = document.getElementById("linkFormCancel");
  const linkFormSave = document.getElementById("linkFormSave");
  const linkTypeFriendly = document.getElementById("linkTypeFriendly");
  const linkFormNormal = document.getElementById("linkFormNormal");
  const linkFormFriendly = document.getElementById("linkFormFriendly");
  const linkImageUrl = document.getElementById("linkImageUrl");
  const linkFriendlyUrl = document.getElementById("linkFriendlyUrl");
  const linkIcon = document.getElementById("linkIcon");
  const linkIsSection = document.getElementById("linkIsSection");
  const linkFormSectionTitle = document.getElementById("linkFormSectionTitle");
  const linkSectionTitle = document.getElementById("linkSectionTitle");
  const statPageViews = document.getElementById("statPageViews");
  const analyticsClicks = document.getElementById("analyticsClicks");
  const previewFrame = document.getElementById("previewFrame");
  const dashboardLinkUrlPreview = document.getElementById("dashboardLinkUrlPreview");
  const copyLinkBtnPreview = document.getElementById("copyLinkBtnPreview");
  const setupProgress = document.getElementById("setupProgress");
  const sidebarUsername = document.getElementById("sidebarUsername");
  const sidebarAvatarImg = document.getElementById("sidebarAvatarImg");
  const linksStripAvatarImg = document.getElementById("linksStripAvatarImg");
  const linksUsername = document.getElementById("linksUsername");

  function showView(which) {
    viewUsername.hidden = which !== "username";
    viewOnboarding.hidden = which !== "onboarding";
    viewDashboard.hidden = which !== "dashboard";
    var appEl = document.getElementById("app");
    if (appEl) {
      if (which === "dashboard") appEl.classList.add("dashboard-active");
      else appEl.classList.remove("dashboard-active");
    }
  }

  function renderThemePreview(theme, isSelected) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "theme-card" + (isSelected ? " is-selected" : "");
    card.dataset.theme = theme.id;
    card.innerHTML = `
      <div class="theme-preview ${theme.previewClass}">
        <div class="avatar"></div>
        <div class="line short"></div>
        <div class="chip-row"><span class="chip"></span><span class="chip"></span><span class="chip"></span></div>
        <div class="pill"></div><div class="pill"></div><div class="pill"></div>
      </div>
      <span>${theme.name}</span>
    `;
    return card;
  }

  function renderOnboardingThemes() {
    onboardingThemes.innerHTML = "";
    THEMES.forEach((t) => {
      const card = renderThemePreview(t, t.id === selectedTheme);
      card.addEventListener("click", () => {
        selectedTheme = t.id;
        onboardingThemes.querySelectorAll(".theme-card").forEach((c) => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
      });
      onboardingThemes.appendChild(card);
    });
  }

  function renderDashboardThemes() {
    const profile = getProfile();
    if (!profile) return;
    const theme = profile.theme || "midnight";
    const hasCustomBg = !!(profile.customBackgroundImage && profile.customBackgroundImage.trim());
    if (customDesignCardWrap && customDesignCardWrap.parentNode) customDesignCardWrap.parentNode.removeChild(customDesignCardWrap);
    if (!dashboardThemes) return;
    dashboardThemes.innerHTML = "";
    var themesToShow = isPremium() ? THEMES : THEMES.slice(0, 3);
    themesToShow.forEach((t) => {
      const themeSelected = !hasCustomBg && t.id === theme;
      const card = renderThemePreview(t, themeSelected);
      card.addEventListener("click", () => {
        const p = getProfile();
        p.theme = t.id;
        p.customBackgroundImage = null;
        saveProfile(p);
        renderDashboardThemes();
        liveRefreshPreview();
      });
      dashboardThemes.appendChild(card);
    });
    if (customDesignCardWrap) dashboardThemes.appendChild(customDesignCardWrap);
    if (customDesignCard) {
      var preview = customDesignCard.querySelector(".custom-design-card-preview");
      if (preview) {
        if (hasCustomBg && profile.customBackgroundImage) {
          preview.style.background = "transparent";
          preview.style.backgroundImage = "url(" + profile.customBackgroundImage + ")";
          preview.style.backgroundSize = "cover";
          preview.style.backgroundPosition = profile.customBackgroundPosition || "center center";
        } else {
          preview.style.background = "";
          preview.style.backgroundImage = "";
          preview.style.backgroundSize = "";
          preview.style.backgroundPosition = "";
        }
      }
      if (hasCustomBg) customDesignCard.classList.add("is-selected");
      else customDesignCard.classList.remove("is-selected");
      customDesignCard.dataset.premiumLock = isPremium() ? "" : "1";
      customDesignCard.classList.toggle("custom-design-card--locked", !isPremium());
    }
    updateCustomDesignUI(getProfile());
  }

  function positionToPercent(posStr) {
    if (!posStr || typeof posStr !== "string") return { x: 50, y: 50 };
    var s = posStr.trim().toLowerCase();
    var m = s.match(/^(\d+(?:\.\d+)?)\s*%\s*(\d+(?:\.\d+)?)\s*%?$/);
    if (m) return { x: Math.min(100, Math.max(0, parseFloat(m[1]))), y: Math.min(100, Math.max(0, parseFloat(m[2]))) };
    var presets = { "left top": [0, 0], "center top": [50, 0], "right top": [100, 0], "left center": [0, 50], "center center": [50, 50], "right center": [100, 50], "left bottom": [0, 100], "center bottom": [50, 100], "right bottom": [100, 100] };
    if (presets[s]) return { x: presets[s][0], y: presets[s][1] };
    return { x: 50, y: 50 };
  }
  function percentToPosition(x, y) {
    return Math.round(x) + "% " + Math.round(y) + "%";
  }
  function getBgSize(zoom) {
    var z = typeof zoom === "number" ? zoom : 100;
    return z + "% " + z + "%";
  }
  function framePositionFromCenter(cx, cy) {
    var frameW = 50;
    var frameH = 50;
    return { left: Math.max(-frameW / 2, Math.min(100 - frameW / 2, cx - frameW / 2)), top: Math.max(-frameH / 2, Math.min(100 - frameH / 2, cy - frameH / 2)) };
  }
  function centerFromFramePosition(left, top) {
    return { x: left + 25, y: top + 25 };
  }
  function updateCustomDesignUI(profile) {
    if (!profile) return;
    var bg = profile.customBackgroundImage || "";
    var pos = profile.customBackgroundPosition || "center center";
    var zoom = typeof profile.customBackgroundZoom === "number" ? profile.customBackgroundZoom : 100;
    var bgSize = getBgSize(zoom);
    if (customDesignPreview) customDesignPreview.hidden = !bg;
    if (customDesignCutImage) {
      if (bg) {
        customDesignCutImage.style.backgroundImage = "url(" + bg + ")";
        customDesignCutImage.style.backgroundSize = "contain";
        customDesignCutImage.style.backgroundPosition = "center center";
      } else {
        customDesignCutImage.style.backgroundImage = "";
        customDesignCutImage.style.backgroundPosition = "";
        customDesignCutImage.style.backgroundSize = "";
      }
    }
    if (customDesignCutFrame) {
      var pct = positionToPercent(pos);
      var fp = framePositionFromCenter(pct.x, pct.y);
      customDesignCutFrame.style.left = fp.left + "%";
      customDesignCutFrame.style.top = fp.top + "%";
    }
    if (customDesignZoomWrap) customDesignZoomWrap.hidden = !bg;
    if (customDesignZoomValue) customDesignZoomValue.textContent = zoom + "%";
    if (customDesignUrl) customDesignUrl.value = (bg && bg.indexOf("http") === 0) ? bg : "";
    if (customDesignFileLabelText) customDesignFileLabelText.textContent = (bg && bg.indexOf("data:") === 0) ? "Image loaded" : "Choose image";
    if (customDesignFile) customDesignFile.value = "";
  }

  function renderOnboardingPlatforms() {
    onboardingPlatforms.innerHTML = "";
    PLATFORMS.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "platform-card";
      btn.dataset.platform = key;
      btn.textContent = platformLabels[key] || key;
      if (selectedPlatforms.includes(key)) btn.classList.add("is-selected");
      btn.addEventListener("click", () => {
        if (btn.classList.contains("is-selected")) {
          btn.classList.remove("is-selected");
          selectedPlatforms = selectedPlatforms.filter((p) => p !== key);
        } else if (selectedPlatforms.length < MAX_PLATFORMS) {
          btn.classList.add("is-selected");
          selectedPlatforms.push(key);
        }
      });
      onboardingPlatforms.appendChild(btn);
    });
  }

  var editProfileUrlModal = document.getElementById("editProfileUrlModal");
  var editProfileUrlInput = document.getElementById("editProfileUrlInput");
  var editProfileUrlPlatform = document.getElementById("editProfileUrlPlatform");
  var editProfileUrlSave = document.getElementById("editProfileUrlSave");
  var editProfileUrlCancel = document.getElementById("editProfileUrlCancel");
  var addProfileModal = document.getElementById("addProfileModal");
  var addProfileGrid = document.getElementById("addProfileGrid");
  var addProfileModalClose = document.getElementById("addProfileModalClose");

  function openEditProfileModal(platformKey) {
    var p = getProfile();
    var entry = (p.socialLinks || []).find(function (e) { return (e.platform || "") === platformKey; });
    if (!entry) return;
    if (editProfileUrlPlatform) editProfileUrlPlatform.value = platformLabels[platformKey] || platformKey;
    if (editProfileUrlInput) editProfileUrlInput.value = entry.url || "";
    if (editProfileUrlModal) {
      editProfileUrlModal.dataset.editPlatform = platformKey;
      editProfileUrlModal.hidden = false;
      document.body.style.overflow = "hidden";
      if (editProfileUrlInput) setTimeout(function () { editProfileUrlInput.focus(); }, 80);
    }
  }
  function closeEditProfileModal() {
    if (editProfileUrlModal) {
      editProfileUrlModal.hidden = true;
      document.body.style.overflow = "";
      editProfileUrlModal.removeAttribute("data-edit-platform");
    }
  }
  function openAddProfileModal() {
    if (!addProfileGrid) return;
    addProfileGrid.innerHTML = "";
    var socialList = (getProfile() || {}).socialLinks || [];
    var added = socialList.map(function (e) { return e.platform || ""; });
    PLATFORMS.forEach(function (key) {
      if (STRIP_ADD_PLATFORMS.indexOf(key) !== -1) return;
      var already = added.indexOf(key) !== -1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "add-suggested-circle" + (already ? " is-added" : "");
      btn.setAttribute("aria-label", (platformLabels[key] || key) + (already ? " (already added)" : ""));
      var logoUrl = platformLogoUrl(key);
      if (logoUrl) btn.innerHTML = '<img src="' + logoUrl + '" alt="" class="add-suggested-circle-logo" loading="lazy" />';
      else btn.innerHTML = '<span class="add-suggested-circle-emoji">' + (platformLabels[key] || key).charAt(0) + '</span>';
      if (already) return;
      btn.addEventListener("click", function () {
        var pr = getProfile();
        pr.socialLinks = pr.socialLinks || [];
        if (pr.socialLinks.length >= MAX_SOCIAL_LINKS) return;
        pr.socialLinks.push({ platform: key, url: "" });
        saveProfile(pr);
        closeAddProfileModal();
        renderLinksStripAddIcons();
        renderSocialUrls(pr.socialLinks.length - 1);
        liveRefreshPreview();
      });
      addProfileGrid.appendChild(btn);
    });
    if (addProfileModal) {
      addProfileModal.hidden = false;
      document.body.style.overflow = "hidden";
    }
  }
  function closeAddProfileModal() {
    if (addProfileModal) {
      addProfileModal.hidden = true;
      document.body.style.overflow = "";
    }
  }

  function renderLinksStripAddIcons() {
    var container = document.getElementById("linksStripAddIcons");
    if (!container) return;
    var profile = getProfile();
    if (!profile) return;
    var socialList = profile.socialLinks || [];
    container.innerHTML = "";
    function makeStripBtn(platformKey, isGenericPlus, alreadyAdded) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "links-strip-add-btn" + (isGenericPlus ? " links-strip-add-plus" : "") + (alreadyAdded ? " links-strip-add-has" : "");
      var label = isGenericPlus ? "Add profile" : (alreadyAdded ? "Edit or remove " + (platformLabels[platformKey] || platformKey) : "Add " + (platformLabels[platformKey] || platformKey));
      btn.setAttribute("aria-label", label);
      var badgeChar = isGenericPlus ? "+" : (alreadyAdded ? "−" : "+");
      if (isGenericPlus) {
        btn.innerHTML = '<span class="links-strip-add-icon">+</span><span class="links-strip-add-badge">+</span>';
      } else {
        var logoUrl = platformLogoUrl(platformKey);
        btn.dataset.platform = platformKey;
        if (logoUrl) {
          btn.innerHTML = '<img src="' + logoUrl + '" alt="" class="links-strip-add-logo" loading="lazy" /><span class="links-strip-add-badge">' + badgeChar + '</span>';
        } else {
          btn.innerHTML = '<span class="links-strip-add-icon">' + (platformLabels[platformKey] || platformKey).charAt(0) + '</span><span class="links-strip-add-badge">' + badgeChar + '</span>';
        }
      }
      return btn;
    }
    STRIP_ADD_PLATFORMS.forEach(function (key) {
      var alreadyAdded = socialList.some(function (e) { return (e.platform || "") === key; });
      var btn = makeStripBtn(key, false, alreadyAdded);
      btn.addEventListener("click", function (e) {
        var target = e.target;
        var isBadge = target.classList && target.classList.contains("links-strip-add-badge");
        if (alreadyAdded) {
          if (isBadge) {
            var p = getProfile();
            p.socialLinks = (p.socialLinks || []).filter(function (el) { return (el.platform || "") !== key; });
            saveProfile(p);
            renderLinksStripAddIcons();
            renderSocialUrls();
            liveRefreshPreview();
          } else {
            openEditProfileModal(key);
          }
          return;
        }
        var p = getProfile();
        p.socialLinks = p.socialLinks || [];
        if (p.socialLinks.length >= MAX_SOCIAL_LINKS) return;
        p.socialLinks.push({ platform: key, url: "" });
        var newIndex = p.socialLinks.length - 1;
        var promise = saveProfile(p);
        renderLinksStripAddIcons();
        renderSocialUrls(newIndex);
        if (promise && promise.then) promise.then(function () { refreshPreview(); }).catch(function () {});
        else liveRefreshPreview();
      });
      container.appendChild(btn);
    });
    for (var i = 0; i < 2; i++) {
      var plusBtn = makeStripBtn(null, true, false);
      plusBtn.addEventListener("click", function () {
        openAddProfileModal();
      });
      container.appendChild(plusBtn);
    }
  }

  function renderDashboardPlatforms() {
    const profile = getProfile();
    if (!profile) return;
    var list = profile.socialLinks || [];
    if (!dashboardPlatforms) return;
    dashboardPlatforms.innerHTML = "";
    PLATFORMS.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "platform-card";
      btn.dataset.platform = key;
      btn.setAttribute("aria-label", "Add " + (platformLabels[key] || key));
      var logoUrl = platformLogoUrl(key);
      if (logoUrl) {
        var img = document.createElement("img");
        img.src = logoUrl;
        img.alt = platformLabels[key] || key;
        img.className = "platform-logo";
        img.setAttribute("loading", "lazy");
        btn.appendChild(img);
      } else {
        btn.textContent = (platformLabels[key] || key).charAt(0);
      }
      btn.addEventListener("click", () => {
        const p = getProfile();
        p.socialLinks = p.socialLinks || [];
        if (p.socialLinks.length >= MAX_SOCIAL_LINKS) return;
        p.socialLinks.push({ platform: key, url: "" });
        var promise = saveProfile(p);
        renderDashboardPlatforms();
        renderSocialUrls();
        if (promise && promise.then) promise.then(function () { refreshPreview(); }).catch(function () {});
        else liveRefreshPreview();
      });
      dashboardPlatforms.appendChild(btn);
    });
    renderSocialUrls();
  }

  if (editProfileUrlSave) editProfileUrlSave.addEventListener("click", function () {
    var platformKey = editProfileUrlModal && editProfileUrlModal.dataset.editPlatform;
    if (!platformKey || !editProfileUrlInput) return;
    var p = getProfile();
    var entry = (p.socialLinks || []).find(function (e) { return (e.platform || "") === platformKey; });
    if (entry) {
      entry.url = editProfileUrlInput.value.trim();
      saveProfile(p);
      renderSocialUrls();
      liveRefreshPreview();
    }
    closeEditProfileModal();
  });
  if (editProfileUrlCancel) editProfileUrlCancel.addEventListener("click", closeEditProfileModal);
  if (document.getElementById("editProfileUrlModalClose")) document.getElementById("editProfileUrlModalClose").addEventListener("click", closeEditProfileModal);
  if (editProfileUrlModal) editProfileUrlModal.addEventListener("click", function (e) { if (e.target === editProfileUrlModal) closeEditProfileModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && editProfileUrlModal && !editProfileUrlModal.hidden) closeEditProfileModal(); });
  if (addProfileModalClose) addProfileModalClose.addEventListener("click", closeAddProfileModal);
  if (addProfileModal) addProfileModal.addEventListener("click", function (e) { if (e.target === addProfileModal) closeAddProfileModal(); });

  var socialUrlInputDebounce = {};
  function renderSocialUrls(focusIndex) {
    const profile = getProfile();
    if (!profile) return;
    var links = profile.socialLinks || [];
    var labelEl = document.getElementById("socialUrlsLabel");
    if (labelEl) labelEl.hidden = links.length === 0;
    socialUrls.innerHTML = "";
    if (links.length === 0) {
      var emptyP = document.createElement("p");
      emptyP.className = "profile-urls-empty";
      emptyP.textContent = "No profile URLs yet. Click + on an icon above to add one.";
      socialUrls.appendChild(emptyP);
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "social-url-cards";
    links.forEach((entry, index) => {
      var key = entry.platform || "website";
      var platformName = platformLabels[key] || key;
      const card = document.createElement("div");
      card.className = "link-card social-url-card social-url-row";
      card.draggable = true;
      card.dataset.index = String(index);
      var logoUrl = platformLogoUrl(key);
      var iconHtml = logoUrl
        ? '<img src="' + logoUrl + '" alt="" class="social-url-card-logo" loading="lazy" />'
        : '<span class="social-url-card-letter">' + platformName.charAt(0) + '</span>';
      card.innerHTML =
        '<div class="link-card-inner">' +
          '<div class="link-card-left">' +
            '<button type="button" class="link-card-handle" aria-label="Drag to reorder" title="Drag to reorder">⋮⋮</button>' +
            '<div class="link-card-body">' +
              '<div class="link-card-title-row">' +
                '<span class="link-card-title">' + platformName + ' – Profile URL</span>' +
                '<button type="button" class="link-card-edit social-url-edit-title" title="Edit">✎</button>' +
              '</div>' +
              '<div class="link-card-url-row">' +
                '<span class="link-card-url-text">URL</span>' +
                '<button type="button" class="link-card-edit social-url-edit-url" title="Edit URL">✎</button>' +
              '</div>' +
              '<div class="social-url-card-icon-row">' + iconHtml + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="link-card-right">' +
            '<button type="button" class="btn-delete-card social-url-remove" title="Delete">🗑</button>' +
          '</div>' +
        '</div>';
      var input = document.createElement("input");
      input.type = "url";
      input.placeholder = "https://...";
      input.value = entry.url || "";
      input.className = "social-url-card-input";
      input.setAttribute("aria-label", "URL " + platformName);
      var urlRow = card.querySelector(".link-card-url-row");
      urlRow.insertBefore(input, urlRow.querySelector(".social-url-edit-url"));
      function saveThisUrl() {
        var p = getProfile();
        if ((p.socialLinks || [])[index]) p.socialLinks[index].url = input.value.trim();
        var promise = saveProfile(p);
        if (promise && promise.then) {
          promise.then(function () { refreshPreview(); }).catch(function () {});
        } else {
          liveRefreshPreview();
        }
      }
      input.addEventListener("change", saveThisUrl);
      input.addEventListener("input", function () {
        clearTimeout(socialUrlInputDebounce[index]);
        socialUrlInputDebounce[index] = setTimeout(saveThisUrl, 700);
      });
      card.querySelector(".social-url-edit-title").addEventListener("click", function () { input.focus(); });
      card.querySelector(".social-url-edit-url").addEventListener("click", function () { input.focus(); });
      card.querySelector(".social-url-remove").addEventListener("click", function () {
        var p = getProfile();
        p.socialLinks = (p.socialLinks || []).filter(function (_, i) { return i !== index; });
        var promise = saveProfile(p);
        renderLinksStripAddIcons();
        renderSocialUrls();
        if (promise && promise.then) promise.then(function () { refreshPreview(); }).catch(function () {});
        else liveRefreshPreview();
      });
      wrap.appendChild(card);
    });
    socialUrls.appendChild(wrap);
    setupSocialUrlsDragDrop(socialUrls);
    if (typeof focusIndex === "number" && focusIndex >= 0 && focusIndex < links.length) {
      setTimeout(function () {
        var card = wrap.querySelectorAll(".social-url-card")[focusIndex];
        var input = card && card.querySelector(".social-url-card-input");
        if (input) input.focus();
      }, 100);
    }
  }

  function setupSocialUrlsDragDrop(container) {
    if (!container) return;
    var draggedIdx = null;
    container.querySelectorAll(".social-url-row").forEach(function (row) {
      row.addEventListener("dragstart", function (e) {
        draggedIdx = parseInt(row.dataset.index, 10);
        e.dataTransfer.setData("text/plain", String(draggedIdx));
        e.dataTransfer.effectAllowed = "move";
        row.classList.add("social-url-row-dragging");
      });
      row.addEventListener("dragend", function () {
        row.classList.remove("social-url-row-dragging");
        draggedIdx = null;
      });
      row.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        var idx = parseInt(row.dataset.index, 10);
        if (draggedIdx !== null && idx !== draggedIdx) row.classList.add("social-url-row-drag-over");
      });
      row.addEventListener("dragleave", function () {
        row.classList.remove("social-url-row-drag-over");
      });
      row.addEventListener("drop", function (e) {
        e.preventDefault();
        row.classList.remove("social-url-row-drag-over");
        var toIdx = parseInt(row.dataset.index, 10);
        if (draggedIdx === null || draggedIdx === toIdx) return;
        var p = getProfile();
        var links = p.socialLinks || [];
        var item = links.splice(draggedIdx, 1)[0];
        links.splice(toIdx, 0, item);
        p.socialLinks = links;
        saveProfile(p);
        renderSocialUrls();
        if (window.__taplyLiveRefresh) window.__taplyLiveRefresh();
      });
    });
  }

  function showOnboardingStep(step) {
    currentOnboardingStep = step;
    viewOnboarding.querySelectorAll(".panel").forEach((p) => {
      p.classList.toggle("is-active", Number(p.dataset.step) === step);
    });
    onboardingSteps.querySelectorAll(".step").forEach((s) => {
      s.classList.toggle("is-active", Number(s.dataset.step) === step);
    });
  }

  function setupOnboardingNavigation() {
    viewOnboarding.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (currentOnboardingStep < 3) showOnboardingStep(currentOnboardingStep + 1);
      });
    });
    viewOnboarding.querySelectorAll("[data-prev]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (currentOnboardingStep > 1) showOnboardingStep(currentOnboardingStep - 1);
      });
    });
  }

  function finishOnboarding() {
    const profile = defaultProfile();
    profile.theme = selectedTheme;
    profile.platforms = [...selectedPlatforms];
    profile.socialLinks = selectedPlatforms.map(function (key) { return { platform: key, url: "" }; });
    profile.displayName = onboardingDisplayName.value.trim() || "Name";
    profile.bio = onboardingBio.value.trim();
    profile.username = (currentUser && currentUser.username) || "";
    try {
      const pendingUser = sessionStorage.getItem(PENDING_USERNAME_KEY);
      if (pendingUser) profile.username = pendingUser;
      sessionStorage.removeItem(PENDING_USERNAME_KEY);
    } catch (err) {}
    if (!profile.username) profile.username = "my-profile";
    try {
      profile.email = sessionStorage.getItem(PENDING_EMAIL_KEY) || (currentUser && currentUser.email) || "";
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
    } catch (err) {}
    if (onboardingAvatarPreview.src && onboardingAvatarPreview.src.indexOf("data:") === 0) {
      profile.avatar = onboardingAvatarPreview.src;
    }
    saveProfile(profile);
    showView("dashboard");
    initDashboard();
  }

  function initOnboarding() {
    const p = getProfile();
    if (p) {
      selectedTheme = p.theme || "midnight";
      selectedPlatforms = (p.socialLinks || []).map(function (e) { return e.platform; }).filter(Boolean);
      if (selectedPlatforms.length === 0) selectedPlatforms = p.platforms || [];
      onboardingDisplayName.value = p.displayName || "";
      onboardingBio.value = p.bio || "";
      if (p.avatar) {
        onboardingAvatarPreview.src = p.avatar;
        onboardingAvatarPreview.hidden = false;
        onboardingAvatar.querySelector(".plus").style.display = "none";
      }
    }
    renderOnboardingThemes();
    renderOnboardingPlatforms();
    showOnboardingStep(1);
    setupOnboardingNavigation();

    onboardingAvatar.addEventListener("click", () => onboardingAvatarInput.click());
    onboardingAvatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      const r = new FileReader();
      r.onload = () => {
        onboardingAvatarPreview.src = r.result;
        onboardingAvatarPreview.hidden = false;
        onboardingAvatar.querySelector(".plus").style.display = "none";
      };
      r.readAsDataURL(file);
    });

    onboardingBio.addEventListener("input", () => {
      onboardingBioCounter.textContent = onboardingBio.value.length + "/160";
    });
    onboardingBioCounter.textContent = onboardingBio.value.length + "/160";

    onboardingFinish.addEventListener("click", finishOnboarding);
  }

  function initDashboard() {
    const profile = getProfile();
    if (!profile) return;

    const username = (currentUser && currentUser.username) || profile.username || "";
    var slugNorm = (username || "my-profile").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "my-profile";
    var profileFullUrl = getCanonicalOrigin() + "/" + slugNorm;
    var profileDisplayUrl = getDisplayHost() + "/" + slugNorm;
    const profileLinkEl = document.getElementById("dashboardProfileLink");
    if (profileLinkEl) {
      profileLinkEl.href = username ? profileFullUrl : "#";
    }
    if (previewFrame && username) {
      previewFrame.src = profileFullUrl + (profileFullUrl.indexOf("?") >= 0 ? "&" : "?") + "embed=1";
    }
    if (dashboardLinkUrlPreview) {
      dashboardLinkUrlPreview.value = profileDisplayUrl;
      dashboardLinkUrlPreview.dataset.fullUrl = profileFullUrl;
    }
    if (dashboardLinkUrl) {
      dashboardLinkUrl.value = profileDisplayUrl;
      dashboardLinkUrl.dataset.fullUrl = profileFullUrl;
    }
    if (sidebarLinkUrl) {
      sidebarLinkUrl.value = profileDisplayUrl;
      sidebarLinkUrl.dataset.fullUrl = profileFullUrl;
    }
    var mobilePreviewUrl = document.getElementById("mobilePreviewUrl");
    var mobilePreviewOpen = document.getElementById("mobilePreviewOpen");
    if (mobilePreviewUrl) { mobilePreviewUrl.value = profileDisplayUrl; mobilePreviewUrl.dataset.fullUrl = profileFullUrl; }
    if (mobilePreviewOpen) mobilePreviewOpen.href = username ? profileFullUrl : "#";
    if (copyLinkBtnPreview && dashboardLinkUrlPreview) {
      copyLinkBtnPreview.addEventListener("click", () => {
        var toCopy = dashboardLinkUrlPreview.dataset.fullUrl || dashboardLinkUrlPreview.value;
        try {
          navigator.clipboard.writeText(toCopy);
          copyLinkBtnPreview.textContent = "✓";
          setTimeout(() => { copyLinkBtnPreview.textContent = "⎘"; }, 1500);
        } catch (e) {}
      });
    }
    if (sidebarUsername) sidebarUsername.textContent = username || "—";
    const sidebarAvatarPlaceholder = document.getElementById("sidebarAvatarPlaceholder");
    if (sidebarAvatarImg && profile.avatar) {
      sidebarAvatarImg.src = profile.avatar;
      sidebarAvatarImg.hidden = false;
      if (sidebarAvatarPlaceholder) sidebarAvatarPlaceholder.hidden = true;
    } else if (sidebarAvatarPlaceholder) {
      sidebarAvatarPlaceholder.hidden = false;
    }
    var dropdownUsername = document.getElementById("dropdownUsername");
    var dropdownProfileLink = document.getElementById("dropdownProfileLink");
    var dropdownAvatarImg = document.getElementById("dropdownAvatarImg");
    var dropdownAvatarPlaceholder = document.getElementById("dropdownAvatarPlaceholder");
    if (dropdownUsername) dropdownUsername.textContent = username || "—";
    if (dropdownProfileLink) {
      dropdownProfileLink.href = profileFullUrl;
      dropdownProfileLink.textContent = username ? profileFullUrl : "—";
      dropdownProfileLink.title = "Open profile";
    }
    updatePlanPillDisplay();
    setupTestPremiumTripleClick();
    applyPremiumRestrictions();
    window.updateDashboardLinkDisplay = function () {
      var p = getProfile();
      var u = (currentUser && currentUser.username) || p.username || "";
      var s = (u || "my-profile").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "my-profile";
      var fullUrl = getCanonicalOrigin() + "/" + s;
      var displayUrl = getDisplayHost() + "/" + s;
      if (profileLinkEl) profileLinkEl.href = u ? fullUrl : "#";
      if (previewFrame && u) previewFrame.src = fullUrl + (fullUrl.indexOf("?") >= 0 ? "&" : "?") + "embed=1";
      if (dashboardLinkUrlPreview) { dashboardLinkUrlPreview.value = displayUrl; dashboardLinkUrlPreview.dataset.fullUrl = fullUrl; }
      if (dashboardLinkUrl) { dashboardLinkUrl.value = displayUrl; dashboardLinkUrl.dataset.fullUrl = fullUrl; }
      if (sidebarLinkUrl) { sidebarLinkUrl.value = displayUrl; sidebarLinkUrl.dataset.fullUrl = fullUrl; }
      var mpUrl = document.getElementById("mobilePreviewUrl");
      var mpOpen = document.getElementById("mobilePreviewOpen");
      if (mpUrl) { mpUrl.value = displayUrl; mpUrl.dataset.fullUrl = fullUrl; }
      if (mpOpen) mpOpen.href = u ? fullUrl : "#";
      var subdomainDomain = getSubdomainDomain();
      if (profileSubdomainRow && dashboardLinkSubdomainUrl && subdomainDomain) {
        profileSubdomainRow.hidden = !isPremium() || !u;
        if (u) {
          var subFull = "https://" + s + "." + subdomainDomain;
          dashboardLinkSubdomainUrl.value = s + "." + subdomainDomain;
          dashboardLinkSubdomainUrl.dataset.fullUrl = subFull;
        }
      }
      if (sidebarUsername) sidebarUsername.textContent = u || "—";
      if (dropdownUsername) dropdownUsername.textContent = u || "—";
      if (dropdownProfileLink) { dropdownProfileLink.href = fullUrl; dropdownProfileLink.textContent = u ? fullUrl : "—"; }
    };
    if (dropdownAvatarImg && profile.avatar) {
      dropdownAvatarImg.src = profile.avatar;
      dropdownAvatarImg.hidden = false;
      if (dropdownAvatarPlaceholder) dropdownAvatarPlaceholder.hidden = true;
    } else if (dropdownAvatarPlaceholder) {
      if (dropdownAvatarImg) dropdownAvatarImg.hidden = true;
      dropdownAvatarPlaceholder.hidden = false;
    }
    if (linksStripAvatarImg && profile.avatar) {
      linksStripAvatarImg.src = profile.avatar;
      linksStripAvatarImg.hidden = false;
    }
    if (linksUsername) {
      linksUsername.textContent = profile.displayName || profile.username || "—";
    }
    var completed = 0;
    if (profile.displayName) completed++;
    if ((profile.links || []).length > 0) completed++;
    if (profile.avatar) completed++;
    if (profile.bio) completed++;
    if (setupProgress) setupProgress.textContent = Math.round((completed / 4) * 100) + "% · " + completed + " of 4";

    function closeAccountDropdown() {
      var dd = document.getElementById("accountDropdown");
      var trigger = document.getElementById("accountDropdownTrigger");
      if (dd) { dd.classList.remove("is-open"); dd.setAttribute("aria-hidden", "true"); }
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    }
    function openAccountDropdown() {
      var dd = document.getElementById("accountDropdown");
      var trigger = document.getElementById("accountDropdownTrigger");
      if (dd) { dd.classList.add("is-open"); dd.setAttribute("aria-hidden", "false"); }
      if (trigger) trigger.setAttribute("aria-expanded", "true");
    }
    function toggleAccountDropdown() {
      var dd = document.getElementById("accountDropdown");
      if (dd && dd.classList.contains("is-open")) closeAccountDropdown();
      else openAccountDropdown();
    }
    var accountTrigger = document.getElementById("accountDropdownTrigger");
    if (accountTrigger) {
      accountTrigger.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleAccountDropdown();
      });
    }
    document.addEventListener("click", function (e) {
      var dd = document.getElementById("accountDropdown");
      var trigger = document.getElementById("accountDropdownTrigger");
      if (dd && dd.classList.contains("is-open") && trigger && !trigger.contains(e.target) && !dd.contains(e.target)) closeAccountDropdown();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAccountDropdown();
    });
    document.querySelectorAll(".sidebar-account-dropdown .dropdown-item").forEach(function (item) {
      item.addEventListener("click", function () { closeAccountDropdown(); });
    });
    const logoutBtn = document.getElementById("dashboardLogout");
    const dropdownLogoutBtn = document.getElementById("dropdownLogout");
    function doLogout() {
      var supabase = getSupabase();
      if (supabase) {
        supabase.auth.signOut().then(function () {
          try { localStorage.removeItem(TOKEN_KEY); } catch (err) {}
          window.location.href = "/login";
        }).catch(function () {
          try { localStorage.removeItem(TOKEN_KEY); } catch (err) {}
          window.location.href = "/login";
        });
        return;
      }
      try { localStorage.removeItem(TOKEN_KEY); } catch (err) {}
      window.location.href = "/login";
    }
    if (logoutBtn) logoutBtn.addEventListener("click", doLogout);
    if (dropdownLogoutBtn) dropdownLogoutBtn.addEventListener("click", function () { closeAccountDropdown(); doLogout(); });

    document.querySelectorAll(".sidebar-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const hash = tab.getAttribute("href");
        if (hash) {
          window.location.hash = hash;
          activateDashboardTab(hash);
        }
      });
    });
    const hash = window.location.hash || "#links";
    activateDashboardTab(hash);

    if (dashboardDisplayName) dashboardDisplayName.value = profile.displayName || "";
    dashboardUsername.value = profile.username || "";
    dashboardBio.value = profile.bio || "";
    dashboardBioCounter.textContent = (profile.bio || "").length + "/160";
    updateProfileLinkUrl();
    if (dashboardAvatarPreview && dashboardAvatar) {
      if (profile.avatar) {
        dashboardAvatarPreview.src = profile.avatar;
        dashboardAvatarPreview.hidden = false;
        dashboardAvatar.querySelector(".plus").style.display = "none";
      } else {
        dashboardAvatarPreview.hidden = true;
        dashboardAvatar.querySelector(".plus").style.display = "";
      }
    }

    renderDashboardThemes();
    renderLinksStripAddIcons();
    renderSocialUrls();
    renderLinkList();
    renderAnalytics();
    initDesignPanel();

    function initDesignPanel() {
      var designIntro = document.getElementById("designIntro");
      var designIntroMain = document.querySelector(".design-intro-main");
      var designThemePreview = document.getElementById("designThemePreview");
      var designThemeGridWrap = document.querySelector(".design-theme-grid-wrap");
      var designSaveBtn = document.querySelector(".design-save-btn");
      var designHeaderValue = document.getElementById("designHeaderValue");
      var designWallpaperValue = document.getElementById("designWallpaperValue");
      var designButtonsValue = document.getElementById("designButtonsValue");
      var designTextValue = document.getElementById("designTextValue");
      var GRADIENT_PRESETS = [
        "linear-gradient(135deg,#ec4899,#f97316)",
        "linear-gradient(135deg,#f97316,#eab308)",
        "linear-gradient(135deg,#84cc16,#eab308)",
        "linear-gradient(135deg,#22c55e,#3b82f6)",
        "linear-gradient(135deg,#6366f1,#1e3a8a)",
        "linear-gradient(135deg,#1e3a8a,#6366f1)",
        "linear-gradient(135deg,#38bdf8,#f97316)",
        "linear-gradient(135deg,#f97316,#ef4444)",
      ];
      function showDesignIntro() {
        if (designIntro) designIntro.hidden = false;
        if (designIntroMain) designIntroMain.hidden = false;
        document.querySelectorAll(".design-subpanel").forEach(function (p) { p.hidden = true; });
        if (designThemeGridWrap) designThemeGridWrap.hidden = true;
      }
      function showDesignSubpanel(id) {
        if (designIntro) designIntro.hidden = true;
        document.querySelectorAll(".design-subpanel").forEach(function (p) { p.hidden = p.id !== id; });
        var panel = document.getElementById(id);
        if (panel) syncDesignPanelFromProfile(panel.id);
      }
      function syncDesignPanelFromProfile(panelId) {
        var p = getProfile();
        if (!p || !p.design) return;
        var d = p.design;
        if (panelId === "designPanelHeader") {
          var headerAvatarImg = document.getElementById("designHeaderAvatarImg");
          if (headerAvatarImg) {
            if (p.avatar) { headerAvatarImg.src = p.avatar; headerAvatarImg.hidden = false; }
            else { headerAvatarImg.removeAttribute("src"); headerAvatarImg.hidden = true; }
          }
          var titleInput = document.getElementById("designTitleInput");
          if (titleInput) titleInput.value = p.displayName || "";
          var altFont = document.getElementById("designAlternativeTitleFont");
          if (altFont) altFont.checked = !!d.alternativeTitleFont;
          var titleFontWrap = document.getElementById("designTitleFontWrap");
          var titleFontTrigger = document.getElementById("designTitleFontTrigger");
          applyDesignConditionalVisibility();
          if (titleFontTrigger) titleFontTrigger.textContent = d.titleFont || "DM Sans";
          setOptionSelected("headerLayout", d.headerLayout);
          setOptionSelected("titleStyle", d.titleStyle);
          setOptionSelected("titleSize", d.titleSize);
          var logoField = document.getElementById("designFieldLogoUrl");
          var logoUrlInput = document.getElementById("designTitleLogoUrl");
          if (logoUrlInput) {
            if (d.titleLogoUrl && d.titleLogoUrl.startsWith("data:")) {
              logoUrlInput.value = "";
              logoUrlInput.placeholder = "Imagine încărcată";
            } else {
              logoUrlInput.value = d.titleLogoUrl || "";
              logoUrlInput.placeholder = "Opțional: URL";
            }
          }
          applyDesignConditionalVisibility();
          var logoPreview = document.getElementById("designLogoPreview");
          if (logoPreview) {
            if (d.titleLogoUrl) { logoPreview.src = d.titleLogoUrl; logoPreview.hidden = false; }
            else { logoPreview.removeAttribute("src"); logoPreview.hidden = true; }
          }
          setColorInput("designTitleColor", "designTitleColorSwatch", d.titleColor);
        } else if (panelId === "designPanelWallpaper") {
          setOptionSelected("wallpaperStyle", d.wallpaperStyle);
          setOptionSelected("gradientStyle", d.gradientStyle);
          var animate = document.getElementById("designAnimateGradient");
          if (animate) animate.checked = !!d.animateGradient;
          var noise = document.getElementById("designNoise");
          if (noise) noise.checked = !!d.noise;
          renderGradientPresets();
        } else if (panelId === "designPanelButtons") {
          setOptionSelected("buttonStyle", d.buttonStyle);
          setOptionSelected("cornerRoundness", d.cornerRoundness);
          setOptionSelected("buttonShadow", d.buttonShadow);
          setColorInput("designButtonsColor", "designButtonsColorSwatch", d.buttonsColor);
          setColorInput("designButtonTextColor", "designButtonTextColorSwatch", d.buttonTextColor);
        } else if (panelId === "designPanelText") {
          var pageFont = document.getElementById("designPageFont");
          if (pageFont) pageFont.value = d.pageFont || "DM Sans";
          setColorInput("designPageTextColor", "designPageTextColorSwatch", d.pageTextColor);
          var altTitle = document.getElementById("designAltTitleFontText");
          if (altTitle) altTitle.checked = !!d.alternativeTitleFont;
          var titleFontWrapText = document.getElementById("designTitleFontWrapText");
          var titleFontTriggerText = document.getElementById("designTitleFontTriggerText");
          applyDesignConditionalVisibility();
          if (titleFontTriggerText) titleFontTriggerText.textContent = d.titleFont || "DM Sans";
          setOptionSelected("titleSize", d.titleSize);
        } else if (panelId === "designPanelColors") {
          setColorInput("designColorsButtons", "designColorsButtonsSwatch", d.buttonsColor || "#D14646");
          setColorInput("designColorsButtonText", "designColorsButtonTextSwatch", d.buttonTextColor || "#E40390");
          setColorInput("designColorsPageText", "designColorsPageTextSwatch", d.pageTextColor || "#362630");
          setColorInput("designColorsTitleText", "designColorsTitleTextSwatch", d.titleColor || "#362630");
        }
      }
      function applyDesignConditionalVisibility() {
        var p = getProfile();
        var d = (p && p.design) ? p.design : defaultProfile().design;
        var showLogo = (d.titleStyle || "text") === "logo";
        var showTitleFont = !!d.alternativeTitleFont;
        var logoField = document.getElementById("designFieldLogoUrl");
        var titleFontWrap = document.getElementById("designTitleFontWrap");
        var titleFontWrapText = document.getElementById("designTitleFontWrapText");
        if (logoField) {
          logoField.hidden = !showLogo;
          logoField.style.display = showLogo ? "" : "none";
        }
        if (titleFontWrap) {
          titleFontWrap.hidden = !showTitleFont;
          titleFontWrap.style.display = showTitleFont ? "" : "none";
        }
        if (titleFontWrapText) {
          titleFontWrapText.hidden = !showTitleFont;
          titleFontWrapText.style.display = showTitleFont ? "" : "none";
        }
      }
      function setOptionSelected(optionName, value) {
        document.querySelectorAll(".design-option-btn[data-option=\"" + optionName + "\"], .design-option-tile[data-option=\"" + optionName + "\"]").forEach(function (btn) {
          btn.classList.toggle("is-selected", (btn.dataset.value || "") === (value || ""));
        });
      }
      function setColorInput(inputId, swatchId, hex) {
        var input = document.getElementById(inputId);
        var swatch = document.getElementById(swatchId);
        if (input) input.value = hex || "#000000";
        if (swatch) swatch.style.background = hex || "#000000";
      }
      function applyDesignOption(optionName, value) {
        var p = getProfile();
        if (!p) return;
        p.design = p.design || defaultProfile().design;
        p.design[optionName] = value;
        saveProfile(p);
        updateDesignRowValues();
        liveRefreshPreview();
      }
      function updateDesignRowValues() {
        var p = getProfile();
        if (!p || !p.design) return;
        var d = p.design;
        if (designHeaderValue) designHeaderValue.textContent = d.headerLayout === "hero" ? "Hero" : "Classic";
        if (designWallpaperValue) designWallpaperValue.textContent = (d.wallpaperStyle || "gradient").charAt(0).toUpperCase() + (d.wallpaperStyle || "gradient").slice(1);
        if (designButtonsValue) designButtonsValue.textContent = d.buttonStyle === "solid" ? "Fill" : (d.buttonStyle === "glass" ? "Glass" : "Outline");
        if (designTextValue) designTextValue.textContent = d.pageFont || "DM Sans";
      }
      function renderGradientPresets() {
        var wrap = document.getElementById("designGradientPresets");
        if (!wrap) return;
        wrap.innerHTML = "";
        var p = getProfile();
        var selected = (p && p.design && typeof p.design.gradientPreset === "number") ? p.design.gradientPreset : 2;
        GRADIENT_PRESETS.forEach(function (grad, i) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "design-gradient-preset" + (i === selected ? " is-selected" : "");
          btn.style.background = grad;
          btn.addEventListener("click", function () {
            var pr = getProfile();
            if (pr && pr.design) {
              pr.design.gradientPreset = i;
              saveProfile(pr);
              renderGradientPresets();
              liveRefreshPreview();
            }
          });
          wrap.appendChild(btn);
        });
      }
      document.querySelectorAll(".design-customize-row").forEach(function (row) {
        row.addEventListener("click", function () {
          var panelId = row.dataset.panel;
          if (!panelId) return;
          var subpanelId = "designPanel" + panelId.charAt(0).toUpperCase() + panelId.slice(1);
          showDesignSubpanel(subpanelId);
        });
      });
      var designHeaderAddBtn = document.getElementById("designHeaderAddAvatarBtn");
      var profileImageModal = document.getElementById("profileImageModal");
      var profileImageModalClose = document.getElementById("profileImageModalClose");
      var profileImageFileInput = document.getElementById("profileImageFileInput");
      if (designHeaderAddBtn && profileImageModal) {
        designHeaderAddBtn.addEventListener("click", function () { profileImageModal.hidden = false; });
      }
      if (profileImageModalClose && profileImageModal) {
        profileImageModalClose.addEventListener("click", function () { profileImageModal.hidden = true; });
      }
      profileImageModal && profileImageModal.addEventListener("click", function (e) { if (e.target === profileImageModal) profileImageModal.hidden = true; });
      var profileImageOptionFile = document.getElementById("profileImageOptionFile");
      if (profileImageOptionFile && profileImageFileInput) {
        profileImageOptionFile.addEventListener("click", function () { profileImageFileInput.click(); });
      }
      ["profileImageOptionVideo", "profileImageOptionAI", "profileImageOptionCanva"].forEach(function (id) {
        var btn = document.getElementById(id);
        if (btn && profileImageModal) btn.addEventListener("click", function () { profileImageModal.hidden = true; });
      });
      if (profileImageFileInput) {
        profileImageFileInput.addEventListener("change", function () {
          var file = profileImageFileInput.files && profileImageFileInput.files[0];
          if (!file || (!file.type.startsWith("image/") && file.type !== "image/gif")) return;
          var reader = new FileReader();
          reader.onload = function () {
            var p = getProfile();
            if (p) {
              p.avatar = reader.result;
              saveProfile(p);
              var headerAvatarImg = document.getElementById("designHeaderAvatarImg");
              if (headerAvatarImg) { headerAvatarImg.src = reader.result; headerAvatarImg.hidden = false; }
              if (profileImageModal) profileImageModal.hidden = true;
              liveRefreshPreview();
            }
          };
          reader.readAsDataURL(file);
          profileImageFileInput.value = "";
        });
      }
      document.querySelectorAll(".design-back-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          showDesignIntro();
          updateDesignRowValues();
        });
      });
      document.querySelectorAll(".design-option-btn, .design-option-tile").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var opt = btn.dataset.option;
          var val = btn.dataset.value;
          if (!opt || !val) return;
          var parent = btn.closest(".design-subpanel-body");
          if (parent) parent.querySelectorAll(".design-option-btn[data-option=\"" + opt + "\"], .design-option-tile[data-option=\"" + opt + "\"]").forEach(function (b) { b.classList.remove("is-selected"); });
          btn.classList.add("is-selected");
          applyDesignOption(opt, val);
          if (opt === "titleStyle") applyDesignConditionalVisibility();
        });
      });
      document.querySelectorAll(".design-color-input").forEach(function (input) {
        input.addEventListener("input", function () {
          var hex = input.value.trim();
          var swatchId = input.id + "Swatch";
          if (input.id === "designButtonsColor") swatchId = "designButtonsColorSwatch";
          else if (input.id === "designButtonTextColor") swatchId = "designButtonTextColorSwatch";
          else if (input.id === "designPageTextColor") swatchId = "designPageTextColorSwatch";
          else if (input.id === "designTitleColor") swatchId = "designTitleColorSwatch";
          else if (input.id === "designColorsButtons") swatchId = "designColorsButtonsSwatch";
          else if (input.id === "designColorsButtonText") swatchId = "designColorsButtonTextSwatch";
          else if (input.id === "designColorsPageText") swatchId = "designColorsPageTextSwatch";
          else if (input.id === "designColorsTitleText") swatchId = "designColorsTitleTextSwatch";
          var swatch = document.getElementById(swatchId);
          if (swatch) swatch.style.background = hex || "#000";
          var p = getProfile();
          if (!p || !p.design) return;
          p.design = p.design || defaultProfile().design;
          if (input.id === "designButtonsColor" || input.id === "designColorsButtons") p.design.buttonsColor = hex;
          else if (input.id === "designButtonTextColor" || input.id === "designColorsButtonText") p.design.buttonTextColor = hex;
          else if (input.id === "designPageTextColor" || input.id === "designColorsPageText") p.design.pageTextColor = hex;
          else if (input.id === "designTitleColor" || input.id === "designColorsTitleText") p.design.titleColor = hex;
          saveProfile(p);
          liveRefreshPreview();
        });
      });
      var designTitleInput = document.getElementById("designTitleInput");
      if (designTitleInput) designTitleInput.addEventListener("input", function () {
        var p = getProfile();
        if (p) { p.displayName = designTitleInput.value; saveProfile(p); liveRefreshPreview(); }
      });
      var designTitleLogoUrl = document.getElementById("designTitleLogoUrl");
      if (designTitleLogoUrl) designTitleLogoUrl.addEventListener("input", function () {
        var p = getProfile();
        if (p && p.design) { p.design.titleLogoUrl = designTitleLogoUrl.value.trim(); saveProfile(p); liveRefreshPreview(); }
        var logoPreview = document.getElementById("designLogoPreview");
        if (logoPreview) {
          var v = designTitleLogoUrl.value.trim();
          if (v) { logoPreview.src = v; logoPreview.hidden = false; } else { logoPreview.removeAttribute("src"); logoPreview.hidden = true; }
        }
      });
      var designTitleLogoFile = document.getElementById("designTitleLogoFile");
      var designUploadLogoBtn = document.getElementById("designUploadLogoBtn");
      if (designUploadLogoBtn && designTitleLogoFile) {
        designUploadLogoBtn.addEventListener("click", function () { designTitleLogoFile.click(); });
        designTitleLogoFile.addEventListener("change", function () {
          var file = designTitleLogoFile.files && designTitleLogoFile.files[0];
          if (!file || !file.type.startsWith("image/")) return;
          var reader = new FileReader();
          reader.onload = function () {
            var p = getProfile();
            if (p && p.design) {
              p.design.titleLogoUrl = reader.result;
              saveProfile(p);
              if (designTitleLogoUrl) {
                designTitleLogoUrl.value = "";
                designTitleLogoUrl.placeholder = "Imagine încărcată";
              }
              var logoPreview = document.getElementById("designLogoPreview");
              if (logoPreview) { logoPreview.src = reader.result; logoPreview.hidden = false; }
              liveRefreshPreview();
            }
          };
          reader.readAsDataURL(file);
        });
      }
      (function () {
        var colorModal = document.getElementById("designColorPickerModal");
        var colorBox = document.getElementById("designColorPickerBox");
        var colorGradient = document.getElementById("designColorPickerGradient");
        var colorSelector = document.getElementById("designColorPickerSelector");
        var colorHueBar = document.getElementById("designColorPickerHueBar");
        var colorHueHandle = document.getElementById("designColorPickerHueHandle");
        var colorHex = document.getElementById("designColorPickerHex");
        var colorEyedropper = document.getElementById("designColorPickerEyedropper");
        var colorDone = document.getElementById("designColorPickerDone");
        var titleColorInput = document.getElementById("designTitleColor");
        var titleColorSwatch = document.getElementById("designTitleColorSwatch");
        function hexFromInput(h) {
          h = (h || "").trim();
          if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h;
          if (/^[0-9A-Fa-f]{6}$/.test(h)) return "#" + h;
          return "#362630";
        }
        function hexToRgb(hex) {
          var n = parseInt(hex.slice(1), 16);
          return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
        }
        function rgbToHex(r, g, b) {
          return "#" + [r, g, b].map(function (x) { x = Math.round(Math.max(0, Math.min(255, x))); return (x < 16 ? "0" : "") + x.toString(16); }).join("");
        }
        function rgbToHsv(r, g, b) {
          r /= 255; g /= 255; b /= 255;
          var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h, s = max === 0 ? 0 : d / max, v = max;
          if (d === 0) h = 0;
          else if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) h = ((b - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
          return { h: h * 360, s: s, v: v };
        }
        function hsvToRgb(h, s, v) {
          var i = Math.floor(h / 60) % 6, f = h / 60 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
          var r = [v, q, p, p, t, v][i], g = [t, v, v, q, p, p][i], b = [p, p, t, v, v, q][i];
          return { r: r * 255, g: g * 255, b: b * 255 };
        }
        var pickerState = { h: 330, s: 0.2, v: 0.2 };
        function setPickerFromHex(hex) {
          hex = hexFromInput(hex);
          var rgb = hexToRgb(hex);
          var hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          pickerState.h = hsv.h; pickerState.s = hsv.s; pickerState.v = hsv.v;
          if (colorGradient) colorGradient.style.setProperty("--picker-hue", Math.round(pickerState.h));
          if (colorSelector) {
            colorSelector.style.left = (pickerState.s * 100) + "%";
            colorSelector.style.top = ((1 - pickerState.v) * 100) + "%";
          }
          if (colorHueHandle) colorHueHandle.style.left = (pickerState.h / 360 * 100) + "%";
          if (colorHex) colorHex.value = hex;
        }
        function setPickerFromHSV() {
          var rgb = hsvToRgb(pickerState.h, pickerState.s, pickerState.v);
          var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          if (colorHex) colorHex.value = hex;
        }
        function openTitleColorPicker() {
          var hex = hexFromInput(titleColorInput && titleColorInput.value);
          setPickerFromHex(hex);
          if (colorModal) colorModal.hidden = false;
        }
        function applyPickerColor(hex) {
          setPickerFromHex(hex);
        }
        function closeAndApplyTitleColor() {
          var hex = colorHex && hexFromInput(colorHex.value);
          if (hex && titleColorInput) titleColorInput.value = hex;
          if (hex && titleColorSwatch) titleColorSwatch.style.background = hex;
          var p = getProfile();
          if (p && p.design && hex) { p.design.titleColor = hex; saveProfile(p); liveRefreshPreview(); }
          if (colorModal) colorModal.hidden = true;
        }
        function dragGradient(e) {
          if (!colorGradient || !colorSelector) return;
          var rect = colorGradient.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width;
          var y = (e.clientY - rect.top) / rect.height;
          x = Math.max(0, Math.min(1, x));
          y = Math.max(0, Math.min(1, y));
          pickerState.s = x;
          pickerState.v = 1 - y;
          colorSelector.style.left = (x * 100) + "%";
          colorSelector.style.top = (y * 100) + "%";
          setPickerFromHSV();
        }
        function dragHue(e) {
          if (!colorHueBar || !colorHueHandle) return;
          var rect = colorHueBar.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width;
          x = Math.max(0, Math.min(1, x));
          pickerState.h = x * 360;
          colorGradient.style.setProperty("--picker-hue", Math.round(pickerState.h));
          colorHueHandle.style.left = (x * 100) + "%";
          setPickerFromHSV();
        }
        if (colorGradient) {
          colorGradient.addEventListener("mousedown", function (e) { e.preventDefault(); dragGradient(e); var up = function () { document.removeEventListener("mousemove", dragGradient); document.removeEventListener("mouseup", up); }; document.addEventListener("mousemove", dragGradient); document.addEventListener("mouseup", up); });
          colorGradient.addEventListener("touchstart", function (e) { e.preventDefault(); var t = e.touches[0]; dragGradient({ clientX: t.clientX, clientY: t.clientY }); var move = function (ev) { if (ev.touches[0]) dragGradient({ clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY }); }; var end = function () { colorGradient.removeEventListener("touchmove", move); colorGradient.removeEventListener("touchend", end); }; colorGradient.addEventListener("touchmove", move, { passive: false }); colorGradient.addEventListener("touchend", end); });
        }
        if (colorHueBar) {
          colorHueBar.addEventListener("mousedown", function (e) { e.preventDefault(); dragHue(e); var up = function () { document.removeEventListener("mousemove", dragHue); document.removeEventListener("mouseup", up); }; document.addEventListener("mousemove", dragHue); document.addEventListener("mouseup", up); });
          colorHueBar.addEventListener("touchstart", function (e) { e.preventDefault(); var t = e.touches[0]; dragHue({ clientX: t.clientX }); var move = function (ev) { if (ev.touches[0]) dragHue({ clientX: ev.touches[0].clientX }); }; var end = function () { colorHueBar.removeEventListener("touchmove", move); colorHueBar.removeEventListener("touchend", end); }; colorHueBar.addEventListener("touchmove", move, { passive: false }); colorHueBar.addEventListener("touchend", end); });
        }
        if (colorHex) colorHex.addEventListener("input", function () { setPickerFromHex(colorHex.value); });
        if (colorEyedropper && window.EyeDropper) {
          colorEyedropper.style.display = "";
          colorEyedropper.addEventListener("click", function () {
            (new window.EyeDropper()).open().then(function (r) { setPickerFromHex(r.sRGBHex || r.sHex || "#362630"); }).catch(function () {});
          });
        } else if (colorEyedropper) colorEyedropper.style.display = "none";
        if (titleColorSwatch) titleColorSwatch.addEventListener("click", openTitleColorPicker);
        if (titleColorInput) titleColorInput.addEventListener("click", openTitleColorPicker);
        var triggerWrap = document.querySelector(".design-color-picker-trigger-wrap");
        if (triggerWrap) triggerWrap.addEventListener("click", function (e) { if (e.target === triggerWrap || e.target === titleColorSwatch || e.target === titleColorInput) openTitleColorPicker(); });
        document.querySelectorAll("#designColorPickerSuggested .design-color-picker-swatch").forEach(function (sw) {
          sw.addEventListener("click", function () { applyPickerColor(sw.dataset.hex); });
        });
        if (colorDone) colorDone.addEventListener("click", closeAndApplyTitleColor);
        if (colorModal) colorModal.addEventListener("click", function (e) { if (e.target === colorModal) closeAndApplyTitleColor(); });
        if (colorBox) colorBox.addEventListener("click", function (e) { e.stopPropagation(); });
      })();
      ["designAlternativeTitleFont", "designAnimateGradient", "designNoise", "designAltTitleFontText"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener("change", function () {
          var p = getProfile();
          if (!p || !p.design) return;
          p.design = p.design || defaultProfile().design;
          if (id === "designAlternativeTitleFont" || id === "designAltTitleFontText") {
            p.design.alternativeTitleFont = el.checked;
            var other = id === "designAlternativeTitleFont" ? document.getElementById("designAltTitleFontText") : document.getElementById("designAlternativeTitleFont");
            if (other) other.checked = el.checked;
            applyDesignConditionalVisibility();
          } else if (id === "designAnimateGradient") p.design.animateGradient = el.checked;
          else if (id === "designNoise") p.design.noise = el.checked;
          saveProfile(p);
          liveRefreshPreview();
        });
      });
      (function () {
        var titleFontModal = document.getElementById("titleFontModal");
        var titleFontModalBox = document.getElementById("titleFontModalBox");
        var titleFontModalGrid = document.getElementById("titleFontModalGrid");
        var titleFontModalClose = document.getElementById("titleFontModalClose");
        function openTitleFontModal() {
          if (!titleFontModal || !titleFontModalGrid) return;
          var p = getProfile();
          var current = (p && p.design && p.design.titleFont) || "DM Sans";
          titleFontModalGrid.innerHTML = "";
          TITLE_FONTS.forEach(function (fontName) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = fontName;
            btn.style.fontFamily = fontName + ", sans-serif";
            btn.classList.toggle("is-selected", fontName === current);
            btn.addEventListener("click", function () {
              var pr = getProfile();
              if (pr && pr.design) {
                pr.design.titleFont = fontName;
                saveProfile(pr);
                var trigger = document.getElementById("designTitleFontTrigger");
                var triggerText = document.getElementById("designTitleFontTriggerText");
                if (trigger) trigger.textContent = fontName;
                if (triggerText) triggerText.textContent = fontName;
                titleFontModalGrid.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-selected"); if (b.textContent === fontName) b.classList.add("is-selected"); });
                if (titleFontModal) titleFontModal.hidden = true;
                liveRefreshPreview();
              }
            });
            titleFontModalGrid.appendChild(btn);
          });
          titleFontModal.hidden = false;
        }
        function closeTitleFontModal() {
          if (titleFontModal) titleFontModal.hidden = true;
        }
        ["designTitleFontTrigger", "designTitleFontTriggerText"].forEach(function (triggerId) {
          var trigger = document.getElementById(triggerId);
          if (trigger) trigger.addEventListener("click", openTitleFontModal);
        });
        if (titleFontModalClose) titleFontModalClose.addEventListener("click", closeTitleFontModal);
        if (titleFontModal) titleFontModal.addEventListener("click", function (e) { if (e.target === titleFontModal) closeTitleFontModal(); });
        if (titleFontModalBox) titleFontModalBox.addEventListener("click", function (e) { e.stopPropagation(); });
      })();
      var designPageFont = document.getElementById("designPageFont");
      if (designPageFont) designPageFont.addEventListener("change", function () {
        var p = getProfile();
        if (p && p.design) { p.design.pageFont = designPageFont.value; saveProfile(p); updateDesignRowValues(); liveRefreshPreview(); }
      });
      if (designThemePreview) designThemePreview.addEventListener("click", function () {
        if (designThemeGridWrap && designIntroMain) {
          designIntroMain.hidden = true;
          designThemeGridWrap.hidden = false;
        }
      });
      var designShuffleBtn = document.getElementById("designShuffleBtn");
      if (designShuffleBtn) designShuffleBtn.addEventListener("click", function () {
        var p = getProfile();
        if (!p) return;
        p.design = p.design || defaultProfile().design;
        var d = p.design;
        var arr = function (a) { return a[Math.floor(Math.random() * a.length)]; };
        d.headerLayout = arr(["classic", "hero"]);
        d.wallpaperStyle = arr(["fill", "gradient", "blur", "pattern", "image", "video"]);
        d.gradientPreset = Math.floor(Math.random() * GRADIENT_PRESETS.length);
        d.animateGradient = Math.random() > 0.6;
        d.noise = Math.random() > 0.7;
        d.buttonStyle = arr(["solid", "glass", "outline"]);
        d.cornerRoundness = arr(["square", "round", "rounder", "full"]);
        d.buttonShadow = arr(["none", "soft", "strong", "hard"]);
        d.pageFont = arr(["DM Sans", "Inter", "Playfair Display"]);
        saveProfile(p);
        updateDesignRowValues();
        document.querySelectorAll(".design-subpanel").forEach(function (panel) {
          if (!panel.hidden) syncDesignPanelFromProfile(panel.id);
        });
        liveRefreshPreview();
      });
      if (designSaveBtn) designSaveBtn.addEventListener("click", function () {
        var p = getProfile();
        if (p) saveProfile(p);
        liveRefreshPreview();
      });
      updateDesignRowValues();
      applyDesignConditionalVisibility();
    }

    function getProfilePreviewUrl() {
      var p = getProfile();
      var username = (p && p.username) || (currentUser && currentUser.username) || (dashboardUsername && dashboardUsername.value.trim()) || "my-profile";
      var slug = (username || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "my-profile";
      return getCanonicalOrigin() + "/" + slug;
    }
    function refreshDesignModalPreview() {
      if (!customDesignPreviewFrame || !customDesignPreviewFrame.src) return;
      var url = customDesignPreviewFrame.src;
      var sep = url.indexOf("?") >= 0 ? "&" : "?";
      customDesignPreviewFrame.src = url.split(/[?#]/)[0] + (url.indexOf("?") >= 0 ? url.substring(url.indexOf("?")) : "") + sep + "_=" + Date.now();
    }
    if (customDesignCard) {
      customDesignCard.addEventListener("click", function () {
        if (customDesignCard.dataset.premiumLock === "1") {
          alert("Upgrade to Premium to add your own design.");
          return;
        }
        if (customDesignModal) {
          customDesignModal.hidden = false;
          document.body.style.overflow = "hidden";
          if (customDesignPreviewFrame) {
            var previewUrl = (previewFrame && previewFrame.src && previewFrame.src.startsWith(window.location.origin + "/")) ? previewFrame.src : getProfilePreviewUrl();
            customDesignPreviewFrame.src = previewUrl;
            setTimeout(refreshDesignModalPreview, 100);
          }
        }
      });
    }
    if (customDesignModalClose) {
      customDesignModalClose.addEventListener("click", function () {
        if (customDesignModal) {
          customDesignModal.hidden = true;
          document.body.style.overflow = "";
        }
      });
    }
    if (customDesignModal) {
      customDesignModal.addEventListener("click", function (e) {
        if (e.target === customDesignModal) {
          customDesignModal.hidden = true;
          document.body.style.overflow = "";
        }
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && customDesignModal && !customDesignModal.hidden) {
          customDesignModal.hidden = true;
          document.body.style.overflow = "";
        }
      });
    }
    if (customDesignFile) {
      customDesignFile.addEventListener("change", function (e) {
        var file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) return;
        var r = new FileReader();
        r.onload = function () {
          var p = getProfile();
          p.customBackgroundImage = r.result;
          var promise = saveProfile(p);
          updateCustomDesignUI(p);
          renderDashboardThemes();
          if (promise && promise.then) promise.then(function () { refreshPreview(); refreshDesignModalPreview(); }).catch(function () {});
          else { refreshPreview(); refreshDesignModalPreview(); }
        };
        r.readAsDataURL(file);
      });
    }
    if (customDesignUrl) {
      customDesignUrl.addEventListener("change", function () {
        var url = customDesignUrl.value.trim();
        var p = getProfile();
        p.customBackgroundImage = url || null;
        var promise = saveProfile(p);
        updateCustomDesignUI(p);
        renderDashboardThemes();
        if (promise && promise.then) promise.then(function () { refreshPreview(); refreshDesignModalPreview(); }).catch(function () {});
        else { refreshPreview(); refreshDesignModalPreview(); }
      });
      customDesignUrl.addEventListener("input", function () {
        clearTimeout(window.customDesignUrlDebounce);
        window.customDesignUrlDebounce = setTimeout(function () {
          var url = customDesignUrl.value.trim();
          if (!url) return;
          var p = getProfile();
          p.customBackgroundImage = url;
          var promise = saveProfile(p);
          updateCustomDesignUI(p);
          renderDashboardThemes();
          if (promise && promise.then) promise.then(function () { refreshPreview(); refreshDesignModalPreview(); }).catch(function () {});
          else { refreshPreview(); refreshDesignModalPreview(); }
        }, 800);
      });
    }
    if (customDesignClear) {
      customDesignClear.addEventListener("click", function () {
        var p = getProfile();
        p.customBackgroundImage = null;
        var promise = saveProfile(p);
        updateCustomDesignUI(p);
        renderDashboardThemes();
        if (customDesignUrl) customDesignUrl.value = "";
        if (promise && promise.then) promise.then(function () { refreshPreview(); refreshDesignModalPreview(); }).catch(function () {});
        else { refreshPreview(); refreshDesignModalPreview(); }
      });
    }
    function setZoom(delta) {
      var p = getProfile();
      if (!p || !p.customBackgroundImage) return;
      var zoom = typeof p.customBackgroundZoom === "number" ? p.customBackgroundZoom : 100;
      zoom = Math.min(150, Math.max(70, zoom + delta));
      p.customBackgroundZoom = zoom;
      var promise = saveProfile(p);
      updateCustomDesignUI(p);
      if (promise && promise.then) promise.then(function () { refreshPreview(); }).catch(function () {});
      else refreshPreview();
    }
    if (customDesignZoomIn) customDesignZoomIn.addEventListener("click", function () { setZoom(10); refreshDesignModalPreview(); });
    if (customDesignZoomOut) customDesignZoomOut.addEventListener("click", function () { setZoom(-10); refreshDesignModalPreview(); });
    (function () {
      var frameEl = customDesignCutFrame;
      var editorEl = customDesignCutEditor;
      var dragging = false;
      var startClientX, startClientY, startLeftPct, startTopPct;
      var lastRefresh = 0;
      var REFRESH_THROTTLE = 100;

      function applyPositionFromFrame(leftPct, topPct) {
        var center = centerFromFramePosition(leftPct, topPct);
        var cx = Math.min(100, Math.max(0, center.x));
        var cy = Math.min(100, Math.max(0, center.y));
        var p = getProfile();
        if (!p) return;
        var posStr = percentToPosition(cx, cy);
        p.customBackgroundPosition = posStr;
        if (frameEl) {
          frameEl.style.left = leftPct + "%";
          frameEl.style.top = topPct + "%";
        }
        if (customDesignCutImage) customDesignCutImage.style.backgroundPosition = posStr;
        var now = Date.now();
        if (now - lastRefresh >= REFRESH_THROTTLE) {
          lastRefresh = now;
          refreshPreview();
          if (customDesignPreviewFrame && customDesignPreviewFrame.src) refreshDesignModalPreview();
        }
      }

      function onMove(clientX, clientY) {
        if (!dragging || !editorEl || !frameEl) return;
        var w = editorEl.offsetWidth || 1;
        var h = editorEl.offsetHeight || 1;
        var dx = clientX - startClientX;
        var dy = clientY - startClientY;
        var leftPct = startLeftPct + (dx / w) * 100;
        var topPct = startTopPct + (dy / h) * 100;
        leftPct = Math.max(-40, Math.min(90, leftPct));
        topPct = Math.max(-40, Math.min(90, topPct));
        applyPositionFromFrame(leftPct, topPct);
      }

      function onEnd() {
        if (!dragging) return;
        dragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onEnd);
        var p = getProfile();
        if (p) {
          var promise = saveProfile(p);
          if (promise && promise.then) promise.then(function () { refreshPreview(); refreshDesignModalPreview(); }).catch(function () {});
          else { refreshPreview(); refreshDesignModalPreview(); }
        }
      }

      function onMouseMove(e) { onMove(e.clientX, e.clientY); }
      function onTouchMove(e) {
        if (e.touches.length && dragging) {
          e.preventDefault();
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }
      function onTouchEnd(e) {
        if (dragging && (!e.touches || e.touches.length === 0)) onEnd();
      }

      function startDrag(clientX, clientY) {
        var p = getProfile();
        if (!p || !p.customBackgroundImage || !frameEl) return;
        var pos = positionToPercent(p.customBackgroundPosition || "center center");
        var fp = framePositionFromCenter(pos.x, pos.y);
        startClientX = clientX;
        startClientY = clientY;
        startLeftPct = fp.left;
        startTopPct = fp.top;
        dragging = true;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onEnd);
      }

      if (frameEl) {
        frameEl.addEventListener("mousedown", function (e) {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.clientX, e.clientY);
        });
        frameEl.addEventListener("touchstart", function (e) {
          if (e.touches.length) { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }
        }, { passive: false });
      }
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd, { passive: true });
      document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    })();

    if (dashboardAvatar && dashboardAvatarInput) {
      dashboardAvatar.addEventListener("click", () => dashboardAvatarInput.click());
      dashboardAvatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) return;
        const r = new FileReader();
        r.onload = () => {
          const p = getProfile();
          p.avatar = r.result;
          saveProfile(p);
          if (dashboardAvatarPreview) { dashboardAvatarPreview.src = p.avatar; dashboardAvatarPreview.hidden = false; }
          if (dashboardAvatar) dashboardAvatar.querySelector(".plus").style.display = "none";
        };
        r.readAsDataURL(file);
      });
    }

    dashboardBio.addEventListener("input", () => {
      dashboardBioCounter.textContent = dashboardBio.value.length + "/160";
    });

    function updateProfileLinkUrl() {
      const p = getProfile();
      const username = (dashboardUsername && dashboardUsername.value.trim()) || (currentUser && currentUser.username) || (p && p.username) || "my-profile";
      const slug = username.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "my-profile";
      const fullUrl = getCanonicalOrigin() + "/" + slug;
      const displayUrl = getDisplayHost() + "/" + slug;
      if (dashboardLinkUrl) { dashboardLinkUrl.value = displayUrl; dashboardLinkUrl.dataset.fullUrl = fullUrl; }
      if (sidebarLinkUrl) { sidebarLinkUrl.value = displayUrl; sidebarLinkUrl.dataset.fullUrl = fullUrl; }
      var subdomainDomain = getSubdomainDomain();
      if (profileSubdomainRow && dashboardLinkSubdomainUrl && subdomainDomain) {
        profileSubdomainRow.hidden = !slug || slug === "my-profile";
        if (slug && slug !== "my-profile") {
          dashboardLinkSubdomainUrl.value = slug + "." + subdomainDomain;
          dashboardLinkSubdomainUrl.dataset.fullUrl = "https://" + slug + "." + subdomainDomain;
        }
      }
    }

    if (dashboardUsername) {
      dashboardUsername.addEventListener("input", updateProfileLinkUrl);
      dashboardUsername.addEventListener("change", updateProfileLinkUrl);
    }

    if (sidebarCopyLink && sidebarLinkUrl) {
      sidebarCopyLink.addEventListener("click", () => {
        var toCopy = sidebarLinkUrl.dataset.fullUrl || sidebarLinkUrl.value;
        if (!toCopy) return;
        try {
          navigator.clipboard.writeText(toCopy);
          sidebarCopyLink.textContent = "✓";
          setTimeout(() => { sidebarCopyLink.textContent = "⎘"; }, 1500);
        } catch (e) { alert("Link: " + toCopy); }
      });
    }
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener("click", () => {
        var toCopy = dashboardLinkUrl && (dashboardLinkUrl.dataset.fullUrl || dashboardLinkUrl.value);
        if (!toCopy) return;
        try {
          navigator.clipboard.writeText(toCopy);
          copyLinkBtn.textContent = "Copied!";
          setTimeout(() => { copyLinkBtn.textContent = "Copy"; }, 2000);
        } catch (e) {
          alert("Link: " + toCopy);
        }
      });
    }
    var mobilePreviewCopy = document.getElementById("mobilePreviewCopy");
    if (mobilePreviewCopy) {
      mobilePreviewCopy.addEventListener("click", () => {
        var mpUrl = document.getElementById("mobilePreviewUrl");
        var toCopy = mpUrl && (mpUrl.dataset.fullUrl || mpUrl.value);
        if (!toCopy) return;
        try {
          navigator.clipboard.writeText(toCopy);
          mobilePreviewCopy.textContent = "✓";
          setTimeout(() => { mobilePreviewCopy.textContent = "⎘"; }, 1500);
        } catch (e) {}
      });
    }
    if (copySubdomainLinkBtn && dashboardLinkSubdomainUrl) {
      copySubdomainLinkBtn.addEventListener("click", () => {
        var toCopy = dashboardLinkSubdomainUrl.dataset.fullUrl || dashboardLinkSubdomainUrl.value;
        if (!toCopy) return;
        try {
          navigator.clipboard.writeText(toCopy);
          copySubdomainLinkBtn.textContent = "Copied!";
          setTimeout(() => { copySubdomainLinkBtn.textContent = "Copy"; }, 2000);
        } catch (e) {
          alert("Link: " + toCopy);
        }
      });
    }

    saveProfileBtn.addEventListener("click", () => {
      const p = getProfile();
      p.displayName = (dashboardDisplayName ? dashboardDisplayName.value.trim() : (p.displayName || (document.getElementById("designTitleInput") && document.getElementById("designTitleInput").value.trim()))) || "Name";
      const raw = dashboardUsername.value.trim();
      p.username = raw ? raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") : "";
      p.bio = dashboardBio.value.trim();
      var promise = saveProfile(p);
      if (promise && promise.then) {
        saveProfileBtn.disabled = true;
        promise.then(function () {
          if (currentUser) currentUser.username = p.username;
          if (dashboardUsername) dashboardUsername.value = p.username || "";
          updateProfileLinkUrl();
          if (typeof window.updateDashboardLinkDisplay === "function") window.updateDashboardLinkDisplay();
          refreshPreview();
          alert("Profile saved.");
        }).catch(function () {
          alert("Error saving. Check that the server is running.");
        }).then(function () {
          saveProfileBtn.disabled = false;
        });
      } else {
        if (dashboardUsername) dashboardUsername.value = p.username || "";
        updateProfileLinkUrl();
        if (typeof window.updateDashboardLinkDisplay === "function") window.updateDashboardLinkDisplay();
        refreshPreview();
        alert("Profile saved.");
      }
    });

    var liveSaveProfileTimer;
    function liveSaveProfileAndRefresh() {
      clearTimeout(liveSaveProfileTimer);
      liveSaveProfileTimer = setTimeout(function () {
        var p = getProfile();
        if (dashboardDisplayName) p.displayName = dashboardDisplayName.value.trim() || "Name";
        if (dashboardUsername) {
          var raw = dashboardUsername.value.trim();
          p.username = raw ? raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") : "";
        }
        if (dashboardBio) p.bio = dashboardBio.value.trim();
        saveProfile(p);
        if (currentUser) currentUser.username = p.username;
        updateProfileLinkUrl();
        if (typeof window.updateDashboardLinkDisplay === "function") window.updateDashboardLinkDisplay();
        liveRefreshPreview();
      }, 600);
    }
    if (dashboardDisplayName) { dashboardDisplayName.addEventListener("input", liveSaveProfileAndRefresh); dashboardDisplayName.addEventListener("change", liveSaveProfileAndRefresh); }
    if (dashboardBio) { dashboardBio.addEventListener("input", liveSaveProfileAndRefresh); dashboardBio.addEventListener("change", liveSaveProfileAndRefresh); }
    if (dashboardUsername) { dashboardUsername.addEventListener("input", liveSaveProfileAndRefresh); dashboardUsername.addEventListener("change", liveSaveProfileAndRefresh); }

    function toggleLinkFormFriendly() {
      var friendly = linkTypeFriendly && linkTypeFriendly.checked;
      var isSection = linkIsSection && linkIsSection.checked;
      if (linkFormNormal) linkFormNormal.hidden = !!friendly || !!isSection;
      if (linkFormFriendly) linkFormFriendly.hidden = !friendly || !!isSection;
      if (linkFormSectionTitle) linkFormSectionTitle.hidden = !isSection;
    }
    function enforcePremiumLinkOptions() {
      if (isPremium()) return;
      if (linkTypeFriendly && linkTypeFriendly.checked) { linkTypeFriendly.checked = false; alert("Upgrade to Premium for clickable image."); return; }
      if (linkHighlight && linkHighlight.checked) { linkHighlight.checked = false; alert("Upgrade to Premium for highlight."); return; }
      if (linkIsSection && linkIsSection.checked) { linkIsSection.checked = false; alert("Upgrade to Premium for section separator."); return; }
    }
    if (linkTypeFriendly) linkTypeFriendly.addEventListener("change", function () { enforcePremiumLinkOptions(); toggleLinkFormFriendly(); });
    if (linkIsSection) linkIsSection.addEventListener("change", function () { enforcePremiumLinkOptions(); toggleLinkFormFriendly(); });
    if (linkHighlight) linkHighlight.addEventListener("change", enforcePremiumLinkOptions);
    var addModal = document.getElementById("addModal");
    var addModalClose = document.getElementById("addModalClose");
    var addModalSearch = document.getElementById("addModalSearch");
    var addSuggestedList = document.getElementById("addSuggestedList");
    var addCategoryTitle = document.getElementById("addCategoryTitle");
    var ADD_SUGGESTED = [
      { icon: "instagram", name: "Instagram", desc: "Display your posts and reels", emoji: "📷" },
      { icon: "whatsapp", name: "WhatsApp", desc: "Chat link", emoji: "💬" },
      { icon: "tiktok", name: "TikTok", desc: "Share your TikToks", emoji: "🎵" },
      { icon: "youtube", name: "YouTube", desc: "Share YouTube videos", emoji: "▶️" },
      { icon: "spotify", name: "Spotify", desc: "Share your latest or favorite music", emoji: "🎧" },
      { icon: "email", name: "Email", desc: "Contact email", emoji: "✉️" },
      { icon: "facebook", name: "Facebook", desc: "Your Facebook", emoji: "📘" },
      { icon: "x", name: "X", desc: "X (Twitter)", emoji: "𝕏" },
      { icon: "soundcloud", name: "SoundCloud", desc: "Music and podcasts", emoji: "🎵" },
      { icon: "snapchat", name: "Snapchat", desc: "Snapchat profile", emoji: "👻" },
      { icon: "pinterest", name: "Pinterest", desc: "Pinterest board", emoji: "📌" },
      { icon: "steam", name: "Steam", desc: "Steam profile", emoji: "🎮" },
      { icon: "twitch", name: "Twitch", desc: "Your Twitch channel", emoji: "🎮" },
      { icon: "discord", name: "Discord", desc: "Invite to your server", emoji: "💬" },
      { icon: "telegram", name: "Telegram", desc: "Your Telegram profile", emoji: "✈️" },
      { icon: "website", name: "Custom / Image", desc: "Link or image", emoji: "🖼" },
    ];
    var ADD_CATEGORIES = {
      suggested: { title: "Suggested", items: ADD_SUGGESTED },
      social: { title: "Social", items: ADD_SUGGESTED.filter(function (x) { return ["instagram", "whatsapp", "tiktok", "facebook", "x", "discord", "telegram", "snapchat", "pinterest"].indexOf(x.icon) !== -1; }) },
      media: { title: "Media", items: ADD_SUGGESTED.filter(function (x) { return ["youtube", "spotify", "twitch", "soundcloud"].indexOf(x.icon) !== -1; }) },
      contact: { title: "Contact", items: ADD_SUGGESTED.filter(function (x) { return ["website", "telegram", "email"].indexOf(x.icon) !== -1; }) },
    };
    var editLinkModal = document.getElementById("editLinkModal");
    var editLinkModalClose = document.getElementById("editLinkModalClose");
    function addLinkFromModal(icon, title) {
      var p = getProfile();
      p.links = p.links || [];
      p.links.push({
        id: generateId(),
        title: title || "Link",
        url: "https://",
        highlight: false,
        icon: icon || "",
        type: "link",
      });
      saveProfile(p);
      renderLinkList();
      liveRefreshPreview();
    }
    function addSectionFromModal(title) {
      var p = getProfile();
      p.links = p.links || [];
      p.links.push({
        id: generateId(),
        title: title || "Section",
        url: "#",
        highlight: false,
        type: "section",
        section: title || "Section",
      });
      saveProfile(p);
      renderLinkList();
      liveRefreshPreview();
    }
    function openLinkFormWithPrefill(options) {
      options = options || {};
      editingLinkId = null;
      linkTitle.value = options.title || "";
      linkUrl.value = options.url || "";
      linkHighlight.checked = false;
      if (linkTypeFriendly) linkTypeFriendly.checked = false;
      if (linkIsSection) linkIsSection.checked = !!options.isSection;
      if (linkSectionTitle) linkSectionTitle.value = options.isSection ? (options.title || "Section") : "";
      if (linkImageUrl) linkImageUrl.value = "";
      if (linkFriendlyUrl) linkFriendlyUrl.value = "";
      if (linkIcon) linkIcon.value = options.icon || "";
      toggleLinkFormFriendly();
      var editTitleEl = document.getElementById("editLinkModalTitle");
      if (editTitleEl) editTitleEl.textContent = "Add link";
      if (editLinkModal) {
        editLinkModal.hidden = false;
        document.body.style.overflow = "hidden";
      }
    }
    function closeEditLinkModal() {
      if (editLinkModal) {
        editLinkModal.hidden = true;
        document.body.style.overflow = "";
      }
      editingLinkId = null;
    }
    function renderAddSuggested(categoryKey) {
      var cat = ADD_CATEGORIES[categoryKey] || ADD_CATEGORIES.suggested;
      if (addCategoryTitle) addCategoryTitle.textContent = cat.title;
      if (!addSuggestedList) return;
      addSuggestedList.className = "add-suggested-grid";
      addSuggestedList.innerHTML = "";
      cat.items.forEach(function (item) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "add-suggested-circle";
        btn.dataset.icon = item.icon;
        btn.dataset.name = item.name;
        btn.setAttribute("aria-label", item.name);
        var logoUrl = item.icon && platformLogoUrl(item.icon);
        if (logoUrl) {
          btn.innerHTML = "<img src=\"" + logoUrl + "\" alt=\"\" class=\"add-suggested-circle-logo\" loading=\"lazy\" />";
        } else {
          btn.innerHTML = "<span class=\"add-suggested-circle-emoji\">" + (item.emoji || "🔗") + "</span>";
        }
        btn.addEventListener("click", function () {
          if (addModal) addModal.hidden = true;
          addLinkFromModal(item.icon, item.name);
        });
        li.appendChild(btn);
        addSuggestedList.appendChild(li);
      });
    }
    addLinkBtn.addEventListener("click", function () {
      if (addModal) {
        addModal.hidden = false;
        if (addModalSearch) addModalSearch.value = "";
        document.querySelectorAll(".add-type-card").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.addType === "link" ? "true" : "false"); });
        document.querySelectorAll(".add-category").forEach(function (c) { c.classList.toggle("is-active", c.dataset.category === "suggested"); });
        renderAddSuggested("suggested");
      } else {
        openLinkFormWithPrefill();
      }
    });
    if (addModalClose) addModalClose.addEventListener("click", function () { if (addModal) addModal.hidden = true; });
    if (addModal) addModal.addEventListener("click", function (e) { if (e.target === addModal) addModal.hidden = true; });
    if (editLinkModalClose) editLinkModalClose.addEventListener("click", closeEditLinkModal);
    if (editLinkModal) editLinkModal.addEventListener("click", function (e) { if (e.target === editLinkModal) closeEditLinkModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && editLinkModal && !editLinkModal.hidden) closeEditLinkModal(); });
    var addCollectionBtn = document.getElementById("addCollectionBtn");
    var viewArchiveBtn = document.getElementById("viewArchiveBtn");
    if (addCollectionBtn) addCollectionBtn.addEventListener("click", function () { /* Add collection – placeholder */ });
    if (viewArchiveBtn) viewArchiveBtn.addEventListener("click", function () { /* View archive – placeholder */ });
    document.querySelectorAll(".add-type-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".add-type-card").forEach(function (c) { c.setAttribute("aria-pressed", c === btn ? "true" : "false"); });
        var type = btn.dataset.addType;
        if (addModal) addModal.hidden = true;
        if (type === "section") addSectionFromModal("Section");
        else openLinkFormWithPrefill();
      });
    });
    document.querySelectorAll(".add-category").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".add-category").forEach(function (c) { c.classList.remove("is-active"); });
        btn.classList.add("is-active");
        renderAddSuggested(btn.dataset.category || "suggested");
      });
    });
    if (addModalSearch) {
      addModalSearch.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { if (addModal) addModal.hidden = true; }
      });
      addModalSearch.addEventListener("input", function () {
        var q = (addModalSearch.value || "").trim().toLowerCase();
        if (!q) { var active = document.querySelector(".add-category.is-active"); renderAddSuggested(active ? (active.dataset.category || "suggested") : "suggested"); return; }
        var filtered = ADD_SUGGESTED.filter(function (x) { return (x.name + " " + (x.desc || "")).toLowerCase().indexOf(q) !== -1; });
        if (addCategoryTitle) addCategoryTitle.textContent = "Search";
        if (!addSuggestedList) return;
        addSuggestedList.className = "add-suggested-grid";
        addSuggestedList.innerHTML = "";
        filtered.forEach(function (item) {
          var li = document.createElement("li");
          var b = document.createElement("button");
          b.type = "button";
          b.className = "add-suggested-circle";
          b.setAttribute("aria-label", item.name);
          var logoUrl = item.icon && platformLogoUrl(item.icon);
          if (logoUrl) {
            b.innerHTML = "<img src=\"" + logoUrl + "\" alt=\"\" class=\"add-suggested-circle-logo\" loading=\"lazy\" />";
          } else {
            b.innerHTML = "<span class=\"add-suggested-circle-emoji\">" + (item.emoji || "🔗") + "</span>";
          }
          b.addEventListener("click", function () { if (addModal) addModal.hidden = true; addLinkFromModal(item.icon, item.name); });
          li.appendChild(b);
          addSuggestedList.appendChild(li);
        });
      });
    }
    linkFormCancel.addEventListener("click", closeEditLinkModal);
    linkFormSave.addEventListener("click", () => {
      var friendly = linkTypeFriendly && linkTypeFriendly.checked;
      var isSection = linkIsSection && linkIsSection.checked;
      var title, url, imageUrl, icon;
      if (isSection) {
        title = (linkSectionTitle && linkSectionTitle.value.trim()) || "Section";
        url = "#";
        imageUrl = undefined;
        icon = "";
      } else if (friendly) {
        imageUrl = (linkImageUrl && linkImageUrl.value.trim()) || "";
        url = (linkFriendlyUrl && linkFriendlyUrl.value.trim()) || "";
        if (!imageUrl || !url) {
          alert("Enter the image URL and link on click.");
          return;
        }
        title = "Image";
        icon = "";
      } else {
        title = linkTitle.value.trim();
        url = linkUrl.value.trim();
        if (!title || !url) {
          alert("Enter title and URL.");
          return;
        }
        icon = (linkIcon && linkIcon.value) || "";
      }
      const p = getProfile();
      p.links = p.links || [];
      if (editingLinkId) {
        const link = p.links.find((l) => l.id === editingLinkId);
        if (link) {
          link.title = title;
          link.url = url;
          link.highlight = isSection ? false : linkHighlight.checked;
          link.icon = icon;
          link.imageUrl = friendly ? imageUrl : undefined;
          if (isSection) { link.type = "section"; link.section = title; }
          else if (friendly) { link.type = "image"; link.section = undefined; }
          else { delete link.type; delete link.section; }
        }
      } else {
        p.links.push({
          id: generateId(),
          title,
          url: isSection ? "#" : url,
          highlight: isSection ? false : linkHighlight.checked,
          icon: icon,
          imageUrl: friendly ? imageUrl : undefined,
          type: isSection ? "section" : (friendly ? "image" : "link"),
          section: isSection ? title : undefined,
        });
      }
      saveProfile(p);
      closeEditLinkModal();
      renderLinkList();
      liveRefreshPreview();
    });

    function activateDashboardTab(hash) {
    var name = (hash && hash.slice(1)) || "links";
    if (name === "platforms") { name = "links"; if (window.history && window.history.replaceState) window.history.replaceState(null, "", "#links"); }
    const panelId = "panel" + name.charAt(0).toUpperCase() + name.slice(1);
    document.querySelectorAll(".sidebar-tab").forEach((t) => {
      t.classList.toggle("is-active", t.getAttribute("href") === "#" + name);
    });
    document.querySelectorAll(".dashboard-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === panelId);
    });
    var layout = document.querySelector(".dashboard-layout");
    if (layout) layout.classList.toggle("preview-half", panelId === "panelTheme");
    if (panelId === "panelTheme") {
      var intro = document.getElementById("designIntro");
      var introMain = document.querySelector(".design-intro-main");
      var wrap = document.querySelector(".design-theme-grid-wrap");
      if (intro) intro.hidden = false;
      if (introMain) introMain.hidden = false;
      document.querySelectorAll(".design-subpanel").forEach(function (p) { p.hidden = true; });
      if (wrap) wrap.hidden = true;
    }
    if (panelId === "panelLink") updateQrcodePanel();
  }

  function refreshPreview() {
    if (!previewFrame || !previewFrame.src) return;
    var url = previewFrame.src;
    var sep = url.indexOf("?") >= 0 ? "&" : "?";
    previewFrame.src = url.split(/[?#]/)[0] + (url.indexOf("?") >= 0 ? url.substring(url.indexOf("?")) : "") + sep + "_=" + Date.now();
  }

  var liveRefreshPreviewTimer;
  function liveRefreshPreview() {
    clearTimeout(liveRefreshPreviewTimer);
    liveRefreshPreviewTimer = setTimeout(refreshPreview, 450);
  }
  try { window.__taplyLiveRefresh = liveRefreshPreview; } catch (e) {}

  window.addEventListener("hashchange", () => activateDashboardTab(window.location.hash));

    function getProfileUrl() {
      var p = getProfile();
      var un = (p && p.username) || (dashboardUsername && dashboardUsername.value.trim()) || "";
      var slug = (un || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "my-profile";
      return getCanonicalOrigin() + "/" + slug;
    }

    function updateQrcodePanel() {
      var box = document.getElementById("qrcodeBox");
      var placeholder = document.getElementById("qrcodePlaceholder");
      var canvas = document.getElementById("qrcodeCanvas");
      var img = document.getElementById("qrcodeImage");
      var actions = document.getElementById("qrcodeActions");
      var downloadBtn = document.getElementById("qrcodeDownload");
      var copyBtn = document.getElementById("qrcodeCopy");
      if (!box || !placeholder) return;
      var url = getProfileUrl();
      if (!url || url.indexOf("my-profile") >= 0) {
        placeholder.hidden = false;
        placeholder.innerHTML = "<p>Save your profile with a username to generate QR.</p>";
        if (img) img.hidden = true;
        if (canvas) canvas.hidden = true;
        if (actions) actions.hidden = true;
        return;
      }
      var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=" + encodeURIComponent(url);
      if (img) {
        img.src = qrUrl;
        img.hidden = false;
      }
      if (placeholder) placeholder.hidden = true;
      if (canvas) canvas.hidden = true;
      if (actions) actions.hidden = false;
      if (downloadBtn) {
        downloadBtn.href = qrUrl;
        downloadBtn.download = "taply-qr.png";
        downloadBtn.onclick = function (e) {
          e.preventDefault();
          var a = document.createElement("a");
          a.href = qrUrl;
          a.download = "taply-qr.png";
          a.click();
        };
      }
      if (copyBtn) {
        copyBtn.onclick = function () {
          navigator.clipboard.writeText(url).then(function () { alert("Link copied!"); }).catch(function () {});
        };
      }
    }

    function renderSectionsPanel() {
      var list = document.getElementById("sectionsList");
      if (!list) return;
      var p = getProfile();
      var links = p && p.links || [];
      var sections = links.filter(function (l) { return l.type === "section"; });
      if (sections.length === 0) {
        list.innerHTML = "<p class='muted'>No sections. Add a link and check „Section separator”.</p>";
        return;
      }
      list.innerHTML = sections.map(function (s, i) {
        return "<div class='section-list-item'><span class='section-list-icon'>📂</span><span>" + escapeHtml(s.title) + "</span></div>";
      }).join("");
    }

    function renderShortenerPanel() {
      var addWrap = document.getElementById("shortenerAdd");
      var list = document.getElementById("shortenerList");
      var slugInput = document.getElementById("shortenerSlug");
      var targetInput = document.getElementById("shortenerTarget");
      var addBtn = document.getElementById("shortenerAddBtn");
      if (!list || !addBtn) return;
      var p = getProfile();
      p.shortLinks = p.shortLinks || {};
      var baseUrl = getCanonicalOrigin() + "/go/" + ((p.username || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "user") + "/";
      function refresh() {
        var sl = p.shortLinks || {};
        var keys = Object.keys(sl);
        if (keys.length === 0) {
          list.innerHTML = "<p class='muted'>No short links. Add below.</p>";
        } else {
          list.innerHTML = keys.map(function (k) {
            var full = baseUrl + k;
            var target = (sl[k] || "");
            var targetDisplay = target.length > 45 ? target.substring(0, 45) + "…" : target;
            return "<div class='shortener-item'><span class='shortener-slug'>/" + escapeHtml(k) + "</span> → <span class='shortener-target'>" + escapeHtml(targetDisplay) + "</span> <button type='button' class='ghost shortener-copy' data-url='" + escapeHtml(full) + "' title='Copy'>⎘</button> <button type='button' class='ghost shortener-remove' data-slug='" + escapeHtml(k) + "' title='Delete'>×</button></div>";
          }).join("");
          list.querySelectorAll(".shortener-copy").forEach(function (btn) {
            btn.onclick = function () { navigator.clipboard.writeText(btn.dataset.url); };
          });
          list.querySelectorAll(".shortener-remove").forEach(function (btn) {
            btn.onclick = function () {
              delete p.shortLinks[btn.dataset.slug];
              saveProfile(p);
              renderShortenerPanel();
            };
          });
        }
      }
      refresh();
      if (addBtn && slugInput && targetInput) {
        addBtn.onclick = function () {
          var slug = (slugInput.value || "").toLowerCase().replace(/[^a-z0-9-_]/g, "");
          var target = (targetInput.value || "").trim();
          if (!slug || !target) { alert("Enter slug and URL."); return; }
          p.shortLinks[slug] = target;
          saveProfile(p);
          slugInput.value = "";
          targetInput.value = "";
          refresh();
        };
      }
    }
  }

  function renderLinkList() {
    const profile = getProfile();
    if (!profile || !linkList) return;
    const links = profile.links || [];
    const analytics = getAnalytics();
    const clicks = analytics.linkClicks || {};
    linkList.innerHTML = "";
    links.forEach((link, index) => {
      const isSection = link.type === "section";
      const card = document.createElement("div");
      card.className = "link-card" + (isSection ? " link-card-section" : "");
      card.dataset.linkId = link.id;
      card.draggable = true;
      card.dataset.index = String(index);
      const clickCount = clicks[link.id] || 0;
      const isInstagram = (link.icon || "").toLowerCase() === "instagram" || (link.title || "").toLowerCase().indexOf("instagram") !== -1;
      if (isSection) {
        card.innerHTML = `
          <div class="link-card-inner">
            <div class="link-card-left">
              <button type="button" class="link-card-handle" aria-label="Reorder">⋮⋮</button>
              <div class="link-card-body">
                <div class="link-card-title-row">
                  <span class="link-card-title">${escapeHtml(link.title || link.section || "Section")}</span>
                  <button type="button" class="link-card-edit" title="Edit">✎</button>
                </div>
              </div>
            </div>
            <div class="link-card-right">
              <button type="button" class="link-card-edit" title="Edit">✎</button>
              <button type="button" class="btn-delete-card" title="Delete">🗑</button>
            </div>
          </div>
        `;
        var editBtns = card.querySelectorAll(".link-card-edit");
        editBtns.forEach(function (btn) { btn.addEventListener("click", openEdit); });
      } else {
        card.innerHTML = `
          <div class="link-card-inner">
            <div class="link-card-left">
              <button type="button" class="link-card-handle" aria-label="Reorder">⋮⋮</button>
              <div class="link-card-body">
                <div class="link-card-title-row">
                  <span class="link-card-title">${escapeHtml(link.title)}</span>
                  <button type="button" class="link-card-edit link-card-edit-title" title="Edit">✎</button>
                </div>
                <div class="link-card-url-row">
                  <span class="link-card-url-text">URL</span>
                  <button type="button" class="link-card-edit link-card-edit-url" title="Edit URL">✎</button>
                </div>
                <div class="link-card-meta">
                  <span class="link-card-meta-icons">
                    <span class="link-card-meta-icon" title="Video">▶</span>
                    <span class="link-card-meta-icon" title="Image">▢</span>
                    <button type="button" class="link-card-meta-icon link-card-star" title="Highlight">${link.highlight ? "★" : "☆"}</button>
                    <span class="link-card-meta-icon" title="Schedule">🕐</span>
                    <span class="link-card-meta-icon" title="Privacy">🔒</span>
                    <span class="link-card-meta-icon link-card-chart" title="Stats">📊</span>
                  </span>
                  <span class="link-card-clicks">${clickCount} clicks</span>
                </div>
              </div>
            </div>
            <div class="link-card-right">
              <button type="button" class="link-card-share" title="Share">↗</button>
              <label class="link-card-toggle-wrap"><input type="checkbox" class="link-card-toggle" ${link.highlight ? "checked" : ""} aria-label="Visible" /><span class="link-card-toggle-slider"></span></label>
              <button type="button" class="btn-delete-card" title="Delete">🗑</button>
            </div>
          </div>
          ${isInstagram ? '<div class="link-card-connect-instagram">Looking for a more visual display? Connect your Instagram <span class="link-card-connect-info" title="Connect Instagram">ⓘ</span></div>' : ""}
        `;
        var starBtn = card.querySelector(".link-card-star");
        if (starBtn) starBtn.addEventListener("click", function () {
          const p = getProfile();
          const l = (p.links || []).find(function (x) { return x.id === link.id; });
          if (l) {
            l.highlight = !l.highlight;
            saveProfile(p);
            renderLinkList();
            liveRefreshPreview();
          }
        });
        var toggleInput = card.querySelector(".link-card-toggle");
        if (toggleInput) toggleInput.addEventListener("change", function () {
          const p = getProfile();
          const l = (p.links || []).find(function (x) { return x.id === link.id; });
          if (l) {
            l.highlight = !!toggleInput.checked;
            saveProfile(p);
            liveRefreshPreview();
          }
        });
        card.querySelector(".link-card-edit-title, .link-card-edit-url").addEventListener("click", openEdit);
      }
      function openEdit() {
        editingLinkId = link.id;
        var friendly = (link.type === "image" || !!link.imageUrl) && link.type !== "section";
        var isSec = link.type === "section";
        if (linkTypeFriendly) linkTypeFriendly.checked = friendly;
        if (linkIsSection) linkIsSection.checked = isSec;
        if (linkTitle) linkTitle.value = isSec ? "" : (link.title || "");
        if (linkUrl) linkUrl.value = isSec ? "" : (link.url || "");
        if (linkSectionTitle) linkSectionTitle.value = isSec ? (link.title || link.section || "") : "";
        if (linkHighlight) linkHighlight.checked = !!link.highlight;
        if (linkIcon) linkIcon.value = link.icon || "";
        if (linkImageUrl) linkImageUrl.value = link.imageUrl || "";
        if (linkFriendlyUrl) linkFriendlyUrl.value = link.url || "";
        toggleLinkFormFriendly();
        var editTitleEl = document.getElementById("editLinkModalTitle");
        if (editTitleEl) editTitleEl.textContent = "Edit link";
        if (editLinkModal) { editLinkModal.hidden = false; document.body.style.overflow = "hidden"; }
      }
      card.querySelector(".btn-delete-card").addEventListener("click", function () {
        const p = getProfile();
        p.links = (p.links || []).filter((l) => l.id !== link.id);
        saveProfile(p);
        renderLinkList();
        renderAnalytics();
        liveRefreshPreview();
      });
      linkList.appendChild(card);
    });
    setupLinkDragDrop(linkList);
    if (linkList.classList.contains("link-list")) linkList.classList.remove("link-list");
    if (!linkList.classList.contains("link-cards")) linkList.classList.add("link-cards");
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function setupLinkDragDrop(container) {
    if (!container) return;
    var draggedId = null;
    container.querySelectorAll(".link-card").forEach(function (card) {
      card.addEventListener("dragstart", function (e) {
        draggedId = card.dataset.linkId;
        e.dataTransfer.setData("text/plain", draggedId);
        e.dataTransfer.effectAllowed = "move";
        card.classList.add("link-card-dragging");
      });
      card.addEventListener("dragend", function () {
        card.classList.remove("link-card-dragging");
        draggedId = null;
      });
      card.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedId && card.dataset.linkId !== draggedId) {
          card.classList.add("link-card-drag-over");
        }
      });
      card.addEventListener("dragleave", function () {
        card.classList.remove("link-card-drag-over");
      });
      card.addEventListener("drop", function (e) {
        e.preventDefault();
        card.classList.remove("link-card-drag-over");
        var targetId = card.dataset.linkId;
        if (!draggedId || draggedId === targetId) return;
        var p = getProfile();
        var links = p.links || [];
        var fromIdx = links.findIndex(function (l) { return l.id === draggedId; });
        var toIdx = links.findIndex(function (l) { return l.id === targetId; });
        if (fromIdx < 0 || toIdx < 0) return;
        var item = links.splice(fromIdx, 1)[0];
        links.splice(toIdx, 0, item);
        p.links = links;
        saveProfile(p);
        renderLinkList();
        if (window.__taplyLiveRefresh) window.__taplyLiveRefresh();
      });
    });
  }

  function renderAnalytics() {
    const analytics = getAnalytics();
    statPageViews.textContent = analytics.pageViews;
    const clicks = analytics.linkClicks || {};
    const profile = getProfile();
    const links = profile?.links || [];
    analyticsClicks.innerHTML = "";
    if (links.length === 0) {
      analyticsClicks.innerHTML = "<p class='muted'>Add links to see clicks.</p>";
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "analytics-link-list";
    links.forEach((link) => {
      const count = clicks[link.id] || 0;
      const li = document.createElement("li");
      li.innerHTML = `<span>${escapeHtml(link.title)}</span> <strong>${count}</strong> clicks`;
      ul.appendChild(li);
    });
    analyticsClicks.appendChild(ul);
  }

  function suggestUsernameFromEmail(email) {
    if (!email || !email.indexOf) return "";
    var part = email.split("@")[0] || "";
    return part.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30) || "";
  }

  function initUsername() {
    var base = (getCanonicalOrigin() || "https://taply.ro").replace(/\/$/, "");
    if (usernamePrefix) usernamePrefix.textContent = base + "/";
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const suggested = suggestUsernameFromEmail(emailParam);
    if (usernameInput) {
      usernameInput.value = suggested;
      usernameInput.placeholder = "your-username";
    }
    if (usernameContinue) {
      usernameContinue.addEventListener("click", function () {
        const raw = usernameInput.value.trim();
        const slug = raw ? raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") : "";
        if (!slug) {
          usernameInput.focus();
          return;
        }
        try {
          sessionStorage.setItem(PENDING_USERNAME_KEY, slug);
        } catch (err) {}
        showView("onboarding");
        initOnboarding();
      });
    }
  }

  function init() {
    if (typeof window !== "undefined" && window.location && window.location.protocol === "file:") {
      var app = document.getElementById("app");
      if (app) {
        app.innerHTML = "<div style=\"padding: 24px; max-width: 400px; margin: 40px auto; text-align: center; font-family: system-ui, sans-serif;\"><h2 style=\"margin: 0 0 12px;\">Deschide prin server</h2><p style=\"color: #666; margin: 0 0 16px;\">Rulează în terminal: <code style=\"background: #eee; padding: 4px 8px; border-radius: 4px;\">npm start</code> sau <code style=\"background: #eee; padding: 4px 8px; border-radius: 4px;\">./start.sh</code>, apoi deschide în browser: <strong>http://localhost:8001</strong></p><a href=\"#\" onclick=\"location.reload(); return false;\" style=\"color: var(--primary, #6366f1);\">Reîncarcă</a></div>";
        app.style.display = "block";
      }
      return;
    }
    var supabase = getSupabase();
    if (supabase) {
      // După Google OAuth, Supabase redirecționează la /dashboard#access_token=... – dacă e hash OAuth, așteptăm puțin ca sesiunea să fie setată
      var hasAuthHash = (window.location.hash || "").indexOf("access_token") !== -1;
      function runSupabaseInit() {
        supabase.auth.getSession().then(function (sessionResult) {
          var session = sessionResult.data && sessionResult.data.session;
          if (!session || !session.user) {
            try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
            var profile = getProfile();
            var params = new URLSearchParams(window.location.search);
            var emailParam = params.get("email");
            if (profile) {
              showView("dashboard");
              initDashboard();
            } else if (emailParam) {
              try { sessionStorage.setItem(PENDING_EMAIL_KEY, emailParam); } catch (err) {}
              showView("username");
              initUsername();
            } else {
              window.location.href = "/login";
            }
            return;
          }
          if (hasAuthHash && window.history && window.history.replaceState) {
            try { window.history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) {}
          }
          function setCurrentUserFromRow(row, planDefault) {
            var plan = (row && row.plan ? row.plan : planDefault || "free").toString().toLowerCase();
            currentUser = {
              id: session.user.id,
              email: session.user.email || "",
              username: (row && row.username) || "",
              profile: (row && row.profile) || {},
              analytics: (row && row.analytics) ? row.analytics : { pageViews: 0, linkClicks: {} },
              plan: plan,
            };
            updatePlanPillDisplay();
          }
          function loadProfileWithPlan() {
            // Un singur request, fără plan – încarcă mai repede; plan = free, după plată ?premium=success îl setăm
            var cols = "username, profile, analytics";
            return supabase.from("profiles").select(cols).eq("id", session.user.id).single().then(function (result) {
          if (result.error || !result.data) {
            var meta = session.user.user_metadata || {};
            var username = (meta.username || (session.user.email || "").split("@")[0] || "user").toString().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "user";
            var newProfile = defaultProfile();
            newProfile.displayName = meta.full_name || meta.name || meta.user_name || (session.user.email || "").split("@")[0] || "";
            if (meta.avatar_url) newProfile.avatar = meta.avatar_url;
            supabase.from("profiles").insert({
              id: session.user.id,
              username: username,
              profile: newProfile,
              analytics: defaultAnalytics(),
            }).then(function (insertRes) {
              if (insertRes.error) {
                var un = username + "_" + Math.random().toString(36).slice(2, 8);
                supabase.from("profiles").insert({ id: session.user.id, username: un, profile: newProfile, analytics: defaultAnalytics() }).then(function (r2) {
                  if (r2.error) { window.location.href = "/login"; return; }
                  setCurrentUserFromRow(null, "free");
                  currentUser.username = un;
                  currentUser.profile = newProfile;
                  currentUser.analytics = defaultAnalytics();
                  showView("onboarding");
                  initOnboarding();
                });
                return;
              }
              setCurrentUserFromRow(null, "free");
              currentUser.username = username;
              currentUser.profile = newProfile;
              currentUser.analytics = defaultAnalytics();
              showView("onboarding");
              initOnboarding();
            });
            return;
          }
          var row = result.data;
          setCurrentUserFromRow(row, "free");
          try { if (sessionStorage.getItem(TEST_PREMIUM_KEY)) { currentUser.plan = "premium"; updatePlanPillDisplay(); } } catch (e) {}
          if (window.location.search && window.location.search.indexOf("premium=success") !== -1) {
            currentUser.plan = "premium";
            updatePlanPillDisplay();
            if (window.history && window.history.replaceState) {
              try { window.history.replaceState(null, "", window.location.pathname + (window.location.search.replace(/\?premium=success&?|&?premium=success/, "") || "?").replace(/\?$/, "") || window.location.search); } catch (e) {}
            }
          }
          var profile = currentUser.profile;
          var needsOnboarding = !profile.displayName && (!profile.links || profile.links.length === 0);
          if (needsOnboarding) {
            showView("onboarding");
            initOnboarding();
          } else {
            showView("dashboard");
            initDashboard();
          }
            }).catch(function (err) {
              throw err;
            });
          }
          loadProfileWithPlan().catch(function (err) {
            var msg = (err && err.message) ? String(err.message) : "";
            if (msg.indexOf("fetch") !== -1 || msg.indexOf("Network") !== -1) {
              alert("Conexiune eșuată. Verifică internetul și că serverul rulează (npm start), apoi reîncarcă.");
            }
            window.location.href = "/login";
          });
        }).catch(function (err) {
          var msg = (err && err.message) ? String(err.message) : "";
          if (msg.indexOf("fetch") !== -1 || msg.indexOf("Network") !== -1) {
            alert("Connection failed. Check your internet and that the server is running (./start.sh), then reload.");
          }
          window.location.href = "/login";
        });
      }
      if (hasAuthHash) setTimeout(runSupabaseInit, 80); else runSupabaseInit();
      return;
    }

    const token = getToken();
    if (token) {
      var apiOrigin = window.location.origin;
      if (!apiOrigin || apiOrigin === "null" || apiOrigin.indexOf("file") === 0) {
        window.location.href = "/login";
        return;
      }
      fetch(apiOrigin + "/api/me", { headers: apiHeaders() })
        .then((r) => {
          if (!r.ok) {
            try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
            window.location.href = "/login";
            return null;
          }
          return r.json();
        })
        .then((data) => {
          if (!data) return;
          currentUser = data;
          const profile = data.profile || {};
          const needsOnboarding = !profile.displayName && (!profile.links || profile.links.length === 0);
          if (needsOnboarding) {
            showView("onboarding");
            initOnboarding();
          } else {
            showView("dashboard");
            initDashboard();
          }
        })
        .catch(function (err) {
          var msg = (err && err.message) ? String(err.message) : "";
          var isLocal = window.location.protocol === "file:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          if ((msg.indexOf("fetch") !== -1 || msg.indexOf("Network") !== -1) && isLocal) {
            alert("Connection failed. Start the server (./start.sh) and open the app at http://localhost:8001/dashboard");
          }
          try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
          window.location.href = "/login";
        });
      return;
    }
    const profile = getProfile();
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (profile) {
      showView("dashboard");
      initDashboard();
    } else if (emailParam) {
      try { sessionStorage.setItem(PENDING_EMAIL_KEY, emailParam); } catch (err) {}
      showView("username");
      initUsername();
    } else {
      window.location.href = "/login";
    }
  }

  init();
})();
