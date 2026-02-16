const multer = require("multer");
const archiver = require("archiver");
const fs = require("fs");
const os = require("os");
const path = require("path");

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ dest: os.tmpdir() });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

module.exports = async function handler(req, res) {
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
