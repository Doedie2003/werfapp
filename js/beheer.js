document.addEventListener("DOMContentLoaded", startBeheer);

async function startBeheer() {

    const ingelogd = await checkLogin();

    if (!ingelogd) {
        return;
    }

    setupButtons();

    await loadSites();
    await loadCategories();
    await loadRates();
}


// ==========================================
// LOGIN
// ==========================================

async function checkLogin() {

    const resultaat =
        await supabaseClient.auth.getSession();

    if (resultaat.error || !resultaat.data.session) {

        window.location.href = "index.html";

        return false;
    }

    return true;
}


// ==========================================
// UITLOGGEN
// ==========================================

document
    .getElementById("logoutButton")
    .addEventListener("click", async function(event) {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

    });


// ==========================================
// KNOPPEN
// ==========================================

function setupButtons() {

    document
        .getElementById("addSiteButton")
        .addEventListener("click", addSite);

    document
        .getElementById("addCategoryButton")
        .addEventListener("click", addCategory);

    document
        .getElementById("addRateButton")
        .addEventListener("click", addRate);

}


// ==========================================
// WERVEN LADEN
// ==========================================

async function loadSites() {

    const resultaat =
        await supabaseClient
            .from("sites")
            .select("*")
            .order("name", {
                ascending: true
            });

    if (resultaat.error) {

        console.error(
            "Fout bij werven:",
            resultaat.error
        );

        alert(
            "Werven konden niet geladen worden."
        );

        return;
    }

    const tabel =
        document.getElementById("siteTable");

    tabel.innerHTML = "";

    (resultaat.data || []).forEach(function(site) {

        const rij =
            document.createElement("tr");

        const naamCel =
            document.createElement("td");

        naamCel.textContent =
            site.name || "";

        const actieCel =
            document.createElement("td");

        const knop =
            document.createElement("button");

        knop.type = "button";

        knop.textContent =
            "Verwijderen";

        knop.addEventListener(
            "click",
            function() {
                deleteSite(site.id);
            }
        );

        actieCel.appendChild(knop);

        rij.appendChild(naamCel);

        rij.appendChild(actieCel);

        tabel.appendChild(rij);

    });

}


// ==========================================
// WERF TOEVOEGEN
// ==========================================

async function addSite() {

    const input =
        document.getElementById("siteName");

    const naam =
        input.value.trim();

    if (!naam) {

        alert(
            "Vul eerst een naam van de werf in."
        );

        return;
    }

    const resultaat =
        await supabaseClient
            .from("sites")
            .insert({
                name: naam
            });

    if (resultaat.error) {

        console.error(
            "Fout bij werf toevoegen:",
            resultaat.error
        );

        alert(
            "Werf kon niet worden toegevoegd."
        );

        return;
    }

    input.value = "";

    await loadSites();

}


// ==========================================
// WERF VERWIJDEREN
// ==========================================

async function deleteSite(id) {

    if (!confirm("Deze werf verwijderen?")) {
        return;
    }

    const resultaat =
        await supabaseClient
            .from("sites")
            .delete()
            .eq("id", id);

    if (resultaat.error) {

        console.error(
            "Fout bij werf verwijderen:",
            resultaat.error
        );

        alert(
            "Werf kon niet worden verwijderd."
        );

        return;
    }

    await loadSites();

}


// ==========================================
// CATEGORIEËN LADEN
// ==========================================

async function loadCategories() {

    const resultaat =
        await supabaseClient
            .from("categories")
            .select("*")
            .order("name", {
                ascending: true
            });

    if (resultaat.error) {

        console.error(
            "Fout bij categorieën:",
            resultaat.error
        );

        alert(
            "Categorieën konden niet geladen worden."
        );

        return;
    }

    const tabel =
        document.getElementById("categoryTable");

    const select =
        document.getElementById("rateCategory");

    tabel.innerHTML = "";

    select.innerHTML =
        '<option value="">Kies categorie</option>';

    (resultaat.data || []).forEach(function(category) {

        const rij =
            document.createElement("tr");

        const naamCel =
            document.createElement("td");

        naamCel.textContent =
            category.name || "";

        const actieCel =
            document.createElement("td");

        const knop =
            document.createElement("button");

        knop.type = "button";

        knop.textContent =
            "Verwijderen";

        knop.addEventListener(
            "click",
            function() {
                deleteCategory(category.id);
            }
        );

        actieCel.appendChild(knop);

        rij.appendChild(naamCel);

        rij.appendChild(actieCel);

        tabel.appendChild(rij);


        const option =
            document.createElement("option");

        option.value =
            category.id;

        option.textContent =
            category.name || "";

        select.appendChild(option);

    });

}


// ==========================================
// CATEGORIE TOEVOEGEN
// ==========================================

async function addCategory() {

    const input =
        document.getElementById("categoryName");

    const naam =
        input.value.trim();

    if (!naam) {

        alert(
            "Vul eerst een naam van de categorie in."
        );

        return;
    }

    const resultaat =
        await supabaseClient
            .from("categories")
            .insert({
                name: naam
            });

    if (resultaat.error) {

        console.error(
            "Fout bij categorie toevoegen:",
            resultaat.error
        );

        alert(
            "Categorie kon niet worden toegevoegd."
        );

        return;
    }

    input.value = "";

    await loadCategories();

    await loadRates();

}


// ==========================================
// CATEGORIE VERWIJDEREN
// ==========================================

async function deleteCategory(id) {

    if (!confirm("Deze categorie verwijderen?")) {
        return;
    }

    const resultaat =
        await supabaseClient
            .from("categories")
            .delete()
            .eq("id", id);

    if (resultaat.error) {

        console.error(
            "Fout bij categorie verwijderen:",
            resultaat.error
        );

        alert(
            "Categorie kon niet worden verwijderd."
        );

        return;
    }

    await loadCategories();

    await loadRates();

}


// ==========================================
// TARIEVEN LADEN
// ==========================================

async function loadRates() {

    const resultaat =
        await supabaseClient
            .from("rates")
            .select(`
                id,
                category_id,
                hourly_rate,
                valid_from,
                categories(name)
            `)
            .order("valid_from", {
                ascending: false
            });

    if (resultaat.error) {

        console.error(
            "Fout bij tarieven:",
            resultaat.error
        );

        alert(
            "Tarieven konden niet geladen worden."
        );

        return;
    }

    const tabel =
        document.getElementById("rateTable");

    tabel.innerHTML = "";

    (resultaat.data || []).forEach(function(rate) {

        const rij =
            document.createElement("tr");

        const categorieCel =
            document.createElement("td");

        categorieCel.textContent =
            rate.categories?.name || "Onbekend";

        const tariefCel =
            document.createElement("td");

        tariefCel.textContent =
            "€" +
            Number(rate.hourly_rate || 0)
                .toFixed(2);

        const datumCel =
            document.createElement("td");

        datumCel.textContent =
            rate.valid_from || "";

        const actieCel =
            document.createElement("td");

        const knop =
            document.createElement("button");

        knop.type = "button";

        knop.textContent =
            "Verwijderen";

        knop.addEventListener(
            "click",
            function() {
                deleteRate(rate.id);
            }
        );

        actieCel.appendChild(knop);

        rij.appendChild(categorieCel);

        rij.appendChild(tariefCel);

        rij.appendChild(datumCel);

        rij.appendChild(actieCel);

        tabel.appendChild(rij);

    });

}


// ==========================================
// TARIEF TOEVOEGEN
// ==========================================

async function addRate() {

    const categoryId =
        document.getElementById("rateCategory").value;

    const hourlyRate =
        document.getElementById("hourlyRate").value;

    const validFrom =
        document.getElementById("validFrom").value;

    if (!categoryId) {

        alert(
            "Kies eerst een categorie."
        );

        return;
    }

    if (
        hourlyRate === "" ||
        Number(hourlyRate) < 0
    ) {

        alert(
            "Vul een geldig uurtarief in."
        );

        return;
    }

    if (!validFrom) {

        alert(
            "Kies een datum."
        );

        return;
    }

    const resultaat =
        await supabaseClient
            .from("rates")
            .insert({
                category_id: categoryId,
                hourly_rate: Number(hourlyRate),
                valid_from: validFrom
            });

    if (resultaat.error) {

        console.error(
            "Fout bij tarief toevoegen:",
            resultaat.error
        );

        alert(
            "Tarief kon niet worden toegevoegd."
        );

        return;
    }

    document.getElementById(
        "hourlyRate"
    ).value = "";

    document.getElementById(
        "validFrom"
    ).value = "";

    await loadRates();

}


// ==========================================
// TARIEF VERWIJDEREN
// ==========================================

async function deleteRate(id) {

    if (!confirm("Dit tarief verwijderen?")) {
        return;
    }

    const resultaat =
        await supabaseClient
            .from("rates")
            .delete()
            .eq("id", id);

    if (resultaat.error) {

        console.error(
            "Fout bij tarief verwijderen:",
            resultaat.error
        );

        alert(
            "Tarief kon niet worden verwijderd."
        );

        return;
    }

    await loadRates();

}