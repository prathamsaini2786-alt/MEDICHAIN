
const API_BASE_URL = "https://mediback-vz2n.onrender.com/api";

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}


const navItems = document.querySelectorAll(".nav-item[data-page]");

// =========================
// MediChain API
// =========================


const authOverlay = document.getElementById("authOverlay");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");

function getToken() {
  return localStorage.getItem("token");
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function applyRolePermissions() {
  const user = getStoredUser();
  const userRole = user?.role || "Pharmacy";

  document
    .querySelectorAll("[data-roles]")
    .forEach(item => {
      const allowedRoles = item.dataset.roles
        .split(",")
        .map(role => role.trim());

      item.style.display =
        allowedRoles.includes(userRole)
          ? ""
          : "none";
    });
}

function showLogin() {
  authOverlay?.classList.remove("hidden");
}

function hideLogin() {
  authOverlay?.classList.add("hidden");
}

function setLoginError(message) {
  if (!loginError) return;

  loginError.textContent = message;
  loginError.classList.toggle("hidden", !message);
}

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

loginForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = loginEmail?.value.trim();
  const password = loginPassword?.value;

  if (!email || !password) {
    setLoginError("Please enter your email and password.");
    return;
  }

  setLoginError("");

  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";
  }

  try {
    const data = await login(email, password);

    applyRolePermissions();

    console.log("MediChain login successful:", data.user);

    hideLogin();

    // Reload the page so the authenticated dashboard initializes cleanly.
    window.location.reload();
  } catch (error) {
    console.error("Login error:", error);

    setLoginError(
      error.message || "Unable to sign in. Please try again."
    );
  } finally {
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = "Sign in";
    }
  }
});

// Require authentication before showing the dashboard.
if (getToken()) {
  hideLogin();
} else {
  showLogin();
}

const pages = document.querySelectorAll(".page");
const breadcrumb = document.getElementById("breadcrumb");

function showPage(name) {
  pages.forEach(p => p.classList.remove("active-page"));

  const target = document.getElementById(`page-${name}`);
  if (target) target.classList.add("active-page");

  navItems.forEach(item =>
    item.classList.toggle("active", item.dataset.page === name)
  );

  const active = document.querySelector(
    `.nav-item[data-page="${name}"]`
  );

  breadcrumb.textContent = active
    ? active.textContent.replace(/[0-9]/g, "").trim()
    : name;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  // Refresh alerts whenever the Alerts page is opened
  if (name === "alerts") {
    generateAutomatedAlerts();
  }

  // Load issue reports whenever Reports is opened
  if (name === "reports") {
    loadIssueReports();
  }

  if (name === "medicines") {
  loadMedicines();
}
}

navItems.forEach(item => {
  item.addEventListener("click", () => showPage(item.dataset.page));
});

document.querySelectorAll("[data-page-link]").forEach(btn => {
  btn.addEventListener("click", () => {
    showPage(btn.dataset.pageLink);
  });
});


// ================= QUICK ACTION MODAL =================

const modal = document.getElementById("quickModal");

document.getElementById("quickAction")?.addEventListener("click", () => {
  modal?.classList.remove("hidden");
});

document.querySelector(".modal-close")?.addEventListener("click", () => {
  modal?.classList.add("hidden");
});

modal?.addEventListener("click", e => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

// ================= GLOBAL SEARCH =================

const globalSearchModal = document.getElementById("globalSearchModal");
const globalSearchInput = document.getElementById("globalSearchInput");
const globalSearchResults = document.getElementById("globalSearchResults");
const globalSearchClose = document.getElementById("globalSearchClose");

const globalSearchButton = document.querySelector(
  '.top-actions .icon-btn[title="Search"]'
);

function getAuthHeaders() {
  const token = getToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

function openGlobalSearch() {
  if (!globalSearchModal) return;

  globalSearchModal.classList.remove("hidden");

  setTimeout(() => {
    globalSearchInput?.focus();
  }, 50);
}

function closeGlobalSearch() {
  globalSearchModal?.classList.add("hidden");

  if (globalSearchInput) {
    globalSearchInput.value = "";
  }

  if (globalSearchResults) {
    globalSearchResults.innerHTML = `
      <div class="search-empty">
        Start typing to search MediChain.
      </div>
    `;
  }
}

globalSearchButton?.addEventListener("click", openGlobalSearch);
globalSearchClose?.addEventListener("click", closeGlobalSearch);

globalSearchModal?.addEventListener("click", event => {
  if (event.target === globalSearchModal) {
    closeGlobalSearch();
  }
});

async function performGlobalSearch(query) {
  const search = query.trim().toLowerCase();

  if (!search) {
    globalSearchResults.innerHTML = `
      <div class="search-empty">
        Start typing to search MediChain.
      </div>
    `;
    return;
  }

  globalSearchResults.innerHTML = `
    <div class="search-empty">
      Searching...
    </div>
  `;

  try {
    const headers = getAuthHeaders();

    const [drugsResponse, ordersResponse, warehousesResponse] =
      await Promise.all([
        fetch(`${API_BASE_URL}/drugs`, { headers }),
        fetch(`${API_BASE_URL}/orders`, { headers }),
        fetch(`${API_BASE_URL}/warehouses`, { headers })
      ]);

    if (!drugsResponse.ok) {
      throw new Error("Unable to search medicines");
    }

    if (!ordersResponse.ok) {
      throw new Error("Unable to search orders");
    }

    if (!warehousesResponse.ok) {
      throw new Error("Unable to search warehouses");
    }

    const drugsData = await drugsResponse.json();
    const ordersData = await ordersResponse.json();
    const warehousesData = await warehousesResponse.json();

    const drugs = drugsData.drugs || drugsData || [];
    const orders = ordersData.orders || ordersData || [];
    const warehouses =
      warehousesData.warehouses || warehousesData || [];

    const matchingDrugs = drugs.filter(drug => {
      const text = [
        drug.name,
        drug.medicine,
        drug.category,
        drug.batchNumber,
        drug.batch,
        drug.sku,
        drug.manufacturer
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });

    const matchingOrders = orders.filter(order => {
      const text = [
        order._id,
        order.drug,
        order.medicine,
        order.supplier,
        order.destination,
        order.facility,
        order.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });

    const matchingWarehouses = warehouses.filter(warehouse => {
      const text = [
        warehouse.name,
        warehouse.location,
        warehouse.city,
        warehouse.state,
        warehouse.code
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });

    renderGlobalSearchResults(
      matchingDrugs,
      matchingOrders,
      matchingWarehouses
    );
  } catch (error) {
    console.error("Global search error:", error);

    globalSearchResults.innerHTML = `
      <div class="search-empty">
        Unable to search right now. Please try again.
      </div>
    `;
  }
}

function renderGlobalSearchResults(drugs, orders, warehouses) {
  const total =
    drugs.length +
    orders.length +
    warehouses.length;

  if (!total) {
    globalSearchResults.innerHTML = `
      <div class="search-empty">
        No results found.
      </div>
    `;
    return;
  }

  let html = "";

  if (drugs.length) {
    html += `
      <div class="search-group">
        <div class="search-group-title">Medicines</div>
        ${drugs.slice(0, 8).map(drug => `
          <button
            class="search-result"
            data-search-page="inventory"
          >
            <span class="search-result-icon">💊</span>
            <span class="search-result-info">
              <b>${escapeSearchText(
                drug.name || drug.medicine || "Medicine"
              )}</b>
              <small>
                ${escapeSearchText(
                  drug.batchNumber ||
                  drug.batch ||
                  drug.sku ||
                  "Inventory"
                )}
              </small>
            </span>
            <span class="search-result-type">Medicine</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  if (orders.length) {
    html += `
      <div class="search-group">
        <div class="search-group-title">Orders</div>
        ${orders.slice(0, 8).map(order => `
          <button
            class="search-result"
            data-search-page="orders"
          >
            <span class="search-result-icon">📦</span>
            <span class="search-result-info">
              <b>${escapeSearchText(
                order.drug ||
                order.medicine ||
                "Order"
              )}</b>
              <small>
                ${escapeSearchText(
                  order.destination ||
                  order.facility ||
                  order.supplier ||
                  "Order"
                )}
              </small>
            </span>
            <span class="search-result-type">Order</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  if (warehouses.length) {
    html += `
      <div class="search-group">
        <div class="search-group-title">Warehouses</div>
        ${warehouses.slice(0, 8).map(warehouse => `
          <button
            class="search-result"
            data-search-page="inventory"
          >
            <span class="search-result-icon">🏭</span>
            <span class="search-result-info">
              <b>${escapeSearchText(
                warehouse.name || "Warehouse"
              )}</b>
              <small>
                ${escapeSearchText(
                  warehouse.location ||
                  warehouse.city ||
                  warehouse.code ||
                  "Warehouse"
                )}
              </small>
            </span>
            <span class="search-result-type">Warehouse</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  globalSearchResults.innerHTML = html;

  document
    .querySelectorAll(".search-result")
    .forEach(result => {
      result.addEventListener("click", () => {
        const page = result.dataset.searchPage;

        closeGlobalSearch();

        if (page) {
          showPage(page);
        }
      });
    });
}

function escapeSearchText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let globalSearchTimeout;

globalSearchInput?.addEventListener("input", event => {
  clearTimeout(globalSearchTimeout);

  globalSearchTimeout = setTimeout(() => {
    performGlobalSearch(event.target.value);
  }, 250);
});

globalSearchInput?.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeGlobalSearch();
  }
});



// ================= SETTINGS =================

const settingsTabs = document.querySelectorAll(
  "[data-settings-tab]"
);

const settingsPanels = document.querySelectorAll(
  "[data-settings-panel]"
);

const settingsName =
  document.getElementById("settingsName");

const settingsRole =
  document.getElementById("settingsRole");

const settingsEmail =
  document.getElementById("settingsEmail");

const notifyLowStock =
  document.getElementById("notifyLowStock");

const notifyExpiry =
  document.getElementById("notifyExpiry");

const notifyOrders =
  document.getElementById("notifyOrders");

const notifyShipments =
  document.getElementById("notifyShipments");

const workspaceName =
  document.getElementById("workspaceName");

const workspaceRegion =
  document.getElementById("workspaceRegion");


function showSettingsMessage(
  elementId,
  message,
  success = true
) {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");

  element.classList.toggle(
    "success",
    success
  );

  element.classList.toggle(
    "error",
    !success
  );

  setTimeout(() => {
    element.classList.add("hidden");
  }, 3500);
}


function getSettingsHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}


// -------------------------
// TAB SWITCHING
// -------------------------

settingsTabs.forEach(tab => {

  tab.addEventListener("click", () => {

    const target =
      tab.dataset.settingsTab;

    settingsTabs.forEach(item => {
      item.classList.remove("selected");
    });

    tab.classList.add("selected");

    settingsPanels.forEach(panel => {

      panel.classList.toggle(
        "active",
        panel.dataset.settingsPanel === target
      );

    });

  });

});


// -------------------------
// LOAD PROFILE
// -------------------------

async function loadSettingsProfile() {

  if (!getToken()) return;

  try {

    const response = await fetch(
      `${API_BASE_URL}/auth/profile`,
      {
        headers: getSettingsHeaders()
      }
    );

    if (!response.ok) {
      throw new Error("Unable to load profile");
    }

    const data = await response.json();
    const user = data.user;

    if (!user) return;
  
    const profileDisplayName =
  document.getElementById("profileDisplayName");

const profileDisplayEmail =
  document.getElementById("profileDisplayEmail");

const profileDisplayRole =
  document.getElementById("profileDisplayRole");

const settingsAvatar =
  document.getElementById("settingsAvatar");

if (profileDisplayName) {
  profileDisplayName.textContent = user.name || "User";
}

if (profileDisplayEmail) {
  profileDisplayEmail.textContent =
    user.email || "MediChain account";
}

if (profileDisplayRole) {
  profileDisplayRole.textContent =
    user.role || "Pharmacy";
}

if (settingsAvatar) {
  settingsAvatar.textContent =
    (user.name || "U")
      .split(" ")
      .map(part => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
}

    if (settingsName) {
      settingsName.value = user.name || "";
    }

    if (settingsRole) {
      settingsRole.value = user.role || "";
    }

    if (settingsEmail) {
      settingsEmail.value = user.email || "";
    }


    const notifications =
      user.notifications || {};

    if (notifyLowStock) {
      notifyLowStock.checked =
        notifications.lowStock !== false;
    }

    if (notifyExpiry) {
      notifyExpiry.checked =
        notifications.expiry !== false;
    }

    if (notifyOrders) {
      notifyOrders.checked =
        notifications.orderUpdates !== false;
    }

    if (notifyShipments) {
      notifyShipments.checked =
        notifications.shipmentUpdates !== false;
    }


    const workspace =
      user.workspace || {};

    if (workspaceName) {
      workspaceName.value =
        workspace.name || "North Region";
    }

    if (workspaceRegion) {
      workspaceRegion.value =
        workspace.region || "North Region";
    }


    localStorage.setItem(
      "user",
      JSON.stringify({
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role
      })
    );

    updateUserUI(user);

  } catch (error) {

    console.error(
      "Settings profile error:",
      error
    );

  }

}


// -------------------------
// UPDATE USER UI
// -------------------------

function updateUserUI(user) {

  if (!user) return;

  const userCards =
    document.querySelectorAll(".user-card");

  userCards.forEach(card => {

    const name =
      card.querySelector("b");

    if (name) {
      name.textContent =
        user.name || "User";
    }

    const role =
      card.querySelector("small");

    if (role) {
      role.textContent =
        user.role || "";
    }

  });

  const topUser =
    document.querySelector(".top-user span");

  if (topUser) {

    const firstName =
      (user.name || "User")
        .trim()
        .split(/\s+/)[0];

    topUser.textContent =
      firstName;

  }

  const dashboardHeading =
    document.querySelector("#page-dashboard h1");
    
  if (dashboardHeading) {

    const hour = new Date().getHours();

    let greeting;

    if (hour >= 5 && hour < 12) {
      greeting = "Good morning";
    } else if (hour >= 12 && hour < 17) {
      greeting = "Good afternoon";
    } else if (hour >= 17 && hour < 21) {
      greeting = "Good evening";
    } else {
      greeting = "Good night";
    }

    dashboardHeading.textContent =
      `${greeting}, ${user.name || "there"}.`;
  }

}


// -------------------------
// SAVE PROFILE
// -------------------------

document
  .getElementById("saveProfileBtn")
  ?.addEventListener("click", async () => {

    const name =
      settingsName?.value.trim();

    const email =
      settingsEmail?.value.trim();

    if (!name || !email) {

      showSettingsMessage(
        "profileMessage",
        "Name and email are required.",
        false
      );

      return;
    }

    const button =
      document.getElementById(
        "saveProfileBtn"
      );

    button.disabled = true;
    button.textContent = "Saving...";

    try {

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: "PUT",
          headers: getSettingsHeaders(),
          body: JSON.stringify({
            name,
            email
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update profile"
        );
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      updateUserUI(data.user);

      showSettingsMessage(
        "profileMessage",
        "Profile saved successfully."
      );

    } catch (error) {

      showSettingsMessage(
        "profileMessage",
        error.message,
        false
      );

    } finally {

      button.disabled = false;
      button.textContent = "Save changes";

    }

  });


// -------------------------
// SAVE NOTIFICATIONS
// -------------------------

document
  .getElementById("saveNotificationsBtn")
  ?.addEventListener("click", async () => {

    const button =
      document.getElementById(
        "saveNotificationsBtn"
      );

    button.disabled = true;
    button.textContent = "Saving...";

    try {

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: "PUT",
          headers: getSettingsHeaders(),
          body: JSON.stringify({
            notifications: {
              lowStock:
                notifyLowStock?.checked ?? true,

              expiry:
                notifyExpiry?.checked ?? true,

              orderUpdates:
                notifyOrders?.checked ?? true,

              shipmentUpdates:
                notifyShipments?.checked ?? true
            }
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to save preferences"
        );
      }

      showSettingsMessage(
        "notificationMessage",
        "Notification preferences saved."
      );

    } catch (error) {

      showSettingsMessage(
        "notificationMessage",
        error.message,
        false
      );

    } finally {

      button.disabled = false;
      button.textContent = "Save preferences";

    }

  });


// -------------------------
// SAVE WORKSPACE
// -------------------------

document
  .getElementById("saveWorkspaceBtn")
  ?.addEventListener("click", async () => {

    const button =
      document.getElementById(
        "saveWorkspaceBtn"
      );

    button.disabled = true;
    button.textContent = "Saving...";

    try {

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: "PUT",
          headers: getSettingsHeaders(),
          body: JSON.stringify({
            workspace: {
              name:
                workspaceName?.value.trim() ||
                "North Region",

              region:
                workspaceRegion?.value.trim() ||
                "North Region"
            }
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to save workspace"
        );
      }

      showSettingsMessage(
        "workspaceMessage",
        "Workspace settings saved."
      );

    } catch (error) {

      showSettingsMessage(
        "workspaceMessage",
        error.message,
        false
      );

    } finally {

      button.disabled = false;
      button.textContent = "Save workspace";

    }

  });


// -------------------------
// CHANGE PASSWORD
// -------------------------

document
  .getElementById("changePasswordBtn")
  ?.addEventListener("click", async () => {

    const currentPassword =
      document.getElementById(
        "currentPassword"
      )?.value;

    const newPassword =
      document.getElementById(
        "newPassword"
      )?.value;

    const confirmPassword =
      document.getElementById(
        "confirmPassword"
      )?.value;


    if (!currentPassword || !newPassword) {

      showSettingsMessage(
        "securityMessage",
        "Please enter your current and new password.",
        false
      );

      return;
    }


    if (newPassword !== confirmPassword) {

      showSettingsMessage(
        "securityMessage",
        "New passwords do not match.",
        false
      );

      return;
    }


    if (newPassword.length < 6) {

      showSettingsMessage(
        "securityMessage",
        "New password must be at least 6 characters.",
        false
      );

      return;
    }


    const button =
      document.getElementById(
        "changePasswordBtn"
      );

    button.disabled = true;
    button.textContent = "Changing...";


    try {

      const response = await fetch(
        `${API_BASE_URL}/auth/change-password`,
        {
          method: "POST",
          headers: getSettingsHeaders(),
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to change password"
        );
      }


      document.getElementById(
        "currentPassword"
      ).value = "";

      document.getElementById(
        "newPassword"
      ).value = "";

      document.getElementById(
        "confirmPassword"
      ).value = "";


      showSettingsMessage(
        "securityMessage",
        "Password changed successfully."
      );

    } catch (error) {

      showSettingsMessage(
        "securityMessage",
        error.message,
        false
      );

    } finally {

      button.disabled = false;
      button.textContent = "Change password";

    }

  });


// -------------------------
// LOGOUT
// -------------------------

document
  .getElementById("logoutBtn")
  ?.addEventListener("click", () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href =
      "login.html";

  });


// Load settings whenever the page starts.
loadSettingsProfile();

// ================= INVENTORY V2 =================

let inventoryDrugs = [];

async function loadInventoryFromAPI() {

  try {

    const response = await fetch(
      `${API_BASE_URL}/drugs`,
      {
        headers: {
          Authorization:
            `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch inventory");
    }

    const data =
      await response.json();

    inventoryDrugs =
      data.drugs || data;

    renderInventory(inventoryDrugs);

  } catch (error) {

    console.error(
      "Inventory API error:",
      error
    );

  }

}


function renderInventory(drugs) {

  const tableBody =
    document.querySelector(
      "#inventoryTable tbody"
    );

  if (!tableBody) {

    console.error(
      "Inventory table body not found"
    );

    return;
  }

  tableBody.innerHTML = "";

  drugs.forEach(drug => {

    const row =
      document.createElement("tr");

      row.className = "inventory-row";
row.style.cursor = "pointer";

    const expiryDate =
      new Date(drug.expiryDate);

    const expiry =
      expiryDate.toLocaleDateString(
        "en-US",
        {
          month: "short",
          year: "numeric"
        }
      );

    const statusClass =
      drug.status === "Available"
        ? "healthy"
        : drug.status === "Low Stock"
          ? "warning"
          : "critical";

    row.dataset.medicine =
      drug.name || "";

    row.dataset.category =
      drug.category || "";

    row.dataset.batch =
      drug.batchNumber || "";

    row.dataset.quantity =
      drug.quantity ?? 0;

    row.dataset.facility =
      drug.location || "";

    row.dataset.expiry =
      expiry;

      row.dataset.expiryDate =
  drug.expiryDate || "";

    row.dataset.status =
      statusClass;

    row.dataset.qr =
  drug._id ||
  drug.id ||
  "";

row.dataset.drugId =
  drug._id ||
  drug.id ||
  "";

    row.innerHTML = `

      <td>
        <b>${drug.name || "Unknown medicine"}</b>
      </td>

      <td>
        ${drug.batchNumber || "—"}
      </td>

      <td>
        <b>${drug.quantity ?? 0}</b> units
      </td>

      <td>
        ${drug.location || "—"}
      </td>

      <td>
        ${expiry}
      </td>

      <td>
        <span class="status ${statusClass}">
          ${drug.status || "Unknown"}
        </span>
      </td>

      <td>→</td>

    `;

    tableBody.appendChild(row);

  });

  attachInventoryRowListeners();

  filterInventory();



}


function attachInventoryRowListeners() {

  const rows =
    document.querySelectorAll(
      ".inventory-row"
    );

  rows.forEach(row => {

    row.addEventListener(
      "click",
      () => {
        openInventoryDrawer(row);
      }
    );

  });

}


loadInventoryFromAPI();

function getInventoryRows() {
  return document.querySelectorAll(".inventory-row");
}

const inventoryDrawer =
  document.getElementById("inventoryDrawer");

const inventoryDrawerBackdrop =
  document.getElementById("inventoryDrawerBackdrop");

const inventorySearch =
  document.getElementById("inventorySearch");

const inventoryStatus =
  document.getElementById("inventoryStatus");

const inventoryFacility =
  document.getElementById("inventoryFacility");

const inventoryExpiry =
  document.getElementById("inventoryExpiryFilter");

const inventoryResultCount =
  document.getElementById("inventoryResultCount");

let selectedInventory = null;


function openInventoryDrawer(row) {

  selectedInventory = row;

  const d = row.dataset;

  document.getElementById("drawerMedicine").textContent =
    d.medicine;

  document.getElementById("drawerCategory").textContent =
    d.category;

  document.getElementById("drawerBatch").textContent =
    d.batch;

  document.getElementById("drawerQuantity").textContent =
    `${Number(d.quantity).toLocaleString()} units`;

  document.getElementById("drawerFacility").textContent =
    d.facility;

  document.getElementById("drawerExpiry").textContent =
    d.expiry;

  document.getElementById("drawerQrText").textContent =
    d.qr;

  const status =
    document.getElementById("drawerStatus");

  status.className =
    `drawer-status ${d.status}`;

  status.textContent =
    d.status === "healthy"
      ? "Healthy stock"
      : d.status === "warning"
        ? "Low stock — reorder recommended"
        : "Critical stock — action required";

  inventoryDrawer.classList.add("open");

  inventoryDrawerBackdrop.classList.remove("hidden");

  inventoryDrawer.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeInventoryDrawer() {

  inventoryDrawer.classList.remove("open");

  inventoryDrawerBackdrop.classList.add("hidden");

  inventoryDrawer.setAttribute(
    "aria-hidden",
    "true"
  );
}


getInventoryRows().forEach(row => {

  row.addEventListener("click", () => {
    openInventoryDrawer(row);
  });

});


document
  .getElementById("drawerClose")
  ?.addEventListener(
    "click",
    closeInventoryDrawer
  );


document
  .getElementById("drawerCloseAction")
  ?.addEventListener(
    "click",
    closeInventoryDrawer
  );


inventoryDrawerBackdrop?.addEventListener(
  "click",
  closeInventoryDrawer
);


// ================= INVENTORY FILTERING =================
function filterInventory() {
  const q =
    (inventorySearch?.value || "")
      .trim()
      .toLowerCase();

  const status =
    inventoryStatus?.value || "all";

  const facility =
    inventoryFacility?.value || "all";

  const expiry =
    inventoryExpiry?.value || "all";

  let shown = 0;

  const now = new Date();

  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(
    thirtyDaysFromNow.getDate() + 30
  );

  getInventoryRows().forEach(row => {
    const d = row.dataset;

    const textMatch =
      [
        d.medicine,
        d.batch,
        d.facility,
        d.category
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);

    const statusMatch =
      status === "all" ||
      d.status === status;

    const facilityMatch =
      facility === "all" ||
      d.facility === facility;

    let expiryMatch = true;

    if (expiry !== "all") {
      if (!d.expiryDate) {
        expiryMatch = false;
      } else {
        const expiryDate =
          new Date(d.expiryDate);

        if (expiry === "soon") {
          expiryMatch =
            expiryDate >= now &&
            expiryDate <= thirtyDaysFromNow;
        }

        if (expiry === "expired") {
          expiryMatch =
            expiryDate < now;
        }

        if (expiry === "normal") {
          expiryMatch =
            expiryDate > thirtyDaysFromNow;
        }
      }
    }

    const visible =
      textMatch &&
      statusMatch &&
      facilityMatch &&
      expiryMatch;

    row.style.display =
      visible ? "" : "none";

    if (visible) {
      shown++;
    }
  });

  if (inventoryResultCount) {
    inventoryResultCount.textContent =
      `${shown} record${shown === 1 ? "" : "s"} shown`;
  }
}

[
  inventorySearch,
  inventoryStatus,
  inventoryFacility,
  inventoryExpiry
].forEach(el => {

  el?.addEventListener(
    el.tagName === "INPUT"
      ? "input"
      : "change",
    filterInventory
  );

});

filterInventory();


// ================= INVENTORY EXPORT =================

document
  .getElementById("inventoryExport")
  ?.addEventListener("click", () => {
const visible =
      [...getInventoryRows()]
        .filter(
          r => r.style.display !== "none"
        )
        .map(r => ({

          Medicine:
            r.dataset.medicine,

          Batch:
            r.dataset.batch,

          Quantity:
            r.dataset.quantity,

          Facility:
            r.dataset.facility,

          Expiry:
            r.dataset.expiry,

          Status:
            r.dataset.status

        }));


    const csv = [

      Object.keys(
        visible[0] || {}
      ).join(","),

      ...visible.map(x =>
        Object.values(x)
          .map(v =>
            `"${String(v).replaceAll('"', '""')}"`
          )
          .join(",")
      )

    ].join("\n");


    const blob =
      new Blob(
        [csv],
        { type: "text/csv" }
      );


    const a =
      document.createElement("a");

    a.href =
      URL.createObjectURL(blob);

    a.download =
      "medichain-inventory.csv";

    a.click();

    URL.revokeObjectURL(a.href);

  });


// ================= QR =================

document
  .getElementById("generateQrBtn")
  ?.addEventListener("click", e => {

    e.currentTarget.textContent =
      "✓ QR ready";

    document.getElementById(
      "drawerQr"
    ).textContent = "▦";


    setTimeout(() => {

      e.currentTarget.textContent =
        "Generate QR";

    }, 1800);

  });


// ================= TRANSFER FLOW =================

const transferModal =
  document.getElementById("transferModal");


function openTransferModal() {

  if (!selectedInventory) return;

  document.getElementById(
    "transferMedicine"
  ).textContent =
    `${selectedInventory.dataset.medicine} · ${
      Number(
        selectedInventory.dataset.quantity
      ).toLocaleString()
    } units available`;

  transferModal?.classList.remove(
    "hidden"
  );
}


function closeTransferModal() {

  transferModal?.classList.add(
    "hidden"
  );

}


document
  .getElementById("drawerTransferBtn")
  ?.addEventListener(
    "click",
    openTransferModal
  );


document
  .getElementById("transferClose")
  ?.addEventListener(
    "click",
    closeTransferModal
  );


document
  .getElementById("transferCancel")
  ?.addEventListener(
    "click",
    closeTransferModal
  );


transferModal?.addEventListener(
  "click",
  e => {

    if (e.target === transferModal) {
      closeTransferModal();
    }

  }
);


document
  .getElementById("confirmTransfer")
  ?.addEventListener(
    "click",
    async () => {

      if (!selectedInventory) return;

      const token = getToken();

      if (!token) {
        showToast("Please login first.", "error");
        return;
      }

      const units =
        Number(
          document.getElementById(
            "transferUnits"
          ).value
        );

      const destination =
        document.getElementById(
          "transferDestination"
        ).value;

      const sourceQuantity =
        Number(
          selectedInventory.dataset.quantity || 0
        );

      const drugId =
        selectedInventory.dataset.drugId ||
        selectedInventory.dataset.qr ||
        "";

      const source =
        selectedInventory.dataset.facility ||
        "";

      const batchNumber =
        selectedInventory.dataset.batch ||
        "";

      const medicine =
        selectedInventory.dataset.medicine ||
        "medicine";

      if (!drugId) {
        showToast("Unable to identify this medicine.", "error");
        return;
      }

      if (!Number.isFinite(units) || units < 1) {
        showToast("Enter a valid quantity.", "error");
        return;
      }

      if (units > sourceQuantity) {
        showToast(
  `Only ${sourceQuantity.toLocaleString()} units are available.`,
  "error"
);
        return;
      }

      if (!source || !destination) {
        showToast("Source and destination are required.", "error");
        return;
      }

      if (source === destination) {
        showToast(
  "Source and destination must be different.",
  "error"
);
        return;
      }

      const confirmButton =
        document.getElementById(
          "confirmTransfer"
        );

      if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent = "Creating...";
      }

      try {

        const response = await fetch(
          `${API_BASE_URL}/movements`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
              drug: drugId,
              batchNumber,
              fromLocation: source,
              toLocation: destination,
              quantity: units,
              movedBy: "Current user",
              notes: `Transfer of ${medicine}`
            })
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to create stock movement"
          );
        }

        closeTransferModal();
        closeInventoryDrawer();

       showToast(
  `Transfer created · ${units.toLocaleString()} units of ${medicine} · ${source} → ${destination}`,
  "success"
);

        console.log(
          "Stock movement created:",
          data
        );

      } catch (error) {

        console.error(
          "Create stock movement error:",
          error
        );

       showToast(
  error.message || "Failed to create stock movement",
  "error"
);

      } finally {

        if (confirmButton) {
          confirmButton.disabled = false;
          confirmButton.textContent =
            "Create transfer plan";
        }

      }
    }
  );

  // ==================== INVENTORY FACILITIES ====================

async function loadInventoryWarehouses() {
  const locationSelect =
    document.getElementById("inventoryLocation");

  if (!locationSelect || !getToken()) return;

  try {
    locationSelect.innerHTML =
      `<option value="">Loading facilities...</option>`;

    const response = await fetch(
      `${API_BASE_URL}/warehouses`,
      {
        headers: getSettingsHeaders()
      }
    );

    if (!response.ok) {
      throw new Error("Unable to load facilities");
    }

    const warehouses = await response.json();

    locationSelect.innerHTML =
      `<option value="">Select facility</option>`;

    warehouses.forEach((warehouse) => {
      const option = document.createElement("option");

      option.value = warehouse.name;
      option.textContent = warehouse.name;

      locationSelect.appendChild(option);
    });

  } catch (error) {
    console.error(
      "Load inventory facilities error:",
      error
    );

    locationSelect.innerHTML =
      `<option value="">Unable to load facilities</option>`;

    showToast(
      "Unable to load facilities.",
      "error"
    );
  }
}

// ==================== ADD INVENTORY ====================

let selectedMedicineForInventory = null;

const addInventoryModal = document.getElementById("addInventoryModal");
const addInventoryForm = document.getElementById("addInventoryForm");

function openAddInventoryModal() {
  addInventoryModal?.classList.remove("hidden");
  loadInventoryWarehouses();
}

function closeAddInventoryModal() {
  addInventoryModal?.classList.add("hidden");
}

// Open modal from Inventory page
document
  .getElementById("addInventoryBtn")
  ?.addEventListener("click", openAddInventoryModal);

// Close buttons
document
  .getElementById("addInventoryClose")
  ?.addEventListener("click", closeAddInventoryModal);

document
  .getElementById("addInventoryCancel")
  ?.addEventListener("click", closeAddInventoryModal);

// Submit inventory to backend
addInventoryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const inventoryData = {
  name: document.getElementById("inventoryName").value.trim(),

  genericName:
    selectedMedicineForInventory?.genericName ||
    document.getElementById("inventoryName").value.trim(),

  batchNumber:
    document.getElementById("inventoryBatch").value.trim(),

  manufacturer:
    document.getElementById("inventoryManufacturer").value.trim(),

  dosageForm:
    selectedMedicineForInventory?.dosageForm || "",

  strength:
    selectedMedicineForInventory?.strength || "",

  quantity:
    Number(document.getElementById("inventoryQuantity").value),

  reorderLevel:
    Number(
      document.getElementById("inventoryReorderLevel").value
    ),

  expiryDate:
    document.getElementById("inventoryExpiry").value,

  location:
    document.getElementById("inventoryLocation").value,

  status:
    document.getElementById("inventoryStatus").value
};

  try {
    const response = await fetch(`${API_BASE_URL}/drugs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(inventoryData)
    });

    const data = await response.json();

    if (!response.ok) {
  throw new Error(
    data.error ||
    data.message ||
    "Failed to add inventory"
  );
}

    console.log("Inventory added:", data);

    showToast("Inventory added successfully!", "success");

    addInventoryForm.reset();

    closeAddInventoryModal();

    // Refresh inventory from backend
    loadInventoryFromAPI();

  } catch (error) {
    console.error("Add inventory API error:", error);
    showToast(`Failed to add inventory: ${error.message}`, "error");
  }
});


// ================= SHIPMENT TRACKING =================

let shipments = [];
let selectedShipment = null;

const shipmentCardsContainer =
  document.querySelector(".shipment-cards");

const shipmentDrawer =
  document.getElementById("shipmentDrawer");

const shipmentDrawerBackdrop =
  document.getElementById("shipmentDrawerBackdrop");

const shipmentDrawerId =
  document.getElementById("shipmentDrawerId");

const shipmentDrawerStatus =
  document.getElementById("shipmentDrawerStatus");

const shipmentDrawerStatusBadge =
  document.getElementById("shipmentDrawerStatusBadge");

const shipmentOrigin =
  document.getElementById("shipmentOrigin");

const shipmentDestination =
  document.getElementById("shipmentDestination");

const shipmentProgress =
  document.getElementById("shipmentProgress");

const shipmentEta =
  document.getElementById("shipmentEta");

const shipmentProgressText =
  document.getElementById("shipmentProgressText");

const shipmentProgressBar =
  document.getElementById("shipmentProgressBar");

const shipmentRouteOrigin =
  document.getElementById("shipmentRouteOrigin");

const shipmentRouteDestination =
  document.getElementById("shipmentRouteDestination");

const shipmentTemperature =
  document.getElementById("shipmentTemperature");

const shipmentDriver =
  document.getElementById("shipmentDriver");

const shipmentVehicle =
  document.getElementById("shipmentVehicle");


// ================= LOAD SHIPMENTS =================

async function loadShipments() {

  if (!getToken()) return;

  try {

    const response = await fetch(
      `${API_BASE_URL}/shipments`,
      {
        headers: getSettingsHeaders()
      }
    );

    if (!response.ok) {
      throw new Error("Unable to load shipments");
    }

    const data = await response.json();

    shipments = Array.isArray(data)
      ? data
      : (data.shipments || []);

    renderShipments();

  } catch (error) {

    console.error(
      "Shipments load error:",
      error
    );

  }
}


// ================= STATUS CLASS =================

function getShipmentStatusClass(status) {

  switch (status) {

    case "In transit":
      return "healthy";

    case "Delivered":
      return "success";

    case "Delayed":
      return "warning";

    case "Cancelled":
      return "danger";

    default:
      return "warning";
  }
}


// ================= RENDER SHIPMENTS =================

function renderShipments() {

  if (!shipmentCardsContainer) return;

  shipmentCardsContainer.innerHTML = "";

  if (!shipments.length) {

    shipmentCardsContainer.innerHTML = `
      <div class="panel" style="padding:24px;">
        <b>No shipments yet</b>
        <p>Create a shipment to begin tracking it.</p>
      </div>
    `;

    updateShipmentOverview();

    return;
  }


  shipments.forEach(shipment => {

    const progress =
      Number(shipment.progress) || 0;

    const temperature =
      shipment.temperature !== null &&
      shipment.temperature !== undefined
        ? `${shipment.temperature}°C`
        : "—";


    const card =
      document.createElement("article");

    card.className =
      "route-card shipment-clickable";


    card.dataset.shipmentId =
      shipment.shipmentId || shipment._id;

    card.dataset.mongoId =
      shipment._id || "";

      card.dataset.orderId =
  shipment.order?._id || "";

    card.dataset.status =
      shipment.status || "Pending";

    card.dataset.origin =
      shipment.origin || "—";

    card.dataset.destination =
      shipment.destination || "—";

    card.dataset.progress =
      progress;

    card.dataset.eta =
      shipment.eta || "—";

    card.dataset.temperature =
      temperature;

    card.dataset.driver =
      shipment.driver || "—";

    card.dataset.vehicle =
      shipment.vehicle || "—";

      card.dataset.orderNumber =
  shipment.order?.orderNumber ||
  shipment.order?.orderId ||
  shipment.order?._id ||
  "—";

    card.innerHTML = `
      <div class="route-head">
        <span class="status ${getShipmentStatusClass(shipment.status)}">
          ${shipment.status || "Pending"}
        </span>

        <b>${shipment.shipmentId || shipment._id}</b>
      </div>

      <h3>
        ${shipment.origin || "—"}
        <span>→</span>
        ${shipment.destination || "—"}
      </h3>

      <div class="route-bar">
        <i style="width:${progress}%"></i>
      </div>

      <div class="route-info">
        <span>${progress}% complete</span>
        <b>ETA ${shipment.eta || "—"}</b>
      </div>

      <div class="temp">
        ❄ Temperature
        <b>${temperature}</b>
        <span>✓ Recorded</span>
      </div>

      <button class="track-btn">
        View live tracking →
      </button>
    `;


    card.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openShipmentDrawer(
          card,
          shipment
        );

      }
    );


    shipmentCardsContainer.appendChild(card);

  });


  updateShipmentOverview();

  updateShipmentMap();

}


// ================= OVERVIEW =================

function updateShipmentOverview() {

  const active =
    shipments.filter(
      shipment =>
        shipment.status !== "Delivered" &&
        shipment.status !== "Cancelled"
    ).length;

  const inTransit =
    shipments.filter(
      shipment =>
        shipment.status === "In transit"
    ).length;

  const delayed =
    shipments.filter(
      shipment =>
        shipment.status === "Delayed"
    ).length;

  const activeElement =
    document.getElementById("shipmentsActiveCount");

  const transitElement =
    document.getElementById("shipmentsTransitCount");

  const delayedElement =
    document.getElementById("shipmentsDelayedCount");

  const activeDetail =
    document.getElementById("shipmentsActiveDetail");

  const transitDetail =
    document.getElementById("shipmentsTransitDetail");

  const delayedDetail =
    document.getElementById("shipmentsDelayedDetail");


  if (activeElement) {
    activeElement.textContent = active;
  }

  if (transitElement) {
    transitElement.textContent = inTransit;
  }

  if (delayedElement) {
    delayedElement.textContent = delayed;
  }


  if (activeDetail) {
    activeDetail.textContent =
      `${active} active shipment${active === 1 ? "" : "s"}`;
  }

  if (transitDetail) {
    transitDetail.textContent =
      active > 0
        ? `${Math.round((inTransit / active) * 100)}% of active shipments`
        : "0% of active shipments";
  }

  if (delayedDetail) {
    delayedDetail.textContent =
      delayed > 0
        ? "Requires attention"
        : "No delayed shipments";
  }

}

// ================= MAP =================

function updateShipmentMap() {

  const mapRoute =
    document.querySelector(".map-route");

  if (!mapRoute || !shipments.length) return;

  const shipment =
    shipments.find(
      item =>
        item.status === "In transit"
    ) || shipments[0];


  const start =
    mapRoute.querySelector(".map-node.start");

  const end =
    mapRoute.querySelector(".map-node.end");

  const line =
    mapRoute.querySelector(".map-line i");


  if (start) {
    start.textContent =
      shipment.origin || "Origin";
  }

  if (end) {
    end.textContent =
      shipment.destination || "Destination";
  }

  if (line) {
    line.style.width =
      `${Number(shipment.progress) || 0}%`;
  }

}


// ================= DRAWER =================

function openShipmentDrawer(
  card,
  shipment
) {

  selectedShipment = shipment;

  const statusSelect =
  document.getElementById("shipmentStatusSelect");

const progressInput =
  document.getElementById("shipmentProgressInput");

if (statusSelect) {
  statusSelect.value =
    shipment.status || "Pending";
}

if (progressInput) {
  progressInput.value =
    Number(shipment.progress) || 0;
}

  const data = card.dataset;

  if (shipmentDrawerId) {
    shipmentDrawerId.textContent =
      data.shipmentId || "—";
  }

  if (shipmentDrawerStatus) {
    shipmentDrawerStatus.textContent =
      data.status || "—";
  }

  if (shipmentDrawerStatusBadge) {
    shipmentDrawerStatusBadge.textContent =
      data.status || "—";
  }

  if (shipmentOrigin) {
    shipmentOrigin.textContent =
      data.origin || "—";
  }

  if (shipmentDestination) {
    shipmentDestination.textContent =
      data.destination || "—";
  }


  const progress =
    parseInt(data.progress, 10) || 0;


  if (shipmentProgress) {
    shipmentProgress.textContent =
      `${progress}%`;
  }

  if (shipmentEta) {
    shipmentEta.textContent =
      data.eta || "—";
  }

  if (shipmentProgressText) {
    shipmentProgressText.textContent =
      `${progress}% complete`;
  }

  if (shipmentProgressBar) {
    shipmentProgressBar.style.width =
      `${progress}%`;
  }

  if (shipmentRouteOrigin) {
    shipmentRouteOrigin.textContent =
      data.origin || "—";
  }

  if (shipmentRouteDestination) {
    shipmentRouteDestination.textContent =
      data.destination || "—";
  }

  if (shipmentTemperature) {
    shipmentTemperature.textContent =
      data.temperature || "—";
  }

  if (shipmentDriver) {
    shipmentDriver.textContent =
      data.driver || "—";
  }

  if (shipmentVehicle) {
    shipmentVehicle.textContent =
      data.vehicle || "—";
  }


  shipmentDrawer?.classList.remove("hidden");
  shipmentDrawer?.classList.add("open");

  shipmentDrawerBackdrop?.classList.remove("hidden");

  shipmentDrawer?.setAttribute(
    "aria-hidden",
    "false"
  );

}


// ================= CLOSE DRAWER =================

function closeShipmentDrawer() {

  shipmentDrawer?.classList.remove("open");

  shipmentDrawer?.classList.add("hidden");

  shipmentDrawerBackdrop?.classList.add("hidden");

  shipmentDrawer?.setAttribute(
    "aria-hidden",
    "true"
  );

  selectedShipment = null;

}


document
  .getElementById("shipmentDrawerClose")
  ?.addEventListener(
    "click",
    closeShipmentDrawer
  );


document
  .getElementById("shipmentDrawerDone")
  ?.addEventListener(
    "click",
    closeShipmentDrawer
  );


shipmentDrawerBackdrop?.addEventListener(
  "click",
  closeShipmentDrawer
);


// ================= CREATE SHIPMENT =================

document
  .getElementById("newShipmentBtn")
  ?.addEventListener(
    "click",
    () => {

      const order =
        window.selectedShipmentOrder;

      const destinationInput =
        document.getElementById(
          "shipmentDestinationInput"
        );

      const quantityInput =
        document.getElementById(
          "shipmentQuantity"
        );


      // Prefill from selected order
      if (order) {

        if (destinationInput) {
          destinationInput.value =
            order.destination ||
            order.facility ||
            "";
        }

        if (quantityInput) {
          quantityInput.value =
            order.quantity || "";
        }

      }


      document
        .getElementById("shipmentModal")
        ?.classList.remove("hidden");

    }
  );


document
  .getElementById("shipmentModalClose")
  ?.addEventListener(
    "click",
    closeShipmentModal
  );


document
  .getElementById("shipmentCancel")
  ?.addEventListener(
    "click",
    closeShipmentModal
  );


document
  .getElementById("shipmentModal")
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        document.getElementById("shipmentModal")
      ) {
        closeShipmentModal();
      }

    }
  );


function closeShipmentModal() {

  document
    .getElementById("shipmentModal")
    ?.classList.add("hidden");

}


document
  .getElementById("confirmShipment")
  ?.addEventListener(
    "click",
    async () => {

      const origin =
        document
          .getElementById("shipmentOriginInput")
          ?.value.trim();

      const destination =
        document
          .getElementById("shipmentDestinationInput")
          ?.value.trim();

      const quantity =
        Number(
          document
            .getElementById("shipmentQuantity")
            ?.value
        );

      const eta =
        document
          .getElementById("shipmentEtaInput")
          ?.value.trim();

      const temperature =
        document
          .getElementById("shipmentTemperatureInput")
          ?.value;

      const driver =
        document
          .getElementById("shipmentDriverInput")
          ?.value.trim();

      const vehicle =
        document
          .getElementById("shipmentVehicleInput")
          ?.value.trim();


      if (
        !origin ||
        !destination ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {

        showToast(
  "Please fill origin, destination and a valid quantity.",
  "error"
);

        return;
      }


      try {

        const response =
          await fetch(
            `${API_BASE_URL}/shipments`,
            {
              method: "POST",

              headers: {
                ...getSettingsHeaders(),
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
  order:
  window.selectedShipmentOrder?._id ||
  null,

  origin,
  destination,
  quantity,
  eta,
  temperature,
  driver,
  vehicle
})

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to create shipment"
          );

        }

        // Move linked order to Processing
const linkedOrder =
  window.selectedShipmentOrder;

if (linkedOrder?._id) {

  const orderResponse =
    await fetch(
      `${API_BASE_URL}/orders/${linkedOrder._id}/status`,
      {
        method: "PUT",

        headers: {
          ...getSettingsHeaders(),
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          status: "Processing"
        })
      }
    );


  if (!orderResponse.ok) {

    console.warn(
      "Shipment created, but order could not be moved to Processing."
    );

  }

}


        closeShipmentModal();

       const shipmentModal =
  document.getElementById("shipmentModal");

shipmentModal
  ?.querySelectorAll("input")
  .forEach(input => {
    input.value = "";
  });

        await loadShipments();

        window.selectedShipmentOrder = null;

await loadOrders();

showToast(
  `Shipment ${data.shipment?.shipmentId || ""} created successfully.`,
  "success"
);


      } catch (error) {

        console.error(
          "Create shipment error:",
          error
        );
showToast(
  error.message ||
  "Unable to create shipment.",
  "error"
);
      }

    }
  );


// ================= UPDATE SHIPMENT STATUS =================

document
  .getElementById("updateShipmentStatusBtn")
  ?.addEventListener(
    "click",
    async () => {

      if (!selectedShipment?._id) {
        showToast("No shipment selected.", "error");
        return;
      }

      const status =
        document
          .getElementById("shipmentStatusSelect")
          ?.value;

      const progress =
        Number(
          document
            .getElementById("shipmentProgressInput")
            ?.value
        );


      if (
        !status ||
        !Number.isFinite(progress) ||
        progress < 0 ||
        progress > 100
      ) {

        showToast(
          "Please enter a progress value between 0 and 100.",
          "error"
        );

        return;
      }


      try {

        const response =
          await fetch(
            `${API_BASE_URL}/shipments/${selectedShipment._id}/status`,
            {
              method: "PUT",

              headers: {
                ...getSettingsHeaders(),
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                status,
                progress
              })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to update shipment"
          );

        }


        showToast(
  `Shipment ${data.shipment?.shipmentId || selectedShipment.shipmentId} updated — ${status} (${progress}%).`,
  "success"
);


        closeShipmentDrawer();

        await loadShipments();


      } catch (error) {

        console.error(
          "Update shipment error:",
          error
        );

        showToast(
  error.message ||
  "Unable to update shipment.",
  "error"
);

      }

    }
  );

// ================= REPORT ISSUE =================

const issueReportModal =
  document.getElementById("issueReportModal");

const issueReportShipmentId =
  document.getElementById("issueReportShipmentId");

const issueReportType =
  document.getElementById("issueReportType");

const issueReportComment =
  document.getElementById("issueReportComment");

const issueReportMessage =
  document.getElementById("issueReportMessage");


function openIssueReportModal() {

  if (!selectedShipment?._id) {
    showToast("No shipment selected.", "error");
    return;
  }

  issueReportShipmentId.textContent =
    selectedShipment.shipmentId || "—";

  issueReportType.value = "Other";
  issueReportComment.value = "";

  issueReportMessage?.classList.add("hidden");

  issueReportModal?.classList.remove("hidden");
}


function closeIssueReportModal() {
  issueReportModal?.classList.add("hidden");
}


document
  .getElementById("shipmentAlertBtn")
  ?.addEventListener(
    "click",
    openIssueReportModal
  );


document
  .getElementById("issueReportClose")
  ?.addEventListener(
    "click",
    closeIssueReportModal
  );


document
  .getElementById("issueReportCancel")
  ?.addEventListener(
    "click",
    closeIssueReportModal
  );


issueReportModal?.addEventListener(
  "click",
  event => {
    if (event.target === issueReportModal) {
      closeIssueReportModal();
    }
  }
);


document
  .getElementById("submitIssueReport")
  ?.addEventListener(
    "click",
    async () => {

      if (!selectedShipment?.shipmentId) {
        showToast("No shipment selected.", "error");
        return;
      }

      const comment =
        issueReportComment?.value.trim();

      if (!comment) {
        showToast(
          "Please add a personal comment.",
          "error"
        );
        issueReportComment?.focus();
        return;
      }

      const submitButton =
        document.getElementById(
          "submitIssueReport"
        );

      submitButton.disabled = true;
      submitButton.textContent =
        "Submitting...";

      try {

        const response = await fetch(
          `${API_BASE_URL}/issue-reports`,
          {
            method: "POST",

            headers: {
              ...getSettingsHeaders(),
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              shipmentId:
                selectedShipment.shipmentId,

              issueType:
                issueReportType?.value || "Other",

              comment
            })
          }
        );


        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.message ||
            "Unable to submit issue report"
          );
        }


        closeIssueReportModal();

        showToast(
          "Issue reported successfully.",
          "success"
        );

      } catch (error) {

        console.error(
          "Issue report error:",
          error
        );

        showToast(
          error.message ||
          "Unable to submit issue report.",
          "error"
        );

      } finally {

        submitButton.disabled = false;
        submitButton.textContent =
          "Submit report";
      }
    }
  );


// ================= INITIAL LOAD =================

loadShipments();

// ============================================================
// FINAL FRONTEND PASS — QUICK ACTIONS + ORDERS
// ============================================================


// ================= QUICK ACTIONS =================

const quickModal = document.getElementById("quickModal");

function closeQuickModal() {
  quickModal?.classList.add("hidden");
}

document.getElementById("quickModalClose")?.addEventListener(
  "click",
  closeQuickModal
);

quickModal?.addEventListener("click", event => {
  if (event.target === quickModal) {
    closeQuickModal();
  }
});


// Add inventory
document.getElementById("quickAddInventory")?.addEventListener(
  "click",
  () => {
    closeQuickModal();

    showPage("inventory");

    setTimeout(() => {
      document.getElementById("addInventoryBtn")?.click();
    }, 100);
  }
);


// Create shipment
document.getElementById("quickCreateShipment")?.addEventListener(
  "click",
  () => {
    closeQuickModal();

    showPage("shipments");

    setTimeout(() => {
      document.getElementById("newShipmentBtn")?.click();
    }, 100);
  }
);


// Review alerts
document.getElementById("quickReviewAlerts")?.addEventListener(
  "click",
  () => {
    closeQuickModal();
    showPage("alerts");
  }
);


// ================= ORDERS =================

const orderModal = document.getElementById("orderModal");
const ordersTableBody = document.getElementById("ordersTableBody");
const pendingOrderCount = document.getElementById("pendingOrderCount");

let orders = [];
let selectedOrder = null;

// ================= ORDER MODAL =================

const createOrderModal =
  document.getElementById("createOrderModal");

function openOrderModal() {
  createOrderModal?.classList.remove("hidden");
}

function closeOrderModal() {
  createOrderModal?.classList.add("hidden");
}

document.getElementById("createOrderBtn")?.addEventListener(
  "click",
  openOrderModal
);

document.getElementById("createOrderClose")?.addEventListener(
  "click",
  closeOrderModal
);

document.getElementById("createOrderCancel")?.addEventListener(
  "click",
  closeOrderModal
);

createOrderModal?.addEventListener("click", event => {
  if (event.target === createOrderModal) {
    closeOrderModal();
  }
});


// ================= LOAD ORDERS =================

async function loadOrders() {

  if (!getToken()) return;

  try {

    const response = await fetch(
      `${API_BASE_URL}/orders`,
      {
        headers: getSettingsHeaders()
      }
    );

    if (!response.ok) {
      throw new Error("Unable to load orders");
    }

    const data = await response.json();

    orders = Array.isArray(data)
      ? data
      : (data.orders || []);

    renderOrders();

  } catch (error) {

    console.error("Orders load error:", error);

    if (ordersTableBody) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;">
            Unable to load orders.
          </td>
        </tr>
      `;
    }
  }
}


// ================= RENDER ORDERS =================

function renderOrders() {

  if (!ordersTableBody) return;

  ordersTableBody.innerHTML = "";

  if (!orders.length) {

    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">
          No orders found.
        </td>
      </tr>
    `;

    if (pendingOrderCount) {
      pendingOrderCount.textContent = "0";
    }

    return;
  }


  const pendingOrders = orders.filter(
    order => order.status === "Pending"
  );

  if (pendingOrderCount) {
    pendingOrderCount.textContent = pendingOrders.length;
  }


  orders.forEach(order => {

    const row = document.createElement("tr");

    row.className = "order-row";

    const orderId =
      order.orderNumber ||
      order.orderId ||
      order._id ||
      "N/A";

    const facility =
      order.destination ||
      order.facility ||
      "—";

    const quantity =
      Number(order.quantity || 0);

    const supplier =
      order.supplier ||
      "—";

    const date = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric"
          }
        )
      : "—";

    const status =
      order.status ||
      "Pending";


    row.dataset.orderId = order._id || "";
    row.dataset.orderNumber = orderId;
    row.dataset.status = status;
    row.dataset.facility = facility;
    row.dataset.items = quantity.toLocaleString();
    row.dataset.supplier = supplier;
    row.dataset.date = date;


    row.innerHTML = `
      <td>
        <b>#${orderId}</b>
      </td>

      <td>
        ${facility}
      </td>

      <td>
        ${quantity.toLocaleString()}
      </td>

      <td>
        ${supplier}
      </td>

      <td>
        ${date}
      </td>

      <td>
        <span class="status ${getOrderStatusClass(status)}">
          ${status}
        </span>
      </td>
    `;


    row.addEventListener("click", () => {
      openOrderDrawer(row, order);
    });


    ordersTableBody.appendChild(row);

  });
}


// ================= STATUS STYLE =================

function getOrderStatusClass(status) {

  switch (status) {

    case "Approved":
      return "success";

    case "Processing":
      return "info";

    case "Completed":
      return "success";

    case "Cancelled":
      return "danger";

    case "Pending":
    default:
      return "warning";
  }
}


// ================= CREATE ORDER =================

document.getElementById("confirmCreateOrder")?.addEventListener(
  "click",
  async () => {

    const medicine =
      document.getElementById("orderMedicine")?.value.trim();

    const quantity =
      Number(
        document.getElementById("orderQuantity")?.value
      );

    const supplier =
      document.getElementById("orderSupplier")?.value.trim();

    const facility =
      document.getElementById("orderFacility")?.value.trim();

    const priority =
      document.getElementById("orderPriority")?.value ||
      "Normal";


    if (
      !medicine ||
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      showToast("Please enter a valid medicine quantity.", "error");
      return;
    }


    if (!supplier || !facility) {
      showToast("Please select a supplier and facility.", "error");
      return;
    }


    try {

      const response = await fetch(
        `${API_BASE_URL}/orders`,
        {
          method: "POST",

          headers: {
            ...getSettingsHeaders(),
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            medicine,
            supplier,
            facility,
            quantity,
            priority
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to create order"
        );
      }


      closeOrderModal();


      // Reset form
      const quantityInput =
        document.getElementById("orderQuantity");

      if (quantityInput) {
        quantityInput.value = "";
      }


      await loadOrders();


      const createdOrder = data.order;

      const createdId =
        createdOrder?._id ||
        "New order";


      showToast(
        `Order ${createdId} created — ${medicine} (${quantity.toLocaleString()} units).`,
        "success"
      );


    } catch (error) {

      console.error("Create order error:", error);

      showToast(
        error.message ||
        "Unable to create order.",
        "error"
      );
    }

  }
);


// ================= ORDER EXPORT =================

document.getElementById("exportOrdersBtn")?.addEventListener(
  "click",
  () => {

    const rows = [
      [
        "Order",
        "Requested by",
        "Items",
        "Supplier",
        "Date",
        "Status"
      ]
    ];


    document
      .querySelectorAll("#ordersTableBody tr")
      .forEach(row => {

        const cells =
          row.querySelectorAll("td");

        if (cells.length < 6) return;


        rows.push([
          cells[0].textContent.trim(),
          cells[1].textContent.trim(),
          cells[2].textContent.trim(),
          cells[3].textContent.trim(),
          cells[4].textContent.trim(),
          cells[5].textContent.trim()
        ]);

      });


    const csv = rows
      .map(row =>
        row
          .map(value =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");


    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;"
      }
    );


    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "medichain-orders.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

  }
);


// ================= ORDER DRAWER =================

const orderDrawer =
  document.getElementById("orderDrawer");

const orderDrawerBackdrop =
  document.getElementById("orderDrawerBackdrop");

const orderDrawerId =
  document.getElementById("orderDrawerId");

const orderDrawerStatus =
  document.getElementById("orderDrawerStatus");

const orderDrawerStatusBadge =
  document.getElementById("orderDrawerStatusBadge");

const orderDrawerFacility =
  document.getElementById("orderDrawerFacility");

const orderDrawerItems =
  document.getElementById("orderDrawerItems");

const orderDrawerSupplier =
  document.getElementById("orderDrawerSupplier");

const orderDrawerDate =
  document.getElementById("orderDrawerDate");

const orderTimelineDate =
  document.getElementById("orderTimelineDate");

const orderDrawerClose =
  document.getElementById("orderDrawerClose");

const orderDrawerCloseAction =
  document.getElementById("orderDrawerCloseAction");

const orderApproveBtn =
  document.getElementById("orderApproveBtn");

const orderCreateShipmentBtn =
  document.getElementById("orderCreateShipmentBtn");


function openOrderDrawer(row, order) {

  selectedOrder = order;

  const data = row.dataset;

  if (orderDrawerId) {
    orderDrawerId.textContent =
      `#${data.orderNumber || data.orderId}`;
  }

  if (orderDrawerStatus) {
    orderDrawerStatus.textContent =
      data.status;
  }

  if (orderDrawerStatusBadge) {
    orderDrawerStatusBadge.textContent =
      data.status;
  }

  if (orderDrawerFacility) {
    orderDrawerFacility.textContent =
      data.facility;
  }

  if (orderDrawerItems) {
    orderDrawerItems.textContent =
      data.items;
  }

  if (orderDrawerSupplier) {
    orderDrawerSupplier.textContent =
      data.supplier;
  }

  if (orderDrawerDate) {
    orderDrawerDate.textContent =
      data.date;
  }

  if (orderTimelineDate) {
    orderTimelineDate.textContent =
      data.date;
  }


  // ============================
  // APPROVE BUTTON
  // ============================

  if (orderApproveBtn) {

    const canApprove =
      data.status === "Pending";

    orderApproveBtn.style.display =
      canApprove ? "" : "none";
  }


  // ============================
  // CREATE SHIPMENT BUTTON
  // ============================

  if (orderCreateShipmentBtn) {

    const canCreateShipment =
      data.status === "Approved" ||
      data.status === "Processing";

    orderCreateShipmentBtn.style.display =
      canCreateShipment ? "" : "none";
  }


  orderDrawer?.classList.remove("hidden");
  orderDrawer?.classList.add("open");

  orderDrawerBackdrop?.classList.remove("hidden");

  orderDrawer?.setAttribute(
    "aria-hidden",
    "false"
  );
}


// ================= CLOSE DRAWER =================

function closeOrderDrawer() {

  orderDrawer?.classList.remove("open");

  orderDrawer?.classList.add("hidden");

  orderDrawerBackdrop?.classList.add("hidden");

  orderDrawer?.setAttribute(
    "aria-hidden",
    "true"
  );

  selectedOrder = null;
}


orderDrawerClose?.addEventListener(
  "click",
  closeOrderDrawer
);

orderDrawerCloseAction?.addEventListener(
  "click",
  closeOrderDrawer
);

orderDrawerBackdrop?.addEventListener(
  "click",
  closeOrderDrawer
);


// ================= APPROVE ORDER =================

orderApproveBtn?.addEventListener(
  "click",
  async () => {

    if (!selectedOrder?._id) {

      showToast(
        "Invalid order.",
        "error"
      );

      return;
    }


    try {

      const response = await fetch(
        `${API_BASE_URL}/orders/${selectedOrder._id}/status`,
        {
          method: "PUT",

          headers: {
            ...getSettingsHeaders(),
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            status: "Approved"
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to approve order"
        );
      }


      closeOrderDrawer();

      await loadOrders();


      showToast(
        "Order approved successfully.",
        "success"
      );


    } catch (error) {

      console.error(
        "Approve order error:",
        error
      );

      showToast(
        error.message ||
        "Unable to approve order.",
        "error"
      );

    }

  }
);


// ================= CREATE SHIPMENT FROM ORDER =================
orderCreateShipmentBtn?.addEventListener(
  "click",
  () => {

    if (!selectedOrder?._id) {
      showToast("Invalid order.", "error");
      return;
    }

    const order = selectedOrder;

    // Store BEFORE opening shipment modal
    window.selectedShipmentOrder = order;

    closeOrderDrawer();

    const shipmentNav =
      document.querySelector(
        '[data-page="shipments"]'
      );

    if (shipmentNav) {
      shipmentNav.click();
    }

    setTimeout(() => {

      const newShipmentBtn =
        document.getElementById("newShipmentBtn");

      if (newShipmentBtn) {
        newShipmentBtn.click();
      }

    }, 100);

  }
);

// ================= INITIAL LOAD =================

loadOrders();



// ============================================================
// SUPPLIERS
// ============================================================

const supplierGrid =
  document.getElementById("supplierGrid");

const supplierModal =
  document.getElementById("supplierModal");

const addSupplierBtn =
  document.getElementById("addSupplierBtn");

const supplierModalClose =
  document.getElementById("supplierModalClose");

const supplierCancel =
  document.getElementById("supplierCancel");

const confirmSupplier =
  document.getElementById("confirmSupplier");

const supplierName =
  document.getElementById("supplierName");

const supplierCode =
  document.getElementById("supplierCode");

const supplierCategory =
  document.getElementById("supplierCategory");


function openSupplierModal() {

  supplierModal?.classList.remove("hidden");

}


function closeSupplierModal() {

  supplierModal?.classList.add("hidden");

}


addSupplierBtn?.addEventListener(
  "click",
  openSupplierModal
);


supplierModalClose?.addEventListener(
  "click",
  closeSupplierModal
);


supplierCancel?.addEventListener(
  "click",
  closeSupplierModal
);


supplierModal?.addEventListener(
  "click",
  event => {

    if (event.target === supplierModal) {
      closeSupplierModal();
    }

  }
);


// ============================================================
// LOAD SUPPLIERS
// ============================================================

async function loadSuppliers() {

  const token = getToken();

  if (!token) return;

  if (!supplierGrid) return;

  try {

    const response = await fetch(
      `${API_BASE_URL}/suppliers`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );


    const data = await response.json();


    if (!response.ok) {

      throw new Error(
        data.message || "Failed to load suppliers"
      );

    }


    const suppliers =
      data.suppliers || data || [];


    supplierGrid.innerHTML = "";


    if (!suppliers.length) {

      supplierGrid.innerHTML = `
        <div class="panel">
          <p>No suppliers registered yet.</p>
        </div>
      `;

      return;

    }


    suppliers.forEach(supplier => {

      const card =
        document.createElement("article");


      card.className = "supplier-card";


      const initials =
        supplier.name
          ? supplier.name
              .split(/\s+/)
              .map(word => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          : "SU";


      card.innerHTML = `

        <div class="supplier-logo">
          ${initials}
        </div>

        <div>
          <h3>${supplier.name || "Unnamed supplier"}</h3>

          <small>
            ${supplier.category || "General medicines"}
          </small>
        </div>

        <span class="rating">
          ${Number(supplier.rating || 0).toFixed(1)}%
        </span>

        <div class="supplier-stats">

          <span>
            <b>${Number(supplier.onTimeRate || 0).toFixed(1)}%</b>
            <small>On-time</small>
          </span>

          <span>
            <b>${supplier.activeOrders || 0}</b>
            <small>Active orders</small>
          </span>

          <span>
            <b>${Number(supplier.reliability || 0).toFixed(1)}/5</b>
            <small>Reliability</small>
          </span>

        </div>

      `;


      supplierGrid.appendChild(card);

    });


  } catch (error) {

    console.error(
      "Load suppliers error:",
      error
    );


    supplierGrid.innerHTML = `
      <div class="panel">
        <p>Unable to load suppliers.</p>
      </div>
    `;

  }

}


// ============================================================
// CREATE SUPPLIER
// ============================================================

confirmSupplier?.addEventListener(
  "click",
  async () => {

    const name =
      supplierName?.value.trim();

    const code =
      supplierCode?.value.trim();

    const category =
      supplierCategory?.value.trim();


    if (!name || !code || !category) {

      showToast(
        "Please fill in supplier name, code and category.",
        "error"
      );

      return;

    }


    const token = getToken();


    if (!token) {

      showToast("Please login first.", "error");

      return;

    }


    confirmSupplier.disabled = true;

    confirmSupplier.textContent =
      "Adding...";


    try {

      const response = await fetch(
        `${API_BASE_URL}/suppliers`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({

            name,
            code,
            category,

            onTimeRate: 0,
            activeOrders: 0,
            reliability: 0,
            rating: 0,
            status: "Active"

          })
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to create supplier"
        );

      }


      console.log(
        "Supplier created:",
        data
      );


      closeSupplierModal();


      supplierName.value = "";
      supplierCode.value = "";
      supplierCategory.value = "";


      await loadSuppliers();


      showToast(
        "Supplier added successfully.",
        "success"
      );


    } catch (error) {

      console.error(
        "Create supplier error:",
        error
      );


      showToast(
        error.message ||
        "Failed to create supplier",
        "error"
      );


    } finally {

      confirmSupplier.disabled = false;

      confirmSupplier.textContent =
        "Add supplier";

    }

  }
);


// Load suppliers on startup
loadSuppliers();


// ============================================================
// ALERTS
// ============================================================

const alertsList = document.getElementById("alertsList");
const markAllAlertsReviewed =
  document.getElementById("markAllAlertsReviewed");

  const generateAlertsBtn =
  document.getElementById("generateAlertsBtn");

const criticalAlertCount =
  document.getElementById("criticalAlertCount");

const warningAlertCount =
  document.getElementById("warningAlertCount");

const infoAlertCount =
  document.getElementById("infoAlertCount");


async function loadAlerts() {
  const token = getToken();

  if (!token || !alertsList) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/alerts`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid server response");
    }

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load alerts"
      );
    }

    const alerts = data.alerts || data || [];

   const critical = alerts.filter(
  alert =>
    String(alert.severity || "").toLowerCase() === "critical" &&
    !alert.reviewed
).length;

const warning = alerts.filter(
  alert =>
    String(alert.severity || "").toLowerCase() === "warning" &&
    !alert.reviewed
).length;

const info = alerts.filter(
  alert =>
    String(alert.severity || "").toLowerCase() === "info" &&
    !alert.reviewed
).length;

    const activeAlerts =
  alerts.filter(alert => !alert.reviewed).length;

const alertsNavBadge =
  document.getElementById("alertsNavBadge");

if (alertsNavBadge) {
  alertsNavBadge.textContent = activeAlerts;
  alertsNavBadge.style.display =
    activeAlerts > 0 ? "inline-flex" : "none";
}

    if (criticalAlertCount) {
      criticalAlertCount.textContent = critical;
    }

    if (warningAlertCount) {
      warningAlertCount.textContent = warning;
    }

    if (infoAlertCount) {
      infoAlertCount.textContent = info;
    }

    alertsList.innerHTML = "";

    if (!alerts.length) {
      alertsList.innerHTML = `
        <div class="large-alert info">
          <span class="severity info-bg">i</span>
          <div>
            <b>No alerts</b>
            <p>
              There are currently no disruptions,
              stock risks or compliance events.
            </p>
          </div>
        </div>
      `;

      return;
    }

    alerts.forEach(alert => {
      const severityClass =
        alert.severity === "Critical"
          ? "critical"
          : alert.severity === "Warning"
            ? "warning"
            : "info";

      const severityIcon =
        alert.severity === "Info" ? "i" : "!";

      const detected = alert.createdAt
        ? new Date(alert.createdAt).toLocaleString()
        : "Recently";

      const recommendation =
        alert.recommendation
          ? `<small>Recommended action: ${alert.recommendation}</small>`
          : "";

      const actionButton = alert.reviewed
        ? `<button class="ghost-btn" disabled>Reviewed</button>`
        : `<button
            class="primary-btn review-alert-btn"
            data-alert-id="${alert._id}"
          >
            Review action
          </button>`;

      const item = document.createElement("div");

      item.className = `large-alert ${severityClass}`;

      item.innerHTML = `
        <span class="severity ${severityClass}-bg">
          ${severityIcon}
        </span>

        <div>
          <b>${alert.title || "Alert"}</b>

          <p>
            ${alert.message || ""}
          </p>

          <small>
            Detected ${detected}
            ${recommendation ? " · " : ""}
          </small>

          ${recommendation}
        </div>

        ${actionButton}
      `;

      alertsList.appendChild(item);
    });

    document
      .querySelectorAll(".review-alert-btn")
      .forEach(button => {
        button.addEventListener("click", () => {
          reviewAlert(button.dataset.alertId);
        });
      });

  } catch (error) {
    console.error("Load alerts error:", error);

    alertsList.innerHTML = `
      <div class="large-alert critical">
        <span class="severity critical-bg">!</span>
        <div>
          <b>Unable to load alerts</b>
          <p>${error.message}</p>
        </div>
      </div>
    `;
  }
}

async function generateAutomatedAlerts() {
  const token = getToken();

  if (!token) {
    showToast("Please login first.", "error");
    return;
  }

  if (!generateAlertsBtn) return;

  try {
    generateAlertsBtn.disabled = true;
    generateAlertsBtn.textContent = "Generating...";

    const response = await fetch(
      `${API_BASE_URL}/alerts/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to generate alerts"
      );
    }

    await loadAlerts();

    showToast(
      `${data.generated || 0} automated alert${data.generated === 1 ? "" : "s"} generated.`,
      "success"
    );

  } catch (error) {
    console.error(
      "Generate automated alerts error:",
      error
    );

    showToast(
      error.message || "Failed to generate alerts",
      "error"
    );

  } finally {
    generateAlertsBtn.disabled = false;
    generateAlertsBtn.textContent = "↻ Generate alerts";
  }
}

generateAlertsBtn?.addEventListener(
  "click",
  generateAutomatedAlerts
);


async function reviewAlert(alertId) {
  const token = getToken();

  if (!token || !alertId) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/alerts/${alertId}/review`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to review alert"
      );
    }

    await loadAlerts();

  } catch (error) {
    console.error("Review alert error:", error);

    showToast(
      error.message || "Failed to review alert",
      "error"
    );
  }
}


markAllAlertsReviewed?.addEventListener(
  "click",
  async () => {

    const token = getToken();

    if (!token) {
      showToast("Please login first.", "error");
      return;
    }

    try {
      markAllAlertsReviewed.disabled = true;
      markAllAlertsReviewed.textContent = "Updating...";

      const response = await fetch(
        `${API_BASE_URL}/alerts/review-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to review alerts"
        );
      }

      await loadAlerts();

      showToast(
        "All alerts marked as reviewed.",
        "success"
      );

    } catch (error) {
      console.error(
        "Mark all alerts reviewed error:",
        error
      );

      showToast(
        error.message ||
        "Failed to mark alerts as reviewed",
        "error"
      );

    } finally {
      markAllAlertsReviewed.disabled = false;
      markAllAlertsReviewed.textContent =
        "Mark all reviewed";
    }
  }
);

// =====================================================
// MEDICINE MASTER
// =====================================================

let medicineMasterList = [];

const medicineSearchInput =
  document.getElementById("medicineSearchInput");

const medicineCategoryFilter =
  document.getElementById("medicineCategoryFilter");

const medicinePrescriptionFilter =
  document.getElementById("medicinePrescriptionFilter");

const medicineTableBody =
  document.getElementById("medicinesTableBody");

const medicineTotalCount =
  document.getElementById("medicineTotalCount");

const essentialMedicineCount =
  document.getElementById("essentialMedicineCount");

const prescriptionMedicineCount =
  document.getElementById("prescriptionMedicineCount");

const medicineCategoryCount =
  document.getElementById("medicineCategoryCount");

const refreshMedicinesBtn =
  document.getElementById("refreshMedicinesBtn");


async function loadMedicines() {

  const token = getToken();

  if (!token) {
    showToast("Please login first.", "error");
    return;
  }

  if (!medicineTableBody) return;

  try {

    medicineTableBody.innerHTML = `
      <tr>
        <td colspan="8">Loading medicines...</td>
      </tr>
    `;

    const response = await fetch(
      `${API_BASE_URL}/medicines`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load medicines"
      );
    }

    medicineMasterList =
      Array.isArray(data)
        ? data
        : data.medicines || [];

    updateMedicineSummary();
    populateMedicineCategories();
    renderMedicines();

  } catch (error) {

    console.error(
      "Medicine master error:",
      error
    );

    medicineTableBody.innerHTML = `
      <tr>
        <td colspan="8">
          Unable to load medicines.
        </td>
      </tr>
    `;

    showToast(
      error.message || "Failed to load medicines",
      "error"
    );
  }
}


function updateMedicineSummary() {

  if (!medicineMasterList.length) {

    if (medicineTotalCount)
      medicineTotalCount.textContent = "0";

    if (essentialMedicineCount)
      essentialMedicineCount.textContent = "0";

    if (prescriptionMedicineCount)
      prescriptionMedicineCount.textContent = "0";

    if (medicineCategoryCount)
      medicineCategoryCount.textContent = "0";

    return;
  }

  const categories = new Set(
    medicineMasterList
      .map(medicine => medicine.category)
      .filter(Boolean)
  );

  const essentialCount =
    medicineMasterList.filter(
      medicine => medicine.essentialMedicine
    ).length;

  const prescriptionCount =
    medicineMasterList.filter(
      medicine => medicine.prescriptionRequired
    ).length;

  medicineTotalCount.textContent =
    medicineMasterList.length;

  essentialMedicineCount.textContent =
    essentialCount;

  prescriptionMedicineCount.textContent =
    prescriptionCount;

  medicineCategoryCount.textContent =
    categories.size;
}


function populateMedicineCategories() {

  if (!medicineCategoryFilter) return;

  const currentValue =
    medicineCategoryFilter.value;

  const categories = [
    ...new Set(
      medicineMasterList
        .map(medicine => medicine.category)
        .filter(Boolean)
    )
  ].sort();

  medicineCategoryFilter.innerHTML = `
    <option value="">All categories</option>
  `;

  categories.forEach(category => {

    const option =
      document.createElement("option");

    option.value = category;
    option.textContent = category;

    medicineCategoryFilter.appendChild(option);
  });

  if (categories.includes(currentValue)) {
    medicineCategoryFilter.value =
      currentValue;
  }
}


function renderMedicines() {

  if (!medicineTableBody) return;

  const search =
    (medicineSearchInput?.value || "")
      .trim()
      .toLowerCase();

  const category =
    medicineCategoryFilter?.value || "";

  const prescription =
    medicinePrescriptionFilter?.value || "";

  const filteredMedicines =
    medicineMasterList.filter(medicine => {

      const searchableText = [
        medicine.genericName,
        medicine.brandName,
        medicine.manufacturer,
        medicine.strength,
        medicine.dosageForm,
        medicine.category
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      const matchesCategory =
        !category ||
        medicine.category === category;

      const matchesPrescription =
        !prescription ||
        (prescription === "yes"
          ? medicine.prescriptionRequired === true
          : medicine.prescriptionRequired === false);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrescription
      );
    });


  if (!filteredMedicines.length) {

    medicineTableBody.innerHTML = `
      <tr>
        <td colspan="8">
          No medicines found.
        </td>
      </tr>
    `;

    return;
  }


  medicineTableBody.innerHTML = "";

  filteredMedicines.forEach(medicine => {

    const row =
      document.createElement("tr");

    row.style.cursor = "pointer";

    row.innerHTML = `
      <td>
        <strong>
          ${escapeSearchText(
            medicine.genericName || "—"
          )}
        </strong>
      </td>

      <td>
        ${escapeSearchText(
          medicine.brandName || "—"
        )}
      </td>

      <td>
        ${escapeSearchText(
          medicine.manufacturer || "—"
        )}
      </td>

      <td>
        ${escapeSearchText(
          medicine.strength || "—"
        )}
      </td>

      <td>
        ${escapeSearchText(
          medicine.dosageForm || "—"
        )}
      </td>

      <td>
        ${escapeSearchText(
          medicine.category || "—"
        )}
      </td>

      <td>
        ${
          medicine.essentialMedicine
            ? '<span class="status-badge healthy">Yes</span>'
            : '<span class="status-badge">No</span>'
        }
      </td>

      <td>
        ${
          medicine.prescriptionRequired
            ? '<span class="status-badge warning">Required</span>'
            : '<span class="status-badge healthy">No</span>'
        }
      </td>
    `;

   row.addEventListener("click", () => {
  openMedicineDrawer(medicine);
});

medicineTableBody.appendChild(row);
  });
}


medicineSearchInput?.addEventListener(
  "input",
  renderMedicines
);

medicineCategoryFilter?.addEventListener(
  "change",
  renderMedicines
);

medicinePrescriptionFilter?.addEventListener(
  "change",
  renderMedicines
);

refreshMedicinesBtn?.addEventListener(
  "click",
  loadMedicines
);



 function openMedicineDrawer(medicine) {

  const drawer =
    document.getElementById("medicineDrawer");

  const backdrop =
    document.getElementById("medicineDrawerBackdrop");

  if (!drawer || !backdrop || !medicine) return;


  document.getElementById(
    "medicineDrawerName"
  ).textContent =
    medicine.genericName || "Medicine";


  document.getElementById(
    "medicineDrawerBrand"
  ).textContent =
    medicine.brandName || "No brand specified";


  document.getElementById(
    "medicineDrawerManufacturer"
  ).textContent =
    medicine.manufacturer || "—";


  document.getElementById(
    "medicineDrawerStrength"
  ).textContent =
    medicine.strength || "—";


  document.getElementById(
    "medicineDrawerDosage"
  ).textContent =
    medicine.dosageForm || "—";


  document.getElementById(
    "medicineDrawerCategory"
  ).textContent =
    medicine.category || "—";


  document.getElementById(
    "medicineDrawerStorage"
  ).textContent =
    medicine.storageConditions || "—";


  document.getElementById(
    "medicineDrawerSource"
  ).textContent =
    medicine.source || "—";


  document.getElementById(
    "medicineDrawerReference"
  ).textContent =
    medicine.sourceReference || "—";


  const essential =
    document.getElementById(
      "medicineDrawerEssential"
    );

  essential.textContent =
    medicine.essentialMedicine
      ? "Essential medicine"
      : "Non-essential";

  essential.className =
    medicine.essentialMedicine
      ? "status-badge healthy"
      : "status-badge";


  const prescription =
    document.getElementById(
      "medicineDrawerPrescription"
    );

  prescription.textContent =
    medicine.prescriptionRequired
      ? "Prescription required"
      : "No prescription";


  prescription.className =
    medicine.prescriptionRequired
      ? "status-badge warning"
      : "status-badge healthy";


  const addButton =
    document.getElementById(
      "medicineAddInventoryBtn"
    );

  if (addButton) {

  addButton.onclick = () => {

    selectedMedicineForInventory = medicine;

    closeMedicineDrawer();

    openAddInventoryModal();

    const nameInput =
      document.getElementById("inventoryName");

    const manufacturerInput =
      document.getElementById("inventoryManufacturer");

    if (nameInput) {
      nameInput.value =
        medicine.genericName || "";
    }

    if (manufacturerInput) {
      manufacturerInput.value =
        medicine.manufacturer || "";
    }

    showToast(
      `${medicine.genericName} selected for inventory.`,
      "success"
    );

  };

}


  drawer.classList.add("open");

  drawer.setAttribute(
    "aria-hidden",
    "false"
  );

  backdrop.classList.remove("hidden");
}


function closeMedicineDrawer() {

  const drawer =
    document.getElementById("medicineDrawer");

  const backdrop =
    document.getElementById(
      "medicineDrawerBackdrop"
    );


  if (drawer) {

    drawer.classList.remove("open");

    drawer.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  if (backdrop) {

    backdrop.classList.add(
      "hidden"
    );

  }

}


document.addEventListener(
  "click",
  event => {

    if (
      event.target.closest(
        "#medicineDrawerClose"
      )
    ) {
      closeMedicineDrawer();
    }


    if (
      event.target.id ===
      "medicineDrawerBackdrop"
    ) {
      closeMedicineDrawer();
    }

  }
);

// ============================================================
// ANALYTICS
// ============================================================

const analyticsOrderFulfillment =
  document.getElementById("analyticsOrderFulfillment");

const analyticsOnTimeDelivery =
  document.getElementById("analyticsOnTimeDelivery");

const analyticsStockHealth =
  document.getElementById("analyticsStockHealth");

const analyticsExpiryPrevention =
  document.getElementById("analyticsExpiryPrevention");

const analyticsInventory =
  document.getElementById("analyticsInventory");

const analyticsMedicines =
  document.getElementById("analyticsMedicines");

const analyticsSuppliers =
  document.getElementById("analyticsSuppliers");

const analyticsActiveSuppliers =
  document.getElementById("analyticsActiveSuppliers");

const analyticsShipments =
  document.getElementById("analyticsShipments");

const analyticsExpired =
  document.getElementById("analyticsExpired");

const analyticsTrendChart =
  document.getElementById("analyticsTrendChart");


async function loadAnalytics() {
  const token = getToken();

  if (!token) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/analytics`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load analytics"
      );
    }

    const metrics = data.metrics || {};
    const inventory = data.inventory || {};
    const network = data.network || {};
    const trends = data.trends || [];

    if (analyticsOrderFulfillment) {
      analyticsOrderFulfillment.textContent =
        `${Number(metrics.orderFulfillment || 0).toFixed(1)}%`;
    }

    if (analyticsOnTimeDelivery) {
      analyticsOnTimeDelivery.textContent =
        `${Number(metrics.onTimeDelivery || 0).toFixed(1)}%`;
    }

    if (analyticsStockHealth) {
      analyticsStockHealth.textContent =
        `${Number(metrics.stockHealth || 0).toFixed(1)}%`;
    }

    if (analyticsExpiryPrevention) {
      analyticsExpiryPrevention.textContent =
        `${Number(metrics.expiryPrevention || 0).toFixed(1)}%`;
    }

    if (analyticsInventory) {
      analyticsInventory.textContent =
        Number(inventory.totalQuantity || 0).toLocaleString();
    }

    if (analyticsMedicines) {
      analyticsMedicines.textContent =
        Number(inventory.totalMedicines || 0).toLocaleString();
    }

    if (analyticsSuppliers) {
      analyticsSuppliers.textContent =
        Number(network.totalSuppliers || 0).toLocaleString();
    }

    if (analyticsActiveSuppliers) {
      analyticsActiveSuppliers.textContent =
        Number(network.activeSuppliers || 0).toLocaleString();
    }

    if (analyticsShipments) {
      analyticsShipments.textContent =
        Number(network.totalShipments || 0).toLocaleString();
    }

    if (analyticsExpired) {
      analyticsExpired.textContent =
        Number(inventory.expired || 0).toLocaleString();
    }

    renderAnalyticsTrend(trends);

  } catch (error) {
    console.error("Analytics error:", error);

    if (analyticsTrendChart) {
      analyticsTrendChart.innerHTML = `
        <p>Unable to load analytics.</p>
      `;
    }
  }
}


function renderAnalyticsTrend(trends) {
  if (!analyticsTrendChart) return;

  if (!trends.length) {
    analyticsTrendChart.innerHTML = `
      <p>No trend data available yet.</p>
    `;
    return;
  }

  const maxValue = Math.max(
    ...trends.flatMap(item => [
      Number(item.demand || 0),
      Number(item.supply || 0)
    ]),
    1
  );

  analyticsTrendChart.innerHTML = `
    <div class="analytics-bars">
      ${trends.map(item => {
        const demand = Number(item.demand || 0);
        const supply = Number(item.supply || 0);

        const demandHeight =
          Math.max(4, (demand / maxValue) * 100);

        const supplyHeight =
          Math.max(4, (supply / maxValue) * 100);

        return `
          <div class="analytics-week">
            <div class="analytics-bar-group">
              <div
                class="analytics-bar demand"
                style="height:${demandHeight}%"
                title="Demand: ${demand}"
              ></div>

              <div
                class="analytics-bar supply"
                style="height:${supplyHeight}%"
                title="Supply: ${supply}"
              ></div>
            </div>

            <small>${item.label}</small>
          </div>
        `;
      }).join("")}
    </div>

    <div class="analytics-legend">
      <span>
        <i class="legend-demand"></i>
        Demand
      </span>

      <span>
        <i class="legend-supply"></i>
        Supply
      </span>
    </div>
  `;
}


loadAnalytics();


// ==================== TRANSFER WAREHOUSES ====================

async function loadTransferWarehouses() {
  const select = document.getElementById("transferDestination");
  const token = getToken();

  if (!select || !token) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/warehouses`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load warehouses"
      );
    }

    const warehouses = Array.isArray(data)
      ? data
      : data.warehouses || [];

    select.innerHTML = "";

    if (!warehouses.length) {
      select.innerHTML =
        `<option value="">No warehouses available</option>`;
      return;
    }

    warehouses.forEach(warehouse => {
      const option = document.createElement("option");

      option.value = warehouse.name;
      option.textContent =
        `${warehouse.name} · ${warehouse.location || ""}`;

      select.appendChild(option);
    });

  } catch (error) {
    console.error(
      "Load transfer warehouses error:",
      error
    );

    select.innerHTML =
      `<option value="">Unable to load warehouses</option>`;
  }
}

loadTransferWarehouses();

// ==================== TRANSFER WAREHOUSES ====================

async function loadTransferWarehouses() {
  const select = document.getElementById("transferDestination");
  const token = getToken();

  if (!select || !token) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/warehouses`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load warehouses"
      );
    }

    const warehouses = Array.isArray(data)
      ? data
      : data.warehouses || [];

    select.innerHTML = "";

    if (!warehouses.length) {
      select.innerHTML =
        `<option value="">No warehouses available</option>`;
      return;
    }

    warehouses.forEach(warehouse => {
      const option = document.createElement("option");

      option.value = warehouse.name;
      option.textContent =
        `${warehouse.name} · ${warehouse.location || ""}`;

      select.appendChild(option);
    });

  } catch (error) {
    console.error(
      "Load transfer warehouses error:",
      error
    );

    select.innerHTML =
      `<option value="">Unable to load warehouses</option>`;
  }
}

loadTransferWarehouses();


// =========================================
// STOCK MOVEMENTS
// =========================================

async function loadMovements() {
  const tableBody = document.getElementById("movementsTableBody");
  const token = getToken();

  if (!tableBody || !token) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="7">Loading stock movements...</td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/movements`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load movements");
    }

    const movements = Array.isArray(data)
      ? data
      : data.movements || [];

    if (!movements.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">No stock movements found.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = "";

    movements.forEach(movement => {
      const row = document.createElement("tr");

      const medicine =
        movement.drug?.name ||
        movement.drug?.genericName ||
        "Unknown medicine";

      const batch = movement.batchNumber || movement.drug?.batchNumber || "—";

      const created = movement.createdAt
        ? new Date(movement.createdAt).toLocaleDateString()
        : "—";

      const status = movement.status || "Pending";

      const statusClass =
        status === "Delivered"
          ? "healthy"
          : status === "Cancelled"
            ? "critical"
            : status === "In Transit"
              ? "info"
              : "warning";

      row.innerHTML = `
        <td>
          <b>${medicine}</b>
        </td>

        <td>${batch}</td>

        <td>
          <small>
            ${movement.fromLocation || "—"}
            →
            ${movement.toLocation || "—"}
          </small>
        </td>

        <td>
          <b>${Number(movement.quantity || 0).toLocaleString()}</b>
          units
        </td>

        <td>${created}</td>

        <td>
          <span class="status ${statusClass}">
            ${status}
          </span>
        </td>

        <td>
          ${getMovementActionButton(movement)}
        </td>
      `;

      tableBody.appendChild(row);
    });

    bindMovementActions();

  } catch (error) {
    console.error("Load movements error:", error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="7">
          Failed to load stock movements.
        </td>
      </tr>
    `;
  }
}


function getMovementActionButton(movement) {
  const status = movement.status;

  if (status === "Pending") {
    return `
      <button
        class="ghost-btn movement-action-btn"
        data-movement-id="${movement._id}"
        data-next-status="In Transit"
      >
        Start transfer
      </button>
    `;
  }

  if (status === "In Transit") {
    return `
      <button
        class="primary-btn movement-action-btn"
        data-movement-id="${movement._id}"
        data-next-status="Delivered"
      >
        Mark delivered
      </button>
    `;
  }

  return `
    <span class="muted-text">No action</span>
  `;
}


function bindMovementActions() {
  document
    .querySelectorAll(".movement-action-btn")
    .forEach(button => {

      button.addEventListener("click", async () => {

        const movementId = button.dataset.movementId;
        const nextStatus = button.dataset.nextStatus;
        const token = getToken();

        if (!movementId || !token) {
          showToast(
            "Unable to update this movement.",
            "error"
          );
          return;
        }

        const originalText = button.textContent;

        button.disabled = true;
        button.textContent = "Updating...";

        try {

          const response = await fetch(
            `${API_BASE_URL}/movements/${movementId}/status`,
            {
              method: "PUT",

              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },

              body: JSON.stringify({
                status: nextStatus
              })
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
              data.error ||
              "Failed to update movement"
            );
          }

          await loadMovements();

          showToast(
  `Movement updated successfully · Status: ${nextStatus}`,
  "success"
);

        } catch (error) {

          console.error(
            "Update movement status error:",
            error
          );

          showToast(
  error.message ||
  "Failed to update movement",
  "error"
);
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
}


document
  .getElementById("refreshMovementsBtn")
  ?.addEventListener(
    "click",
    loadMovements
  );


// Load movements when the app starts
loadMovements();

// =========================================
// MEDICHAIN TOAST NOTIFICATIONS
// =========================================

function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon =
    type === "error"
      ? "!"
      : type === "warning"
        ? "⚠"
        : "✓";

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="Close">×</button>
  `;

  container.appendChild(toast);

  const closeToast = () => {
    toast.classList.add("toast-hide");

    setTimeout(() => {
      toast.remove();
    }, 250);
  };

  toast.querySelector(".toast-close")?.addEventListener(
    "click",
    closeToast
  );

  setTimeout(closeToast, 4500);
}


// =========================================
// DASHBOARD 2.0 — LIVE DATA
// =========================================

async function loadDashboard() {
  const token = getToken();

  if (!token) return;

  try {
    const headers = {
      Authorization: `Bearer ${token}`
    };

    const [
  analyticsResponse,
  alertsResponse,
  shipmentsResponse,
  warehousesResponse,
  drugsResponse
] = await Promise.all([
  fetch(`${API_BASE_URL}/analytics`, { headers }),
  fetch(`${API_BASE_URL}/alerts`, { headers }),
  fetch(`${API_BASE_URL}/shipments`, { headers }),
  fetch(`${API_BASE_URL}/warehouses`, { headers }),
  fetch(`${API_BASE_URL}/drugs`, { headers })
]);

    const analytics =
      analyticsResponse.ok
        ? await analyticsResponse.json()
        : null;

    const alerts =
      alertsResponse.ok
        ? await alertsResponse.json()
        : [];

    const shipments =
      shipmentsResponse.ok
        ? await shipmentsResponse.json()
        : [];

    const warehouses =
      warehousesResponse.ok
        ? await warehousesResponse.json()
        : [];

    const metrics = analytics?.metrics || {};
    const inventory = analytics?.inventory || {};
    const network = analytics?.network || {};

    const alertList =
      Array.isArray(alerts)
        ? alerts
        : alerts.alerts || [];

    const shipmentList =
      Array.isArray(shipments)
        ? shipments
        : shipments.shipments || [];

    const warehouseList =
      Array.isArray(warehouses)
        ? warehouses
        : warehouses.warehouses || [];

        const drugs =
  drugsResponse.ok
    ? await drugsResponse.json()
    : [];

const drugList =
  Array.isArray(drugs)
    ? drugs
    : drugs.drugs || [];


    // -----------------------------------------
    // TOP SUMMARY
    // -----------------------------------------

    const inventoryUnits =
      inventory.totalQuantity || 0;

    const totalOrders =
      metrics.totalOrders || 0;

    const activeShipments =
      shipmentList.filter(shipment =>
        ["Pending", "In Transit", "Delayed"].includes(
          shipment.status
        )
      ).length;

    const activeAlerts =
      alertList.filter(alert =>
        !alert.reviewed
      ).length;


    setDashboardText(
      "dashboardInventoryUnits",
      inventoryUnits.toLocaleString()
    );

    setDashboardText(
      "dashboardOrdersPipeline",
      totalOrders.toLocaleString()
    );

    setDashboardText(
      "dashboardActiveShipments",
      activeShipments.toLocaleString()
    );

    setDashboardText(
      "dashboardRiskCount",
      activeAlerts.toLocaleString()
    );

setDashboardText(
  "dashboardInventoryDetail",
  `${drugList.length} medicine records`
);

    setDashboardText(
      "dashboardOrdersDetail",
      `${metrics.completedOrders || 0} completed`
    );

    setDashboardText(
      "dashboardShipmentsDetail",
      `${metrics.deliveredShipments || 0} delivered`
    );

    setDashboardText(
      "dashboardRiskDetail",
     `${alertList.filter(
  a =>
    !a.reviewed &&
    String(a.severity || "").toLowerCase() === "critical"
).length} critical`
    );


    // -----------------------------------------
    // NETWORK HEALTH
    // -----------------------------------------

    const stockHealth =
      Number(metrics.stockHealth || 0);

    const expiryPrevention =
      Number(metrics.expiryPrevention || 0);

    const networkScore = Math.round(
      (stockHealth + expiryPrevention) / 2
    );

    setDashboardText(
      "dashboardNetworkScore",
      networkScore
    );

    setDashboardText(
      "dashboardNetworkScoreText",
      `${stockHealth.toFixed(1)}% stock health`
    );

    setDashboardText(
      "dashboardNetworkSummary",
      `${warehouseList.length} facilities online · ${activeShipments} shipments moving · ${activeAlerts} risks need attention`
    );


    // -----------------------------------------
    // INVENTORY HEALTH
    // -----------------------------------------

    const totalMedicines =
  drugList.length ||
  metrics.totalDrugs ||
  0;

const healthyMedicines =
  drugList.length
    ? drugList.filter(
        drug =>
          String(drug.status || "").toLowerCase() ===
          "available"
      ).length
    : (metrics.healthyDrugs || 0);

const expiredMedicines =
  drugList.length
    ? drugList.filter(
        drug =>
          String(drug.status || "").toLowerCase() ===
          "expired"
      ).length
    : (metrics.expiredDrugs || 0);

const lowStockMedicines =
  drugList.length
    ? drugList.filter(
        drug =>
          String(drug.status || "").toLowerCase() ===
          "low stock"
      ).length
    : Math.max(
        0,
        totalMedicines -
        healthyMedicines -
        expiredMedicines
      );

    const healthyPercent =
      totalMedicines
        ? (healthyMedicines / totalMedicines) * 100
        : 0;

    const lowStockPercent =
      totalMedicines
        ? (lowStockMedicines / totalMedicines) * 100
        : 0;

    const expiredPercent =
      totalMedicines
        ? (expiredMedicines / totalMedicines) * 100
        : 0;


    setDashboardText(
      "dashboardHealthyPercent",
      `${healthyPercent.toFixed(0)}%`
    );

    setDashboardText(
      "dashboardHealthyPercentList",
      `${healthyPercent.toFixed(1)}%`
    );

    setDashboardText(
      "dashboardLowStockPercent",
      `${lowStockPercent.toFixed(1)}%`
    );

    setDashboardText(
      "dashboardExpiredPercent",
      `${expiredPercent.toFixed(1)}%`
    );

    setDashboardText(
      "dashboardHealthyUnits",
      `${healthyMedicines} medicine records`
    );

    setDashboardText(
      "dashboardLowStockUnits",
      `${lowStockMedicines} medicine records`
    );

    setDashboardText(
      "dashboardExpiredUnits",
      `${expiredMedicines} medicine records`
    );

    setDashboardText(
      "dashboardInventoryFacilities",
      `Across ${warehouseList.length} facilities`
    );


    // -----------------------------------------
    // PRIMARY RISK
    // -----------------------------------------

   const criticalAlerts =
  alertList.filter(
    alert =>
      !alert.reviewed &&
      String(alert.severity || "").toLowerCase() ===
      "critical"
  );

   const warningAlerts =
  alertList.filter(
    alert =>
      !alert.reviewed &&
      String(alert.severity || "").toLowerCase() ===
      "warning"
  );


    const primaryAlert =
      criticalAlerts[0] ||
      warningAlerts[0] ||
      alertList.find(a => !a.reviewed);


    if (primaryAlert) {

      setDashboardText(
        "dashboardPrimaryRiskLabel",
        `${primaryAlert.severity || "ALERT"} · ACTION REQUIRED`
      );

      setDashboardText(
        "dashboardPrimaryRisk",
        primaryAlert.title ||
        primaryAlert.message ||
        "Operational risk detected"
      );

      setDashboardText(
        "dashboardPrimaryRiskDescription",
        primaryAlert.message ||
        "Review the alert for more information."
      );

      setDashboardText(
        "dashboardRiskRecommendation",
        "Open the Alerts center and review this event."
      );

    } else {

      setDashboardText(
        "dashboardPrimaryRiskLabel",
        "SYSTEM STATUS"
      );

      setDashboardText(
        "dashboardPrimaryRisk",
        "No active operational risks"
      );

      setDashboardText(
        "dashboardPrimaryRiskDescription",
        "The current network has no unreviewed alerts."
      );

      setDashboardText(
        "dashboardRiskRecommendation",
        "Continue monitoring the network."
      );
    }


    // -----------------------------------------
    // SECONDARY RISKS
    // -----------------------------------------

    const secondaryContainer =
      document.getElementById(
        "dashboardSecondaryRisks"
      );

    if (secondaryContainer) {

      const secondaryAlerts =
        alertList
          .filter(a => !a.reviewed)
          .slice(1, 3);

      if (!secondaryAlerts.length) {

        secondaryContainer.innerHTML = `
          <div>
            <span class="severity info-bg">✓</span>
            <div>
              <b>No additional alerts</b>
              <small>Network monitoring active</small>
            </div>
          </div>

          <div>
            <span class="severity info-bg">i</span>
            <div>
              <b>Inventory monitoring active</b>
              <small>Stock levels being tracked</small>
            </div>
          </div>
        `;

      } else {

        secondaryContainer.innerHTML =
          secondaryAlerts
            .map(alert => `
              <div>
                <span class="severity warning-bg">!</span>
                <div>
                  <b>${alert.title || alert.message || "Operational alert"}</b>
                  <small>${alert.message || "Review required"}</small>
                </div>
              </div>
            `)
            .join("");
      }
    }


    // -----------------------------------------
    // LIVE SHIPMENTS
    // -----------------------------------------

    const shipmentContainer =
      document.getElementById(
        "dashboardShipmentsList"
      );

    if (shipmentContainer) {

      const liveShipments =
        shipmentList
          .filter(shipment =>
            ["Pending", "In Transit", "Delayed"].includes(
              shipment.status
            )
          )
          .slice(0, 3);


      if (!liveShipments.length) {

        shipmentContainer.innerHTML = `
          <div class="shipment">
            <div class="shipment-line">
              <span class="route-dot"></span>

              <div>
                <b>No active shipments</b>
                <small>All current shipments are settled</small>
              </div>

              <span class="route-progress">—</span>
            </div>

            <div class="progress">
              <i style="width:0%"></i>
            </div>

            <div class="shipment-meta">
              <span>Network monitoring active</span>
              <b>—</b>
            </div>
          </div>
        `;

      } else {

        shipmentContainer.innerHTML =
          liveShipments
            .map(shipment => {

              const progress =
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(shipment.progress || 0)
                  )
                );

              return `
                <div class="shipment">

                  <div class="shipment-line">

                    <span class="route-dot ${
                      shipment.status === "Delayed"
                        ? "orange"
                        : ""
                    }"></span>

                    <div>
                      <b>
                        ${shipment.origin || "Origin"}
                        → 
                        ${shipment.destination || "Destination"}
                      </b>

                      <small>
                        ${shipment.shipmentId || "Shipment"} ·
                        ${shipment.status || "Pending"}
                      </small>
                    </div>

                    <span class="route-progress">
                      ${progress}%
                    </span>

                  </div>

                  <div class="progress">
                    <i style="width:${progress}%"></i>
                  </div>

                  <div class="shipment-meta">

                    <span>
                      ${shipment.temperature != null
                        ? `❄ ${shipment.temperature}°C`
                        : "Temperature normal"}
                    </span>

                    <b>
                      ETA ${shipment.eta || "—"}
                    </b>

                  </div>

                </div>
              `;
            })
            .join("");
      }
    }


    // -----------------------------------------
    // FACILITY BARS
    // -----------------------------------------

    const facilityBars =
      document.getElementById(
        "dashboardFacilityBars"
      );

    if (facilityBars && warehouseList.length) {

      const maxStock =
        Math.max(
          ...warehouseList.map(
            warehouse =>
              Number(warehouse.currentStock || 0)
          ),
          1
        );

      facilityBars.innerHTML =
        warehouseList
          .slice(0, 4)
          .map(warehouse => {

            const width =
              (
                Number(warehouse.currentStock || 0) /
                maxStock
              ) * 100;

            return `
              <i
                style="width:${Math.max(8, width)}%"
                title="${warehouse.name}: ${warehouse.currentStock || 0} units"
              ></i>
            `;
          })
          .join("");
    }


    // -----------------------------------------
    // ACTIVITY BARS
    // -----------------------------------------

    const activityBars =
      document.getElementById(
        "dashboardActivityBars"
      );

    if (activityBars) {

      const values = [
        inventoryUnits,
        totalOrders,
        activeShipments,
        network.activeSuppliers || 0
      ];

      const maxValue =
        Math.max(...values, 1);

      activityBars.innerHTML =
        values
          .map(value => `
            <i
              style="
                width:16%;
                height:${Math.max(
                  8,
                  (value / maxValue) * 100
                )}%;
                border-radius:8px 8px 0 0;
                background:rgba(37, 126, 244, .78);
                display:block;
              "
            ></i>
          `)
          .join("");
    }

  } catch (error) {

    console.error(
      "Dashboard load error:",
      error
    );

    showToast(
      "Unable to load some live dashboard data.",
      "error"
    );
  }
}


function setDashboardText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}


loadDashboard();

// =========================================
// FACILITIES / WAREHOUSES
// =========================================

async function loadFacilities() {

  const token = getToken();
  const tableBody =
    document.getElementById("facilitiesTableBody");

  if (!token || !tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="7">Loading facilities...</td>
    </tr>
  `;

  try {

    const response = await fetch(
      `${API_BASE_URL}/warehouses`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Failed to load facilities"
      );
    }

    const facilities =
      Array.isArray(data)
        ? data
        : data.warehouses || [];


    // -----------------------------------------
    // SUMMARY
    // -----------------------------------------

    const total =
      facilities.length;

    const operational =
      facilities.filter(
        facility =>
          facility.status === "Operational"
      ).length;

    const capacity =
      facilities.reduce(
        (sum, facility) =>
          sum + Number(facility.capacity || 0),
        0
      );

    const stock =
      facilities.reduce(
        (sum, facility) =>
          sum + Number(facility.currentStock || 0),
        0
      );


    setDashboardText(
      "facilityTotalCount",
      total.toLocaleString()
    );

    setDashboardText(
      "facilityOperationalCount",
      operational.toLocaleString()
    );

    setDashboardText(
      "facilityCapacity",
      capacity.toLocaleString()
    );

    setDashboardText(
      "facilityStock",
      stock.toLocaleString()
    );


    // -----------------------------------------
    // TABLE
    // -----------------------------------------

    if (!facilities.length) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            No facilities found.
          </td>
        </tr>
      `;

      return;
    }


    tableBody.innerHTML = "";

facilities.forEach(facility => {

  const row = document.createElement("tr");

  const facilityCapacity =
    Number(facility.capacity || 0);

  const currentStock =
    Number(facility.currentStock || 0);

  const utilization =
    facilityCapacity > 0
      ? Math.min(
          100,
          (currentStock / facilityCapacity) * 100
        )
      : 0;

  const status =
    facility.status || "Operational";

  const statusClass =
    status === "Operational"
      ? "healthy"
      : status === "Full"
        ? "warning"
        : status === "Maintenance"
          ? "critical"
          : "info";

  row.innerHTML = `
    <td>
      <b>${facility.name || "Unnamed facility"}</b>
      <small>
        ${facility.storageConditions || "Standard storage"}
      </small>
    </td>

    <td>
      ${facility.code || "—"}
    </td>

    <td>
      ${facility.location || "—"}
    </td>

    <td>
      ${facilityCapacity.toLocaleString()}
    </td>

    <td>
      <b>
        ${currentStock.toLocaleString()}
      </b>
    </td>

    <td>
      <div style="
        display:flex;
        align-items:center;
        gap:10px;
        min-width:130px;
      ">
        <div style="
          flex:1;
          height:7px;
          background:#e8edf3;
          border-radius:999px;
          overflow:hidden;
        ">
          <i style="
            display:block;
            width:${utilization}%;
            height:100%;
            background:currentColor;
            border-radius:999px;
          "></i>
        </div>

        <small>
          ${utilization.toFixed(1)}%
        </small>
      </div>
    </td>

    <td>
      <span class="status ${statusClass}">
        ${status}
      </span>
    </td>
  `;

  row.style.cursor = "pointer";

  row.addEventListener("click", () => {

    selectedFacility = facility;

    const drawer =
      document.getElementById("facilityDrawer");

    const backdrop =
      document.getElementById("facilityDrawerBackdrop");

    if (!drawer) {
      console.error("Facility drawer not found");
      return;
    }

    document.getElementById(
      "facilityDrawerName"
    ).textContent =
      facility.name || "Facility";

    document.getElementById(
      "facilityDrawerLocation"
    ).textContent =
      facility.location || "Unknown location";

    document.getElementById(
      "facilityDrawerCode"
    ).textContent =
      facility.code || "—";

    const capacity =
      Number(facility.capacity || 0);

    const stock =
      Number(facility.currentStock || 0);

    const utilization =
      capacity > 0
        ? Math.min(
            100,
            (stock / capacity) * 100
          )
        : 0;

    document.getElementById(
      "facilityDrawerCapacity"
    ).textContent =
      capacity.toLocaleString();

    document.getElementById(
      "facilityDrawerStock"
    ).textContent =
      stock.toLocaleString();

    document.getElementById(
      "facilityDrawerUtilization"
    ).textContent =
      `${utilization.toFixed(1)}%`;

    document.getElementById(
      "facilityDrawerStorage"
    ).textContent =
      facility.storageConditions ||
      "Standard storage";

    document.getElementById(
      "facilityDrawerCapacityText"
    ).textContent =
      `${stock.toLocaleString()} / ${capacity.toLocaleString()} units occupied`;

    document.getElementById(
      "facilityDrawerStatusText"
    ).textContent =
      facility.status || "Operational";

    document.getElementById(
      "facilityDrawerStatus"
    ).textContent =
      facility.status || "Operational";

    backdrop?.classList.remove("hidden");

    drawer.classList.add("open");

    drawer.setAttribute(
      "aria-hidden",
      "false"
    );
  });

  tableBody.appendChild(row);
});

  } catch (error) {

    console.error(
      "Load facilities error:",
      error
    );

    tableBody.innerHTML = `
      <tr>
        <td colspan="7">
          Failed to load facilities.
        </td>
      </tr>
    `;

    showToast(
      error.message ||
      "Failed to load facilities",
      "error"
    );
  }
}


document
  .getElementById("refreshFacilitiesBtn")
  ?.addEventListener(
    "click",
    loadFacilities
  );


// Load facilities when available
loadFacilities();

// =========================================
// ADD FACILITY
// =========================================

let editingFacilityId = null;

const facilityModal =
  document.getElementById("facilityModal");

const addFacilityBtn =
  document.getElementById("addFacilityBtn");

const facilityClose =
  document.getElementById("facilityClose");

const facilityCancel =
  document.getElementById("facilityCancel");

const confirmFacility =
  document.getElementById("confirmFacility");

function openFacilityModal(facility = null) {
  if (!facilityModal) return;

  editingFacilityId = facility
    ? facility._id || facility.id
    : null;

  const title = facilityModal.querySelector("h2");
  const subtitle = facilityModal.querySelector(".modal-subtitle");
  const confirmButton =
    document.getElementById("confirmFacility");

  if (facility) {
    // EDIT MODE
    if (title) title.textContent = "Edit facility";

    if (subtitle) {
      subtitle.textContent =
        "Update warehouse or distribution facility details.";
    }

    if (confirmButton) {
      confirmButton.textContent = "Save changes";
    }

    document.getElementById("facilityName").value =
      facility.name || "";

    document.getElementById("facilityCode").value =
      facility.code || "";

    document.getElementById("facilityLocation").value =
      facility.location || "";

    document.getElementById("facilityCapacityInput").value =
      facility.capacity ?? "";

    document.getElementById("facilityStockInput").value =
      facility.currentStock ?? "";

    document.getElementById("facilityStorage").value =
      facility.storageConditions || "";

    document.getElementById("facilityStatus").value =
      facility.status || "Operational";
  } else {
    // ADD MODE
    if (title) title.textContent = "Add facility";

    if (subtitle) {
      subtitle.textContent =
        "Add a warehouse or distribution facility to the network.";
    }

    if (confirmButton) {
      confirmButton.textContent = "Add facility";
    }

    document.getElementById("facilityName").value = "";
    document.getElementById("facilityCode").value = "";
    document.getElementById("facilityLocation").value = "";
    document.getElementById("facilityCapacityInput").value = "";
    document.getElementById("facilityStockInput").value = "";
    document.getElementById("facilityStorage").value = "";
    document.getElementById("facilityStatus").value =
      "Operational";
  }

  facilityModal.classList.remove("hidden");
}

function closeFacilityModal() {

  if (!facilityModal) return;

  facilityModal.classList.add("hidden");

}


addFacilityBtn?.addEventListener(
  "click",
  openFacilityModal
);


facilityClose?.addEventListener(
  "click",
  closeFacilityModal
);


facilityCancel?.addEventListener(
  "click",
  closeFacilityModal
);


confirmFacility?.addEventListener("click", async () => {
  const name =
    document.getElementById("facilityName").value.trim();

  const code =
    document.getElementById("facilityCode").value.trim();

  const location =
    document.getElementById("facilityLocation").value.trim();

  const capacity =
    Number(document.getElementById("facilityCapacityInput").value);

  const currentStock =
    Number(document.getElementById("facilityStockInput").value);

  const storageConditions =
    document.getElementById("facilityStorage").value.trim();

  const status =
    document.getElementById("facilityStatus").value;

  if (!name || !code || !location) {
    showToast(
      "Please fill in name, code and location.",
      "error"
    );
    return;
  }

  if (!capacity || capacity <= 0) {
    showToast(
      "Capacity must be greater than 0.",
      "error"
    );
    return;
  }

  if (currentStock < 0) {
    showToast(
      "Current stock cannot be negative.",
      "error"
    );
    return;
  }

  if (currentStock > capacity) {
    showToast(
      "Current stock cannot exceed facility capacity.",
      "error"
    );
    return;
  }

  const payload = {
    name,
    code,
    location,
    capacity,
    currentStock,
    storageConditions:
      storageConditions || "Standard storage",
    status: status || "Operational"
  };

  try {
    confirmFacility.disabled = true;

    const url = editingFacilityId
      ? `${API_BASE_URL}/warehouses/${editingFacilityId}`
      : `${API_BASE_URL}/warehouses`;

    const method = editingFacilityId
      ? "PUT"
      : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Unable to save facility"
      );
    }

    facilityModal.classList.add("hidden");

    const wasEditing = Boolean(editingFacilityId);

    editingFacilityId = null;

    await loadFacilities();

    closeFacilityDrawer();

    showToast(
      wasEditing
        ? "Facility updated successfully."
        : "Facility added successfully.",
      "success"
    );

  } catch (error) {
    console.error("Facility save error:", error);

    showToast(
      error.message || "Unable to save facility.",
      "error"
    );

  } finally {
    confirmFacility.disabled = false;
  }
});



// =========================================
// FACILITY DETAILS DRAWER
// =========================================

let selectedFacility = null;


const facilityDrawer =
  document.getElementById("facilityDrawer");

const facilityDrawerBackdrop =
  document.getElementById(
    "facilityDrawerBackdrop"
  );

const facilityDrawerClose =
  document.getElementById(
    "facilityDrawerClose"
  );

  document.addEventListener("click", (event) => {

  const editButton =
    event.target.closest("#facilityEditBtn");

  if (!editButton) return;

  event.preventDefault();
  event.stopPropagation();

  if (!selectedFacility) {
    console.error("No facility selected for editing");
    return;
  }

  console.log(
    "Editing facility:",
    selectedFacility
  );

  closeFacilityDrawer();

  openFacilityModal(selectedFacility);
});

const facilityDrawerCloseAction =
  document.getElementById(
    "facilityDrawerCloseAction"
  );


function closeFacilityDrawer() {

  const drawer =
    document.getElementById("facilityDrawer");

  const backdrop =
    document.getElementById("facilityDrawerBackdrop");

  if (drawer) {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }

  if (backdrop) {
    backdrop.classList.add("hidden");
  }
}


function openFacilityDrawer(facility) {
  const drawer = document.getElementById("facilityDrawer");

  if (!drawer || !facility) return;

  selectedFacility = facility;

  const capacity =
    Number(facility.capacity || 0);

  const stock =
    Number(facility.currentStock || 0);

  const utilization =
    capacity > 0
      ? Math.min(
          100,
          (stock / capacity) * 100
        )
      : 0;


  document.getElementById(
    "facilityDrawerName"
  ).textContent =
    facility.name || "Facility";


  document.getElementById(
    "facilityDrawerLocation"
  ).textContent =
    facility.location || "Unknown location";


  document.getElementById(
    "facilityDrawerCode"
  ).textContent =
    facility.code || "—";


  document.getElementById(
    "facilityDrawerCapacity"
  ).textContent =
    capacity.toLocaleString();


  document.getElementById(
    "facilityDrawerStock"
  ).textContent =
    stock.toLocaleString();


  document.getElementById(
    "facilityDrawerUtilization"
  ).textContent =
    `${utilization.toFixed(1)}%`;


  document.getElementById(
    "facilityDrawerStorage"
  ).textContent =
    facility.storageConditions ||
    "Standard storage";


  document.getElementById(
    "facilityDrawerCapacityText"
  ).textContent =
    `${stock.toLocaleString()} / ${capacity.toLocaleString()} units occupied`;


  document.getElementById(
    "facilityDrawerStatusText"
  ).textContent =
    facility.status || "Operational";


  const statusElement =
    document.getElementById(
      "facilityDrawerStatus"
    );

  if (statusElement) {

    statusElement.textContent =
      facility.status || "Operational";

    statusElement.className =
      `drawer-status ${
        facility.status === "Operational"
          ? "healthy"
          : facility.status === "Full"
            ? "warning"
            : "critical"
      }`;

  }


  facilityDrawerBackdrop
    ?.classList.remove("hidden");

  facilityDrawer.classList.add("open");

  facilityDrawer.setAttribute(
    "aria-hidden",
    "false"
  );

}


// Close controls

facilityDrawerClose
  ?.addEventListener(
    "click",
    closeFacilityDrawer
  );

facilityDrawerCloseAction
  ?.addEventListener(
    "click",
    closeFacilityDrawer
  );

facilityDrawerBackdrop
  ?.addEventListener(
    "click",
    closeFacilityDrawer
  );

  // =========================================
// GLOBAL SEARCH
// =========================================

const globalSearchBtn =
  document.getElementById("globalSearchBtn");

  "click",
  openGlobalSearch
;

globalSearchClose?.addEventListener(
  "click",
  closeGlobalSearch
);

globalSearchModal?.addEventListener(
  "click",
  event => {
    if (event.target === globalSearchModal) {
      closeGlobalSearch();
    }
  }
);

document.getElementById("brandDashboardBtn")?.addEventListener("click", () => {
  showPage("dashboard");
});

const workspaceBtn = document.getElementById("workspaceBtn");
const workspaceMenu = document.getElementById("workspaceMenu");

workspaceBtn?.addEventListener("click", () => {
  workspaceMenu?.classList.toggle("show");
});

// =========================
// BOTTOM USER CARD
// =========================

const bottomUserCard =
  document.getElementById("bottomUserCard");

const bottomUserAvatar =
  document.getElementById("bottomUserAvatar");

const bottomUserName =
  document.getElementById("bottomUserName");

const bottomUserRole =
  document.getElementById("bottomUserRole");

const bottomUser = getStoredUser();

if (bottomUser) {
  const name = bottomUser.name || "User";

  const initials = name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  bottomUserName.textContent = name;
  bottomUserRole.textContent = bottomUser.role || "Pharmacy";
  bottomUserAvatar.textContent = initials;
}

bottomUserCard?.addEventListener("click", () => {
  showPage("settings");
});

// =========================
// TOP USER MENU
// =========================

const topUserBtn = document.getElementById("topUserBtn");
const topUserMenu = document.getElementById("topUserMenu");

const topUserAvatar = document.getElementById("topUserAvatar");
const topUserName = document.getElementById("topUserName");

const menuUserAvatar = document.getElementById("menuUserAvatar");
const menuUserName = document.getElementById("menuUserName");
const menuUserRole = document.getElementById("menuUserRole");

const currentUser = getStoredUser();

if (currentUser) {
  const name = currentUser.name || "User";
  const initials = name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  topUserName.textContent = name.split(" ")[0];
  topUserAvatar.textContent = initials;

  menuUserName.textContent = name;
  menuUserRole.textContent = currentUser.role || "Pharmacy";
  menuUserAvatar.textContent = initials;
}

topUserBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  topUserMenu?.classList.toggle("show");
});

document.addEventListener("click", (event) => {
  if (
    topUserMenu &&
    !topUserMenu.contains(event.target) &&
    !topUserBtn?.contains(event.target)
  ) {
    topUserMenu.classList.remove("show");
  }
});

document.getElementById("profileMenuBtn")?.addEventListener("click", () => {
  topUserMenu?.classList.remove("show");
  showPage("settings");
});
document.getElementById("securityMenuBtn")?.addEventListener("click", () => {
  topUserMenu?.classList.remove("show");
  showPage("settings");

  document
    .querySelector('[data-settings-tab="security"]')
    ?.click();
});

  

document.getElementById("logoutMenuBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("medichainUser");

  window.location.href = "login.html";
});


document.addEventListener("DOMContentLoaded", () => {
  applyRolePermissions();
});

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {
      closeGlobalSearch();
    }

    if (
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();
      openGlobalSearch();
    }

  }
);
/* ============================================================
   ISSUE REPORTS
   ============================================================ */

async function loadIssueReports() {

  const reportsList =
    document.getElementById("reportsList");

  if (!reportsList) return;

  reportsList.innerHTML = `
    <div class="reports-empty">
      <div>↻</div>
      <strong>Loading reports...</strong>
      <p>Fetching the latest shipment issues.</p>
    </div>
  `;

  try {

    const response = await fetch(
      `${API_BASE_URL}/issue-reports`,
      {
        headers: getSettingsHeaders()
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load reports"
      );
    }

    const reports = Array.isArray(data)
      ? data
      : data.reports || [];

    updateReportsSummary(reports);

    if (!reports.length) {

      reportsList.innerHTML = `
        <div class="reports-empty">
          <div>✓</div>
          <strong>No issue reports yet</strong>
          <p>Reported shipment issues will appear here.</p>
        </div>
      `;

      return;
    }

    reportsList.innerHTML =
      reports.map(report => {

        const reporter =
          report.reportedBy?.name ||
          report.reporterName ||
          "Unknown user";

        const date =
          report.createdAt
            ? new Date(report.createdAt)
                .toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short"
                })
            : "Unknown date";

        const status =
          report.status || "Open";

        const statusClass =
          status.toLowerCase()
            .replace(/\s+/g, "-");

        return `
          <article class="report-card">

            <div class="report-card-top">

              <div class="report-type">
                <span class="report-warning">!</span>

                <div>
                  <strong>
                    ${escapeHtml(
                      report.issueType || "Other"
                    )}
                  </strong>

                  <small>
                    Shipment
                    ${escapeHtml(
                      report.shipmentId || "—"
                    )}
                  </small>
                </div>
              </div>

              <span class="report-status ${statusClass}">
                ${escapeHtml(status)}
              </span>

            </div>

            <div class="report-comment">
              <div class="report-comment-label">
                PERSONAL COMMENT
              </div>

              <p>
                ${escapeHtml(
                  report.comment || "No comment provided."
                )}
              </p>
            </div>

            <div class="report-card-footer">

              <span>
                Reported by
                <strong>${escapeHtml(reporter)}</strong>
              </span>

              <span>${escapeHtml(date)}</span>

            </div>

          </article>
        `;

      }).join("");

  } catch (error) {

    console.error(
      "Load issue reports error:",
      error
    );

    reportsList.innerHTML = `
      <div class="reports-empty">
        <div>!</div>
        <strong>Unable to load reports</strong>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}


function updateReportsSummary(reports) {

  const open =
    reports.filter(
      report => report.status === "Open"
    ).length;

  const review =
    reports.filter(
      report => report.status === "In Review"
    ).length;

  const resolved =
    reports.filter(
      report => report.status === "Resolved"
    ).length;

  const openElement =
    document.getElementById("openReportsCount");

  const reviewElement =
    document.getElementById("reviewReportsCount");

  const resolvedElement =
    document.getElementById("resolvedReportsCount");

  if (openElement)
    openElement.textContent = open;

  if (reviewElement)
    reviewElement.textContent = review;

  if (resolvedElement)
    resolvedElement.textContent = resolved;
}


document
  .getElementById("refreshReportsBtn")
  ?.addEventListener(
    "click",
    loadIssueReports
  );

// ================= REAL DASHBOARD DATA =================

async function loadDashboardData() {
  try {
    const data = await apiFetch("/dashboard");

    // Dashboard stat cards
    const statCards = document.querySelectorAll("#page-dashboard .stat-card");

    if (statCards.length >= 3) {
      statCards[0].querySelector("strong").textContent =
        data.medicines.totalInventory.toLocaleString();

      statCards[1].querySelector("strong").textContent =
        data.medicines.total.toLocaleString();

      statCards[2].querySelector("strong").textContent =
        data.shipments.active.toLocaleString();
    }

    console.log("Dashboard data loaded:", data);

  } catch (error) {
    console.error("Dashboard API error:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboardData);
