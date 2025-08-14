export const convertToPng = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context not available");

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Failed to convert to PNG");

            const pngFile = new File([blob], "converted.png", {
              type: "image/png",
            });

            resolve(pngFile);
          },
          "image/png",
          1
        );
      };

      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };

    reader.onerror = () => reject("File reading failed");

    reader.readAsDataURL(file);
  });
};
