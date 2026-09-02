```javascript
// ==========================================
// WERFAPP MATERIALEN
// ==========================================

let materialSites = [];


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    startMaterialen
);


async function startMaterialen() {

    const ingelogd =
        await checkLogin();

    if (!ingelogd) {
        return;
    }

    setDefaultDate();

    await loadSites();

    await loadMaterials();


    document
        .getElementById("saveMaterialButton")
        .addEventListener(
            "click",
            saveMaterial
        );


    document
        .getElementById("materialTable")
        .addEventListener(
            "click",
            handleMaterialTableClick
        );

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


function setDefaultDate() {

    const veld =
        document.getElementById(
            "materialDate"
        );


    veld.value =
        formatDate(
            new Date()
        );
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
// BERICHT
// ==========================================

function showMessage(
    tekst,
    type
) {

    const message =
        document.getElementById(
            "materialMessage"
        );


    message.textContent =
        tekst;


    message.className =
        "message " + type;


    setTimeout(
        function() {

            message.textContent =
                "";

            message.className =
                "message";

        },
        5000
    );
}


// ==========================================
// WERVEN LADEN
// ==========================================

async function loadSites() {

    const resultaat =
        await supabaseClient
            .from("sites")
            .select("*")
            .eq(
                "active",
                true
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );


    if (resultaat.error) {

        console.error(
            "Fout bij werven:",
            resultaat.error
        );

        showMessage(
            "Werven konden niet geladen worden.",
            "error"
        );

        return;
    }


    materialSites =
        resultaat.data || [];


    const select =
        document.getElementById(
            "materialSite"
        );


    select.innerHTML =
        '<option value="">Werf kiezen...</option>';


    materialSites.forEach(
        function(site) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(site.id);


            option.textContent =
                site.name;


            select.appendChild(
                option
            );

        }
    );
}


// ==========================================
// WERFNAAM
// ==========================================

function getSiteName(siteId) {

    const site =
        materialSites.find(
            function(item) {

                return String(item.id) ===
                    String(siteId);

            }
        );


    return site
        ? site.name
        : "Onbekende werf";
}


// ==========================================
// MATERIALEN OPSLAAN
// ==========================================

async function saveMaterial() {

    const date =
        document.getElementById(
            "materialDate"
        ).value;


    const siteId =
        document.getElementById(
            "materialSite"
        ).value;


    const description =
        document.getElementById(
            "materialDescription"
        ).value.trim();


    const price =
        Number(
            document.getElementById(
                "materialPrice"
            ).value
        );


    if (!date) {

        showMessage(
            "Kies een datum.",
            "error"
        );

        return;
    }


    if (!siteId) {

        showMessage(
            "Kies een werf.",
            "error"
        );

        return;
    }


    if (!description) {

        showMessage(
            "Geef op welke materialen zijn gehaald.",
            "error"
        );

        return;
    }


    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        showMessage(
            "Geef een geldige totaalprijs in.",
            "error"
        );

        return;
    }


    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient.auth.getSession();


    if (
        sessionError ||
        !sessionData.session
    ) {

        window.location.href =
            "index.html";

        return;
    }


    const userId =
        sessionData.session.user.id;


    const button =
        document.getElementById(
            "saveMaterialButton"
        );


    button.disabled =
        true;


    button.textContent =
        "Opslaan...";


    const resultaat =
        await supabaseClient
            .from("material_entries")
            .insert([
                {
                    work_date: date,
                    site_id: Number(siteId),
                    description: description,
                    total_price: price,
                    user_id: userId
                }
            ]);


    if (resultaat.error) {

        console.error(
            "Fout bij materiaalregistratie:",
            resultaat.error
        );


        showMessage(
            "Materialen konden niet worden opgeslagen.",
            "error"
        );


        button.disabled =
            false;


        button.textContent =
            "Materialen opslaan";


        return;
    }


    showMessage(
        "Materiaalregistratie succesvol opgeslagen.",
        "success"
    );


    document
        .getElementById(
            "materialDescription"
        )
        .value = "";


    document
        .getElementById(
            "materialPrice"
        )
        .value = "";


    document
        .getElementById(
            "materialSite"
        )
        .value = "";


    button.disabled =
        false;


    button.textContent =
        "Materialen opslaan";


    await loadMaterials();
}


// ==========================================
// MATERIALEN LADEN
// ==========================================

async function loadMaterials() {

    const resultaat =
        await supabaseClient
            .from("material_entries")
            .select("*")
            .order(
                "work_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (resultaat.error) {

        console.error(
            "Fout bij materialen:",
            resultaat.error
        );

        showMessage(
            "Materiaalregistraties konden niet geladen worden.",
            "error"
        );

        return;
    }


    const materials =
        resultaat.data || [];


    const table =
        document.getElementById(
            "materialTable"
        );


    table.innerHTML =
        "";


    if (
        materials.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    Nog geen materiaalregistraties.
                </td>
            </tr>
        `;

        return;
    }


    materials.forEach(
        function(material) {

            const row =
                document.createElement(
                    "tr"
                );


            const dateCell =
                document.createElement(
                    "td"
                );


            dateCell.textContent =
                formatDisplayDate(
                    material.work_date
                );


            const siteCell =
                document.createElement(
                    "td"
                );


            siteCell.textContent =
                getSiteName(
                    material.site_id
                );


            const descriptionCell =
                document.createElement(
                    "td"
                );


            descriptionCell.className =
                "material-description";


            descriptionCell.textContent =
                material.description;


            const priceCell =
                document.createElement(
                    "td"
                );


            priceCell.textContent =
                euro(
                    material.total_price
                );


            const actionCell =
                document.createElement(
                    "td"
                );


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "danger-button small-button";


            deleteButton.dataset.id =
                material.id;


            deleteButton.textContent =
                "Verwijderen";


            actionCell.appendChild(
                deleteButton
            );


            row.appendChild(
                dateCell
            );

            row.appendChild(
                siteCell
            );

            row.appendChild(
                descriptionCell
            );

            row.appendChild(
                priceCell
            );

            row.appendChild(
                actionCell
            );


            table.appendChild(
                row
            );

        }
    );
}


// ==========================================
// DATUM WEERGAVE
// ==========================================

function formatDisplayDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const parts =
        dateString.split("-");


    if (parts.length !== 3) {
        return dateString;
    }


    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );
}


// ==========================================
// TABEL ACTIES
// ==========================================

async function handleMaterialTableClick(
    event
) {

    const button =
        event.target.closest(
            "button[data-id]"
        );


    if (!button) {
        return;
    }


    const id =
        button.dataset.id;


    const bevestiging =
        confirm(
            "Wil je deze materiaalregistratie verwijderen?"
        );


    if (!bevestiging) {
        return;
    }


    button.disabled =
        true;


    const resultaat =
        await supabaseClient
            .from("material_entries")
            .delete()
            .eq(
                "id",
                id
            );


    if (resultaat.error) {

        console.error(
            "Fout bij verwijderen:",
            resultaat.error
        );


        alert(
            "De materiaalregistratie kon niet worden verwijderd."
        );


        button.disabled =
            false;


        return;
    }


    await loadMaterials();
}
```
