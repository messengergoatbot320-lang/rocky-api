const ytdl = require("@distube/ytdl-core");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { link, format } = req.query;

  if (!link) {
    return res.status(400).json({
      status: false,
      developer: "Rocky Chowdhury",
      error: "link parameter is required"
    });
  }

  try {
    const videoUrl =
      link.includes("youtube.com") || link.includes("youtu.be")
        ? link
        : `https://www.youtube.com/watch?v=${link}`;

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnails.pop().url;
    const channel = info.videoDetails.author.name;
    const duration = info.videoDetails.lengthSeconds + "s";

    let downloadLink, quality;

    if (format === "mp3") {
      const audioFmt = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
        filter: "audioonly"
      });
      downloadLink = audioFmt.url;
      quality = (audioFmt.audioBitrate || "128") + "kbps";
    } else {
      // mp4 — 360p preferred (audioandvideo)
      let videoFmt;
      try {
        videoFmt = ytdl.chooseFormat(info.formats, {
          quality: "18",
          filter: "audioandvideo"
        });
      } catch {
        videoFmt = ytdl.chooseFormat(info.formats, {
          filter: "audioandvideo"
        });
      }
      downloadLink = videoFmt.url;
      quality = videoFmt.qualityLabel || "360p";
    }

    return res.status(200).json({
      status: true,
      developer: "Rocky Chowdhury",
      data: {
        title,
        quality,
        downloadLink,
        thumbnail,
        duration,
        channel
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      developer: "Rocky Chowdhury",
      error: err.message || "Something went wrong"
    });
  }
};
