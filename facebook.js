// facebook.js - Utilidades auxiliares de URL e identificadores de red

/**
 * Analiza la URL actual y extrae el identificador principal del usuario o página.
 * @param {string} link - URL completa de Facebook
 * @returns {Promise<string>} Username o ID en texto
 */
function get_current_username(link) {
    return new Promise((resolve) => {
        const test = new URL(link);
        if (test.pathname.includes("/friends/")) {
            resolve(test.searchParams.get("profile_id"));
        } else if (test.pathname.includes("/groups/")) {
            resolve(test.pathname.split("/").filter(str => str !== "")[3]);
        } else if (test.pathname.includes("/t/") && !test.pathname.includes("/e2ee/")) {
            resolve(test.pathname.split("/").filter(str => str !== "")[1]);
        } else if (test.pathname === "/profile.php") {
            resolve(test.searchParams.get("id"));
        } else {
            resolve(test.pathname.split("/").filter(str => str !== "")[0]);
        }
    });
}