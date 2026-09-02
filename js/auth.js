async function login() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        document.getElementById("loginMessage").innerText =
            "Fout: " + error.message;
        console.log(error);
        return;
    }

    window.location.href = "dashboard.html";
}

document.getElementById("loginButton").addEventListener("click", login);
