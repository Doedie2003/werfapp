// ==========================================
// WERFAPP DASHBOARD
// ==========================================

let rates = [];


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    startDashboard
);


async function startDashboard() {

    const ingelogd = await checkLogin();

    if (!ingelogd) {
        return;
    }

    await loadRates();

    await loadDashboard();

}


// ==========================================
// LOGIN
// ==========================================

async function checkLogin() {

    const resultaat =
        await supabaseClient.auth.getSession();

    if (
        resultaat.error ||
        !resultaat.data.session
    ) {

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

    rates =
        resultaat.data || [];

}


// ==========================================
// TARIEF OP DATUM ZOEKEN
// ==========================================

function getRateForCategory(
    categoryId,
    workDate
) {

    const kandidaten =
        rates.filter(function(rate) {

            return (
                Number(rate.category_id) ===
                Number(categoryId)

                &&

                rate.valid_from <=
                workDate
            );

        });


    if (
        kandidaten.length === 0
    ) {

        return 0;

    }


    kandidaten.sort(
        function(a, b) {

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
// REGISTRATIES LADEN
// ==========================================

async function getEntries(
    startDate,
    endDate
) {

    const resultaat =
        await supabaseClient
            .from("daily_entries")
            .select(`
                id,
                work_date,
                quantity,
                hours_per_person,
                site_id,
                category_id,
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
            )
            .order(
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
// KOST REGISTRATIE
// ==========================================

function calculateEntryCost(entry) {

    const prijs =
        getRateForCategory(
            entry.category_id,
            entry.work_date
        );

    const aantal =
        Number(entry.quantity) || 0;

    const uren =
        Number(entry.hours_per_person) || 0;

    return (
        aantal *
        uren *
        prijs
    );

}


// ==========================================
// DASHBOARD LADEN
// ==========================================

async function loadDashboard() {

    await loadSiteCount();

    await calculateTotals();

    await loadSiteCosts();

}


// ==========================================
// ACTIEVE WERVEN TELLEN
// ==========================================

async function loadSiteCount() {

    const resultaat =
        await supabaseClient
            .from("sites")
            .select("id")
            .eq(
                "active",
                true
            );


    if (resultaat.error) {

        console.error(
            "Fout bij werven:",
            resultaat.error
        );

        document
            .getElementById("siteCount")
            .innerText = "0";

        return;

    }


    document
        .getElementById("siteCount")
        .innerText =
            (resultaat.data || []).length;

}


// ==========================================
// TOTALE KOSTEN
// ==========================================

async function calculateTotals() {

    const vandaag =
        new Date();


    const vandaagString =
        formatDate(vandaag);


    // --------------------------------------
    // MAANDAG VAN DE HUIDIGE WEEK
    // --------------------------------------

    const maandag =
        new Date(vandaag);


    const dag =
        maandag.getDay();


    const verschil =
        dag === 0
            ? -6
            : 1 - dag;


    maandag.setDate(
        maandag.getDate() +
        verschil
    );


    const weekString =
        formatDate(maandag);


    // --------------------------------------
    // EERSTE DAG MAAND
    // --------------------------------------

    const eersteDagMaand =
        new Date(
            vandaag.getFullYear(),
            vandaag.getMonth(),
            1
        );


    const maandString =
        formatDate(
            eersteDagMaand
        );


    // --------------------------------------
    // REGISTRATIES OPHALEN
    // --------------------------------------

    const entries =
        await getEntries(
            maandString,
            vandaagString
        );


    let vandaagTotaal = 0;

    let weekTotaal = 0;

    let maandTotaal = 0;


    entries.forEach(function(entry) {

        const kost =
            calculateEntryCost(
                entry
            );


        const datum =
            entry.work_date;


        if (
            datum ===
            vandaagString
        ) {

            vandaagTotaal +=
                kost;

        }


        if (
            datum >=
            weekString
        ) {

            weekTotaal +=
                kost;

        }


        if (
            datum >=
            maandString
        ) {

            maandTotaal +=
                kost;

        }

    });


    document
        .getElementById("todayCost")
        .innerText =
            euro(vandaagTotaal);


    document
        .getElementById("weekCost")
        .innerText =
            euro(weekTotaal);


    document
        .getElementById("monthCost")
        .innerText =
            euro(maandTotaal);

}


// ==========================================
// KOSTEN PER WERF VANDAAG
// ==========================================

async function loadSiteCosts() {

    const vandaag =
        formatDate(
            new Date()
        );


    const entries =
        await getEntries(
            vandaag,
            vandaag
        );


    const totaalPerWerf = {};


    entries.forEach(function(entry) {

        const naam =
            entry.sites?.name ||
            "Onbekende werf";


        const kost =
            calculateEntryCost(
                entry
            );


        if (
            !totaalPerWerf[naam]
        ) {

            totaalPerWerf[naam] =
                0;

        }


        totaalPerWerf[naam] +=
            kost;

    });


    const tabel =
        document
            .getElementById(
                "siteTable"
            );


    tabel.innerHTML = "";


    const werven =
        Object.keys(
            totaalPerWerf
        ).sort();


    werven.forEach(function(site) {

        const rij =
            document.createElement(
                "tr"
            );


        const naamCel =
            document.createElement(
                "td"
            );


        naamCel.textContent =
            site;


        const kostenCel =
            document.createElement(
                "td"
            );


        kostenCel.textContent =
            euro(
                totaalPerWerf[site]
            );


        rij.appendChild(
            naamCel
        );


        rij.appendChild(
            kostenCel
        );


        tabel.appendChild(
            rij
        );

    });


    if (
        werven.length === 0
    ) {

        tabel.innerHTML = `
            <tr>
                <td colspan="2">
                    Geen registraties vandaag.
                </td>
            </tr>
        `;

    }

}