let rates = [];

// ==========================================
// START
// ==========================================

document.addEventListener(
"DOMContentLoaded",
startRapporten
);

async function startRapporten() {

const ingelogd = await checkLogin();

if (!ingelogd) {
    return;
}

setDefaultDates();

await loadRates();

await loadDayReport();

await loadWeekReport();

await loadMonthReport();

}

// ==========================================
// LOGIN CONTROLEREN
// ==========================================

async function checkLogin() {

const { data, error } =
    await supabaseClient.auth.getSession();

if (error || !data.session) {

    window.location.href =
        "index.html";

    return false;
}

return true;

}

// ==========================================
// UITLOGGEN
// ==========================================

document
.getElementById("logoutButton")
.addEventListener(
"click",
async function(event) {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href =
            "index.html";

    }
);

// ==========================================
// DATUM INSTELLEN
// ==========================================

function setDefaultDates() {

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
    .getElementById("dayDate")
    .value = datum;

document
    .getElementById("weekDate")
    .value = datum;

document
    .getElementById("monthDate")
    .value =
        `${jaar}-${maand}`;

}

// ==========================================
// EURO
// ==========================================

function euro(bedrag) {

return new Intl.NumberFormat(
    "nl-BE",
    {
        style: "currency",
        currency: "EUR"
    }
).format(
    Number(bedrag) || 0
);

}

// ==========================================
// TARIEVEN LADEN
// ==========================================

async function loadRates() {

const resultaat =
    await supabaseClient
        .from("rates")
        .select("*")
        .order(
            "valid_from",
            {
                ascending: false
            }
        );

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

rates = resultaat.data || [];

console.log(
    "Tarieven geladen:",
    rates
);

}

// ==========================================
// TARIEF OP DATUM ZOEKEN
// ==========================================

function getRateForCategory(
categoryId,
workDate
) {

const kandidaten =
    rates.filter(rate => {

        return (
            Number(rate.category_id) ===
            Number(categoryId)

            &&

            rate.valid_from <=
            workDate
        );

    });


if (kandidaten.length === 0) {

    console.warn(
        "Geen tarief gevonden:",
        categoryId,
        workDate
    );

    return 0;

}


kandidaten.sort(
    (a, b) => {

        return (
            new Date(b.valid_from) -
            new Date(a.valid_from)
        );

    }
);


return Number(
    kandidaten[0].hourly_rate
) || 0;

}

// ==========================================
// REGISTRATIES OPHALEN
// ==========================================

async function getEntries(
    startDate,
    endDate
) {

    let query =
        supabaseClient
            .from("daily_entries")
            .select(`
                id,
                work_date,
                quantity,
                hours_per_person,
                site_id,
                category_id,
                note,
                sites(name),
                categories(name)
            `)
            .gte(
                "work_date",
                startDate
            )
            .lte(
                "work_date",
                endDate
            );


    if (filterSiteId) {

        query =
            query.eq(
                "site_id",
                filterSiteId
            );

    }


    if (filterCategoryId) {

        query =
            query.eq(
                "category_id",
                filterCategoryId
            );

    }


    const resultaat =
        await query.order(
            "work_date",
            {
                ascending: true
            }
        );


    if (resultaat.error) {

        console.error(
            "Fout bij registraties:",
            resultaat.error
        );

        alert(
            "Registraties konden niet geladen worden."
        );

        return [];
    }


    return resultaat.data || [];

}
   

// ==========================================
// KOST VAN REGISTRATIE
// ==========================================

function calculateEntryCost(
entry
) {

const prijs =
    getRateForCategory(
        entry.category_id,
        entry.work_date
    );


const aantal =
    Number(entry.quantity) || 0;


const uren =
    Number(
        entry.hours_per_person
    ) || 0;


const totaal =
    aantal *
    uren *
    prijs;


console.log(
    "Berekening:",
    {
        datum: entry.work_date,
        category: entry.category_id,
        aantal: aantal,
        uren: uren,
        prijs: prijs,
        totaal: totaal
    }
);


return totaal;

}

// ==========================================
// DAGRAPPORT
// ==========================================

document
.getElementById("loadDayButton")
.addEventListener(
"click",
loadDayReport
);

async function loadDayReport() {

const datum =
    document
        .getElementById("dayDate")
        .value;


if (!datum) {
    return;
}


const entries =
    await getEntries(
        datum,
        datum
    );


const perCategorie = {};

let totaal = 0;


entries.forEach(entry => {

    const categorie =
        entry.categories?.name ||
        "Onbekend";


    const kost =
        calculateEntryCost(
            entry
        );


    if (
        !perCategorie[categorie]
    ) {

        perCategorie[categorie] =
            0;

    }


    perCategorie[categorie] +=
        kost;


    totaal += kost;

});


const tabel =
    document
        .getElementById("dayTable");


tabel.innerHTML = "";


Object.keys(perCategorie)
    .sort()
    .forEach(categorie => {

        const rij =
            document.createElement("tr");


        rij.innerHTML = `
            <td>
                ${categorie}
            </td>

            <td>
                ${euro(
                    perCategorie[categorie]
                )}
            </td>
        `;


        tabel.appendChild(rij);

    });


if (
    Object.keys(perCategorie)
        .length === 0
) {

    tabel.innerHTML = `
        <tr>
            <td colspan="2">
                Geen registraties
                voor deze dag.
            </td>
        </tr>
    `;

}


document
    .getElementById("dayTotal")
    .innerText =
        euro(totaal);

}

// ==========================================
// WEEKRAPPORT
// ==========================================

document
.getElementById("loadWeekButton")
.addEventListener(
"click",
loadWeekReport
);

async function loadWeekReport() {

const datum =
    document
        .getElementById("weekDate")
        .value;


if (!datum) {
    return;
}


const gekozenDatum =
    new Date(
        datum + "T00:00:00"
    );


const dag =
    gekozenDatum.getDay();


const verschil =
    dag === 0
        ? -6
        : 1 - dag;


const maandag =
    new Date(
        gekozenDatum
    );


maandag.setDate(
    gekozenDatum.getDate() +
    verschil
);


const zondag =
    new Date(
        maandag
    );


zondag.setDate(
    maandag.getDate() + 6
);


const start =
    formatDate(maandag);


const einde =
    formatDate(zondag);


const entries =
    await getEntries(
        start,
        einde
    );


const perDag = {};


entries.forEach(entry => {

    const datum =
        entry.work_date;


    const kost =
        calculateEntryCost(
            entry
        );


    if (!perDag[datum]) {

        perDag[datum] =
            0;

    }


    perDag[datum] += kost;

});


const tabel =
    document
        .getElementById("weekTable");


tabel.innerHTML = "";


let weekTotaal = 0;


for (
    let i = 0;
    i < 7;
    i++
) {

    const huidigeDag =
        new Date(
            maandag
        );


    huidigeDag.setDate(
        maandag.getDate() + i
    );


    const datumString =
        formatDate(
            huidigeDag
        );


    const naam =
        getDayName(
            huidigeDag
        );


    const bedrag =
        perDag[datumString] || 0;


    weekTotaal += bedrag;


    const rij =
        document.createElement("tr");


    rij.innerHTML = `
        <td>
            ${naam}
        </td>

        <td>
            ${formatReadableDate(
                datumString
            )}
        </td>

        <td>
            ${euro(bedrag)}
        </td>

        <td>
            <button
                style="
                    margin:0;
                    width:auto;
                    padding:8px 12px;
                    font-size:14px;
                "
                onclick="
                    openDay(
                        '${datumString}'
                    )
                "
            >
                Bekijken
            </button>
        </td>
    `;


    tabel.appendChild(rij);

}


document
    .getElementById("weekTotal")
    .innerText =
        euro(weekTotaal);

}

// ==========================================
// DAG OPENEN
// ==========================================

function openDay(datum) {

document
    .getElementById("dayDate")
    .value = datum;


loadDayReport();


window.scrollTo({
    top: 0,
    behavior: "smooth"
});

}

// ==========================================
// MAANDRAPPORT
// ==========================================

document
.getElementById("loadMonthButton")
.addEventListener(
"click",
loadMonthReport
);

async function loadMonthReport() {

const maand =
    document
        .getElementById("monthDate")
        .value;


if (!maand) {
    return;
}


const start =
    `${maand}-01`;


const delen =
    maand.split("-");


const jaar =
    Number(delen[0]);


const maandNummer =
    Number(delen[1]);


const laatsteDag =
    new Date(
        jaar,
        maandNummer,
        0
    );


const einde =
    formatDate(
        laatsteDag
    );


const entries =
    await getEntries(
        start,
        einde
    );


const perDag = {};

const perWerf = {};

const perCategorie = {};


let totaal = 0;


entries.forEach(entry => {

    const kost =
        calculateEntryCost(
            entry
        );


    totaal += kost;


    if (
        !perDag[entry.work_date]
    ) {

        perDag[entry.work_date] =
            0;

    }


    perDag[entry.work_date] +=
        kost;


    const werf =
        entry.sites?.name ||
        "Onbekend";


    if (!perWerf[werf]) {

        perWerf[werf] =
            0;

    }


    perWerf[werf] +=
        kost;


    const categorie =
        entry.categories?.name ||
        "Onbekend";


    if (
        !perCategorie[categorie]
    ) {

        perCategorie[categorie] =
            0;

    }


    perCategorie[categorie] +=
        kost;

});


renderSimpleTable(
    "monthDayTable",
    perDag,
    true
);


renderSimpleTable(
    "monthSiteTable",
    perWerf,
    false
);


renderSimpleTable(
    "monthCategoryTable",
    perCategorie,
    false
);


document
    .getElementById("monthTotal")
    .innerText =
        euro(totaal);

}

// ==========================================
// TABEL RENDEREN
// ==========================================

function renderSimpleTable(
elementId,
data,
isDate
) {

const tabel =
    document
        .getElementById(
            elementId
        );


tabel.innerHTML = "";


const keys =
    Object.keys(data)
        .sort();


keys.forEach(key => {

    const rij =
        document.createElement("tr");


    const naam =
        isDate
            ? formatReadableDate(key)
            : key;


    rij.innerHTML = `
        <td>
            ${naam}
        </td>

        <td>
            ${euro(data[key])}
        </td>
    `;


    tabel.appendChild(rij);

});


if (keys.length === 0) {

    tabel.innerHTML = `
        <tr>
            <td colspan="2">
                Geen gegevens.
            </td>
        </tr>
    `;

}

}

// ==========================================
// DATUM
// ==========================================

function formatDate(date) {

const jaar =
    date.getFullYear();


const maand =
    String(
        date.getMonth() + 1
    ).padStart(2, "0");


const dag =
    String(
        date.getDate()
    ).padStart(2, "0");


return `${jaar}-${maand}-${dag}`;

}

// ==========================================
// LEESBARE DATUM
// ==========================================

function formatReadableDate(
datum
) {

const delen =
    datum.split("-");


return (
    delen[2] +
    "-" +
    delen[1] +
    "-" +
    delen[0]
);

}

// ==========================================
// DAGNAAM
// ==========================================

function getDayName(date) {

const dagen = [

    "Zondag",
    "Maandag",
    "Dinsdag",
    "Woensdag",
    "Donderdag",
    "Vrijdag",
    "Zaterdag"

];


return dagen[
    date.getDay()
];

}
// ==========================================
// PRINTEN
// ==========================================

document
    .getElementById("printDayButton")
    .addEventListener(
        "click",
        function() {
            printReport("day");
        }
    );


document
    .getElementById("printWeekButton")
    .addEventListener(
        "click",
        function() {
            printReport("week");
        }
    );


document
    .getElementById("printMonthButton")
    .addEventListener(
        "click",
        function() {
            printReport("month");
        }
    );


function printReport(type) {

    const dayCard =
        document
            .getElementById("loadDayButton")
            .closest(".card");

    const weekCard =
        document
            .getElementById("loadWeekButton")
            .closest(".card");

    const monthCard =
        document
            .getElementById("loadMonthButton")
            .closest(".card");


    // Eerst alles verbergen
    dayCard.style.display = "none";
    weekCard.style.display = "none";
    monthCard.style.display = "none";


    // Alleen gekozen rapport tonen
    if (type === "day") {

        dayCard.style.display = "block";

        document.title =
            "WerfApp - Dagrapport";

    }


    if (type === "week") {

        weekCard.style.display = "block";

        document.title =
            "WerfApp - Weekrapport";

    }


    if (type === "month") {

        monthCard.style.display = "block";

        document.title =
            "WerfApp - Maandoverzicht";

    }


    // Printen
    window.print();


    // Alles weer zichtbaar maken
    setTimeout(function() {

        dayCard.style.display = "";
        weekCard.style.display = "";
        monthCard.style.display = "";

        document.title =
            "WerfApp - Rapporten";

    }, 1000);

}

// ==========================================
// RAPPORTFILTERS
// ==========================================

let filterSiteId = "";
let filterCategoryId = "";


// ==========================================
// WERVEN LADEN
// ==========================================

async function loadFilterSites() {

    const select =
        document.getElementById("filterSite");

    if (!select) {
        return;
    }

    const resultaat =
        await supabaseClient
            .from("sites")
            .select("id, name")
            .order("name", {
                ascending: true
            });

    if (resultaat.error) {

        console.error(
            "Fout bij werven:",
            resultaat.error
        );

        return;
    }

    select.innerHTML = "";

    const alleOptie =
        document.createElement("option");

    alleOptie.value = "";

    alleOptie.textContent =
        "Alle werven";

    select.appendChild(
        alleOptie
    );

    (resultaat.data || []).forEach(
        function(site) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                site.id;

            option.textContent =
                site.name;

            select.appendChild(
                option
            );

        }
    );

}


// ==========================================
// CATEGORIEËN LADEN
// ==========================================

async function loadFilterCategories() {

    const select =
        document.getElementById(
            "filterCategory"
        );

    if (!select) {
        return;
    }

    const resultaat =
        await supabaseClient
            .from("categories")
            .select("id, name")
            .order("name", {
                ascending: true
            });

    if (resultaat.error) {

        console.error(
            "Fout bij categorieën:",
            resultaat.error
        );

        return;
    }

    select.innerHTML = "";

    const alleOptie =
        document.createElement("option");

    alleOptie.value = "";

    alleOptie.textContent =
        "Alle categorieën";

    select.appendChild(
        alleOptie
    );

    (resultaat.data || []).forEach(
        function(category) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category.id;

            option.textContent =
                category.name;

            select.appendChild(
                option
            );

        }
    );

}


// ==========================================
// FILTERS INSTELLEN
// ==========================================

function setupReportFilters() {

    const siteSelect =
        document.getElementById(
            "filterSite"
        );

    const categorySelect =
        document.getElementById(
            "filterCategory"
        );

    const clearButton =
        document.getElementById(
            "clearFiltersButton"
        );


    if (siteSelect) {

        siteSelect.addEventListener(
            "change",
            function() {

                filterSiteId =
                    this.value;

                loadDayReport();

                loadWeekReport();

                loadMonthReport();

            }
        );

    }


    if (categorySelect) {

        categorySelect.addEventListener(
            "change",
            function() {

                filterCategoryId =
                    this.value;

                loadDayReport();

                loadWeekReport();

                loadMonthReport();

            }
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function() {

                filterSiteId = "";

                filterCategoryId = "";


                if (siteSelect) {
                    siteSelect.value = "";
                }


                if (categorySelect) {
                    categorySelect.value = "";
                }


                loadDayReport();

                loadWeekReport();

                loadMonthReport();

            }
        );

    }

}


// ==========================================
// FILTERS STARTEN
// ==========================================

async function startReportFilters() {

    await loadFilterSites();

    await loadFilterCategories();

    setupReportFilters();

}


document.addEventListener(
    "DOMContentLoaded",
    startReportFilters
);
