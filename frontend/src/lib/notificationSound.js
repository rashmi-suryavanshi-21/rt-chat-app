export const playNotificationSound = () => {
  try {
    const audio = new Audio("/sound/notification.mp3");

    audio.volume = 1.0;
    audio.preload = "auto";

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log("🔇 Audio blocked or invalid file:", err);
      });
    }
  } catch (err) {
    console.log("Audio error:", err);
  }
};

