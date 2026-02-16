module.exports = async function handler(req, res) {
  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    await runMiddleware(req, res, upload.single("jsonFile"));

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const jsonData = fs.readFileSync(req.file.path, "utf8");

    const zipPath = path.join(os.tmpdir(), `${req.file.filename}.lottie`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);

    archive.append(jsonData, { name: "animations/animation.json" });

    archive.append(
      JSON.stringify({
        version: "1.0",
        animations: [
          {
            id: "animation_1",
            src: "animations/animation.json",
            loop: true,
            autoplay: true,
          },
        ],
      }),
      { name: "manifest.json" }
    );

    await archive.finalize();

    output.on("close", () => {
      const fileBuffer = fs.readFileSync(zipPath);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${req.file.originalname.replace(".json", ".lottie")}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");
      res.status(200).send(fileBuffer);
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
