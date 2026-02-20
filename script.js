(function () {
  const STORAGE_KEY = "taply_profile";
  const ANALYTICS_KEY = "taply_analytics";
  const TOKEN_KEY = "taply_token";
  const MAX_PLATFORMS = 5;

  let currentUser = null;

  function getSupabase() {
    if (typeof window === "undefined") return null;
    var c = window.TaplySupabase;
    if (!c || !c.url || !c.anonKey || !window.supabase) return null;
    return window.supabase.createClient(c.url, c.anonKey);
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
  ];

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
    return profile;
  }

  function saveProfile(profile) {
    if (currentUser) {
      currentUser.profile = profile;
      var supabase = getSupabase();
      if (supabase && currentUser.id) {
        return supabase.from("profiles").update({ profile: profile }).eq("id", currentUser.id).then(function (r) { if (r.error) throw new Error(r.error.message); return r; }).catch(function () {});
      }
      const token = getToken();
      if (token) {
        return fetch(window.location.origin + "/api/me", {
          method: "PUT",
          headers: apiHeaders(),
          body: JSON.stringify({ profile: profile }),
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
  const statPageViews = document.getElementById("statPageViews");
  const analyticsClicks = document.getElementById("analyticsClicks");
  const previewFrame = document.getElementById("previewFrame");
  const dashboardLinkUrlPreview = document.getElementById("dashboardLinkUrlPreview");
  const copyLinkBtnPreview = document.getElementById("copyLinkBtnPreview");
  const setupProgress = document.getElementById("setupProgress");
  const sidebarUsername = document.getElementById("sidebarUsername");
  const sidebarAvatarImg = document.getElementById("sidebarAvatarImg");
  const linksStripAvatarImg = document.getElementById("linksStripAvatarImg");
  const linksStripSocial = document.getElementById("linksStripSocial");

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
    THEMES.forEach((t) => {
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

  function renderDashboardPlatforms() {
    const profile = getProfile();
    if (!profile) return;
    var list = profile.socialLinks || [];
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

  var socialUrlInputDebounce = {};
  function renderSocialUrls() {
    const profile = getProfile();
    if (!profile) return;
    var links = profile.socialLinks || [];
    var labelEl = document.getElementById("socialUrlsLabel");
    if (labelEl) labelEl.hidden = links.length === 0;
    socialUrls.innerHTML = "";
    if (links.length === 0) return;
    const wrap = document.createElement("div");
    wrap.className = "social-urls-grid";
    links.forEach((entry, index) => {
      var key = entry.platform || "website";
      var platformName = platformLabels[key] || key;
      const row = document.createElement("div");
      row.className = "social-url-row";
      const labelWrap = document.createElement("div");
      labelWrap.className = "social-url-row-label-wrap";
      const icon = document.createElement("span");
      icon.className = "social-url-icon";
      icon.setAttribute("aria-hidden", "true");
      var logoUrl = platformLogoUrl(key);
      if (logoUrl) {
        var img = document.createElement("img");
        img.src = logoUrl;
        img.alt = "";
        img.className = "social-url-logo";
        img.setAttribute("loading", "lazy");
        icon.appendChild(img);
      } else {
        icon.textContent = platformName.charAt(0);
      }
      const rowLabel = document.createElement("span");
      rowLabel.className = "social-url-row-label";
      rowLabel.textContent = platformName + " – Profile URL";
      labelWrap.appendChild(icon);
      labelWrap.appendChild(rowLabel);
      row.appendChild(labelWrap);
      const input = document.createElement("input");
      input.type = "url";
      input.placeholder = "https://...";
      input.value = entry.url || "";
      input.setAttribute("aria-label", "URL " + platformName);
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
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "social-url-remove";
      removeBtn.innerHTML = "×";
      removeBtn.setAttribute("aria-label", "Elimină " + platformName);
      removeBtn.addEventListener("click", () => {
        const p = getProfile();
        p.socialLinks = (p.socialLinks || []).filter((_, i) => i !== index);
        var promise = saveProfile(p);
        renderSocialUrls();
        if (promise && promise.then) promise.then(function () { refreshPreview(); }).catch(function () {});
        else liveRefreshPreview();
      });
      row.appendChild(input);
      row.appendChild(removeBtn);
      wrap.appendChild(row);
    });
    socialUrls.appendChild(wrap);
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
    var profileFullUrl = window.location.origin + (window.location.pathname || "").replace(/[^/]*$/, "") + "profile.html?u=" + encodeURIComponent(username || "my-profile");
    const profileLinkEl = document.getElementById("dashboardProfileLink");
    if (profileLinkEl) {
      profileLinkEl.href = username ? profileFullUrl : "#";
    }
    if (previewFrame && username) {
      previewFrame.src = profileFullUrl;
    }
    if (dashboardLinkUrlPreview) {
      dashboardLinkUrlPreview.value = profileFullUrl;
    }
    if (copyLinkBtnPreview && dashboardLinkUrlPreview) {
      copyLinkBtnPreview.addEventListener("click", () => {
        dashboardLinkUrlPreview.select();
        try {
          navigator.clipboard.writeText(dashboardLinkUrlPreview.value);
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
      dropdownProfileLink.textContent = (window.location.hostname || "taply.ro") + "/" + (username || "my-profile");
    }
    window.updateDashboardLinkDisplay = function () {
      var p = getProfile();
      var u = (currentUser && currentUser.username) || p.username || "";
      var fullUrl = window.location.origin + (window.location.pathname || "").replace(/[^/]*$/, "") + "profile.html?u=" + encodeURIComponent(u || "my-profile");
      if (profileLinkEl) profileLinkEl.href = u ? fullUrl : "#";
      if (previewFrame && u) previewFrame.src = fullUrl;
      if (dashboardLinkUrlPreview) dashboardLinkUrlPreview.value = fullUrl;
      if (dashboardLinkUrl) dashboardLinkUrl.value = fullUrl;
      if (sidebarUsername) sidebarUsername.textContent = u || "—";
      if (dropdownUsername) dropdownUsername.textContent = u || "—";
      if (dropdownProfileLink) { dropdownProfileLink.href = fullUrl; dropdownProfileLink.textContent = (window.location.hostname || "taply.ro") + "/" + (u || "my-profile"); }
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
    if (linksStripSocial) {
      var sl = profile.socialLinks || [];
      if (sl.length === 0 && (profile.platforms || []).length > 0) {
        sl = (profile.platforms || []).slice(0, 5).map(function (key) { return { platform: key, url: "" }; });
      }
      linksStripSocial.innerHTML = sl.slice(0, 5).map(function (entry) {
        var url = platformLogoUrl(entry.platform || "website");
        return url ? '<img src="' + url + '" alt="" class="links-strip-logo" loading="lazy" />' : '<span></span>';
      }).join("");
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
          window.location.href = "login.html";
        }).catch(function () {
          try { localStorage.removeItem(TOKEN_KEY); } catch (err) {}
          window.location.href = "login.html";
        });
        return;
      }
      try { localStorage.removeItem(TOKEN_KEY); } catch (err) {}
      window.location.href = "login.html";
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

    dashboardDisplayName.value = profile.displayName || "";
    dashboardUsername.value = profile.username || "";
    dashboardBio.value = profile.bio || "";
    dashboardBioCounter.textContent = (profile.bio || "").length + "/160";
    updateProfileLinkUrl();
    if (profile.avatar) {
      dashboardAvatarPreview.src = profile.avatar;
      dashboardAvatarPreview.hidden = false;
      dashboardAvatar.querySelector(".plus").style.display = "none";
    } else {
      dashboardAvatarPreview.hidden = true;
      dashboardAvatar.querySelector(".plus").style.display = "";
    }

    renderDashboardThemes();
    renderDashboardPlatforms();
    renderLinkList();
    renderAnalytics();

    function getProfilePreviewUrl() {
      var p = getProfile();
      var base = window.location.origin + (window.location.pathname || "").replace(/[^/]*$/, "") || window.location.origin;
      var username = (p && p.username) || (currentUser && currentUser.username) || (dashboardUsername && dashboardUsername.value.trim()) || "my-profile";
      var slug = (username || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "my-profile";
      return base + "profile.html?u=" + encodeURIComponent(slug);
    }
    function refreshDesignModalPreview() {
      if (!customDesignPreviewFrame || !customDesignPreviewFrame.src) return;
      var url = customDesignPreviewFrame.src;
      var sep = url.indexOf("?") >= 0 ? "&" : "?";
      customDesignPreviewFrame.src = url.split(/[?#]/)[0] + (url.indexOf("?") >= 0 ? url.substring(url.indexOf("?")) : "") + sep + "_=" + Date.now();
    }
    if (customDesignCard) {
      customDesignCard.addEventListener("click", function () {
        if (customDesignModal) {
          customDesignModal.hidden = false;
          document.body.style.overflow = "hidden";
          if (customDesignPreviewFrame) {
            var previewUrl = (previewFrame && previewFrame.src && previewFrame.src.indexOf("profile.html") >= 0) ? previewFrame.src : getProfilePreviewUrl();
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

    dashboardAvatar.addEventListener("click", () => dashboardAvatarInput.click());
    dashboardAvatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      const r = new FileReader();
      r.onload = () => {
        const p = getProfile();
        p.avatar = r.result;
        saveProfile(p);
        dashboardAvatarPreview.src = p.avatar;
        dashboardAvatarPreview.hidden = false;
        dashboardAvatar.querySelector(".plus").style.display = "none";
      };
      r.readAsDataURL(file);
    });

    dashboardBio.addEventListener("input", () => {
      dashboardBioCounter.textContent = dashboardBio.value.length + "/160";
    });

    function updateProfileLinkUrl() {
      const p = getProfile();
      const base = window.location.origin + (window.location.pathname || "").replace(/[^/]*$/, "") || window.location.origin;
      const username = (dashboardUsername && dashboardUsername.value.trim()) || (currentUser && currentUser.username) || (p && p.username) || "my-profile";
      const slug = username.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "my-profile";
      const link = base + "profile.html?u=" + encodeURIComponent(slug);
      if (dashboardLinkUrl) dashboardLinkUrl.value = link;
    }

    if (dashboardUsername) {
      dashboardUsername.addEventListener("input", updateProfileLinkUrl);
      dashboardUsername.addEventListener("change", updateProfileLinkUrl);
    }

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener("click", () => {
        if (!dashboardLinkUrl || !dashboardLinkUrl.value) return;
        dashboardLinkUrl.select();
        try {
          navigator.clipboard.writeText(dashboardLinkUrl.value);
          copyLinkBtn.textContent = "Copied!";
          setTimeout(() => { copyLinkBtn.textContent = "Copy"; }, 2000);
        } catch (e) {
          alert("Link: " + dashboardLinkUrl.value);
        }
      });
    }

    saveProfileBtn.addEventListener("click", () => {
      const p = getProfile();
      p.displayName = dashboardDisplayName.value.trim() || "Name";
      const raw = dashboardUsername.value.trim();
      p.username = raw ? raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") : "";
      p.bio = dashboardBio.value.trim();
      var promise = saveProfile(p);
      if (promise && promise.then) {
        saveProfileBtn.disabled = true;
        promise.then(function () {
          if (currentUser) currentUser.username = p.username;
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
        updateProfileLinkUrl();
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
      if (linkFormNormal) linkFormNormal.hidden = !!friendly;
      if (linkFormFriendly) linkFormFriendly.hidden = !friendly;
    }
    if (linkTypeFriendly) {
      linkTypeFriendly.addEventListener("change", toggleLinkFormFriendly);
    }
    addLinkBtn.addEventListener("click", () => {
      editingLinkId = null;
      linkTitle.value = "";
      linkUrl.value = "";
      linkHighlight.checked = false;
      if (linkTypeFriendly) linkTypeFriendly.checked = false;
      if (linkImageUrl) linkImageUrl.value = "";
      if (linkFriendlyUrl) linkFriendlyUrl.value = "";
      if (linkIcon) linkIcon.value = "";
      toggleLinkFormFriendly();
      linkForm.hidden = false;
    });
    linkFormCancel.addEventListener("click", () => {
      linkForm.hidden = true;
      editingLinkId = null;
    });
    linkFormSave.addEventListener("click", () => {
      var friendly = linkTypeFriendly && linkTypeFriendly.checked;
      var title, url, imageUrl, icon;
      if (friendly) {
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
          link.highlight = linkHighlight.checked;
          link.icon = icon;
          link.imageUrl = friendly ? imageUrl : undefined;
          if (friendly) link.type = "image"; else delete link.type;
        }
      } else {
        p.links.push({
          id: generateId(),
          title,
          url,
          highlight: linkHighlight.checked,
          icon: icon,
          imageUrl: friendly ? imageUrl : undefined,
          type: friendly ? "image" : "link",
        });
      }
      saveProfile(p);
      linkForm.hidden = true;
      editingLinkId = null;
      renderLinkList();
      liveRefreshPreview();
    });

    function activateDashboardTab(hash) {
    const name = (hash && hash.slice(1)) || "links";
    const panelId = "panel" + name.charAt(0).toUpperCase() + name.slice(1);
    document.querySelectorAll(".sidebar-tab").forEach((t) => {
      t.classList.toggle("is-active", t.getAttribute("href") === "#" + name);
    });
    document.querySelectorAll(".dashboard-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === panelId);
    });
    var layout = document.querySelector(".dashboard-layout");
    if (layout) layout.classList.toggle("preview-half", panelId === "panelTheme");
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

  window.addEventListener("hashchange", () => activateDashboardTab(window.location.hash));
  }

  function renderLinkList() {
    const profile = getProfile();
    if (!profile || !linkList) return;
    const links = profile.links || [];
    const analytics = getAnalytics();
    const clicks = analytics.linkClicks || {};
    linkList.innerHTML = "";
    links.forEach((link, index) => {
      const card = document.createElement("div");
      card.className = "link-card";
      card.dataset.linkId = link.id;
      const clickCount = clicks[link.id] || 0;
      var iconHtml = "";
      if (link.type === "image" && link.imageUrl) {
        iconHtml = '<div class="link-card-icon"><img src="' + escapeHtml(link.imageUrl) + '" alt="" onerror="this.parentElement.innerHTML=\'🖼\'" /></div>';
      } else {
        var logoUrl = link.icon && linkLogoUrl(link.icon);
        if (logoUrl) {
          iconHtml = '<div class="link-card-icon"><img src="' + escapeHtml(logoUrl) + '" alt="" class="link-card-logo" loading="lazy" onerror="this.outerHTML=\'🔗\'" /></div>';
        } else {
          iconHtml = '<div class="link-card-icon">🔗</div>';
        }
      }
      card.innerHTML = `
        <div class="link-card-header">
          ${iconHtml}
          <button type="button" class="link-card-handle" aria-label="Reorder">⋮⋮</button>
          <span class="link-card-title">${escapeHtml(link.title)}</span>
        </div>
        <input type="url" class="link-card-url" value="${escapeHtml(link.url)}" placeholder="https://..." />
        <div class="link-card-actions">
          <button type="button" class="link-card-star" title="Highlight">${link.highlight ? "★" : "☆"}</button>
          <span class="link-card-clicks">${clickCount} clicks</span>
          <button type="button" class="link-card-edit" title="Edit">✎</button>
          <button type="button" class="btn-delete-card" title="Delete">🗑</button>
        </div>
      `;
      const urlInput = card.querySelector(".link-card-url");
      urlInput.addEventListener("blur", () => {
        const p = getProfile();
        const l = (p.links || []).find((x) => x.id === link.id);
        if (l && urlInput.value.trim()) {
          l.url = urlInput.value.trim();
          saveProfile(p);
          liveRefreshPreview();
        }
      });
      card.querySelector(".link-card-star").addEventListener("click", () => {
        const p = getProfile();
        const l = (p.links || []).find((x) => x.id === link.id);
        if (l) {
          l.highlight = !l.highlight;
          saveProfile(p);
          renderLinkList();
          liveRefreshPreview();
        }
      });
      card.querySelector(".link-card-edit").addEventListener("click", () => {
        editingLinkId = link.id;
        var friendly = link.type === "image" || !!link.imageUrl;
        if (linkTypeFriendly) linkTypeFriendly.checked = friendly;
        if (linkTitle) linkTitle.value = link.title || "";
        if (linkUrl) linkUrl.value = link.url || "";
        if (linkHighlight) linkHighlight.checked = !!link.highlight;
        if (linkIcon) linkIcon.value = link.icon || "";
        if (linkImageUrl) linkImageUrl.value = link.imageUrl || "";
        if (linkFriendlyUrl) linkFriendlyUrl.value = link.url || "";
        toggleLinkFormFriendly();
        linkForm.hidden = false;
      });
      card.querySelector(".btn-delete-card").addEventListener("click", () => {
        const p = getProfile();
        p.links = (p.links || []).filter((l) => l.id !== link.id);
        saveProfile(p);
        renderLinkList();
        renderAnalytics();
        liveRefreshPreview();
      });
      linkList.appendChild(card);
    });
    if (linkList.classList.contains("link-list")) linkList.classList.remove("link-list");
    if (!linkList.classList.contains("link-cards")) linkList.classList.add("link-cards");
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
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
    var base = (window.location.origin || "https://taply.ro").replace(/\/$/, "");
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
      window.location.href = "login.html";
      return;
    }
    var supabase = getSupabase();
    if (supabase) {
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
            window.location.href = "login.html";
          }
          return;
        }
        supabase.from("profiles").select("username, profile, analytics").eq("id", session.user.id).single().then(function (result) {
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
                  if (r2.error) { window.location.href = "login.html"; return; }
                  currentUser = { id: session.user.id, email: session.user.email || "", username: un, profile: newProfile, analytics: defaultAnalytics() };
                  showView("onboarding");
                  initOnboarding();
                });
                return;
              }
              currentUser = { id: session.user.id, email: session.user.email || "", username: username, profile: newProfile, analytics: defaultAnalytics() };
              showView("onboarding");
              initOnboarding();
            });
            return;
          }
          var row = result.data;
          currentUser = {
            id: session.user.id,
            email: session.user.email || "",
            username: row.username || "",
            profile: row.profile || {},
            analytics: row.analytics || { pageViews: 0, linkClicks: {} },
          };
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
          var msg = (err && err.message) ? String(err.message) : "";
          if (msg.indexOf("fetch") !== -1 || msg.indexOf("Network") !== -1) {
            alert("Connection failed. Check your internet and that the server is running (./start.sh), then reload.");
          }
          window.location.href = "login.html";
        });
      }).catch(function (err) {
        var msg = (err && err.message) ? String(err.message) : "";
        if (msg.indexOf("fetch") !== -1 || msg.indexOf("Network") !== -1) {
          alert("Connection failed. Check your internet and that the server is running (./start.sh), then reload.");
        }
        window.location.href = "login.html";
      });
      return;
    }

    const token = getToken();
    if (token) {
      var apiOrigin = window.location.origin;
      if (!apiOrigin || apiOrigin === "null" || apiOrigin.indexOf("file") === 0) {
        window.location.href = "login.html";
        return;
      }
      fetch(apiOrigin + "/api/me", { headers: apiHeaders() })
        .then((r) => {
          if (!r.ok) {
            try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
            window.location.href = "login.html";
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
            alert("Connection failed. Start the server (./start.sh) and open the app at http://localhost:8001/index.html");
          }
          try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
          window.location.href = "login.html";
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
      window.location.href = "login.html";
    }
  }

  init();
})();
