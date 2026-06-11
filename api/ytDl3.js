module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const { link, format } = req.query;

  if (!link) {
    return res.status(400).json({
      status: false,
      developer: "Rocky Chowdhury",
      error: "link parameter required"
    });
  }

  try {
    // Video ID বের করো
    let videoId = link;
    if (link.includes("youtube.com/watch")) {
      videoId = new URL(link).searchParams.get("v");
    } else if (link.includes("youtu.be/")) {
      videoId = link.split("youtu.be/")[1].split("?")[0];
    } else if (link.includes("shorts/")) {
      videoId = link.split("shorts/")[1].split("?")[0];
    }

    // YouTube Innertube API call
    const response = await fetch(
      "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://www.youtube.com"
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: "ANDROID",
              clientVersion: "18.11.34",
              androidSdkVersion: 30,
              hl: "en",
              gl: "US"
            }
          }
        })
      }
    );

    const data = await response.json();

    if (!data.streamingData) {
      throw new Error("No streaming data — video may be restricted");
    }

    const details = data.videoDetails || {};
    const title = details.title || "Unknown";
    const thumbnail = details.thumbnail?.thumbnails?.slice(-1)[0]?.url || "";
    const duration = (details.lengthSeconds || 0) + "s";
    const channel = details.author || "";

    let downloadLink = "";
    let quality = "";

    if (format === "mp3") {
      // Audio only
      const audios = data.streamingData.adaptiveFormats?.filter(
        f => f.mimeType?.includes("audio/mp4")
      ) || [];
      audios.sort((a, b) => b.bitrate - a.bitrate);
      downloadLink = audios[0]?.url || "";
      quality = Math.round((audios[0]?.bitrate || 128000) / 1000) + "kbps";
    } else {
      // Video mp4 — 360p prefer
      const videos = data.streamingData.formats?.filter(
        f => f.mimeType?.includes("video/mp4")
      ) || [];
      const vid360 = videos.find(f => f.qualityLabel === "360p");
      const chosen = vid360 || videos[0];
      downloadLink = chosen?.url || "";
      quality = chosen?.qualityLabel || "360p";
    }

    if (!downloadLink) throw new Error("No playable format found");

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
