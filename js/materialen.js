// ==========================================
// TEST MATERIALEN - WERVEN
// ==========================================

document.addEventListener("DOMContentLoaded", async function () {

    const select = document.getElementById("materialSite");

    if (!select) {
        alert("FOUT: materialSite bestaat niet in materialen.html");
        return;
    }

    select.innerHTML =
        '<option value="">Werven worden geladen...</option>';

    console.log("TEST: Supabase client =", supabaseClient);

    // Eerst controleren of we ingelogd zijn
    const sessionResult =
        await supabaseClient.auth.getSession();

    console.log(
        "TEST: sessie =",
        sessionResult
    );

    if (
        sessionResult.error ||
        !sessionResult.data.session
    ) {
        select.innerHTML =
            '<option value="">NIET INGELOGD</option>';

        alert("WerfApp ziet geen ingelogde gebruiker.");

        return;
    }

    // Werven ophalen
    const result =
        await supabaseClient
            .from("sites")
            .select("id, name, active")
            .order("name", {
                ascending: true
            });

    console.log(
        "TEST: resultaat sites =",
        result
    );

    if (result.error) {

        select.innerHTML =
            '<option value="">FOUT BIJ LADEN</option>';

        alert(
            "Fout bij laden van werven:\n\n" +
            result.error.message
        );

        return;
    }

    const sites = result.data || [];

    console.log(
        "TEST: gevonden werven =",
        sites
    );

    select.innerHTML =
        '<option value="">Werf kiezen...</option>';

    sites.forEach(function (site) {

        const option =
            document.createElement("option");

        option.value =
            site.id;

        option.textContent =
            site.name;

        select.appendChild(option);

    });

    if (sites.length === 0) {

        select.innerHTML =
            '<option value="">GEEN WERVEN GEVONDEN</option>';

        alert(
            "Supabase antwoordt succesvol, maar geeft 0 werven terug."
        );

        return;
    }

    alert(
        "SUCCES! " +
        sites.length +
        " werven gevonden."
    );

});
