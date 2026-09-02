// ==========================================
// WERFAPP MATERIALEN
// ==========================================

let materialSites = [];


// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", startMaterialen);


async function startMaterialen() {

    const ingelogd = await checkMaterialenLogin();

    if (!ingelogd) {
        return;
    }

    setDefaultDate();

    await loadSites();

    await loadMaterials();

    const saveButton =
        document.getElementById("saveMaterialButton");

    if (saveButton) {
        saveButton.addEventListener("click", saveMaterial);
    }

    const materialTable =
        document.getElementById("materialTable");

    if (materialTable) {
        materialTable.addEventListener(
            "click",
            handleMaterialTableClick
        );
    }
}


// ==========================================
// LOGIN
// ==========================================

async function checkMaterialenLogin() {

    const resultaat =
        await supabaseClient.auth.getSession();

    if (
        resultaat.error ||
        !resultaat.data.session
    ) {

        window.location.href = "index.html";

        return false;
    }

    return true;
}


// ==========================================
// UITLOGGEN
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const logoutButton =
            document.getElementById("logoutButton");

        if (!logoutButton) {
            return;
        }

        logoutButton.addEventListener(
            "click",
            async function(event) {

                event.preventDefault();

                await supabaseClient.auth.signOut();

                window.location.href = "index.html";

            }
        );

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

    return (
        jaar +
        "-" +
        maand +
        "-" +
        dag
    );
}


function setDefaultDate() {

    const veld =
        document.getElementById("materialDate");

    if (!veld) {
        return;
    }

    veld.value =
        formatDate(new Date());
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
// MELDING
// ==========================================

function showMessage(
    tekst,
    type
) {

    const message =
        document.getElementById(
            "materialMessage"
        );

    if (!message) {
        return;
    }

    message.textContent =
        tekst;

    message.className =
        "message " + type;
}


// ==========================================
// WERVEN LADEN
// ==========================================

async function loadSites() {

    const select =
        document.getElementById(
            "materialSite"
        );

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">Werven laden...</option>';


    const resultaat =
        await supabaseClient
            .from("sites")
            .select(
                "id, name, active"
            )
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
            "Fout bij laden werven:",
            resultaat.error
        );

        select.innerHTML =
            '<option value="">Fout bij laden van werven</option>';

        showMessage(
            "Werven konden niet geladen worden.",
            "error"
        );

        return;
    }


    materialSites =
        resultaat.data || [];


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


    if (
        materialSites.length === 0
    ) {

        select.innerHTML =
            '<option value="">Geen actieve werven gevonden</option>';

        showMessage(
            "Er zijn geen actieve werven gevonden.",
            "error"
        );

    }
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


    if (site) {
        return site.name;
    }


    return "Onbekende werf";
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


    const sessionResult =
        await supabaseClient.auth.getSession();


    if (
        sessionResult.error ||
        !sessionResult.data.session
    ) {

        window.location.href =
            "index.html";

        return;
    }


    const userId =
        sessionResult.data.session.user.id;


    const button =
        document.getElementById(
            "saveMaterialButton"
        );


    button.disabled = true;

    button.textContent =
        "Opslaan...";


    const resultaat =
        await supabaseClient
            .from("material_entries")
            .insert([
                {
                    work_date: date,

                    site_id:
                        Number(siteId),

                    description:
                        description,

                    total_price:
                        price,

                    user_id:
                        userId
                }
            ]);


    if (resultaat.error) {

        console.error(
            "Fout bij materiaalregistratie:",
            resultaat.error
        );

        showMessage(
            "Opslaan mislukt: " +
            resultaat.error.message,
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


    document.getElementById(
        "materialDescription"
    ).value = "";


    document.getElementById(
        "materialPrice"
    ).value = "";


    document.getElementById(
        "materialSite"
    ).value = "";


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


    if (!table) {
        return;
    }


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
// VERWIJDEREN
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
