
const API_BASE_URL = "https://medichain-xizk.onrender.com/api";

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

    dashboardHeading.textContent =
      `Good morning, ${user.name || "there"}.`;

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

    row.className =
      "inventory-row";

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

    row.dataset.status =
      statusClass;

    row.dataset.qr =
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
  document.getElementById("inventoryExpiry");

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


    const expiryMatch =
      expiry === "all" ||
      (
        expiry === "soon" &&
        [
          "Sep 2026",
          "Nov 2026",
          "Dec 2026"
        ].includes(d.expiry)
      ) ||
      (
        expiry === "normal" &&
        ![
          "Sep 2026",
          "Nov 2026",
          "Dec 2026"
        ].includes(d.expiry)
      );


    const visible =
      textMatch &&
      statusMatch &&
      facilityMatch &&
      expiryMatch;


    row.style.display =
      visible ? "" : "none";


    if (visible) shown++;

  });


  if (inventoryResultCount) {

    inventoryResultCount.textContent =
      `${shown} medicine${shown === 1 ? "" : "s"} shown`;

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
    () => {

      if (!selectedInventory) return;


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
          selectedInventory.dataset.quantity
        );


      if (
        !Number.isFinite(units) ||
        units < 1
      ) {

        alert(
          "Enter a valid quantity."
        );

        return;

      }


      if (units > sourceQuantity) {

        alert(
          `Only ${sourceQuantity.toLocaleString()} units are available.`
        );

        return;

      }


      const newSourceQuantity =
        sourceQuantity - units;


      selectedInventory.dataset.quantity =
        newSourceQuantity;


      const sourceCells =
        selectedInventory.querySelectorAll(
          "td"
        );


      if (sourceCells[2]) {

        sourceCells[2].innerHTML =
          `<strong>${newSourceQuantity.toLocaleString()}</strong> units`;

      }


      const destinationRow =
        [...getInventoryRows()].find(row => {

          const facilityCell =
            row.querySelectorAll("td")[3];

          return (
            facilityCell &&
            facilityCell.textContent.trim() ===
              destination
          );

        });


      if (destinationRow) {

        const destinationQuantity =
          Number(
            destinationRow.dataset.quantity || 0
          );


        const newDestinationQuantity =
          destinationQuantity + units;


        destinationRow.dataset.quantity =
          newDestinationQuantity;


        const destinationCells =
          destinationRow.querySelectorAll(
            "td"
          );


        if (destinationCells[2]) {

          destinationCells[2].innerHTML =
            `<strong>${newDestinationQuantity.toLocaleString()}</strong> units`;

        }

      }


      closeTransferModal();

      closeInventoryDrawer();


      alert(
        `Transfer successful!\n\n` +
        `${units.toLocaleString()} units transferred to ${destination}.`
      );

    }
  );

// ==================== ADD INVENTORY ====================

const addInventoryModal = document.getElementById("addInventoryModal");
const addInventoryForm = document.getElementById("addInventoryForm");

function openAddInventoryModal() {
  addInventoryModal?.classList.remove("hidden");
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
    batchNumber: document.getElementById("inventoryBatch").value.trim(),
    manufacturer: document
      .getElementById("inventoryManufacturer")
      .value.trim(),
    quantity: Number(document.getElementById("inventoryQuantity").value),
    reorderLevel: Number(
      document.getElementById("inventoryReorderLevel").value
    ),
    expiryDate: document.getElementById("inventoryExpiry").value,
    location: document.getElementById("inventoryLocation").value,
    status: document.getElementById("inventoryStatus").value
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
      throw new Error(data.message || "Failed to add inventory");
    }

    console.log("Inventory added:", data);

    alert("Inventory added successfully!");

    addInventoryForm.reset();

    closeAddInventoryModal();

    // Refresh inventory from backend
    loadInventoryFromAPI();

  } catch (error) {
    console.error("Add inventory API error:", error);
    alert(`Failed to add inventory: ${error.message}`);
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

  const overview =
    document.querySelectorAll(
      ".shipment-overview .stat-card"
    );

  if (!overview.length) return;


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


  if (overview[0]?.querySelector("b")) {
    overview[0].querySelector("b").textContent =
      active;
  }


  if (overview[1]?.querySelector("b")) {
    overview[1].querySelector("b").textContent =
      inTransit;
  }


  if (overview[2]?.querySelector("b")) {
    overview[2].querySelector("b").textContent =
      delayed;
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

        alert(
          "Please fill origin, destination and a valid quantity."
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


        closeShipmentModal();

        document
          ?.reset();


        await loadShipments();


        alert(
          `Shipment created successfully.\n\n` +
          `${data.shipment?.shipmentId || ""}`
        );


      } catch (error) {

        console.error(
          "Create shipment error:",
          error
        );

        alert(
          error.message ||
          "Unable to create shipment."
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
        alert("No shipment selected.");
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

        alert(
          "Please enter a progress value between 0 and 100."
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


        alert(
          `Shipment updated successfully.\n\n` +
          `${data.shipment?.shipmentId || selectedShipment.shipmentId}\n` +
          `Status: ${status}\n` +
          `Progress: ${progress}%`
        );


        closeShipmentDrawer();

        await loadShipments();


      } catch (error) {

        console.error(
          "Update shipment error:",
          error
        );

        alert(
          error.message ||
          "Unable to update shipment."
        );

      }

    }
  );

// ================= REPORT ISSUE =================

document
  .getElementById("shipmentAlertBtn")
  ?.addEventListener(
    "click",
    () => {

      if (!selectedShipment?._id) {
        alert("No shipment selected.");
        return;
      }

      alert(
        `Issue report started for ${selectedShipment.shipmentId}.`
      );

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

function openOrderModal() {
  orderModal?.classList.remove("hidden");
}

function closeOrderModal() {
  orderModal?.classList.add("hidden");
}

document.getElementById("createOrderBtn")?.addEventListener(
  "click",
  openOrderModal
);

document.getElementById("orderModalClose")?.addEventListener(
  "click",
  closeOrderModal
);

document.getElementById("orderCancel")?.addEventListener(
  "click",
  closeOrderModal
);

orderModal?.addEventListener("click", event => {
  if (event.target === orderModal) {
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

document.getElementById("confirmOrder")?.addEventListener(
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
      alert("Please enter a valid medicine quantity.");
      return;
    }


    if (!supplier || !facility) {
      alert("Please select a supplier and facility.");
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


      alert(
        `Order created successfully.\n\n` +
        `${createdId}\n` +
        `${medicine} — ${quantity.toLocaleString()} units`
      );


    } catch (error) {

      console.error("Create order error:", error);

      alert(
        error.message ||
        "Unable to create order."
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


  // Only allow approval for Pending orders
  if (orderApproveBtn) {

    const canApprove =
      data.status === "Pending";

    orderApproveBtn.style.display =
      canApprove ? "" : "none";
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
      alert("Invalid order.");
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


      alert("Order approved successfully.");


    } catch (error) {

      console.error(
        "Approve order error:",
        error
      );

      alert(
        error.message ||
        "Unable to approve order."
      );
    }

  }
);


// ================= INITIAL LOAD =================

loadOrders();

orderDrawerClose?.addEventListener("click", closeOrderDrawer);

orderDrawerCloseAction?.addEventListener("click", closeOrderDrawer);

orderDrawerBackdrop?.addEventListener("click", closeOrderDrawer);

orderApproveBtn?.addEventListener("click", () => {

    orderDrawerStatus.textContent = "Approved";
    orderDrawerStatusBadge.textContent = "Approved";

    orderApproveBtn.textContent = "Approved";
    orderApproveBtn.disabled = true;

});


// ==================== CREATE ORDER ====================

const createOrderBtn = document.getElementById("createOrderBtn");

const createOrderModal = document.getElementById("createOrderModal");

