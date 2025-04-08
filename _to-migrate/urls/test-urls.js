import fs from "fs/promises";
import fetch from "node-fetch"; // Ensure `node-fetch` is installed

async function checkUrls() {
  const emitSuccess = false;

  try {
    // Read and parse the JSON file
    const data = await fs.readFile("urls.json", "utf8");
    const urls = JSON.parse(data);

    // Iterate over each URL and check the response status
    for (let { uri } of urls) {
      // Skip known/intentional 404s
      if (
        uri === "https://docs.duendesoftware.com/bff/v3/fundamentals/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v5/reference/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v6/reference/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v7/reference/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v5/reference/models/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v6/reference/models/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v7/reference/models/" ||
        uri === "https://docs.duendesoftware.com/foss/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v5/tokens/authentication/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v6/tokens/authentication/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v7/tokens/authentication/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v5/reference/endpoints/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v6/reference/endpoints/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v7/reference/endpoints/" ||
        uri ===
          "https://docs.duendesoftware.com/foss/identitymodel/endpoints/" ||
        uri === "https://docs.duendesoftware.com/foss/identitymodel/utils/" ||
        uri ===
          "https://docs.duendesoftware.com/foss/accesstokenmanagement/advanced/dpop/" ||
        uri ===
          "https://docs.duendesoftware.com/foss/accesstokenmanagement/advanced/" ||
        uri === "https://docs.duendesoftware.com/identityserver/v5/overview/" ||
        uri === "https://docs.duendesoftware.com/identityserver/v6/overview/" ||
        uri === "https://docs.duendesoftware.com/identityserver/v7/overview/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v5/apis/aspnetcore/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v6/apis/aspnetcore/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v7/apis/aspnetcore/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v5/fundamentals/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v6/fundamentals/" ||
        uri ===
          "https://docs.duendesoftware.com/identityserver/v7/fundamentals/"
      ) {
        continue;
      }

      let originalUri = uri;
      uri = uri.replace(
        "https://docs.duendesoftware.com/",
        "http://localhost:4321/",
      );

      try {
        const response = await fetch(uri);
        if (response.ok && response.status !== 404) {
          if (emitSuccess) {
            console.log(`SUCCESS: ${uri} is valid.`);
          }
        } else {
          console.error(
            `ERROR: ${uri} (${originalUri}) returned status ${response.status}.`,
          );
        }
      } catch (error) {
        console.error(`ERROR: Unable to fetch ${uri} - ${error.message}`);
      }
    }
  } catch (err) {
    console.error("Failed to read URLs from file:", err.message);
  }
}

checkUrls();
