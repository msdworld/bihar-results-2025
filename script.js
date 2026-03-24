const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // speed optimization
  await page.setRequestInterception(true);
  page.on("request", req => {
    if (["image", "stylesheet", "font"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto("http://interbiharboard.com/", {
    waitUntil: "domcontentloaded"
  });

  const rollCode = "42104";
  const rollNumber = "26010031";

  await page.type("#mobile", rollCode);
  await page.type("#password", rollNumber);

  await page.evaluate(() => {
    const cap = document.getElementById("generatedCaptcha").dataset.value;
    document.getElementById("captchaInput").value = cap;
  });

  await page.click("#btn_login");

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  const data = await page.evaluate(() => {

    const getValue = (label) => {
      const rows = Array.from(document.querySelectorAll("table tr"));
      for (let row of rows) {
        const tds = row.querySelectorAll("td");
        if (tds.length === 2 && tds[0].innerText.includes(label)) {
          return tds[1].innerText.trim();
        }
      }
      return null;
    };

    return {
      bsebUniqueId: getValue("BSEB Unique Id"),
      studentName: getValue("Student"),
      fatherName: getValue("Father"),
      school: getValue("School"),
      rollCode: getValue("Roll Code"),
      rollNumber: getValue("Roll Number"),
      registrationNumber: getValue("Registration"),
      totalMarks: getValue("Aggregate"),
      division: getValue("Result")
    };

  });

  console.log(data);

  fs.writeFileSync("result.json", JSON.stringify(data, null, 2));

  await browser.close();

})();
