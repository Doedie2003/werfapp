let sites = [];
let categories = [];
let rates = [];

let geselecteerdePrijs = 0;

// ------------------------------------
// START
// ------------------------------------

document.addEventListener(
"DOMContentLoaded",
startRegistratie
);

async function startRegistratie() {

const ingelogd = await checkLogin();

if (!ingelogd) {
    return;
}

setVandaag();

await loadSites();

await loadCategories();

await loadRates();

await loadTodayRegistrations();


}

// ------------------------------------
// LOGIN CONTROLEREN
// ------------------------------------

async function checkLogin() {

const { data, error } =
    await supabaseClient.auth.getSession();

if (error || !data.session) {

    window.location.href = "index.html";

    return false;
}

return true;


}

// ------------------------------------
// UITLOGGEN
// ------------------------------------

document
.getElementById("logoutButton")
.addEventListener("click", async function(event) {

    event.preventDefault();

    await supabaseClient.auth.signOut();

    window.location.href = "index.html";

});


// ------------------------------------
// DATUM VANDAAG
// ------------------------------------

function setVandaag() {

const vandaag = new Date();

const jaar =
    vandaag.getFullYear();

const maand =
    String(
        vandaag.getMonth() + 1
    ).padStart(2, "0");

const dag =
    String(
        vandaag.getDate()
    ).padStart(2, "0");

const datum =
    `${jaar}-${maand}-${dag}`;

document
    .getElementById("workDate")
    .value = datum;


}

// ------------------------------------
// EURO
// ------------------------------------

function euro(bedrag) {

return new Intl.NumberFormat(
    "nl-BE",
    {
        style: "currency",
        currency: "EUR"
    }
).format(bedrag);


}

// ------------------------------------
// SITES LADEN
// ------------------------------------

async function loadSites() {

const { data, error } =
    await supabaseClient
        .from("sites")
        .select("*")
        .eq("active", true)
        .order("name");

if (error) {

    console.log(error);

    showMessage(
        "Werven konden niet geladen worden."
    );

    return;
}

sites = data || [];

const select =
    document.getElementById("site");

select.innerHTML =
    `<option value="">
        Werf kiezen...
    </option>`;

sites.forEach(site => {

    const option =
        document.createElement("option");

    option.value = site.id;

    option.textContent =
        site.name;

    select.appendChild(option);

});


}

// ------------------------------------
// CATEGORIEËN LADEN
// ------------------------------------

async function loadCategories() {

const { data, error } =
    await supabaseClient
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("name");

if (error) {

    console.log(error);

    showMessage(
        "Categorieën konden niet geladen worden."
    );

    return;
}

categories = data || [];

const select =
    document.getElementById("category");

select.innerHTML =
    `<option value="">
        Categorie kiezen...
    </option>`;

categories.forEach(category => {

    const option =
        document.createElement("option");

    option.value =
        category.id;

    option.textContent =
        category.name;

    select.appendChild(option);

});


}

// ------------------------------------
// TARIEVEN LADEN
// ------------------------------------

async function loadRates() {

const { data, error } =
    await supabaseClient
        .from("rates")
        .select("*")
        .order("valid_from", {
            ascending: false
        });

if (error) {

    console.log(error);

    showMessage(
        "Tarieven konden niet geladen worden."
    );

    return;
}

rates = data || [];


}

// ------------------------------------
// JUISTE PRIJS ZOEKEN
// ------------------------------------

function getRateForCategory(
categoryId,
workDate
) {

const passendeTarieven =
    rates.filter(rate =>
        Number(rate.category_id) ===
            Number(categoryId)
        &&
        rate.valid_from <= workDate
    );

if (
    passendeTarieven.length === 0
) {

    return 0;
}

passendeTarieven.sort(
    (a, b) =>
        new Date(b.valid_from) -
        new Date(a.valid_from)
);

return Number(
    passendeTarieven[0].hourly_rate
);


}

// ------------------------------------
// CATEGORIE GEWIJZIGD
// ------------------------------------

document
.getElementById("category")
.addEventListener(
"change",
updateCalculation
);

// ------------------------------------
// DATUM GEWIJZIGD
// ------------------------------------

document
.getElementById("workDate")
.addEventListener(
"change",
updateCalculation
);

// ------------------------------------
// AANTAL GEWIJZIGD
// ------------------------------------

document
.getElementById("quantity")
.addEventListener(
"input",
updateCalculation
);

// ------------------------------------
// UREN GEWIJZIGD
// ------------------------------------

document
.getElementById("hours")
.addEventListener(
"input",
updateCalculation
);

// ------------------------------------
// BEREKENING
// ------------------------------------

function updateCalculation() {

const categoryId =
    document
        .getElementById("category")
        .value;

const datum =
    document
        .getElementById("workDate")
        .value;

const quantity =
    Number(
        document
            .getElementById("quantity")
            .value
    ) || 0;

const hours =
    Number(
        document
            .getElementById("hours")
            .value
    ) || 0;

if (!categoryId || !datum) {

    geselecteerdePrijs = 0;

} else {

    geselecteerdePrijs =
        getRateForCategory(
            categoryId,
            datum
        );

}

const totaal =
    quantity *
    hours *
    geselecteerdePrijs;

document
    .getElementById("hourlyRate")
    .innerText =
        euro(geselecteerdePrijs);

document
    .getElementById("totalCost")
    .innerText =
        euro(totaal);


}

// ------------------------------------
// REGISTRATIE OPSLAAN
// ------------------------------------

document
.getElementById("saveButton")
.addEventListener(
"click",
saveRegistration
);

async function saveRegistration() {

const workDate =
    document
        .getElementById("workDate")
        .value;

const siteId =
    document
        .getElementById("site")
        .value;

const categoryId =
    document
        .getElementById("category")
        .value;

const quantity =
    Number(
        document
            .getElementById("quantity")
            .value
    ) || 0;

const hours =
    Number(
        document
            .getElementById("hours")
            .value
    ) || 0;

const note =
    document
        .getElementById("note")
        .value
        .trim();


if (!workDate) {

    showMessage(
        "Kies een datum."
    );

    return;
}

if (!siteId) {

    showMessage(
        "Kies een werf."
    );

    return;
}

if (!categoryId) {

    showMessage(
        "Kies een categorie."
    );

    return;
}

if (quantity <= 0) {

    showMessage(
        "Vul een aantal groter dan 0 in."
    );

    return;
}

if (hours <= 0) {

    showMessage(
        "Vul het aantal uren in."
    );

    return;
}


const prijs =
    getRateForCategory(
        categoryId,
        workDate
    );


if (prijs <= 0) {

    showMessage(
        "Geen geldig tarief gevonden voor deze categorie."
    );

    return;
}


const { data, error } =
    await supabaseClient
        .from("daily_entries")
        .insert([
            {
                work_date: workDate,
                site_id: Number(siteId),
                category_id: Number(categoryId),
                quantity: quantity,
                hours_per_person: hours,
                note: note
            }
        ])
        .select();


if (error) {

    console.log(error);

    showMessage(
        "Registratie kon niet worden opgeslagen: " +
        error.message
    );

    return;
}


showMessage(
    "Registratie succesvol opgeslagen."
);


document
    .getElementById("quantity")
    .value = "1";

document
    .getElementById("hours")
    .value = "0";

document
    .getElementById("note")
    .value = "";


updateCalculation();

await loadTodayRegistrations();


}

// ------------------------------------
// REGISTRATIES VAN VANDAAG
// ------------------------------------

async function loadTodayRegistrations() {

const datum =
    document
        .getElementById("workDate")
        .value;

if (!datum) {
    return;
}


const { data, error } =
    await supabaseClient
        .from("daily_entries")
        .select(`
            id,
            work_date,
            quantity,
            hours_per_person,
            note,
            sites(name),
            categories(name),
            category_id
        `)
        .eq("work_date", datum)
        .order("created_at", {
            ascending: false
        });


if (error) {

    console.log(error);

    return;
}


const tabel =
    document
        .getElementById("todayTable");

tabel.innerHTML = "";


let totaal = 0;


data.forEach(regel => {

    const prijs =
        getRateForCategory(
            regel.category_id,
            regel.work_date
        );


    const kost =
        Number(regel.quantity) *
        Number(regel.hours_per_person) *
        prijs;


    totaal += kost;


    const rij =
        document.createElement("tr");


    rij.innerHTML = `
        <td>${regel.categories?.name || "-"}</td>

        <td>${regel.quantity}</td>

        <td>${regel.hours_per_person}</td>

        <td>${euro(prijs)}</td>

        <td>${euro(kost)}</td>
    `;


    tabel.appendChild(rij);

});


if (data.length === 0) {

    tabel.innerHTML = `
        <tr>
            <td colspan="5">
                Nog geen registraties.
            </td>
        </tr>
    `;

}


document
    .getElementById("todayTotal")
    .innerText =
        euro(totaal);


}

// ------------------------------------
// DATUM VERANDERD
// ------------------------------------

document
.getElementById("workDate")
.addEventListener(
"change",
async function() {

        updateCalculation();

        await loadTodayRegistrations();

    }
);


// ------------------------------------
// MELDING
// ------------------------------------

function showMessage(tekst) {

document
    .getElementById("message")
    .innerText = tekst;


}